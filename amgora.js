
// app / channel settings
var agoraAppId = "cdbe3f8535de42c4a82a98a1291103a4"; // Set your Agora App ID
var channelName = 'test2';

// video profile settings
var cameraVideoProfile = '480_4'; // 640 × 480 @ 30fps  & 750kbs
var screenVideoProfile = '480_2'; // 640 × 480 @ 30fps

// create client instances for camera (client) and screen share (screenClient)
var client = AgoraRTC.createClient({mode: 'rtc', codec: "h264"}); // h264 better detail at a higher motion
var screenClient = AgoraRTC.createClient({mode: 'rtc', codec: 'vp8'}); // use the vp8 for better detail in low motion

// stream references (keep track of active streams) 
var remoteStreams = {}; // remote streams obj struct [id : stream] 

var localStreams = {
  camera: {
    id: "",
    stream: {}
  },
  screen: {
    id: "",
    stream: {}
  }
};

var mainStreamId; // reference to main stream
var screenShareActive = false; // flag for screen share 

// init Agora SDK
client.init(agoraAppId, function () {
  console.log("AgoraRTC client initialized");
  joinChannel(); // join channel upon successfull init
}, function (err) {
  console.log("[ERROR] : AgoraRTC client init failed", err);
});

client.on('stream-published', function (evt) {
  console.log("Publish local stream successfully");
});

// connect remote streams
client.on('stream-added', function (evt) {
  console.log("new stream added: " + streamId);
  // Check if the stream is local
  if (streamId != localStreams.screen.id) {
    console.log('subscribe to remote stream:' + streamId);
    // Subscribe to the stream.
    client.subscribe(stream, function (err) {
      console.log("[ERROR] : subscribe stream failed", err);
    });
  }
});

client.on('stream-subscribed', function (evt) {
  console.log("Subscribe remote stream successfully: " + evt.stream.getId());
});

// remove the remote-container when a user leaves the channel
client.on("peer-leave", function(evt) {
  console.log("Remote stream: " + evt.stream.getId() + "has left");
});

// show mute icon whenever a remote has muted their mic
client.on("mute-audio", function (evt) {
  console.log("Remote stream: " +  evt.uid + "has muted audio");
});

client.on("unmute-audio", function (evt) {
  console.log("Remote stream: " +  evt.uid + "has muted audio");
});

// show user icon whenever a remote has disabled their video
client.on("mute-video", function (evt) {
  console.log("Remote stream: " +  evt.uid + "has muted video");
});

client.on("unmute-video", function (evt) {
  console.log("Remote stream: " +  evt.uid + "has un-muted video");
});

// join a channel
function joinChannel() {
  var token = generateToken();
  var userID = null; // set to null to auto generate uid on successfull connection
  client.join(token, channelName, userID, function(uid) {
      console.log("User " + uid + " join channel successfully");
      createCameraStream(uid);
      localStreams.camera.id = uid; // keep track of the stream uid 
  }, function(err) {
      console.log("[ERROR] : join channel failed", err);
  });
}

// video streams for channel
function createCameraStream(uid) {
  var localStream = AgoraRTC.createStream({
    streamID: uid,
    audio: true,
    video: true,
    screen: false
  });
  localStream.setVideoProfile(cameraVideoProfile);
  localStream.init(function() {
    console.log("getUserMedia successfully");
    // TODO: add check for other streams. play local stream full size if alone in channel
    localStream.play('local-video'); // play the given stream within the local-video div
    // publish local stream
    client.publish(localStream, function (err) {
      console.log("[ERROR] : publish local stream error: " + err);
    });
  
    enableUiControls(localStream); // move after testing
    localStreams.camera.stream = localStream; // keep track of the camera stream for later
  }, function (err) {
    console.log("[ERROR] : getUserMedia failed", err);
  });
}

function leaveChannel() {
  client.leave(function() {
    console.log("client leaves channel");
  }, function(err) {
    console.log("client leave failed ", err); //error handling
  });
}

// use tokens for added security
function generateToken() {
  return null; // TODO: add a token generation
}



// REMOTE STREAMS UI
function addRemoteStreamMiniView(remoteStream){
  var streamId = remoteStream.getId();
  // append the remote stream template to #remote-streams
  $('#remote-streams').append(
    $('<div/>', {'id': streamId + '_container',  'class': 'remote-stream-container col'}).append(
      $('<div/>', {'id': streamId + '_mute', 'class': 'mute-overlay'}).append(
          $('<i/>', {'class': 'fas fa-microphone-slash'})
      ),
      $('<div/>', {'id': streamId + '_no-video', 'class': 'no-video-overlay text-center'}).append(
        $('<i/>', {'class': 'fas fa-user'})
      ),
      $('<div/>', {'id': 'agora_remote_' + streamId, 'class': 'remote-video'})
    )
  );
  remoteStream.play('agora_remote_' + streamId); 
}