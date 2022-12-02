import Message from './models';
class Utilities {
    getRandomNumber = (connections_size : number) => {
        const random_index =  this.generateRandomNumberLimits(0,connections_size);
        return random_index;
    }
    
     getRandomConnection = (connections : string[]) : string => {
        const random_index =  this.getRandomNumber(connections.length-1);
        console.log("Rando index selecetd",random_index)
        const socket = connections[random_index];
        console.log(`Random socket selected : ${socket}`)
        return socket;
    }

    getRandomConnections = (left: number, cloned_connections : string[]) : string[] => {
        let chosen_connections : string[] =[];
        while (left !== 0) {
            const random_index = utilites.getRandomNumber(cloned_connections.length-1);
            chosen_connections.push(cloned_connections[random_index]);
            cloned_connections.splice(random_index,1);
            left--;
        }
        console.log(`Chosen connections : ${chosen_connections}`)
        return chosen_connections;
    }

    generateRandomNumberLimits = (min : number, max : number) => {
        return Math.floor(Math.random() * (max - min + 1) ) + min;
      }

    validateRequest = (data: Message) : void => {
        if (!data.message) {
            data.message = "No message was supplied, so this is a random one!";
        }
    }
}

const utilites = new Utilities();
export default utilites;