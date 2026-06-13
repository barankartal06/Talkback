const port = 8080
let connectedMusicians = 0
console.log(port, connectedMusicians)

const musicianConnected = (name) => {
    connectedMusicians++
    let text = ''
    if (connectedMusicians==1){
        text= 'musician is connected.'
    } else {
        text= 'musicians are connected.'
    }

    console.log( name, 'connected.', connectedMusicians, text )
}

musicianConnected('Baran')
musicianConnected('Ezgec')

const forward= () => console.log('forwarding to bandmates')
const onAudioRecevied = (callback) => {
    console.log('audio packet received.')
    callback()
}
onAudioRecevied(forward)
