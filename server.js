const io = require('socket.io')();
const PORT = 3000

io.on('connection', client => {
  console.log('someone connected or something like that idk')
  client.emit('init', { data: 'hello world' })
});

console.log(`Listening on ${process.env.PORT || PORT}`)
io.listen(process.env.PORT || PORT);