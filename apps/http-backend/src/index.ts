// import express, { json } from "express";
// import jwt,{JwtPayload} from "jsonwebtoken";
// import bcrypt from "bcryptjs";
// import cors from "cors";
// import { JWT_SECRET } from '@repo/backend-common/config';
// import { middleware } from "./auth.middleware";
// import { 
//     CreateUserSchema,
//     SigninSchema, 
//     CreateRoomSchema 
// } from "@repo/common/types";
// import { prismaClient } from "@repo/db/client";

// const app = express();

// app.use(express.json());
// app.use(cors())

// app.post("/signup", async (req, res) => {

//     const parsedData = CreateUserSchema.safeParse(req.body);
//     if (!parsedData.success) {
//         console.log(parsedData.error);
//         res.json({
//             message: "Incorrect inputs"
//         })
//         return;
//     }
//     try {
//         const hashedPassword=await bcrypt.hash(parsedData.data.password,10)

//         const user = await prismaClient.user.create({
//             data: {
//                 email: parsedData.data?.username,
//                 password: hashedPassword,
//                 name: parsedData.data.name
//             }
//         })

//         return res.json({
//             userId: user.id
//         })
//     } catch(e) {
//         res.status(409).json({
//             message: "User already exists with this username"
//         })
//     }
// })

// app.post("/signin", async (req, res) => {

//     const parsedData = SigninSchema.safeParse(req.body);

//     if (!parsedData.success) {
//         return res.status(400).json({
//             message:"Incorrect inputs"
//         })
//     }

//     const user = await prismaClient.user.findFirst({
//         where: {
//             email: parsedData.data.username,
//         }
//     })

//     if (!user) {
//     return res.status(403).json({
//       message: "Invalid credentials",
//     });
//   }

//     const isPasswordValid=await bcrypt.compare(
//         parsedData.data.password,
//         user.password
//     )
//     if (!isPasswordValid) {
//     return res.status(403).json({
//       message: "Invalid credentials",
//     });
//   }

//     const token = jwt.sign({
//         userId: user?.id
//     }, JWT_SECRET,
//     {expiresIn:"30d"});

//     return res.json({
//         token
//     })
// })

// // app.post("/room", middleware, async (req, res) => {
// //     const parsedData = CreateRoomSchema.safeParse(req.body);

// //     if (!parsedData.success) {
// //         return res.status(400).json({
// //             message: "Incorrect inputs"
// //         })
        
// //     }
// //     const userId = req.userId!;

// //     try {
// //         const room = await prismaClient.room.create({
// //             data: {
// //                 slug: parsedData.data.name,
// //                 adminId: userId
// //             }
// //         })

// //       return res.status(201).json({
// //             roomId: room.id
// //         })
// //     } catch (e) {
// //   return res.status(500).json({
// //     message: "Something went wrong"
// //   });
// // }
// // })

// // app.get("/chats/:roomId", middleware,async (req, res) => {
// //     try {
// //         const roomId = Number(req.params.roomId);
// //         if (isNaN(roomId)) {
// //       return res.status(400).json({
// //         messages: [],
// //       });
// //     }
// //         const messages = await prismaClient.chat.findMany({
// //             where: {   roomId
// //             },
// //             orderBy: {
// //                 id: "desc"
// //             },
// //             take: 1000
// //         });

// //         return res.json({
// //             messages
// //         })
// //     } catch(e) {
// //        return res.status(500).json({
// //             messages: []
// //         })
// //     }
    
// // })

// // app.get("/room/:slug", async (req, res) => {
// //   try {
// //     const slug = req.params.slug;

// //     if (!slug) {
// //       return res.status(400).json({ message: "Slug is required" });
// //     }

// //     const room = await prismaClient.room.findFirst({
// //       where: { slug }
// //     });

// //     if (!room) {
// //       return res.status(404).json({ message: "Room not found" });
// //     }

// //     return res.json({ room });
// //   } catch (e) {
// //     return res.status(500).json({
// //       message: "Something went wrong"
// //     });
// //   }
// // });

// /* -------------------------------------------------------------------------- */
// /* NEW ENDPOINTS                                */
// /* -------------------------------------------------------------------------- */

// // 1. Get User Profile (Fixes fetchUserProfile 404)
// app.get("/me", middleware, async (req, res) => {
//     const userId = req.userId;
//     try {
//         const user = await prismaClient.user.findFirst({
//             where: {
//                 id: userId
//             }
//         });
        
//         if (!user) {
//              res.status(404).json({ message: "User not found" });
//              return;
//         }

//         res.json({
//             user: {
//                 name: user.name,
//                 email: user.email,
//                 photo: user.photo
//             }
//         });
//     } catch (e) {
//         res.status(500).json({
//             message: "Something went wrong"
//         });
//     }
// });

// // 2. Get User's Rooms (Fixes fetchRooms 404)
// app.get("/my-rooms", middleware, async (req, res) => {
//     const userId = req.userId;

//     try {
//         const rooms = await prismaClient.room.findMany({
//             where: {
//                 adminId: userId // Fetch rooms where the user is the admin
//             },
//             orderBy: {
//                 createdAt: 'desc' // Show newest rooms first
//             }
//         });

//         res.json({
//             rooms
//         });
//     } catch (e) {
//         res.status(500).json({
//             message: "Something went wrong"
//         });
//     }
// });

// /* -------------------------------------------------------------------------- */
// app.post("/create-room", middleware, async (req, res) => {
//     // 1. Validate Input (e.g., room name)
//     // You should create a Zod schema for this, like 'CreateRoomSchema'
//     const { name } = req.body; 
//     if (!name) {
//         res.status(400).json({ message: "Room name is required" });
//         return;
//     }

//     // 2. Generate a unique slug for the room URL
//     // A simple timestamp-based slug for now. You can make it better later.
//     const slug = name.toLowerCase().replace(/ /g, '-') + '-' + Date.now();

//     try {
//         // 3. Create the room in the database
//         const room = await prismaClient.room.create({
//             data: {
//                 slug: slug,
//                 adminId: req.userId // The logged-in user is the admin
//             }
//         });

//         // 4. Return the created room's ID
//         res.json({
//             roomId: room.id
//         });

//     } catch (e) {
//         console.error(e);
//         res.status(500).json({
//             message: "Could not create room"
//         });
//     }
// });

// app.listen(3001,() => {
//   console.log("Server running on port 3001");
// });

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import nodemailer from "nodemailer"; // 👈 New Import
import { middleware } from "./auth.middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import { 
    CreateUserSchema,
    SigninSchema 
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";

const app = express();

app.use(express.json());
app.use(cors());

/* -------------------------------------------------------------------------- */
/* AUTH ROUTES                                 */
/* -------------------------------------------------------------------------- */

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

    const isPasswordValid = await bcrypt.compare(parsedData.data.password, user.password);

    if (!isPasswordValid) {
        res.status(403).json({ message: "Invalid credentials" });
        return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ token });
});

/* -------------------------------------------------------------------------- */
/* ROOM ROUTES                                 */
/* -------------------------------------------------------------------------- */

app.post("/create-room", middleware, async (req, res) => {
    const { name } = req.body; 
    if (!name) {
        res.status(400).json({ message: "Room name is required" });
        return;
    }

    const slug = name.toLowerCase().replace(/ /g, '-') + '-' + Date.now();

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
    const slug = req.params.slug;
    try {
        const room = await prismaClient.room.findFirst({
            where: { slug }
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

// 🚀 UPGRADE: Fetch rooms I own OR rooms I am a collaborator in
app.get("/my-rooms", middleware, async (req, res) => {
    const userId = req.userId;
    try {
        const rooms = await prismaClient.room.findMany({
            where: {
                OR: [
                    { adminId: userId }, // My rooms
                    { collaborators: { some: { id: userId } } } // Shared rooms
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
/* COLLABORATION ROUTES                            */
/* -------------------------------------------------------------------------- */

// 🚀 NEW FEATURE: Add Collaborator with Email Invite
app.post('/rooms/:roomId/add-collaborator', middleware, async (req, res) => {
const roomId = req.params.roomId as string;
    const { email } = req.body; // Expecting email

    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
        // 1. Check if user exists
        const userToAdd = await prismaClient.user.findFirst({
            where: { email }
        });

        if (!userToAdd) {
            // 📧 Send Email Invitation (If user doesn't exist)
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.GMAIL_USER, // Add these to your .env
                        pass: process.env.GMAIL_PASS,
                    },
                });

                await transporter.sendMail({
                    from: process.env.GMAIL_USER,
                    to: email,
                    subject: `Invitation to join SketchCalibur`,
                    text: `You have been invited to collaborate! Please sign up here: http://localhost:3000/signup`,
                });

                return res.status(404).json({ message: "User not found, invitation sent!" });
            } catch (mailErr) {
                console.error("Mail error:", mailErr);
                return res.status(500).json({ message: "User not found and failed to send email." });
            }
        }

        // 2. Add user as collaborator
        const roomIdNum = parseInt(roomId); // Ensure ID is a number/string based on your DB
        
        await prismaClient.room.update({
            where: { id: roomIdNum },
            data: {
                collaborators: {
                    connect: { id: userToAdd.id } // Connect the relation
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
/* USER PROFILE ROUTES                             */
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

// 🚀 NEW FEATURE: Update Profile
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
/* CHAT ROUTES                                 */
/* -------------------------------------------------------------------------- */

app.get("/chats/:roomId", middleware, async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        const messages = await prismaClient.chat.findMany({
            where: { roomId: roomId },
            orderBy: { id: "desc" },
            take: 1000
        });
        res.json({ messages });
    } catch(e) {
        res.json({ messages: [] });
    }
});

app.listen(3001, () => {
    console.log("Server running on port 3001");
});