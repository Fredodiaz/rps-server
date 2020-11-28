const { makeid, botsNeeded } = require('./utils')
const ROOM = '123'

/* Pair Up Players With Bots */
const pairUpPlayersWithBots = (roomName) => {
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
    pairUpPlayersWithPlayers(roomName)
}



/* Pair Up Players With Players */
const pairUpPlayersWithPlayers = (roomName) => {
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
    // console.log(DATA[roomName])
}



/* Returns Obj of Oppoennt */
const getPlayerOpponent = (roomName) => {
    let name = DATA[ROOM][2].name
    let opponent = ''

    if(DATA[roomName]) {
        for(let i = 0; i < DATA[roomName].length; i++) {
            if(name === DATA[roomName][i].name) {
                opponent = DATA[roomName][i].opponent
                break
            }
        }
    }
    // console.log('OPPONENT', opponent)
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


    let totalClientPoints = (DATA[ROOM][index].points || 0) + clientPointsIncrement
    DATA[ROOM][index].points = totalClientPoints // JUST NEED TO SET POINTS TO ZERO IN NEW ROUND
    let totalOpponentPoints = (DATA[ROOM][index].opponent.points || 0) + opponentPointsIncrement
    DATA[ROOM][index].opponent.points = totalOpponentPoints // JUST NEED TO SET POINTS TO ZERO IN NEW ROUND

    if(totalClientPoints >= 3) {
        DATA[ROOM][index].wonRound = true // true for win
        DATA[ROOM][index].searchingNewMatch = true
        console.log(client.name, "WON MATCH AGAINST BOT", client.opponent.name)
    }

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



/* Based On Client And Opponent Move What Is Their Final Score */
const updatePlayerScores = (client, opponent, decidingFactor) => {
    let clientIndex = 0;
    let opponentIndex = 0;

    let clientPointsIncrement = 0;
    let totalClientPoints;
    let opponentPointsIncrement = 0;
    let totalOpponentPoints;

    // console.log('judge says client just', decidingFactor)
    if(decidingFactor === 'win') {
        clientPointsIncrement = 1;
        opponentPointsIncrement = 0;
    } else if(decidingFactor === 'lose') {
        clientPointsIncrement = 0;
        opponentPointsIncrement = 1;
    } else {
        // console.log('fatass tie')
        clientPointsIncrement = 0;
        opponentPointsIncrement = 0;
    }

    for(let i = 0; i < DATA[ROOM].length; i++) {
        if(DATA[ROOM][i].id === client.id) {
            clientIndex = i;
            totalClientPoints = (DATA[ROOM][i].points || 0) + clientPointsIncrement
            DATA[ROOM][i].points = totalClientPoints // JUST NEED TO SET POINTS TO ZERO IN NEW ROUND
        }
        if(DATA[ROOM][i].id === opponent.id) {
            opponentIndex = i
            totalOpponentPoints = (DATA[ROOM][i].points || 0) + opponentPointsIncrement
            DATA[ROOM][i].points = totalOpponentPoints
        }
    }

    if(totalClientPoints >= 3) {
        DATA[ROOM][clientIndex].wonRound = true // true for win
        DATA[ROOM][opponentIndex].wonRound = false
        DATA[ROOM][clientIndex].searchingNewMatch = true
        DATA[ROOM][opponentIndex].searchingNewMatch = true
        console.log(client.name, "WON MATCH AGAINST PLAYER", client.opponent.name)
    } else if(totalOpponentPoints >= 3) {
        DATA[ROOM][opponentIndex].wonRound = true
        DATA[ROOM][clientIndex].wonRound = false
        DATA[ROOM][clientIndex].searchingNewMatch = true
        DATA[ROOM][opponentIndex].searchingNewMatch = true
        console.log(client.opponent.name, "WON MATCH AGAINST PLAYER", client.name)
    }


    // console.log('finna tell', opponent.name, 'he got', totalOpponentPoints, 'points against', client.name) // and opponent had totalClientPoints
    // console.log('finna tell', client.name, 'he got', totalClientPoints, 'points against', opponent.name) // gonna delete currentMove too
}


/* Iterates Through Client's Opponent And Adds currentMove To Opponent's Opponent Key */
const showHandToOpponent = (client, opponent) => {
    for(let i = 0; i < DATA[ROOM].length; i++) {
        if(DATA[ROOM][i].name === opponent.name) {
            // console.log(client.name, 'is going to show', client.currentMove, 'to', opponent.name)
            DATA[ROOM][i].opponent.currentMove = client.currentMove
        }
    }
}

/* Determine The Outcome Of Both Client And Opponent Moves */
const determinePlayerAndOponentMove = (client, opponent) => {
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
    updatePlayerScores(client, opponent, decidingFactor)
}


/* Determine If Bot Should Let Player Win Based On Points Player Has */
const determinePlayerAndBotMove = (client) => {
    for(let i = 0; i < DATA[ROOM].length; i++) {
        if(DATA[ROOM][i].id === client.id) {
            if(!DATA[ROOM][i].opponent.points || DATA[ROOM][i].opponent.points < 2) {
                // Random Winner
                appropriateBotCounter(client, i, 'any')                
            } else {
                // Make Player Win
                appropriateBotCounter(client, i, 'win')
            }
        }
    }


}



const handlePlayerMove = (client, room) => {
    let move = getRandomPlayerMove()

    client.currentMove = move
    let playerCount = DATA[room].length
    for(let i = 0; i < playerCount; i++) {
        if(DATA[room][i].name === client.name) { // THIS IS WHY UNIQUE NAME NEEDED
            DATA[room][i].currentMove = move


            if(DATA[room][i].opponent.id) {
                
                if(DATA[room][i].opponent.currentMove) {
                    determinePlayerAndOponentMove(client, DATA[room][i].opponent)
                } else {
                    showHandToOpponent(client, DATA[room][i].opponent)
                }
                
            } else {
                determinePlayerAndBotMove(client)
            }

        }
    }
}



const resetPlayersForNewMatch = () => {
    const allowedKeys = ['name', 'id', 'bot'];

    // Filter Out Losers and Bots
    DATA[ROOM] = DATA[ROOM].filter(player => player.bot === false && player.wonRound)

    for(let i = 0; i < DATA[ROOM].length; i++) {
        DATA[ROOM][i] = Object.keys(DATA[ROOM][i])
            .filter(key => allowedKeys.includes(key))
            .reduce((obj, key) => {
            obj[key] = DATA[ROOM][i][key];
            return obj;
        }, {});
    }
}






//  ############################### TESTS ###############################
let DATA = {}


/* ### PLAYERS JOIN HOST LOBBY AND HOST STARTS GAME #### */
DATA[ROOM] = [ // 5 bots 11 players // 16 total
    {name: makeid(3), id: makeid(4), bot: false}, // 6 players 2 bots
    {name: makeid(3), id: makeid(4), bot: false},
    {name: makeid(3), id: makeid(4), bot: false},
    {name: makeid(3), id: makeid(4), bot: false},
    {name: makeid(3), id: makeid(4), bot: true},
    {name: makeid(3), id: makeid(4), bot: true},
    {name: makeid(3), id: makeid(4), bot: false},
    {name: makeid(3), id: makeid(4), bot: false},
    

    {name: makeid(3), id: makeid(4), bot: false}, // 5 players 3 bots
    {name: makeid(3), id: makeid(4), bot: true},
    {name: makeid(3), id: makeid(4), bot: false},
    {name: makeid(3), id: makeid(4), bot: false},
    {name: makeid(3), id: makeid(4), bot: true},
    {name: makeid(3), id: makeid(4), bot: true},
    {name: makeid(3), id: makeid(4), bot: false},
    {name: makeid(3), id: makeid(4), bot: false},
]



for(let a = 0; a < 3; a++) {
    pairUpPlayersWithBots(ROOM)
    getPlayerOpponent(ROOM)

    /* ### PLAYERS PAIRED WITH BOT OR PERSON AND BATTLING STARTS #### */
    let h = 0;
    while(h >= 0 && h < 100) {
        let playersBattling = 0;
        console.log(`ROUND ${h + 1}`)
        for(let i = 0; i < DATA[ROOM].length; i++) {
            if(!DATA[ROOM][i].bot && !DATA[ROOM][i].searchingNewMatch) { // simulate bot not having turn
                handlePlayerMove(DATA[ROOM][i], ROOM) // ################ WHERE SERVER TELLS CLIENT TO START TIMER
                playersBattling++
            }
        }

        if(playersBattling === 0) {
            console.log("FIRST MATCH IS OVER")
            resetPlayersForNewMatch()
            console.log(DATA[ROOM])
            break
        }
        h++
    }
}








// brody said that's outragous 
