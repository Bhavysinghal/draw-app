import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: number[];
  userId: string;
}

const users: User[] = [];

/* ------------------ AUTH ------------------ */
function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded || !decoded.userId) {
      return null;
    }

    return decoded.userId as string;
  } catch {
    return null;
  }
}

/* ------------------ CONNECTION ------------------ */
wss.on("connection", (ws, request) => {
  const url = request.url;
  if (!url) return ws.close();

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token");

  if (!token) return ws.close();

  const userId = checkUser(token);
  if (!userId) return ws.close();

  const user: User = {
    ws,
    rooms: [],
    userId,
  };

  users.push(user);
//   const pingInterval = setInterval(() => {
//     if (ws.readyState === ws.OPEN) {
//         ws.ping();
//     }
// }, 30000);

// ws.on("close", () => {
//     clearInterval(pingInterval); // Clear interval when user disconnects
//     const index = users.findIndex((u) => u.ws === ws);
//     if (index !== -1) {
//         users.splice(index, 1);
//     }
// });

  /* ------------------ MESSAGE ------------------ */
  ws.on("message", async (data) => {
    let parsedData: any;

    try {
      parsedData =
        typeof data === "string"
          ? JSON.parse(data)
          : JSON.parse(data.toString());
    } catch {
      return;
    }

    if (!parsedData?.type) return;

    /* -------- JOIN ROOM -------- */
    if (parsedData.type === "join_room") {
      const roomId = Number(parsedData.roomId);
      if (!isNaN(roomId) && !user.rooms.includes(roomId)) {
        user.rooms.push(roomId);
      }
      return;
    }

    /* -------- LEAVE ROOM -------- */
    if (parsedData.type === "leave_room") {
      const roomId = Number(parsedData.roomId);
      user.rooms = user.rooms.filter((r) => r !== roomId);
      return;
    }

/* -------- DRAWING (Missing) -------- */
    if (parsedData.type === "drawing") {
      const roomId = Number(parsedData.roomId);
      const elements = parsedData.elements;
      const clientId = parsedData.clientId;

      // Broadcast to everyone in the room EXCEPT the sender
      users.forEach((u) => {
        if (u.ws !== ws && u.rooms.includes(roomId) && u.ws.readyState === WebSocket.OPEN) {
          u.ws.send(JSON.stringify({
            type: "drawing",
            roomId,
            elements,
            clientId
          }));
        }
      });
    }

    /* -------- CURSOR (Missing) -------- */
    if (parsedData.type === "cursor") {
      const roomId = Number(parsedData.roomId);
      const pointer = parsedData.pointer;
      const clientId = parsedData.clientId;
      const color = parsedData.color;

      // Optimisation: If Frontend sends username, use it. Otherwise, fetch from DB.
      // Your Frontend (CanvasPage.tsx) DOES send the username, so we can use it directly
      // instead of hitting the DB 60 times a second like File 2 does.
      const username = parsedData.username || "Anonymous"; 

      users.forEach((u) => {
        if (u.ws !== ws && u.rooms.includes(roomId) && u.ws.readyState === WebSocket.OPEN) {
          u.ws.send(JSON.stringify({
            type: "cursor",
            roomId,
            pointer,
            clientId,
            color,
            username 
          }));
        }
      });
    }    /* -------- CHAT -------- */
    if (parsedData.type === "chat") {
      const roomId = Number(parsedData.roomId);
      const content = parsedData.content; // 👈 FIX 1: Read 'content', not 'message'

      if (!roomId || typeof content !== "string") return; // Validate content

      try {
        // 1. Save to DB & Fetch User Details (Prisma Version of 'populate')
        const chatEntry = await prismaClient.chat.create({
          data: {
            roomId,
            message: content,
            userId
          },
          include: {
            user: true // 👈 FIX 2: Get user name/photo to show in UI
          }
        });

        // 2. Broadcast the FULL object to everyone
        users.forEach((u) => {
          if (
            u.rooms.includes(roomId) &&
            u.ws.readyState === WebSocket.OPEN
          ) {
            u.ws.send(
              JSON.stringify({
                type: "chat",
                roomId,
                message: { // 👈 FIX 3: Send structure matching Frontend expectation
                  id: chatEntry.id,
                  content: chatEntry.message,
                  userId: {
                    id: chatEntry.user.id,
                    name: chatEntry.user.name,
                    photo: chatEntry.user.photo
                  }
                }
              })
            );
          }
        });
      } catch (e) {
        console.error("Chat error:", e);
      }
    }
  });

  ws.on("close", () => {
    const index = users.findIndex((u) => u.ws === ws);
    if (index !== -1) {
      users.splice(index, 1);
    }
  });
});
