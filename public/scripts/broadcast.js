import {sdpParse} from './utilFunctions.js';


const peerConnections = {};
let peerConnArr = [];

let counter = 0;

let stream1, stream2, stream3;
const streams = [];

stream1 = canvas1.captureStream(35);
streams.push(stream1);
stream2 = canvas2.captureStream(35);
streams.push(stream2);
stream3 = canvas3.captureStream(35);
streams.push(stream3);


socket.emit('broadcaster');

socket.on('answer', function(id, description)
{
    peerConnections[id].setRemoteDescription(description);
    console.log('recieved answer');
});



socket.on('receiver', (data) => {
	const peerConnection = new RTCPeerConnection(iceServer);
	peerConnections[data.socket] = peerConnection;
	peerConnArr.push(peerConnection);
	let stream = streams[counter];
		stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
	peerConnection.createOffer()
	.then(sdp => {
		//let newSDP = sdpParse(sdp);
		peerConnection.setLocalDescription(sdp);
		})
	.then(function () {
		socket.emit('offer', data.socket, peerConnection.localDescription);
		console.log('offer');
	});
	peerConnection.onicecandidate = function(event) {
		if (event.candidate) {
			socket.emit('candidate', data.socket, event.candidate);
			console.log('candidate sent');
		}
	};

	//reset stream counter
	if (counter === 2 )
	{
		counter = 0;
	} else {counter++;}
	
});

//Ice candidate recieved
socket.on('candidate', function(id, candidate) {
	peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
	console.log(`candidate`);
});

//peer disconnected
socket.on('bye', function(id) {
	peerConnections[id] && peerConnections[id].close();
	delete peerConnections[id];
});

