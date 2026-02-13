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

//     /* -------- DRAWING -------- */
//     if (parsedData.type === "drawing") {
//       const roomId = Number(parsedData.roomId);
//       const elements = parsedData.elements; // Array of shape objects
//       const clientId = parsedData.clientId;

//       // 1. Broadcast to others (Real-time sync)
//       users.forEach((u) => {
//         if (u.ws !== ws && u.rooms.includes(roomId) && u.ws.readyState === WebSocket.OPEN) {
//           u.ws.send(JSON.stringify({
//             type: "drawing",
//             roomId,
//             elements,
//             clientId
//           }));
//         }
//       });

//       // 2. SAVE TO DB (Persistence Logic)
//       // This ensures when you refresh, the drawings are saved in the DB to be fetched via HTTP
//       // ... after broadcasting to users ...
// if (Array.isArray(elements)) {
//     elements.forEach(async (element: any) => {
//         await prismaClient.shape.upsert({
//             where:  { id: element.id },
//             update: { data: JSON.stringify(element) },
//             create: { id: element.id, roomId, data: JSON.stringify(element) }
//         });
//     });
// }
//     }

    /* -------- CURSOR -------- */
    if (parsedData.type === "cursor") {
      const roomId = Number(parsedData.roomId);
      const pointer = parsedData.pointer;
      const clientId = parsedData.clientId;
      const color = parsedData.color;
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
    }   
    
    /* -------- CHAT -------- */
    if (parsedData.type === "chat") {
      const roomId = Number(parsedData.roomId);
      const content = parsedData.content;

      if (!roomId || typeof content !== "string") return;

      try {
        const chatEntry = await prismaClient.chat.create({
          data: {
            roomId,
            message: content,
            userId
          },
          include: {
            user: true
          }
        });

        users.forEach((u) => {
          if (
            u.rooms.includes(roomId) &&
            u.ws.readyState === WebSocket.OPEN
          ) {
            u.ws.send(
              JSON.stringify({
                type: "chat",
                roomId,
                message: { 
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