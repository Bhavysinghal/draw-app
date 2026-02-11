import { z } from "zod";

export const CreateUserSchema = z.object({
  username: z.string().email(), // Change min(3) to email()
  password: z.string().min(6),
  name: z.string().min(1),
});

export const SigninSchema = z.object({
  username: z.string().email(), // Change here too
  password: z.string().min(6),
});


export const CreateRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Room name too short")
    .max(20, "Room name too long"),
});


