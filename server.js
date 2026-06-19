const port= 8080
const peers= {}
const express= require('express')
const app= express()

const http= require('http')
const server= http.createServer(app)

const { Server } = require('socket.io')
const io = new Server(server, {
    maxHttpBufferSize: 1e8
})
app.use(express.static('public'))


server.listen(port,() => {
    console.log('server running on port', port)
})

io.on('connection', (socket)=> {

    socket.on('join',(name)=> {
        socket.name=name
        socket.emit('existing-peers', peers )
        console.log(name, 'joined the session.')
        peers[socket.id]=socket.name
    })

    socket.on('offer',(offer, targetId)=>{
        io.to(targetId).emit('offer', offer, socket.id)
    })

    socket.on('answer',(answer, targetId)=>{
        io.to(targetId).emit('answer', answer, socket.id)
    })

    socket.on('ice-candidate',(iceCandidate, targetId)=>{
        io.to(targetId).emit('ice-candidate', iceCandidate, socket.id)
    })
    
    socket.on('disconnect',()=>{ 
        console.log(socket.name, 'left the session.')
        delete peers[socket.id]
        })
    })
