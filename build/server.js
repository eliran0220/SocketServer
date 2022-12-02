"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_1 = require("redis");
const redis_emitter_1 = require("@socket.io/redis-emitter");
const utilities_1 = __importDefault(require("./utilities"));
class RedisServer {
    pub_client;
    sub_client;
    io;
    port;
    emitter;
    connections;
    connections_size;
    constructor() {
        this.pub_client = null;
        this.sub_client = null;
        this.io = null;
        this.port = 3000;
        this.connections = [];
        this.connections_size = 0;
        this.emitter = new redis_emitter_1.Emitter(null);
    }
    intializeServer = async () => {
        try {
            this.io = new socket_io_1.Server();
            this.pub_client = (0, redis_1.createClient)();
            this.sub_client = this.pub_client.duplicate();
            await this.pub_client.connect();
            await this.sub_client.connect();
            this.emitter = new redis_emitter_1.Emitter(this.pub_client);
            this.io.adapter((0, redis_adapter_1.createAdapter)(this.pub_client, this.sub_client));
            this.io.listen(this.port);
            await this.initIncomingConnection();
        }
        catch (err) {
            console.log(err);
        }
    };
    initIncomingConnection = async () => {
        this.io.on("connection", async (socket) => {
            console.log(`${socket.id} has been connected!`);
            const emitter = this.emitter.in(socket.id);
            const response = { message: "connected" };
            emitter.emit("connected", response);
            const rooms = await this.io.of('/').adapter.allRooms();
            console.log(rooms);
            await this.handleRequests(socket);
        });
    };
    handleRequests = async (socket) => {
        socket.on("spin", async (data) => {
            console.log("onSpin");
            await this.handleSpin(data);
        });
        socket.on("wild", async (data) => {
            console.log("onWild");
            await this.handleWild(data);
        });
        socket.on("blast", async (data) => {
            console.log("onBlast");
            await this.handleBlast(data);
        });
        socket.on("disconnect", async (data) => {
            await this.handleDisconnect(data, socket);
        });
    };
    handleSpin = async (data) => {
        const rooms = await this.io.of('/').adapter.allRooms();
        const random_connection = utilities_1.default.getRandomConnection(rooms);
        const response = { message: data.message };
        const emitter = this.emitter.in(random_connection);
        emitter.emit("spin", response);
    };
    handleWild = async (data) => {
        const rooms = await this.io.of('/').adapter.allRooms();
        const response = { message: data.message };
        const random = Number(data.random_number);
        if (random <= 0) {
            // in case negative number was provided, no emit
            return;
        }
        else if (random === 1) {
            const random_connection = utilities_1.default.getRandomConnection(rooms);
            const emitter = this.emitter.in(random_connection);
            emitter.emit("wild", response);
        }
        else if (random >= this.connections_size) {
            // in case number bigger than connections size was provided, emit to all
            this.emitter.emit("blast", response);
        }
        else {
            const cloned_connectios = [...rooms];
            let left = Number(data.random_number);
            const chosen_connections = utilities_1.default.getRandomConnections(left, cloned_connectios);
            this.emitChosenConnections(chosen_connections, response);
        }
    };
    emitChosenConnections = async (chosen_connections, response) => {
        let wildEmitter = null;
        for (const connection of chosen_connections) {
            wildEmitter = this.emitter.in(connection);
            wildEmitter.emit("spin", response);
        }
    };
    handleBlast = async (data) => {
        console.log("Total connections:", this.connections_size);
        this.emitter.emit("blast", data);
    };
    handleDisconnect = async (data, socket) => {
        console.log("Total connections:", this.connections_size);
        this.connections = this.connections.filter(connection => connection !== socket);
        this.connections_size--;
        console.log(`${socket.id} has been disconnected.`);
    };
}
const redis_server = new RedisServer();
exports.default = redis_server;
