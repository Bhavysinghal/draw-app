import {WebSocketServer} from "ws"
import Jwt, { JwtPayload }  from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

const wss =new WebSocketServer({port:8080})

wss.on('connection',function connection(ws,request){
    try {
        const url=request.url;
        if(!url){
            return ws.close();
        }
        const queryParams=new URLSearchParams(url.split('?')[1])
        const token=queryParams.get('token')

        if(!token){
            return ws.close()
        }
        const decoded=Jwt.verify(token,JWT_SECRET)
       if (typeof decoded !== "object" || !("userId" in decoded)) {
      return ws.close();
    }

    const userId = (decoded as JwtPayload).userId;
    } catch (error) {
        return ws.close();
    }

    ws.on('message',function message(data){
        ws.send('pong')
    })
})