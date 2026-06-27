import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  userId: string;
}

const usersBySocket = new Map<WebSocket, User>();
const roomMembers = new Map<number, Set<WebSocket>>();

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded?.userId ?? null;
  } catch {
    return null;
  }
}

function broadcastToRoom(roomId: number, senderWs: WebSocket, payload: object) {
  const members = roomMembers.get(roomId);
  if (!members) return;

  const message = JSON.stringify(payload);
  for (const socket of members) {
    if (socket !== senderWs && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }
}

wss.on("connection", (ws, request) => {
  const url = request.url;
  if (!url) return ws.close();

  const token = new URLSearchParams(url.split("?")[1]).get("token");
  if (!token) return ws.close();

  const userId = checkUser(token);
  if (!userId) return ws.close();

  usersBySocket.set(ws, { ws, userId });

  ws.on("message", async (data) => {
    let parsedData: any;
    try {
      parsedData = JSON.parse(
        typeof data === "string" ? data : data.toString()
      );
    } catch {
      return;
    }

    if (!parsedData?.type) return;

    if (parsedData.type === "join_room") {
      const roomId = Number(parsedData.roomId);
      if (isNaN(roomId)) return;
      if (!roomMembers.has(roomId)) roomMembers.set(roomId, new Set());
      roomMembers.get(roomId)!.add(ws);
      return;
    }

    if (parsedData.type === "leave_room") {
      const roomId = Number(parsedData.roomId);
      roomMembers.get(roomId)?.delete(ws);
      return;
    }

    if (parsedData.type === "drawing") {
      const roomId = Number(parsedData.roomId);
      const elements: any[] = parsedData.elements ?? [];

      broadcastToRoom(roomId, ws, { type: "drawing", roomId, elements });

      setImmediate(async () => {
        for (const el of elements) {
          try {
            await prismaClient.shape.upsert({
              where: { id: el.id },
              update: { data: JSON.stringify(el) },
              create: { id: el.id, roomId, data: JSON.stringify(el) },
            });
          } catch (e) {
            console.error("Shape save error:", e);
          }
        }
      });
      return;
    }

    if (parsedData.type === "cursor") {
      const roomId = Number(parsedData.roomId);
      broadcastToRoom(roomId, ws, {
        type: "cursor",
        roomId,
        pointer: parsedData.pointer,
        clientId: parsedData.clientId,
        color: parsedData.color,
        username: parsedData.username || "Anonymous",
      });
      return;
    }

    if (parsedData.type === "chat") {
      const roomId = Number(parsedData.roomId);
      const content = parsedData.content;

      if (!roomId || typeof content !== "string") return;

      try {
        const chatEntry = await prismaClient.chat.create({
          data: { roomId, message: content, userId },
          include: { user: { select: { id: true, name: true, photo: true } } },
        });

        const members = roomMembers.get(roomId);
        if (!members) return;

        const message = JSON.stringify({
          type: "chat",
          roomId,
          message: {
            id: chatEntry.id,
            content: chatEntry.message,
            userId: chatEntry.user,
          },
        });

        for (const socket of members) {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
          }
        }
      } catch (e) {
        console.error("Chat error:", e);
      }
    }
  });

  ws.on("close", () => {
    usersBySocket.delete(ws);
    for (const members of roomMembers.values()) {
      members.delete(ws);
    }
  });
});

console.log("WebSocket server running on port 8080");