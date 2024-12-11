import {sdpParse} from './utilFunctions.js';


/*global socket, video, config*/
let peerConnection;

let video = document.getElementById('vid');


socket.on('offer', function(id, description) {
	console.log('offer');
	peerConnection = new RTCPeerConnection(iceServer);
	peerConnection.setRemoteDescription(description)
	.then(() => peerConnection.createAnswer())
	.then(sdp => 
		{	
			let newSDP = sdpParse(sdp);
			peerConnection.setLocalDescription(new RTCSessionDescription(newSDP));
			//peerConnection.setLocalDescription(sdp);
		})
	.then(function () {
		socket.emit('answer', id, peerConnection.localDescription);
		//send id here
		console.log('answer');
		console.log(peerConnection.localDescription);
	});
	peerConnection.ontrack = function(event) {
		if (video.srcObject !== event.streams[0]) {
			video.srcObject = event.streams[0];
			video.onloadeddata = function(e){
				video.play();
			}	
		  }
	};
	peerConnection.onicecandidate = function(event) {
		if (event.candidate) {
			socket.emit('candidate', id, event.candidate);
		}
	};
});

//set ice candidate
socket.on('candidate', function(id, candidate) {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
  .catch(e => console.error(e));
	
});

socket.on('connect', function() {
	socket.emit('receiver');

});

socket.on('broadcaster', function() {
  socket.emit('receiver');
});

socket.on('bye', function() {
	peerConnection.close();
});
