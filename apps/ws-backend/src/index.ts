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

    /* -------- CHAT -------- */
    if (parsedData.type === "chat") {
      const roomId = Number(parsedData.roomId);
      const message = parsedData.message;

      if (!roomId || typeof message !== "string") return;

      await prismaClient.chat.create({
        data: {
          roomId,
          message,
          userId,
        },
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
              message,
              userId,
            })
          );
        }
      });
    }
  });

  ws.on("close", () => {
    const index = users.findIndex((u) => u.ws === ws);
    if (index !== -1) {
      users.splice(index, 1);
    }
  });
});
