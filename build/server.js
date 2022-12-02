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
    constructor() {
        this.pub_client = null;
        this.sub_client = null;
        this.io = null;
        this.port = 3000;
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
            emitter.emit("data", response);
            await this.handleRequests(socket);
        });
    };
    handleRequests = async (socket) => {
        socket.on("spin", async (data) => {
            console.log("onSpin");
            utilities_1.default.validateRequest(data);
            await this.handleSpin(data);
        });
        socket.on("wild", async (data) => {
            console.log("onWild");
            utilities_1.default.validateRequest(data);
            await this.handleWild(data);
        });
        socket.on("blast", async (data) => {
            console.log("onBlast");
            utilities_1.default.validateRequest(data);
            await this.handleBlast(data);
        });
        socket.on("disconnect", async (data) => {
            console.log("onDisconnect");
            await this.handleDisconnect(data, socket);
        });
    };
    handleSpin = async (data) => {
        console.log("rooms");
        const rooms = [...await this.io.of('/').adapter.allRooms()];
        const random_connection = utilities_1.default.getRandomConnection(rooms);
        const response = { message: data.message };
        const emitter = this.emitter.in(random_connection);
        emitter.emit("data", response);
    };
    handleWild = async (data) => {
        const response = { message: data.message };
        if (!data.random_number || data.random_number === 0) {
            return;
        }
        let random = 0;
        if (!Number.isFinite(data.random_number)) {
            // put default value 1 in case the random_number is not in number value, simple check
            random = 1;
        }
        const rooms = [...await this.io.of('/').adapter.allRooms()];
        if (random === 1) {
            const random_connection = utilities_1.default.getRandomConnection(rooms);
            const emitter = this.emitter.in(random_connection);
            emitter.emit("data", response);
            return;
        }
        else if (random >= rooms.length) {
            // in case number bigger than connections size was provided, emit to all
            this.emitter.emit("data", response);
            return;
        }
        else {
            const rooms = [...await this.io.of('/').adapter.allRooms()];
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
            wildEmitter.emit("data", response);
        }
    };
    handleBlast = async (data) => {
        this.emitter.emit("data", data);
    };
    handleDisconnect = async (data, socket) => {
        console.log(`${socket.id} has been disconnected.`);
    };
}
const redis_server = new RedisServer();
exports.default = redis_server;
