import { z } from "zod";

export const CreateUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username too long"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),

  name: z
    .string()
    .trim()
    .min(1, "Name is required"),
});

export const SigninSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(50),

  password: z.string().min(6),
});


export const CreateRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Room name too short")
    .max(20, "Room name too long"),
});


