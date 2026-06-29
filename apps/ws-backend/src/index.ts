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

async function canAccessRoom(roomId: number, userId: string) {
  const room = await prismaClient.room.findFirst({
    where: {
      id: roomId,
      OR: [
        { visibility: "PUBLIC" },
        { adminId: userId },
        { collaborators: { some: { id: userId } } },
      ],
    },
    select: { id: true },
  });

  return Boolean(room);
}

function hasJoinedRoom(roomId: number, ws: WebSocket) {
  return roomMembers.get(roomId)?.has(ws) === true;
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

      if (!(await canAccessRoom(roomId, userId))) {
        ws.send(JSON.stringify({
          type: "error",
          code: "ROOM_ACCESS_DENIED",
          roomId,
        }));
        return;
      }

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
      if (!Number.isInteger(roomId) || !hasJoinedRoom(roomId, ws)) return;

      broadcastToRoom(roomId, ws, { type: "drawing", roomId, elements });

      setImmediate(async () => {
        for (const el of elements) {
          try {
            const updated = await prismaClient.shape.updateMany({
              where: { id: el.id, roomId },
              data: { data: JSON.stringify(el) },
            });

            if (updated.count === 0) {
              await prismaClient.shape.create({
                data: { id: el.id, roomId, data: JSON.stringify(el) },
              });
            }
          } catch (e) {
            console.error("Shape save error:", e);
          }
        }
      });
      return;
    }

    if (parsedData.type === "cursor") {
      const roomId = Number(parsedData.roomId);
      if (!Number.isInteger(roomId) || !hasJoinedRoom(roomId, ws)) return;

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

      if (
        !Number.isInteger(roomId) ||
        !hasJoinedRoom(roomId, ws) ||
        typeof content !== "string"
      ) return;

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
