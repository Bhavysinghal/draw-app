import dotenv from "dotenv";
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "12345";

if (!process.env.JWT_SECRET) {
    console.warn("⚠️ Warning: Using default JWT_SECRET. This is unsafe for production!");
    // In strict production, you might want to: throw new Error("Missing JWT_SECRET");
}