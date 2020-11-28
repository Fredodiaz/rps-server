const { makeid, botsNeeded } = require('./utils')

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
        DATA[roomName].push({name: client.name, id: client.id, bot: false}) // adds client to players list with properties
        client.join(roomName);
        console.log('PLAYER JOINED:', roomName)
        client.emit('handlePersonJoinAttempt', client.name);
    } else {
        client.emit('handlePersonJoinAttempt', false);
    }
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
    // console.log('CLIENT ROOMS', Object.keys(DATA))
}



/* Removes Player From Player List */
const removePlayer = (io, client) => {
    let roomName = client.currentRoomName
    if(DATA[roomName]) {
        DATA[roomName] = [...DATA[roomName].filter(player => player.name !== client.name)] // player.id !== client.id ?????
    }
    refreshLobbyPlayers(io, roomName)
    client.leave(roomName)
    // console.log('PLAYER LEFT ROOM:', roomName)
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
        // console.log(client.currentRoomName, "DELETE")
        if(PlayerRooms[i] === client.currentRoomName) {
            delete DATA[client.currentRoomName]
        }
    }
    client.host = false
    client.currentRoomName = ''
    // console.log('CLIENT ROOMS', PlayerRooms)
}



 /* Host Starts Game */
const handleHostStartsGame = (io, client) => {
    let numberOfPlayers = 0;
    if(DATA[client.currentRoomName]) {
        numberOfPlayers = DATA[client.currentRoomName].length
    }
    addBots(client.currentRoomName, botsNeeded(numberOfPlayers))
    pairUpPlayersWithBots(io, client.currentRoomName)
    io.to(client.currentRoomName).emit('startedGame') // redirects player to /game
    io.to(client.currentRoomName).emit('startedNewRound')
}



/* Add Bots */
const addBots = ( roomName, val ) => {
    for(let i = 0; i < val; i++) {
        DATA[roomName].push({name: makeid(3), id: makeid(9), bot: true})
    }
}



/* Pair Up Players With Bots */
const pairUpPlayersWithBots = (io, roomName) => {
    let playerCount = DATA[roomName].length
    for(let i = 0; i < playerCount; i++) {
        if(DATA[roomName][i].bot && !DATA[roomName][i].opponent) {
            for(let j = 0; j < playerCount; j++) {
                if(!DATA[roomName][j].opponent && !DATA[roomName][j].bot) { // if potential opponent doesn't have opponent
                    // console.log(!DATA[roomName][j].opponent && !DATA[roomName][j].bot, 'PLAYER IS BEING FOUND', j)
                    DATA[roomName][j].opponent = {
                        name: DATA[roomName][i].name,
                    }
                    DATA[roomName][i].opponent = {
                        name: DATA[roomName][j].name,
                    }
                    break;
                }
            }
        }
    }
    pairUpPlayersWithPlayers(io, roomName)
    
}




/* Pair Up Players With Players */
const pairUpPlayersWithPlayers = (io, roomName) => {
    let playerCount = DATA[roomName].length;
    for(let i = 0; i < playerCount; i++) {
        if(!DATA[roomName][i].bot && !DATA[roomName][i].opponent) {
            for(let j = i + 1; j < playerCount; j++) {
                if(!DATA[roomName][j].opponent && !DATA[roomName][j].bot) { // if potential opponent doesn't have opponent
                    // console.log(!DATA[roomName][j].opponent && !DATA[roomName][j].bot, 'PLAYER IS BEING FOUND', j)
                    DATA[roomName][j].opponent = {
                        name: DATA[roomName][i].name,
                        id: DATA[roomName][i].id,
                    }
                    DATA[roomName][i].opponent = {
                        name: DATA[roomName][j].name,
                        id: DATA[roomName][j].id,
                    }
                    break;
                }
            }
        }
    }

    refreshLobbyPlayers(io, roomName)
    // console.log(DATA[roomName])
}




/* ############################### NEW FUNCTIONS BELOW ################################ */


/* Adds Given Move To Player */
const handlePlayerMove = (client, move) => {

    client.currentMove = move
    let playerCount = DATA[client.currentRoomName].length
    for(let i = 0; i < playerCount; i++) {
        if(DATA[client.currentRoomName][i].name === client.name) {
            DATA[client.currentRoomName][i].currentMove = move
        }
    } 

    console.log('CLIENTMOVE', move, client.name)
    client.emit('returnMove')

}

const handleBotMove = () => {

}

const determinePlayerAndOponentMove = (client, move) => {
    let decidingFactor = ''
    let userChoice = client.currentMove
    let opponentChoice = getPlayerDecision(client.currentRoomName, client.opponent.name)
    if(userChoice === "paper" && opponentChoice === "rock" || userChoice === "rock" && opponentChoice === "scissors" || userChoice === "scissors" && opponentChoice === "paper"){
		decidingFactor = 'win'
	}
	else if(userChoice === opponentChoice){
		decidingFactor = 'tie'
	}
	else{
		decidingFactor = 'lose'
    }
    
}



/* Gets Current Move Based Of Name */
const getPlayerDecision = (roomName, name) => {
    for(let i = 0; i < DATA[roomName].length; i++) {
        if(name === DATA[roomName][i].name) {
            return DATA[roomName][i].currentMove
        }
    }
}

/* Returns Obj of Oppoennt */
const getPlayerOpponent = (client) => {
    let roomName = client.currentRoomName
    let name = client.name
    let opponent = ''

    if(DATA[roomName]) {
        for(let i = 0; i < DATA[roomName].length; i++) {
            if(name === DATA[roomName][i].name) {
                opponent = DATA[roomName][i].opponent
                break
            }
        }
    }

    client.emit('receivePlayerOpponent', opponent);
}



/* PLAYERS SEND THEIR MOVE AND CURRENT POINTS.
OUTPUT WILL BE NEW SCORE / IF LOST

MOVES WILL BE UPDATES TO OPPONENT AND PLAYER

THAT INFO WILL BE BASSED TO NEW ALGO TO DETERMINE WINNERS
 */

// player.opponent = {
//     currentDecision: 'rock',
//     points: 
// }

/* HAVE A FUNCTION THAT BASED ON THE OPPONENT AND PLAYER'S POINTS, CAN DETERMINE A WINNER AND SEND BACK TO CLIENT */

/*
*/

// console.log('SOCKETS', io.sockets.adapter.rooms[roomName]);
// console.log('CLIENT', client.adapter.rooms)
// Object.keys(client.adapter.rooms)[0] // GET ROOMS



module.exports = {
    getPlayerOpponent,
    handleHostLeaveGame,
    handleHostStartsGame,
    handleJoinGame,
    handleNewGame,
    handlePlayerMove,
    refreshLobbyPlayers,
    removePlayer,
    
}