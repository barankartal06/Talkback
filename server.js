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

function removePeerFromRoom(socket){
    const code = socket.code
        if (rooms[code]!= null){
            console.log(rooms[code].peers[socket.id].name, 'left room no:', code)
            delete rooms[code].peers[socket.id]
            if (Object.keys(rooms[code].peers).length === 0 ) {
                rooms[code].deathTimer = setTimeout(() => {
                    delete rooms[code]
                    console.log('room reaped:', code)
                }, 60000)
            }else {
                io.to(code).emit('peers-update', {peers: rooms[code].peers})
            }
        }
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
            const count = Object.keys(rooms[code].peers).length
            if (count >= 8){
                socket.emit('error', { reason: 'ROOM_MAX_SIZE', message: 'This room reached the maximum amount of users allowed'})
                return
            }
            addPeerToRoom(socket, code, name)
            const newCount = Object.keys(rooms[code].peers).length
            if (newCount === 7){
                io.to(code).emit('soft-cap-reached')
            }
            if (newCount === 8){
                io.to(code).emit('hard-cap-reached')
            }
            if(rooms[code].deathTimer){
                clearTimeout(rooms[code].deathTimer)
                rooms[code].deathTimer = null
            }
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
        removePeerFromRoom(socket)
    })

    socket.on('leave', () => {
        removePeerFromRoom(socket)
        socket.code = null
    })

    socket.on('end-session', () => {
        const code = socket.code
        if (rooms[code]){
            if(rooms[code].deathTimer){
                clearTimeout(rooms[code].deathTimer)
                rooms[code].deathTimer = null
            }
            io.to(code).emit('session-ended')
            delete rooms[code] 
        }
    })

    })
