const port= 8080
const express= require('express')
const app= express()

const http= require('http')
const server= http.createServer(app)

const { Server } = require('socket.io')
const io = new Server(server)
app.use(express.static('public'))


server.listen(port,() => {
    console.log('server running on port', port)
})

io.on('connection', (socket)=> {
    socket.on('join',(name)=> {
        socket.name=name
        console.log(name, 'joined the session.')
    })
    socket.on('disconnect',()=> console.log(socket.name, 'left the session.'))
    })
