const io = require('socket.io')();
const PORT = 8080

const { handleHostLeaveGame, handleJoinGame, handleNewGame, handlePlayerMove, removePlayer, refreshLobbyPlayers, handleHostStartsGame, getPlayerOpponent, handleEachMatch } = require('./functions')

io.on('connection', client => {
  console.log('CONNECTED')
  client.emit('init', { data: 'CONNECTED', id: client.id })


  // LOBBY JOIN/LEAVE/HOST ENDPOINTS
  client.on('joinGame', (roomName) => handleJoinGame(io, client, roomName));
  client.on('hostGame', () => handleNewGame(client)); //
  client.on('leaveLobby', () => removePlayer(io, client));
  client.on('hostLeaveGame', () => handleHostLeaveGame(io, client)) //
  client.on('hostStartedGame', () => handleHostStartsGame(io, client)) //
  client.on('refreshLobbyPlayers', () => refreshLobbyPlayers(io, client.currentRoomName)) //



  // MISC GAME ENDPOINTS
  client.on('findPlayerOpponent', () => {
    console.log('HE WWOOOOOOOOOOOON', client.winner)
    if(!client.winner) {
      getPlayerOpponent(client)
    }
  }) // returns opponent object


  // GAME ACTION ENDPOINTS
  client.on('sendCurrentChoice', (choice) => { // gets move sent by client
    if(client.hasUpdated) {
      client.hasUpdated = false
    } else {
      // console.log(client.name, 'did one move')
      handlePlayerMove(io, client, choice)
      client.hasUpdated = true
    } 
  }
  )

  client.on('matchedAndReadyToBattle', () => handleEachMatch(io, client))

  client.on('resetTheTimer', () => client.emit('startTimer'))





  client.on('disconnect', () => {
    removePlayer(io, client)

    if(client.host) {
      handleHostLeaveGame(io, client)
    }
  });
});

console.log(`Listening on ${process.env.PORT || PORT}`)
io.listen(process.env.PORT || PORT);