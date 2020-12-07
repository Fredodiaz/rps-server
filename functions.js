const { makeid, botsNeeded } = require('./utils')

let ROOMDATA = {}
let ROOMMETADATA = {}
const POINTSTOWIN = 3

/* Client Joins Room With Unique Id And Updates Num Of Players To Everyone In Room */
/* checks all rooms and see if the roomname client entered is available */
const handleJoinGame = (io, client, roomName, userName) => {
    let gameAvailable = false
    let PlayerRooms = Object.keys(ROOMDATA)
    roomName = roomName.toString()
    for(let i = 0; i < PlayerRooms.length; i++) {
        if(roomName === PlayerRooms[i] && ROOMMETADATA[roomName] && ROOMMETADATA[roomName].isJoinable) {
            // if(ROOMMETADATA[roomName] &&) {
            //     if(ROOMMETADATA[roomName])
            // }
            gameAvailable = true
        }
    }
    if(gameAvailable) {
        client.name = userName;  // gives client name
        client.currentRoomName = roomName // gives client game joined
        ROOMDATA[roomName].push({name: client.name, id: client.id, bot: false}) // adds client to players list with properties
        client.join(roomName);
        // console.log('PLAYER JOINED:', roomName)
        client.emit('handlePersonJoinAttempt', client.id);
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
    ROOMDATA[roomName] = []
    ROOMMETADATA[roomName] = { isJoinable: true }
    // console.log('CLIENT ROOMS', Object.keys(ROOMDATA))
}



/* Removes Player From Player List */
const removePlayer = (io, client) => {
    let roomName = client.currentRoomName
    if(ROOMDATA[roomName]) {
        ROOMDATA[roomName] = [...ROOMDATA[roomName].filter(player => player.id !== client.id)] // player.id !== client.id ?????
    }
    refreshLobbyPlayers(io, roomName)
    client.leave(roomName)
    // console.log('PLAYER LEFT ROOM:', roomName)
}



/* Refreshed Lobby Players */
const refreshLobbyPlayers = (io, roomName) => {
    io.to(roomName).emit('refreshLobbyPlayers', ROOMDATA[roomName] || []) // prevents null
}



/* Sends Message For Players To Leave Lobby And Lobby Deleted */
const handleHostLeaveGame = (io, client) => {
    io.to(client.currentRoomName).emit('lobbyRemoved')
    let PlayerRooms = Object.keys(ROOMDATA)
    for(let i = 0; i < PlayerRooms.length; i++) {
        // console.log(client.currentRoomName, "DELETE")
        if(PlayerRooms[i] === client.currentRoomName) {
            delete ROOMDATA[client.currentRoomName]
            delete ROOMMETADATA[client.currentRoomName]
        }
    }
    client.host = false
    client.currentRoomName = ''
    // console.log('CLIENT ROOMS', PlayerRooms)
}

const beginTournamentMatch = (io, client) => {
    if(!client.winner) {
        pairUpPlayersWithBots(io, client.currentRoomName) // pairs players with bots and then with other players

        // console.log('PLAYER LIST AFTER PAIRING', ROOMDATA[client.currentRoomName])
    
        ROOMMETADATA[client.currentRoomName].matchStarted = false // never know 777777777777777777777777777777777777777777777777777777777777777777
    
        io.to(client.currentRoomName).emit('startedNewMatch') // ex round one has started
    }
}


const resetPlayersForNewMatch = (io, client) => {
    const allowedKeys = ['name', 'id', 'bot'];
    // console.log('###################################', ROOMDATA[client.currentRoomName])

    for(let i = 0; i < ROOMDATA[client.currentRoomName].length; i++) { // send message to losers
        if(!ROOMDATA[client.currentRoomName][i].bot && !ROOMDATA[client.currentRoomName][i].wonRound) {
            io.to(ROOMDATA[client.currentRoomName][i].id).emit('handleLoss')
        } 
    }

    // Filter Out Losers and Bots
    ROOMDATA[client.currentRoomName] = ROOMDATA[client.currentRoomName].filter(player => player.bot === false && player.wonRound)

    for(let i = 0; i < ROOMDATA[client.currentRoomName].length; i++) {
        ROOMDATA[client.currentRoomName][i] = Object.keys(ROOMDATA[client.currentRoomName][i])
            .filter(key => allowedKeys.includes(key))
            .reduce((obj, key) => {
            obj[key] = ROOMDATA[client.currentRoomName][i][key];
            return obj;
        }, {});
    }

    // console.log('22222222222222222222222222222222222222222222222222222222')
    beginTournamentMatch(io, client)
}


const handleEachMatch = (io, client) => {  // will start timer
    // ROOMMETADATA[client.currentRoomName].playersBattling = 0;

    if( !ROOMMETADATA[client.currentRoomName].matchStarted ) { // first person ready lets host know game is ready
        let playersBattling = 0;
        ROOMMETADATA[client.currentRoomName].matchStarted = true
        // console.log('TIMER STARTED', !ROOMMETADATA[client.currentRoomName].matchStarted)

        
        if(ROOMDATA[client.currentRoomName].length === 1) {
            // console.log(ROOMDATA[client.currentRoomName][0].name, "IS THE TOURNAMENT WINNER")
            io.to(ROOMDATA[client.currentRoomName][0].id).emit('winnerOfMatch', client.name)
            client.winner = true
        } else {
            for(let i = 0; i < ROOMDATA[client.currentRoomName].length; i++) {
                if(!ROOMDATA[client.currentRoomName][i].bot && !ROOMDATA[client.currentRoomName][i].searchingNewMatch) { // simulate bot not having turn
                    io.to(ROOMDATA[client.currentRoomName][i].id).emit('startTimer', ROOMDATA[client.currentRoomName][i].name)
                    playersBattling++
                    // handlePlayerMove(ROOMROOMMETADATA[client.currentRoomName][i], ROOM) // ################ WHERE SERVER TELLS CLIENT TO START TIMER
                    // ROOMMETADATA[client.currentRoomName].playersBattling += 1
                }
            }

            if(playersBattling === 0) {
                // console.log(ROOMMETADATA[client.currentRoomName].currentRound + 1, "MATCH IS OVER")
                ROOMMETADATA[client.currentRoomName].currentRound += 1
                resetPlayersForNewMatch(io, client)
                // console.log(ROOMDATA[client.currentRoomName])
            }
        }
    }
}



 /* Host Starts Game */
const handleHostStartsGame = (io, client) => {
    let numberOfPlayers = 0; // Get Players To Start Match

    if(ROOMDATA[client.currentRoomName]) {
        numberOfPlayers = ROOMDATA[client.currentRoomName].length
        ROOMMETADATA[client.currentRoomName] = { isJoinable: false, isFinalRound: false, roundsBeforeFinal: botsNeeded(numberOfPlayers), currentRound: 0}
    }
    
    addBots(client.currentRoomName, botsNeeded(numberOfPlayers)) // Puts Bots Needed In Game
    
    io.to(client.currentRoomName).emit('startedGame') // redirects players to '/game'

    // console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    beginTournamentMatch(io, client)
}



/* Add Bots */
const addBots = ( roomName, val ) => {
    for(let i = 0; i < val; i++) {
        ROOMDATA[roomName].push({name: makeid(3), id: makeid(9), bot: true})
    }
}



/* Pair Up Players With Bots */
const pairUpPlayersWithBots = (io, roomName) => {
    let playerCount = ROOMDATA[roomName].length
    for(let i = 0; i < playerCount; i++) {
        if(ROOMDATA[roomName][i].bot && !ROOMDATA[roomName][i].opponent) {
            for(let j = 0; j < playerCount; j++) {
                if(!ROOMDATA[roomName][j].opponent && !ROOMDATA[roomName][j].bot) { // if potential opponent doesn't have opponent
                    // console.log(!ROOMDATA[roomName][j].opponent && !ROOMDATA[roomName][j].bot, 'PLAYER IS BEING FOUND', j)
                    ROOMDATA[roomName][j].opponent = {
                        name: ROOMDATA[roomName][i].name,
                    }
                    ROOMDATA[roomName][i].opponent = {
                        name: ROOMDATA[roomName][j].name,
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
    let playerCount = ROOMDATA[roomName].length;
    for(let i = 0; i < playerCount; i++) {
        if(!ROOMDATA[roomName][i].bot && !ROOMDATA[roomName][i].opponent) {
            for(let j = i + 1; j < playerCount; j++) {
                if(!ROOMDATA[roomName][j].opponent && !ROOMDATA[roomName][j].bot) { // if potential opponent doesn't have opponent
                    // console.log(!ROOMDATA[roomName][j].opponent && !ROOMDATA[roomName][j].bot, 'PLAYER IS BEING FOUND', j)
                    ROOMDATA[roomName][j].opponent = {
                        name: ROOMDATA[roomName][i].name,
                        id: ROOMDATA[roomName][i].id,
                    }
                    ROOMDATA[roomName][i].opponent = {
                        name: ROOMDATA[roomName][j].name,
                        id: ROOMDATA[roomName][j].id,
                    }
                    break;
                }
            }
        }
    }

    refreshLobbyPlayers(io, roomName)
    // console.log(ROOMDATA[roomName])
}




/* ############################### NEW FUNCTIONS BELOW ################################ */



/* Based On Client And Opponent Move What Is Their Final Score */
const updatePlayerScores = (io, client, opponent, decidingFactor) => {
    let clientIndex = 0;
    let opponentIndex = 0;

    let clientPointsIncrement = 0;
    let totalClientPoints;
    let opponentPointsIncrement = 0;
    let totalOpponentPoints;
    let opponentOutcomeStatus = ''

    // console.log('judge says client just', decidingFactor)
    if(decidingFactor === 'win') {
        clientPointsIncrement = 1;
        opponentPointsIncrement = 0;
        opponentOutcomeStatus = 'lose'
    } else if(decidingFactor === 'lose') {
        clientPointsIncrement = 0;
        opponentPointsIncrement = 1;
        opponentOutcomeStatus = 'win'
    } else {
        // console.log('fatass tie')
        clientPointsIncrement = 0;
        opponentPointsIncrement = 0;
        opponentOutcomeStatus = 'tie'
    }

    for(let i = 0; i < ROOMDATA[client.currentRoomName].length; i++) {
        // console.log(ROOMDATA[client.currentRoomName][i].id === client.id, ROOMDATA[client.currentRoomName][i].id, client.id)
        if(ROOMDATA[client.currentRoomName][i].id === client.id) {
            clientIndex = i;
            totalClientPoints = (ROOMDATA[client.currentRoomName][i].points || 0) + clientPointsIncrement
            ROOMDATA[client.currentRoomName][i].points = totalClientPoints // JUST NEED TO SET POINTS TO ZERO IN NEW ROUND
        }
        if(ROOMDATA[client.currentRoomName][i].id === opponent.id) {
            opponentIndex = i
            totalOpponentPoints = (ROOMDATA[client.currentRoomName][i].points || 0) + opponentPointsIncrement
            ROOMDATA[client.currentRoomName][i].points = totalOpponentPoints
        }
    }

    if(totalClientPoints >= POINTSTOWIN) {
        ROOMDATA[client.currentRoomName][clientIndex].wonRound = true // true for win
        ROOMDATA[client.currentRoomName][opponentIndex].wonRound = false
        ROOMDATA[client.currentRoomName][clientIndex].searchingNewMatch = true
        ROOMDATA[client.currentRoomName][opponentIndex].searchingNewMatch = true
        // console.log(client.name, "WON MATCH AGAINST PLAYER", client.opponent.name)
    } else if(totalOpponentPoints >= POINTSTOWIN) {
        ROOMDATA[client.currentRoomName][opponentIndex].wonRound = true
        ROOMDATA[client.currentRoomName][clientIndex].wonRound = false
        ROOMDATA[client.currentRoomName][clientIndex].searchingNewMatch = true
        ROOMDATA[client.currentRoomName][opponentIndex].searchingNewMatch = true
        // console.log(client.opponent.name, "WON MATCH AGAINST PLAYER", client.name)
    }

    io.to(client.id).emit('pointUpdate', totalClientPoints, totalOpponentPoints, decidingFactor, client.currentMove, opponent.currentMove)
    io.to(opponent.id).emit('pointUpdate', totalOpponentPoints, totalClientPoints, opponentOutcomeStatus, opponent.currentMove, client.currentMove)
}

/* Determine The Outcome Of Both Client And Opponent Moves */
const determinePlayerAndOponentMove = (io, client, opponent) => {
    // console.log(client.name, 'did', client.currentMove, 'and', opponent.name, 'did', opponent.currentMove)

    let decidingFactor = ''
    let userChoice = client.currentMove
    let opponentChoice = opponent.currentMove
    
    if(userChoice === "paper" && opponentChoice === "rock" || userChoice === "rock" && opponentChoice === "scissors" || userChoice === "scissors" && opponentChoice === "paper"){
        decidingFactor = 'win'
	}
	else if(userChoice === opponentChoice){
		decidingFactor = 'tie'
	}
	else{
		decidingFactor = 'lose'
    }

    updatePlayerScores(io, client, opponent, decidingFactor)
}


/* Iterates Through Client's Opponent And Adds currentMove To Opponent's Opponent Key */
const showHandToOpponent = (client, opponent) => {
    for(let i = 0; i < ROOMDATA[client.currentRoomName].length; i++) {
        if(ROOMDATA[client.currentRoomName][i].name === opponent.name) { // based of id match plz
            // console.log(client.name, 'is going to show', client.currentMove, 'to', opponent.name)
            ROOMDATA[client.currentRoomName][i].opponent.currentMove = client.currentMove
        }
    }
}


/* Get Random Player Move */
const getRandomPlayerMove = () => {
    let selection = ''
    let val = Math.floor(Math.random() * Math.floor(3)); // 0, 1 or 2
    switch(val) {
        case 0: selection = 'rock'
            break
        case 1: selection = 'paper'
            break
        case 2: selection = 'scissors'
            break
        default: selection = 'rock'
            break
    }
    return selection
}


const updatePlayerAgainstBotScore = (client, opponentAppropriateMove, index, decidingFactor) => {
    let clientPointsIncrement = 0;
    let opponentPointsIncrement = 0;

    // console.log('judge says client just', decidingFactor, 'against bot')
    if(decidingFactor === 'win') {
        clientPointsIncrement = 1;
        opponentPointsIncrement = 0;
    } else if(decidingFactor === 'lose') {
        clientPointsIncrement = 0;
        opponentPointsIncrement = 1;
    } else {
        clientPointsIncrement = 0;
        opponentPointsIncrement = 0;
    }


    let totalClientPoints = (ROOMDATA[client.currentRoomName][index].points || 0) + clientPointsIncrement
    ROOMDATA[client.currentRoomName][index].points = totalClientPoints // JUST NEED TO SET POINTS TO ZERO IN NEW ROUND
    let totalOpponentPoints = (ROOMDATA[client.currentRoomName][index].opponent.points || 0) + opponentPointsIncrement
    ROOMDATA[client.currentRoomName][index].opponent.points = totalOpponentPoints // JUST NEED TO SET POINTS TO ZERO IN NEW ROUND

    if(totalClientPoints >= POINTSTOWIN) {
        ROOMDATA[client.currentRoomName][index].wonRound = true // true for win
        ROOMDATA[client.currentRoomName][index].searchingNewMatch = true
        // console.log(client.name, "WON MATCH AGAINST BOT", client.opponent.name)
    }

    // io.to(ROOMDATA[client.currentRoomName][i].id).emit('startTimer', ROOMDATA[client.currentRoomName][i].name)
    client.emit('pointUpdate', totalClientPoints, totalOpponentPoints, decidingFactor, client.currentMove, opponentAppropriateMove )    

    // console.log('finna tell', client.name, decidingFactor, 'and got', totalClientPoints, 'points against bot', client.opponent.name, totalOpponentPoints) // gonna delete currentMove too
}


/* Return Move Needed Based On Player Input and Expected Game Win/Loss Output */
const appropriateBotCounter = (client, index, determiningFactor) => {
    let opponentAppropriateMove = ''
    let decidingFactor = ''
    let userChoice = client.currentMove

    if(determiningFactor === 'win') {
        switch(client.currentMove) { // Win case
            case 'rock':
                opponentAppropriateMove = 'scissors'
                break
            case 'paper':
                opponentAppropriateMove = 'rock'
                break
            case 'scissors':
                opponentAppropriateMove = 'paper'
                break
        }
        decidingFactor = 'win'
    } else {
        opponentAppropriateMove = getRandomPlayerMove()
        if(userChoice === "paper" && opponentAppropriateMove === "rock" || userChoice === "rock" && opponentAppropriateMove === "scissors" || userChoice === "scissors" && opponentAppropriateMove === "paper"){
            decidingFactor = 'win'
        }
        else if(userChoice === opponentAppropriateMove){
            decidingFactor = 'tie'
        }
        else{
            decidingFactor = 'lose'
        }
    
    }

    updatePlayerAgainstBotScore(client, opponentAppropriateMove, index, decidingFactor)
}

/* Determine If Bot Should Let Player Win Based On Points Player Has */
const determinePlayerAndBotMove = (client) => {
    for(let i = 0; i < ROOMDATA[client.currentRoomName].length; i++) {
        if(ROOMDATA[client.currentRoomName][i].id === client.id) {
            if(!ROOMDATA[client.currentRoomName][i].opponent.points || ROOMDATA[client.currentRoomName][i].opponent.points < 2) {
                // Random Winner
                appropriateBotCounter(client, i, 'any')                
            } else {
                // Make Player Win
                appropriateBotCounter(client, i, 'win')
            }
        }
    }
}



/* Adds Given Move To Player */
const handlePlayerMove = (io, client, move) => {
    client.currentMove = move
    let playerCount = ROOMDATA[client.currentRoomName].length
    for(let i = 0; i < playerCount; i++) {
        if(ROOMDATA[client.currentRoomName][i].id === client.id) {
            ROOMDATA[client.currentRoomName][i].currentMove = move


            if(ROOMDATA[client.currentRoomName][i].opponent.id) {
                
                if(ROOMDATA[client.currentRoomName][i].opponent.currentMove) {
                    determinePlayerAndOponentMove(io, client, ROOMDATA[client.currentRoomName][i].opponent)
                } else {
                    showHandToOpponent(client, ROOMDATA[client.currentRoomName][i].opponent)
                }
                
            } else {
                determinePlayerAndBotMove(client)
            }

        }
    }
    ROOMMETADATA[client.currentRoomName].matchStarted = false
    // client.emit('returnMove')
}


/* Returns Obj of Oppoennt */
const getPlayerOpponent = (client) => {
    let roomName = client.currentRoomName
    let name = client.name
    let opponent = ''

    
    if(ROOMDATA[roomName]) {
        for(let i = 0; i < ROOMDATA[roomName].length; i++) {
            if(name === ROOMDATA[roomName][i].name) {
                opponent = ROOMDATA[roomName][i].opponent
                break
            }
        }
    }

    // console.log("PLAYER LIST AFTER FINDING OPPONENTS", ROOMDATA[roomName])
    client.emit('receivePlayerOpponent', opponent, ROOMMETADATA[client.currentRoomName].currentRound + 1);
}




module.exports = {
    getPlayerOpponent,
    handleEachMatch,
    handleHostLeaveGame,
    handleHostStartsGame,
    handleJoinGame,
    handleNewGame,
    handlePlayerMove,
    refreshLobbyPlayers,
    removePlayer,
    
}

/* 
TODO: MAKE SURE ITERATIONS ARE BY ID AND NOT NAME
*/