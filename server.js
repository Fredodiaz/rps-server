const io = require('socket.io')();
const PORT = 8080

const { handleHostLeaveGame, handleJoinGame, handleNewGame, handlePlayerMove, removePlayer, refreshLobbyPlayers, handleHostStartsGame, getPlayerOpponent } = require('./functions')

io.on('connection', client => {
  console.log('CONNECTED')
  client.emit('init', { data: 'CONNECTED', id: client.id })


  client.on('joinGame', (roomName) => handleJoinGame(io, client, roomName));
  client.on('hostGame', () => handleNewGame(client));
  client.on('leaveLobby', () => removePlayer(io, client));
  client.on('hostLeaveGame', () => handleHostLeaveGame(io, client))
  client.on('hostStartedGame', () => handleHostStartsGame(io, client))
  client.on('refreshLobbyPlayers', () => refreshLobbyPlayers(io, client.currentRoomName))
  client.on('findPlayerOpponent', () => getPlayerOpponent(client))


  // Game Stuff
  client.on('sendCurrentChoice', (choice) => {
    if(client.hasUpdated) {
      client.hasUpdated = false
    } else {
      handlePlayerMove(client, choice)
      client.hasUpdated = true
    } 
  }
  )

  client.on('disconnect', () => {
    removePlayer(io, client)

    if(client.host) {
      handleHostLeaveGame(io, client)
    }
  });
});

console.log(`Listening on ${process.env.PORT || PORT}`)
io.listen(process.env.PORT || PORT);