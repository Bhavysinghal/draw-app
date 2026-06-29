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


export const RoomVisibilitySchema = z.enum(["PUBLIC", "PRIVATE"]);

export const CreateRoomSchema = z.object({
  visibility: RoomVisibilitySchema.default("PRIVATE"),
});

