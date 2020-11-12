const { makeid } = require('./utils')

const state = {};
const clientRooms = [];
let PLAYERS = []

/* Client Joins Room With Unique Id And Updates Num Of Players To Everyone In Room */
const handleJoinGame = (io, client, roomName) => {
    let gameAvailable = false
    // checks all rooms and see if the roomname client entered is available
    for(let i = 0; i < clientRooms.length; i++) {
        if(roomName === clientRooms[i]) {
            gameAvailable = true
        }
    }

    if(gameAvailable) {
        client.name = makeid(2);  // gives client name
        client.emit('handlePersonJoinAttempt', client.name);
        PLAYERS.push({name: client.name, id: makeid(4)})
        client.join(roomName);
    } else {
        client.emit('handlePersonJoinAttempt', false);
    }
    console.log(clientRooms, 'rooms', roomName)
    displayPlayersInLobby(io, roomName, client.name)
}

/* Refreshes The Number Of Clients In A Given Room  */
const displayPlayersInLobby = (io, roomName) => {
    const room = io.sockets.adapter.rooms[roomName];
    console.log('ROOM', room)
    let allUsers;
    if (room) {
      allUsers = room.sockets;
      io.to(roomName).emit('refreshLobbyPlayers', PLAYERS)
    }
    let numClients = 0;
    if (allUsers) {
      numClients = Object.keys(allUsers).length - 1; // Subtracting one since game host isn't a player
    }
    console.log(numClients, 'numClients', roomName)
    io.to(roomName).emit('displayPlayersInLobby', numClients)
}

/* Host Creates Game W/ Unique ID For Others To Join */
const handleNewGame = (client) => {
    let roomName = makeid(5);
    client.host = true // Only Player In Room That Will Be A Host
    client.join(`${roomName}`)
    client.emit('gameCode', roomName);
    clientRooms.push(roomName)
}

const removePlayer = (io, roomName, name) => {
    console.log(name, PLAYERS)
    PLAYERS = [...PLAYERS.filter(player => player.name !== name)]
    io.to(roomName).emit('refreshLobbyPlayers', PLAYERS)
    io.to(roomName).emit('displayPlayersInLobby', PLAYERS.length)
}

module.exports = {
    handleJoinGame,
    handleNewGame,
    removePlayer,

}