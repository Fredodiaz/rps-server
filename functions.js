const { makeid } = require('./utils')

// let CLIENTROOMS = [];
// let PLAYERS = []
let DATA = {}

/* Client Joins Room With Unique Id And Updates Num Of Players To Everyone In Room */
/* checks all rooms and see if the roomname client entered is available */
const handleJoinGame = (io, client, roomName) => {
    let gameAvailable = false
    let PlayerRooms = Object.keys(DATA)
    roomName = roomName.toString()

    for(let i = 0; i < PlayerRooms.length; i++) {
        if(roomName === PlayerRooms[i]) {
            gameAvailable = true
        }
    }

    if(gameAvailable) {
        client.name = makeid(3);  // gives client name
        client.currentRoomName = roomName // gives client game joined
        DATA[roomName].push({name: client.name, id: makeid(4)}) // adds client to players list
        client.join(roomName);
        
        client.emit('handlePersonJoinAttempt', client.name);

    } else {
        client.emit('handlePersonJoinAttempt', false);
    }

    // console.log(CLIENTROOMS, 'rooms', roomName)
    refreshLobbyPlayers(io, roomName)
}

/* Host Creates Game W/ Unique ID For Others To Join */
const handleNewGame = (client) => {
    let roomName = makeid(5);
    client.host = true // Only Player In Room That Will Be A Host
    client.currentRoomName = roomName.toString()
    client.join(roomName)
    client.emit('gameCode', roomName);
    DATA[roomName] = []

    console.log('CLIENT ROOMS', Object.keys(DATA))
}

/* Removes Player From Player List */
const removePlayer = (io, client) => {
    let roomName = client.currentRoomName

    if(DATA[roomName]) {
        DATA[roomName] = [...DATA[roomName].filter(player => player.name !== client.name)]
    }

    refreshLobbyPlayers(io, roomName)
    client.leave(roomName)
    console.log('PLAYER LEFT ROOM:', roomName)
}

/* Refreshed Lobby Players */
const refreshLobbyPlayers = (io, roomName) => {
    io.to(roomName).emit('refreshLobbyPlayers', DATA[roomName] || []) // prevents null
}

/* Sends Message For Players To Leave Lobby And Lobby Deleted */
const handleHostLeaveGame = (io, client) => {
    io.to(client.currentRoomName).emit('lobbyRemoved')

    let PlayerRooms = Object.keys(DATA)
    for(let i = 0; i < PlayerRooms.length; i++) {
        console.log(client.currentRoomName, "DELETE")
        if(PlayerRooms[i] === client.currentRoomName) {
            delete DATA[client.currentRoomName]
        }
    }

    client.host = false
    client.currentRoomName = ''

    console.log('CLIENT ROOMS', PlayerRooms)
}

/*
console.log('SOCKETS', io.sockets.adapter.rooms[roomName]);
console.log('CLIENT', client.adapter.rooms)
Object.keys(client.adapter.rooms)[0] // GET ROOMS
*/

module.exports = {
    handleHostLeaveGame,
    handleJoinGame,
    handleNewGame,
    removePlayer,
}