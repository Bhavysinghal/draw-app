import { NextFunction, Request, Response } from "express";
import  Jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";


export function middleware(req:Request,res:Response,next:NextFunction){
   
     try {
        const authHeader=req.headers.authorization;
        if(!authHeader){
            return res.status(403).json({
                message:"No Token provided"
            })
        }
        const token=authHeader.split(" ")[1]
        //@ts-ignore
        const decoded=Jwt.verify(token,JWT_SECRET);
        //@ts-ignore
        req.userId=decoded.userId

        next();
     } catch(err){
        return res.status(403).json({
            message:"Unauthorised"
        })
     }
    

    
    

}