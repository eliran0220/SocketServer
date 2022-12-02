"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Utilities {
    getRandomNumber = (connections_size) => {
        const random_index = this.generateRandomNumberLimits(0, connections_size);
        return random_index;
    };
    getRandomConnection = (connections) => {
        const random_index = this.getRandomNumber(connections.length - 1);
        console.log("Rando index selecetd", random_index);
        const socket = connections[random_index];
        console.log(`Random socket selected : ${socket}`);
        return socket;
    };
    getRandomConnections = (left, cloned_connections) => {
        let chosen_connections = [];
        while (left !== 0) {
            const random_index = utilites.getRandomNumber(cloned_connections.length - 1);
            chosen_connections.push(cloned_connections[random_index]);
            cloned_connections.splice(random_index, 1);
            left--;
        }
        console.log(`Chosen connections : ${chosen_connections}`);
        return chosen_connections;
    };
    generateRandomNumberLimits = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
}
const utilites = new Utilities();
exports.default = utilites;
