import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";


declare global{
    namespace Express{
        interface Request{
            userId?:string;
        }
    }
}

export function middleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;


    if(!authHeader){
        return res.status(401).json({
            message:"Authorization token missing"
        })
    }
    const token=authHeader.split(" ")[1];

    if(!token){
         return res.status(401).json({
            message:"Invalid authorization format"
        })
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        if(!decoded){
            return res.status(403).json({
                message:"Invalid payload token"
            })
        }
        req.userId = decoded.userId as string;
        next();
        
    } catch (error) {
        res.status(403).json({
            message: "Expired or invalid token"
        })
    }
    
}