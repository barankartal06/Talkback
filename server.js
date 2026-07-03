require('dotenv').config()
const port= 8080
const rooms = {}

function generateRoomCode() {
    let code = ''
    do{
        code= String(Math.floor(Math.random() * 1000000)).padStart(6, "0")
    }while(code in rooms)
    return code
}

function addPeerToRoom(socket, code, name) {
    socket.emit('existing-peers', { peers : rooms[code].peers, code })
    rooms[code].peers[socket.id] = { name }
    socket.join(code)
    console.log(name, 'entered room no:', code)
    socket.code = code
    io.to(code).emit('peers-update',{ peers: rooms[code].peers })
}

let dashboardSocket = null
const express= require('express')
const app= express()

const http= require('http')
const server= http.createServer(app)

const ngrok = require('@ngrok/ngrok')
let ngrokUrl = null

const { Server } = require('socket.io')
const io = new Server(server, {
    maxHttpBufferSize: 1e8
})
app.use(express.static('public'))


server.listen(port, async () => {
    console.log('server running on port', port)
    const listener = await ngrok.connect({ addr: port, authtoken: process.env.NGROK_AUTHTOKEN})
    console.log('ngrok url: ', listener.url())
    ngrokUrl=listener.url()
})

io.on('connection', (socket)=> {

    socket.on('create', ( {name} )=>{
        const code = generateRoomCode()
        rooms[code]= {peers: {} }
        addPeerToRoom(socket, code, name)
        socket.emit('room-info', {code})
    })

    socket.on('join',({code, name})=> {
        if (code in rooms) {
            addPeerToRoom(socket, code, name)
        } else {
            socket.emit('error', { reason: 'ROOM_NOT_FOUND', message: 'Room not found' })
        }
    })

    socket.on('join-dashboard', ()=>{
        dashboardSocket= socket
        dashboardSocket.emit('ngrok-url', ngrokUrl)
        socket.name='DASHBOARD'
    })

    socket.on('signal', ({type, payload, targetId})=> {
        io.to(targetId).emit('signal', {type, payload, from: socket.id})
    })
    
    socket.on('disconnect',()=>{ 
        const code = socket.code
        if (rooms[code]!= null){
            console.log(rooms[code].peers[socket.id].name, 'left room no:', code)
            delete rooms[code].peers[socket.id]
            io.to(code).emit('peers-update', {peers: rooms[code].peers})
        }
        })
    })
