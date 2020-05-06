/*global socket, video, config*/
let peerConnection;

let video = document.getElementById('vid');


socket.on('offer', function(id, description) {
	console.log('offer');
	peerConnection = new RTCPeerConnection(config);
	peerConnection.setRemoteDescription(description)
	.then(() => peerConnection.createAnswer())
	.then(sdp => peerConnection.setLocalDescription(sdp))
	.then(function () {
		socket.emit('answer', id, peerConnection.localDescription);
		console.log('answer');
	});
	peerConnection.ontrack = function(event) {
		if (video.srcObject !== event.streams[0]) {
			video.srcObject = event.streams[0];
			video.onloadeddata = function(e){
				video.play();
			}	
		  }
		  
		  console.log(video.srcObject);	
	};
	peerConnection.onicecandidate = function(event) {
		if (event.candidate) {
			socket.emit('candidate', id, event.candidate);
			console.log('emit candidate');
		}
	};
});

socket.on('candidate', function(id, candidate) {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
  .catch(e => console.error(e));
	console.log('candidate');
});

socket.on('connect', function() {
	socket.emit('watcher');
	console.log('connect');
});

socket.on('broadcaster', function() {
  socket.emit('watcher');
  console.log('broadcaster');
});

socket.on('bye', function() {
	peerConnection.close();
});

/*
socket.emit('1');
socket.emit('2');
socket.emit('3');
*/

function getOrientation()
{
	const urlParams = new URLSearchParams(document.location.search.substring(1));;
	const id = parseInt(urlParams.get('id'));
	console.log(`id: ${id}`);


	switch(id)
	{
		case 1:
			socket.emit('orientation', 1);
			break;
		case 2:
			socket.emit('orientation', 2);
			break;
		case 3: 
			socket.emit('orientation', 3);
			break;
	}

	return id;
}

getOrientation();