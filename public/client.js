let myName;
let roomCode;
let stream;
const socket = io()
const connections = {}

const nameInput = document.getElementById('name-input')
const nameHint= document.getElementById('name-hint')
const createBtn = document.getElementById('create-btn')
const joinBtn = document.getElementById('join-btn')
const codeInput = document.getElementById('code-input')
const entrySplit = document.querySelector('.entry-split')
const entryError = document.getElementById('entry-error')
const entryView = document.getElementById('entry-view')
const roomView = document.getElementById('room-view')
const displayName = document.getElementById('display-name')
const codeBtn = document.getElementById('code-btn')
const qrContainer = document.getElementById('qr-container')
const shareCode = document.getElementById('share-code')
const sharePanel = document.getElementById('share-panel')
const shareBackdrop = document.getElementById('share-backdrop')
const shareClose = document.getElementById('share-close')
const div = document.getElementById('peers-list')
const backBtn = document.getElementById('back-btn')
const exitToggle = document.getElementById('exit-toggle')
const exitMenu = document.getElementById('exit-menu')
const leaveBtn = document.getElementById('leave-btn')
const endBtn = document.getElementById('end-btn')
const modalBackdrop = document.getElementById('modal-backdrop')
const modalText = document.getElementById('modal-text')
const modalBtn1 = document.getElementById('modal-btn-1')
const modalBtn2 = document.getElementById('modal-btn-2')

const roomParam = new URLSearchParams(window.location.search).get('room')
if (roomParam) {
    entrySplit.classList.add('join-only')
    codeInput.classList.remove('hidden')
    codeInput.value = roomParam
    nameInput.focus()
}

function showModal({ text, btn1Label, btn1Action, btn2Label, btn2Action }) {
    modalText.textContent = text

    modalBtn1.textContent = btn1Label
    modalBtn1.onclick = () => {
        hideModal()
        if (btn1Action) btn1Action()
    }

    if (btn2Label) {
        modalBtn2.textContent = btn2Label
        modalBtn2.classList.remove('hidden')
        modalBtn2.onclick = () => {
            hideModal()
            if (btn2Action) btn2Action()
        }
    } else {
        modalBtn2.classList.add('hidden')
        modalBtn2.onclick = null
    }

    modalBackdrop.classList.remove('hidden')
}

function hideModal() {
    modalBackdrop.classList.add('hidden')
}

modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) hideModal()
})

function resetToEntry(){
    collapseExitMenu()

    for (const id in connections){
        connections[id].close()
        delete connections[id]
    }

    if(stream){
        stream.getTracks().forEach(t => t.stop())
        stream = null
    }

    roomView.classList.add('hidden')
    entryView.classList.remove('hidden')

    div.innerHTML = '<p class="peers-empty">No peers connected yet</p>'

    entrySplit.classList.remove('join-only');
    codeInput.classList.add('hidden');
    codeInput.value = '';
}

function leaveRoom(){
    resetToEntry()
    socket.emit('leave')
}

function collapseExitMenu() {
    exitMenu.classList.add('hidden');
    exitToggle.classList.remove('hidden');
    document.removeEventListener('click', onOutsideClick);
}
function onOutsideClick(e) {
    // if the click is outside the menu, collapse
    if (!exitMenu.contains(e.target)) {
        collapseExitMenu();
    }
}
exitToggle.addEventListener('click', (e) => {
    e.stopPropagation();               // don't let this click reach document
    exitToggle.classList.add('hidden');
    exitMenu.classList.remove('hidden');
    document.addEventListener('click', onOutsideClick);
});

function refreshEntryState(){
    const hasName = nameInput.value.trim().length > 0
    createBtn.disabled = !hasName
    joinBtn.disabled = !hasName
}
nameInput.addEventListener('input', refreshEntryState)


createBtn.addEventListener('click', async () => {
    myName = nameInput.value.trim()
    if (!myName) return
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    socket.emit('create', { name: myName })
})

joinBtn.addEventListener('click', async () => {
    const revealed = entrySplit.classList.contains('join-only')
    if (!revealed) {
        entrySplit.classList.add('join-only')
        codeInput.classList.remove('hidden')
        codeInput.focus()
        return
    }
    myName = nameInput.value.trim()
    const code = codeInput.value.trim()
    if (!myName || code.length !== 6) return
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    socket.emit('join', {code, name: myName})
})

backBtn.addEventListener('click', () => {
    entrySplit.classList.remove('join-only');
    codeInput.classList.add('hidden');
    codeInput.value = '';
});

codeBtn.addEventListener('click', () =>{
    const shareUrl = `${window.location.origin}/?room=${roomCode}`
    qrContainer.innerHTML = ''
    new QRCode(qrContainer, { text: shareUrl, width: 200, height: 200 })
    shareCode.textContent = roomCode
    sharePanel.classList.add('open')
    shareBackdrop.classList.remove('hidden')
})

leaveBtn.addEventListener('click', leaveRoom)

endBtn.addEventListener('click', ()=>{
    showModal({
        text: "Ending the session will remove everyone and close it permanently. Are you sure?",
        btn1Label: 'Cancel',
        btn2Label : 'End Session',
        btn2Action: () => socket.emit('end-session')
        
    })
})

shareClose.addEventListener('click', () =>{
    sharePanel.classList.remove('open')
    shareBackdrop.classList.add('hidden')
})

shareBackdrop.addEventListener('click', () =>{
    sharePanel.classList.remove('open')
    shareBackdrop.classList.add('hidden')
})

socket.on('room-info', ({ code }) => {
    roomCode = code
    console.log('room created, code:', code)
})

socket.on('existing-peers', async ({peers, code}) => {
    roomCode = code
    codeBtn.textContent = roomCode
    entryView.classList.add('hidden')
    roomView.classList.remove('hidden')
    displayName.textContent = myName
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

socket.on('session-ended', ()=> {
    resetToEntry()
    showModal({
        text: 'This session has been ended.',
        btn1Label: 'Dismiss'
    })
})

socket.on('peers-update', ({peers}) => {
        const ids = Object.keys(peers)
        if (ids.length === 0) {
            div.innerHTML = '<p class="peers-empty">No peers connected yet</p>'
            return
        }
        div.innerHTML = ''
        for (const id in peers) {
            div.innerHTML += `
                <div class="peer-item">
                    <span class="peer-dot"></span>
                    <span>${peers[id].name}</span>
                </div>`
        }
    })

socket.on('error', ({ reason, message }) => {
    if (reason === 'ROOM_NOT_FOUND'){
        if(stream){
            stream.getTracks().forEach(t => t.stop())
            stream = null}
        entryError.textContent = message
        entryError.classList.remove('hidden')}
    
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