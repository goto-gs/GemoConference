const Peer = window.Peer;

(async function main() {
  const localVideo = document.getElementById('js-local-stream');
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const remoteVideos = document.getElementById('js-remote-streams');
  // const roomId = document.getElementById('js-room-id');
  // const roomMode = document.getElementById('js-room-mode');
  const localText = document.getElementById('js-local-text');
  const sendTrigger = document.getElementById('js-send-trigger');
  const messages = document.getElementById('js-messages');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');

  //
  const camSwitch = document.getElementById('js-cam-switch');
  const cameraStatus = document.getElementById('camera-status');
  const micSwitch = document.getElementById('js-mic-switch');
  const microphoneStatus = document.getElementById('microfone-status');
  const screenSwitch = document.getElementById('js-screen-share');
  const videoElem = document.getElementById('video-test');
  const ssStopSwitch = document.getElementById('js-stop-share');
  const roomName = document.getElementById('roomName');
  const yourName = document.getElementById('yourName');



  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();

  /*
  const getRoomModeByHash = () => (location.hash === '#sfu' ? 'sfu' : 'mesh');
  roomMode.textContent = getRoomModeByHash();

  window.addEventListener(
    'hashchange',
    () => (roomMode.textContent = getRoomModeByHash())
  );

  */

  let localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);

  // Render local stream
  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

  // 
  cameraStatus.textContent = `カメラON`;
  microphoneStatus.textContent = `マイクON`;

  // new Peer("name",{ key:...})にするとIDを任意にできる
  // eslint-disable-next-line require-atomic-updates
  const peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  }));

  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "YOURAPIKEYS",
    authDomain: "xxxxxxxxxx.firebaseapp.com",
    databaseURL: "https://xxxxxxxx.firebaseio.com",
    projectId: "xxxxxxxx",
    storageBucket: "xxxxxxxxxx.appspot.com",
    messagingSenderId: "1073314383964",
    appId: "1:1073314383964:web:e5c19e99d837e979037e99"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  //Msg送信準備
  const newPostRef = firebase.database();
  let rooms = roomName.innerText;

  //Msg受信処理
  newPostRef.ref(rooms).on("child_added", function (data) {
    const v = data.val();
    const k = data.key;
    let str = v.username + ":" + v.text + "\n";
    messages.textContent += str;

  });

  // Register join handler
  joinTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    // mode: getRoomModeByHash()   roomId.value
    const room = peer.joinRoom(roomName.innerText, {
      mode: 'mesh',
      stream: localStream,
    });
    console.log(room);

    room.once('open', () => {
      messages.textContent += '=== You joined ===\n';
    });
    room.on('peerJoin', peerId => {
      messages.textContent += `=== ${peerId} joined ===\n`;
    });

    // Render remote stream for new peer join in the room
    room.on('stream', async stream => {
      const newVideo = document.createElement('video');
      newVideo.srcObject = stream;
      newVideo.playsInline = true;

      // 
      newVideo.classList.add("other");

      // mark peerId to find it later at peerLeave event
      newVideo.setAttribute('data-peer-id', stream.peerId);
      remoteVideos.append(newVideo);
      await newVideo.play().catch(console.error);
    });

    room.on('data', ({ data, src }) => {
      // Show a message sent to the room and who sent
      messages.textContent += `${src}: ${data}\n`;
    });

    // for closing room members
    room.on('peerLeave', peerId => {
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id=${peerId}]`
      );
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();

      messages.textContent += `=== ${peerId} left ===\n`;
    });

    // for closing myself
    room.once('close', () => {
      sendTrigger.removeEventListener('click', onClickSend);
      messages.textContent += '== You left ===\n';
      Array.from(remoteVideos.children).forEach(remoteVideo => {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });
    });

    // leaveした時close
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });

    // チャット送信時、firebaseにIDとテキストいれる
    sendTrigger.addEventListener('click', onClickSend);

    function onClickSend() {

      if (!yourName.value) {
        alert("Please write your name!");
        return false;
      }

      // Send message to all of the peers in the room via websocket
      room.send(localText.value);

      const username = yourName.value;
      const text = `${localText.value}`;

      console.log(rooms);

      newPostRef.ref(rooms).push({
        username: username,
        text: text
      });
      console.log('chat');
      localText.value = '';


    }

    // 画面共有の開始
    screenSwitch.addEventListener('click', onClickShare);

    async function onClickShare() {
      try {
        let mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

        // 既存のストリームを画面共有のストリームに置換
        room.replaceStream(mediaStream);

      } catch (e) {
        console.log('Unable to acquire screen capture: ' + e);
      }
    }

    // 画面共有の停止
    ssStopSwitch.addEventListener('click', stopShare);

    function stopShare() {
      // let tracks = videoElem.srcObject.getTracks();
      // tracks.forEach(track => track.stop());
      // videoElem.srcObject = null;

      room.replaceStream(localStream);

    }

  });


  // カメラのミュート
  camSwitch.addEventListener('click', onClickCam);

  function onClickCam() {
    const videoTracks = localStream.getVideoTracks()[0];
    videoTracks.enabled = !videoTracks.enabled;
    cameraStatus.textContent = `カメラ${videoTracks.enabled ? 'ON' : 'OFF'}`;
  }

  // マイクのミュート
  micSwitch.addEventListener('click', onClickMic);

  function onClickMic() {
    const audioTracks = localStream.getAudioTracks()[0];
    audioTracks.enabled = !audioTracks.enabled;
    microphoneStatus.textContent = `マイク${audioTracks.enabled ? 'ON' : 'OFF'}`;
  }

  // 拡大表示
  function targetAdd() {
    if (document.getElementsByClassName("other")) {
      let targets = document.getElementsByClassName("other");
      for (let i = 0; i < targets.length; i++) {
        targets[i].addEventListener("click", (e) => {
          let zoomMedia = e.target.srcObject;
          videoElem.srcObject = zoomMedia;
        }, false);
      }
    }
  }
  setInterval(targetAdd, 1000);

  peer.on('error', console.error);
})();


