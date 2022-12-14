import { Socket,Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import {Emitter} from "@socket.io/redis-emitter";
import Message from './models';
import utilites from './utilities';

class RedisServer {
    private pub_client : any;
    private sub_client : any;
    private io : any;
    private port : number;
    private emitter : Emitter;

    constructor() {
        this.pub_client =  null;
        this.sub_client =  null;
        this.io =  null;
        this.port = 3000;
        this.emitter = new Emitter(null);
    }

    intializeServer = async () : Promise<void> => {
        try {
            this.io = new Server();
            this.pub_client = createClient();
            this.sub_client = this.pub_client.duplicate();
            await this.pub_client.connect();
            await this.sub_client.connect();
            this.emitter = new Emitter(this.pub_client);
            this.io.adapter(createAdapter(this.pub_client, this.sub_client));
            this.io.listen(this.port,{perMessageDeflate: {threshold : 1024}});
            await this.initIncomingConnection();
        } 
        catch (err) 
        {
            console.log(err);
        }

    }

    initIncomingConnection = async () : Promise<void> => {
        try {
        this.io.on("connection",async (socket : Socket)=>{
            console.log(`${socket.id} has been connected!`);
            const emitter = this.emitter.in(socket.id);
            const response : Message = {message : "connected"};
            emitter.emit("data",response);
            await this.handleRequests(socket);
        });
    } catch (err) {
        console.log("err at connecting socket");
        }
    }

    handleRequests = async (socket: Socket) : Promise<void> => {
        try {
        socket.on("spin", async (data : Message)  => {
            console.log("onSpin");
            utilites.validateRequest(data);
            await this.handleSpin(data);
        });
        socket.on("wild", async (data : Message) => {
            console.log("onWild");
            utilites.validateRequest(data);
            await this.handleWild(data);
        });
        socket.on("blast", async (data : Message) => {
            console.log("onBlast");
            utilites.validateRequest(data);
            await this.handleBlast(data);
        })

        socket.on("disconnect", async (data:any) => {
            console.log("onDisconnect");
            await this.handleDisconnect(data,socket);
        }) 
        }
        catch (err) {
            console.log(err)
        }
    }

    handleSpin = async (data : Message) : Promise<void> => {
        try {
        console.log("rooms")
        const rooms = [...await this.io.of('/').adapter.allRooms()];
        const random_connection = utilites.getRandomConnection(rooms);
        const response : Message = {message : data.message}
        const emitter = this.emitter.in(random_connection);
        emitter.emit("data",response);
        } catch (err) {
            console.log("err att spin");
        }
    }

    handleWild = async (data: Message) : Promise<void> => {
        try {
        const response : Message = {message : data.message}
        if (!data.random_number || data.random_number === 0) {
            return;
        }
        let random : number = 0;
        if (!Number.isFinite(data.random_number)) {
            // put default value 1 in case the random_number is not in number value, simple check
            random = 1;
        }
        const rooms = [...await this.io.of('/').adapter.allRooms()]
         if (random === 1) {
            const random_connection = utilites.getRandomConnection(rooms);
            const emitter = this.emitter.in(random_connection);
            emitter.emit("data",response);
            return;
        }
        else if (random >= rooms.length) {
            // in case number bigger than connections size was provided, emit to all
            this.emitter.emit("data",response);
            return;
        } else {
            const rooms = [...await this.io.of('/').adapter.allRooms()]
            const cloned_connectios = [...rooms];
            let left = Number(data.random_number);
            const chosen_connections = utilites.getRandomConnections(left,cloned_connectios);
            this.emitChosenConnections(chosen_connections,response);
        }
    } catch (err) {
        console.log("err at wild")
    }
    }

    emitChosenConnections = async (chosen_connections : string[], response : Message) : Promise<void> => {
        try {
        let wildEmitter = null;
        for (const connection of chosen_connections) {
            wildEmitter = this.emitter.in(connection);
            wildEmitter.emit("data",response);
        }
    } catch (err) {
        console.log("err at emitChosenConnections")
    }
    }

    handleBlast = async (data:Message) : Promise<void> => {
        try {
        this.emitter.emit("data",data);
        } catch (err) {
            console.log("err at blast")
        }
    }

    handleDisconnect = async (data : any, socket: Socket) : Promise<void> => {
        console.log(`${socket.id} has been disconnected.`)
    }


}

const redis_server = new RedisServer();
export default redis_server;






