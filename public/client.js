let stream;

const socket = io()
const connections = {}

socket.on('existing-peers', async (peers) => {
    for (const id in peers) {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        })
        connections[id] = pc
        pc.ontrack = (e) => {
            const audio = new Audio()
            audio.srcObject = e.streams[0]
            audio.play()
        }
        stream.getTracks().forEach(track => pc.addTrack(track, stream))
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('signal', {type: 'offer',payload: offer, targetId: id})
        pc.onicecandidate = (ev) => {
            if (ev.candidate != null) socket.emit('signal', {type: 'ice-candidate', payload: ev.candidate, targetId: id})
        }
    }
})

async function handleOffer(offer, senderId) {
    const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })
    connections[senderId] = pc
    pc.ontrack = (e) => {
        const audio = new Audio()
        audio.srcObject = e.streams[0]
        audio.play()
    }
    stream.getTracks().forEach(track => pc.addTrack(track, stream))
    pc.onicecandidate = (ev) => {
        if (ev.candidate != null) socket.emit('signal', {type: 'ice-candidate', payload: ev.candidate, targetId: senderId})
    }
    await pc.setRemoteDescription(offer)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    socket.emit('signal', {type: 'answer', payload: answer, targetId: senderId})
}

async function handleAnswer(answer, senderId){
    await connections[senderId].setRemoteDescription(answer)
}

async function handleIceCandidate(candidate, sourceId){
    await connections[sourceId].addIceCandidate(candidate)
}

socket.on('signal', async ({ type, payload, from }) => {
    if (type === 'offer') await handleOffer(payload, from)
    else if (type === 'answer') await handleAnswer(payload, from)
    else if (type === 'ice-candidate') await handleIceCandidate(payload, from)
})


let muted = false

function toggleMute() {
    if (muted) {
        stream.getAudioTracks()[0].enabled = true
        muted = false
    } else {
        stream.getAudioTracks()[0].enabled = false
        muted = true
    }
    const status = document.getElementById('mute-status')
    const btn = document.getElementById('mute-btn')
    const footer = document.querySelector('.talkback-footer')
    if (muted) {
        status.textContent = 'Muted'
        status.classList.add('is-muted')
        btn.textContent = 'Unmute'
        btn.classList.add('is-muted')
        footer.textContent = 'tap to unmute'
    } else {
        status.textContent = 'Live'
        status.classList.remove('is-muted')
        btn.textContent = 'Mute'
        btn.classList.remove('is-muted')
        footer.textContent = 'tap to mute'
    }
}