import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import nodemailer from "nodemailer";
import { middleware } from "./auth.middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import { 
    CreateUserSchema,
    SigninSchema 
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";

const app = express();

app.use(express.json());
app.use(cors({
    origin: "*", // ⚠️ ALLOWS ALL origins (good for debugging)
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/* -------------------------------------------------------------------------- */
/* AUTH ROUTES                                                                */
/* -------------------------------------------------------------------------- */

// 1. Google Auth Redirect
app.get("/auth/google", (req, res) => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=profile email`;
    res.redirect(url);
});

// 2. Google Callback
app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;

    if (!code) {
        res.status(400).send("No code provided");
        return;
    }

    try {
        const { data } = await axios.post("https://oauth2.googleapis.com/token", {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        });

        const { access_token } = data;

        const { data: googleUser } = await axios.get("https://www.googleapis.com/oauth2/v1/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const { email, name, picture, id: googleId } = googleUser;

        let user = await prismaClient.user.findFirst({
            where: { email }
        });

        if (!user) {
            user = await prismaClient.user.create({
                data: {
                    email,
                    name,
                    photo: picture,
                    googleId,
                    password: "" 
                }
            });
        } else {
             if (!user.googleId) {
                 user = await prismaClient.user.update({
                     where: { id: user.id },
                     data: { googleId, photo: picture || user.photo }
                 });
             }
        }

        const token = jwt.sign({ 
            userId: user.id,
            name: user.name 
        }, JWT_SECRET);

        res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).send("Authentication failed");
    }
});

app.post("/signup", async (req, res) => {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ message: "Incorrect inputs", errors: parsedData.error });
        return;
    }
    try {
        const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
        const user = await prismaClient.user.create({
            data: {
                email: parsedData.data.username, 
                password: hashedPassword,
                name: parsedData.data.name
            }
        });
        res.json({ userId: user.id });
    } catch(e) {
        res.status(409).json({ message: "User already exists with this email" });
    }
});

app.post("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ message: "Incorrect inputs" });
        return;
    }

    const user = await prismaClient.user.findFirst({
        where: { email: parsedData.data.username }
    });

    if (!user) {
        res.status(403).json({ message: "Invalid credentials" });
        return;
    }

    if (!user.password) {
        res.status(403).json({ message: "Invalid credentials. Please login with Google." });
        return;
    }

    const isPasswordValid = await bcrypt.compare(parsedData.data.password, user.password);

    if (!isPasswordValid) {
        res.status(403).json({ message: "Invalid credentials" });
        return;
    }

    const token = jwt.sign({ 
        userId: user.id,
        name: user.name 
    }, JWT_SECRET);
    
    res.json({ token });
});

/* -------------------------------------------------------------------------- */
/* ROOM ROUTES                                                                */
/* -------------------------------------------------------------------------- */

app.post("/create-room", middleware, async (req, res) => {
    const { name } = req.body; 
    if (!name) {
        res.status(400).json({ message: "Room name is required" });
        return;
    }

    const randomString = Math.random().toString(36).substring(2, 6);
    const slug = name.toLowerCase().trim().replace(/ /g, '-') + '-' + randomString;

    try {
        const room = await prismaClient.room.create({
            data: {
                slug: slug,
                adminId: req.userId!
            }
        });
        res.json({ roomId: room.id });
    } catch (e) {
        res.status(500).json({ message: "Could not create room" });
    }
});

app.get("/room/:slug", async (req, res) => {
    const param = req.params.slug;
    const isNumeric = !isNaN(Number(param)); // Checks if the param is a number (like "4")

    try {
        const room = await prismaClient.room.findFirst({
            // If number, search by ID. If text, search by Slug.
            where: isNumeric ? { id: Number(param) } : { slug: param }
        });
        if (!room) {
             res.status(404).json({ message: "Room not found" });
             return;
        }
        res.json({ room });
    } catch(e) {
        res.status(500).json({ message: "Something went wrong" });
    }
});

app.get("/my-rooms", middleware, async (req, res) => {
    const userId = req.userId;
    try {
        const rooms = await prismaClient.room.findMany({
            where: {
                OR: [
                    { adminId: userId }, 
                    { collaborators: { some: { id: userId } } } 
                ]
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ rooms });
    } catch (e) {
        res.status(500).json({ message: "Something went wrong" });
    }
});

/* -------------------------------------------------------------------------- */
/* COLLABORATION ROUTES                                                       */
/* -------------------------------------------------------------------------- */

app.post('/rooms/:roomId/add-collaborator', middleware, async (req, res) => {
    const roomId = req.params.roomId as string;
    const { email } = req.body; 

    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
        const userToAdd = await prismaClient.user.findFirst({
            where: { email }
        });

        if (!userToAdd) {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.GMAIL_USER,
                        pass: process.env.GMAIL_PASS,
                    },
                });

                await transporter.sendMail({
                    from: process.env.GMAIL_USER,
                    to: email,
                    subject: `Invitation to join DrawSync`,
                    text: `You have been invited to collaborate! Please sign up here: ${FRONTEND_URL}/signup`,
                });

                return res.status(404).json({ message: "User not found, invitation sent!" });
            } catch (mailErr) {
                console.error("Mail error:", mailErr);
                return res.status(500).json({ message: "User not found and failed to send email." });
            }
        }

        const roomIdNum = parseInt(roomId); 
        
        await prismaClient.room.update({
            where: { id: roomIdNum },
            data: {
                collaborators: {
                    connect: { id: userToAdd.id }
                }
            }
        });

        res.json({ message: "Collaborator added successfully!" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Failed to add collaborator" });
    }
});

/* -------------------------------------------------------------------------- */
/* USER PROFILE ROUTES                                                        */
/* -------------------------------------------------------------------------- */

app.get("/me", middleware, async (req, res) => {
    const userId = req.userId;
    try {
        const user = await prismaClient.user.findFirst({
            where: { id: userId }
        });
        
        if (!user) {
             res.status(404).json({ message: "User not found" });
             return;
        }

        res.json({
            user: {
                name: user.name,
                email: user.email,
                photo: user.photo
            }
        });
    } catch (e) {
        res.status(500).json({ message: "Something went wrong" });
    }
});

app.put("/me", middleware, async (req, res) => {
    const userId = req.userId;
    const { name, photo } = req.body;

    try {
        const updatedUser = await prismaClient.user.update({
            where: { id: userId },
            data: { name, photo }
        });

        res.json({ message: "Profile updated", user: updatedUser });
    } catch (e) {
        res.status(500).json({ message: "Error updating profile" });
    }
});

/* -------------------------------------------------------------------------- */
/* CHAT / SNAPSHOT ROUTES (Using Slug for Drawing Persistence)                */
/* -------------------------------------------------------------------------- */

// GET History by Slug
app.get("/chats/:slug", middleware, async (req, res) => {
    try {
        const param = req.params.slug as string; 
        const isNumeric = !isNaN(Number(param));
        
        const room = await prismaClient.room.findFirst({ 
            where: isNumeric ? { id: Number(param) } : { slug: param } 
        });
        
        if (!room) {
             res.status(404).json({ messages: [] });
             return;
        }

        const messages = await prismaClient.chat.findMany({
            where: { roomId: room.id },
            orderBy: { id: "desc" },
            take: 1000
        });
        res.json({ messages });
    } catch(e) {
        res.json({ messages: [] });
    }
});

// POST Snapshot by Slug
app.post("/chats/:slug", middleware, async (req, res) => {
    try {
        const param = req.params.slug as string; 
        const isNumeric = !isNaN(Number(param));
        const { message } = req.body; 

        if (!message) {
             res.status(400).json({ message: "Content required" });
             return;
        }

        const room = await prismaClient.room.findFirst({ 
            where: isNumeric ? { id: Number(param) } : { slug: param } 
        });
        
        if (!room) {
             res.status(404).json({ message: "Room not found" });
             return;
        }

        await prismaClient.chat.create({
            data: {
                roomId: room.id,
                message, 
                userId: req.userId!
            }
        });

        res.json({ message: "Snapshot saved" });
    } catch (e) {
        console.error("Save snapshot error:", e);
        res.status(500).json({ message: "Error saving snapshot" });
    }
});

app.listen(3001, () => {
    console.log("Server running on port 3001");
});