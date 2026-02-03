import express, { json } from "express";
import jwt,{JwtPayload} from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import { JWT_SECRET } from '@repo/backend-common/config';
import { middleware } from "./auth.middleware";
import { 
    CreateUserSchema,
    SigninSchema, 
    CreateRoomSchema 
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";

const app = express();

app.use(express.json());
app.use(cors())

app.post("/signup", async (req, res) => {

    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        console.log(parsedData.error);
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    try {
        const hashedPassword=await bcrypt.hash(parsedData.data.password,10)

        const user = await prismaClient.user.create({
            data: {
                email: parsedData.data?.username,
                password: hashedPassword,
                name: parsedData.data.name
            }
        })

        return res.json({
            userId: user.id
        })
    } catch(e) {
        res.status(409).json({
            message: "User already exists with this username"
        })
    }
})

app.post("/signin", async (req, res) => {

    const parsedData = SigninSchema.safeParse(req.body);

    if (!parsedData.success) {
        return res.status(400).json({
            message:"Incorrect inputs"
        })
    }

    const user = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username,
        }
    })

    if (!user) {
    return res.status(403).json({
      message: "Invalid credentials",
    });
  }

    const isPasswordValid=await bcrypt.compare(
        parsedData.data.password,
        user.password
    )
    if (!isPasswordValid) {
    return res.status(403).json({
      message: "Invalid credentials",
    });
  }

    const token = jwt.sign({
        userId: user?.id
    }, JWT_SECRET,
    {expiresIn:"30d"});

    return res.json({
        token
    })
})

app.post("/room", middleware, async (req, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);

    if (!parsedData.success) {
        return res.status(400).json({
            message: "Incorrect inputs"
        })
        
    }
    const userId = req.userId!;

    try {
        const room = await prismaClient.room.create({
            data: {
                slug: parsedData.data.name,
                adminId: userId
            }
        })

      return res.status(201).json({
            roomId: room.id
        })
    } catch (e) {
  return res.status(500).json({
    message: "Something went wrong"
  });
}
})

app.get("/chats/:roomId", middleware,async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        if (isNaN(roomId)) {
      return res.status(400).json({
        messages: [],
      });
    }
        const messages = await prismaClient.chat.findMany({
            where: {   roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 1000
        });

        return res.json({
            messages
        })
    } catch(e) {
       return res.status(500).json({
            messages: []
        })
    }
    
})

app.get("/room/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;

    if (!slug) {
      return res.status(400).json({ message: "Slug is required" });
    }

    const room = await prismaClient.room.findFirst({
      where: { slug }
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    return res.json({ room });
  } catch (e) {
    return res.status(500).json({
      message: "Something went wrong"
    });
  }
});


app.listen(3001,() => {
  console.log("Server running on port 3001");
});