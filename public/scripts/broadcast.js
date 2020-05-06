const peerConnections = {};
const streams = [];


let stream1, stream2, stream3;

socket.emit('broadcaster');

socket.on('answer', function(id, description)
{
    peerConnections[id].setRemoteDescription(description);
    console.log('recieved answer');
});

//create streams add them to streams arr
console.log(canvas1);
stream1 = canvas1.captureStream(35);
console.log(`stream: ${stream1}`);
streams.push(stream1);
stream2 = canvas2.captureStream(35);
streams.push(stream2);
stream3 = canvas3.captureStream(35);
streams.push(stream3);
console.log('created streams');


socket.on('watcher', function(id) {
	const peerConnection = new RTCPeerConnection(config);
	peerConnections[id] = peerConnection;
	let stream = streams[0	];
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
	peerConnection.createOffer()
	.then(sdp => peerConnection.setLocalDescription(sdp))
	.then(function () {
		socket.emit('offer', id, peerConnection.localDescription);
		console.log('offer');
	});
	peerConnection.onicecandidate = function(event) {
		if (event.candidate) {
			socket.emit('candidate', id, event.candidate);
			console.log('candidate sent');
		}
	};
});

socket.on('candidate', function(id, candidate) {
	peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
	console.log(`candidate`);
});

socket.on('bye', function(id) {
	peerConnections[id] && peerConnections[id].close();
	delete peerConnections[id];
});
