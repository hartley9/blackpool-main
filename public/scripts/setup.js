const config = {
    'iceServers': [{
        'urls': ['stun:stun.l.google.com:19302']
    }],
};

const socket = io.connect(window.location.origin);

window.onunload = window.onbeforeunload = function(){
    socket.close();
}


let canvas1, canvas2, canvas3;

canvas1 = document.getElementById( 'canvas1' );
canvas2 = document.getElementById( 'canvas2' );
canvas3 = document.getElementById( 'canvas3' );