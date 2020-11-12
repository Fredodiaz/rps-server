const io = require('socket.io')();
const PORT = 8080

const { handleJoinGame, handleNewGame, removePlayer } = require('./functions')

io.on('connection', client => {
  console.log('CONNECTED')
  client.emit('init', { data: 'CONNECTED', id: client.id })


  client.on('joinGame', (roomName) => handleJoinGame(io, client, roomName));
  client.on('hostGame', () => handleNewGame(client));
    

  // client.join('GAME')
  // console.log(io.sockets.adapter.rooms['GAME'], 'ROOMS BOI BOIIII')
  client.on('disconnect', () => {
    removePlayer(io, Object.keys(client.adapter.rooms)[0], client.name)
  });
});

console.log(`Listening on ${process.env.PORT || PORT}`)
io.listen(process.env.PORT || PORT);