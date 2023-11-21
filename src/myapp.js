const os = require('os-utils');
const os2 = require('os');
// Websocket

let socket=null
let isConnected = false;
let failed = false;
let json = {};
let appLatency = {
  latency1: {
    screen1: 0,
    screen2: 0,
    dt: 0
  },
  trigger: [{
      screen1: 0,
      screen2: 0,
      dt: 0
    },
    {
      screen1: 0,
      screen2: 0,
      dt: 0
    },
    {
      screen1: 0,
      screen2: 0,
      dt: 0
    },
    {
      screen1: 0,
      screen2: 0,
      dt: 0
    }
  ],
  latency6: {
    screen1: 0,
    screen2: 0,
    dt: -1,
  },
};

//video bitrate
let videoBitrate;

function socketHandler(data){
    socket=new WebSocket(data.url)
    socket.onopen = (event) =>{
      console.log('connected')
      isConnected = true;
      socket.send(JSON.stringify(
        {
          event: 'clientConnected',
          sessionId: data.sessionId,
          role: 'primary'
        }
      ))
    };
  
    //socket.onerror=(event)=>console.log(event)
    //socket.onclose=(event)=>console.log(event)
  
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if(data.sender === 1 && data.message === 1){
        console.log('Peer is connected')
        // if peer is connected, hide the qr code screen
        document.getElementById("qrcode").style.display = "none";
        //show the video element and play the video
        const video = document.getElementById('video');
        video.style.display="block";
        video.play();
        video.muted=false;
      }
      
      if(data.sender == 2){
        let message = JSON.parse(data.message)
        if(message.kpi == 'latency1'){
          appLatency.latency1.screen2 = message.time;

          appLatency.latency1.dt = Math.abs(appLatency.latency1.screen1 - appLatency.latency1.screen2);
          // console.log("latency 1: ", appLatency.latency1);
        }
        if(message.kpi == 'latency2'){
          let i = 0;
          appLatency.trigger[i].screen2 = message.time;

          appLatency.trigger[i].dt = Math.abs(appLatency.trigger[i].screen2 - appLatency.trigger[i].screen1);
          // console.log("latency 2: ", appLatency.trigger[i]);
        }
        if(message.kpi == 'latency3'){
          let i = 1;
          appLatency.trigger[i].screen2 = message.time;

          appLatency.trigger[i].dt = Math.abs(appLatency.trigger[i].screen2 - appLatency.trigger[i].screen1);
          // console.log("latency 3: ", appLatency.trigger[i]);
        }
        if(message.kpi == 'latency4'){
          let i = 2;
          appLatency.trigger[2].screen2 = message.time;

          appLatency.trigger[i].dt = Math.abs(appLatency.trigger[i].screen2 - appLatency.trigger[i].screen1);
          // console.log("latency 4: ", appLatency.trigger[i]);
        }
        if(message.kpi == 'latency5'){
          let i = 3;
          appLatency.trigger[3].screen2 = message.time;

          appLatency.trigger[i].dt = Math.abs(appLatency.trigger[i].screen2 - appLatency.trigger[i].screen1);
          // console.log("latency 5: ", appLatency.trigger[i]);
        }
        // quiz is failed/alternative ending
        if(message.kpi == 'failed'){
          failed = true;
          const video = document.getElementById('video');
          const videoAlternativeEnding = document.getElementById('videoAlternativeEnding');

          video.pause();
          video.muted=true;
          document.getElementById("video").style.display = "none";

          videoAlternativeEnding.style.display="block";
          videoAlternativeEnding.play();
          videoAlternativeEnding.muted=false;

          appLatency.latency6.screen2 = message.time;

          closeConnection();
        }
      }

      // try {
      //   if ((data.event = "data")) {
      //         console.log(data.data);
      //       }
      //     } catch (err) {
      //       console.log(`[message] Error in recieving.`);
      //   }
    }
}

function closeConnection(){
  if(socket){
    socket.close()
    isConnected = false;
    socket=null
  }
}

// generate session id
function newSessionId() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
const sessionId = newSessionId();
// const urlLink = "ws://10.5.1.4:30500";
const urlLink = "wss://5g-test-relay.noriginmedia.com:9000";

const connectData={
    url: urlLink,
    sessionId: sessionId
  }

// connect as primary device
socketHandler(connectData);



const manifestUri =
    'https://folk.ntnu.no/davidju/dash/out.mpd';
// const manifestUri = 'https://5g-test-relay.noriginmedia.com/dash/out.mpd';
const videoUri = 'https://folk.ntnu.no/davidju/nova_8K.mp4';
// const videoUri = 'https://folk.ntnu.no/davidju/nova_4K.mp4';
// const videoUri = 'https://5g-test-relay.noriginmedia.com/nova_8K.mp4';
// const videoUri = 'http://10.5.1.4:31100/nova_8K.mp4';
// const videoUri = 'https://5g-test-relay.noriginmedia.com/nova_4K.mp4';
// const videoUri = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
// const videoAlternativeEndingUri = 'https://folk.ntnu.no/davidju/sorry_youre_Out_4K.mp4';
// const videoAlternativeEndingUri = 'https://5g-test-relay.noriginmedia.com/end_4K.mp4';
const videoAlternativeEndingUri = 'https://folk.ntnu.no/davidju/end_8K.mp4';
// const videoAlternativeEndingUri = 'https://5g-test-relay.noriginmedia.com/end_8K.mp4';
// const videoAlternativeEndingUri = 'http://10.5.1.4:31100/end_8K.mp4';

let triggerTimes = [];
let nrOfEvents;
let height = screen.height;

window.addEventListener("load", () => {
  // generate QR code
  var qrc = new QRCode(document.getElementById("qrcode"), {
    text: JSON.stringify(connectData),
    width: height/2,
    height: height/2,
    // colorDark : "#000000",
    // colorLight : "#ffffff",
    // correctLevel : QRCode.CorrectLevel.H
  });

  //hide the video element and pin
  document.getElementById("video").style.display = "none";
  document.getElementById("videoAlternativeEnding").style.display = "none";
  document.getElementById("pin").style.display = "none";
  //write the pin code
  document.getElementById("title").innerHTML = "Please, insert the following pin code into your VR headset:<br>";
  document.getElementById("code").innerHTML = "4153";

  // read the manifest
  triggerTimes = [61, 87, 102, 134.5];
  nrOfEvents = 4;
  // fetch(manifestUri).then((response) => {
  // response.text().then((xml) => {
  //   let parser = new DOMParser();
  //   let xmlDOM = parser.parseFromString(xml,'text/xml');
  //   // console.log(xml)

  //   nrOfEvents = xmlDOM.getElementsByTagName("Event").length;
  //   for(let i=0; i<nrOfEvents; i++){
  //     triggerTimes[i] = xmlDOM.getElementsByTagName("Event")[i].getAttribute('timeStamp');
  //   }
  //   // console.log(triggerTimes);
  //   })
  // })
});

function calculateStandardDeviation(values) {
  var sum = values.reduce(function(sum, value) {
    return sum + value;
  }, 0);

  var mean = sum / values.length;

  var squaredDifferences = values.map(function(value) {
    var difference = value - mean;
    return difference * difference;
  });

  var sumSquaredDiff = squaredDifferences.reduce(function(sum, value) {
    return sum + value;
  }, 0);

  var variance = sumSquaredDiff / values.length;

  return Math.sqrt(variance);
}

// shaka player
function initApp() {
  // Install built-in polyfills to patch browser incompatibilities.
  shaka.polyfill.installAll();

  // Check to see if the browser supports the basic APIs Shaka needs.
  if (shaka.Player.isBrowserSupported()) {
    // Everything looks good!
    initPlayer();
  } else {
    // This browser does not have the minimum set of APIs we need.
    console.error('Browser not supported!');
  }
}

async function initPlayer() {
  // Create a Player instance.
  const video = document.getElementById('video');
  const player = new shaka.Player(video);

  const videoAlternativeEnding = document.getElementById('videoAlternativeEnding');
  const playerAlternativeEnding = new shaka.Player(videoAlternativeEnding);

  // Attach player to the window to make it easy to access in the JS console.
  window.player = player;

  // Listen for error events.
  player.addEventListener('error', onErrorEvent);
  playerAlternativeEnding.addEventListener('error', onErrorEvent);

  // Try to load a manifest.
  // This is an asynchronous process
  
  //video bitrate
  video.addEventListener('loadedmetadata', function() {
    videoBitrate = estimateVideoBitrate(video); //Mbps
  });

  function estimateVideoBitrate(videoElement) {
    var duration = videoElement.duration; //second
    // var fileSize = 406171462 / (1000 * 1000); //MB
    var fileSize = 387; //MB

    if (duration > 0 && fileSize > 0) {
      // Calculate bitrate in kbps
      var bitrate = (fileSize) / (duration);
      return Math.round(bitrate * 100) / 100;
    } else {
      console.warn('Duration or file size information not available.');
      return null;
    }
  }

  try {
    await player.load(videoUri);
    await playerAlternativeEnding.load(videoAlternativeEndingUri);

    document.getElementById("qrcode").style.display = "none";
    // show the video element and play the video
    const video = document.getElementById('video');
    video.style.display="block";
    // shaka.polyfill.Fullscreen();
    video.play();
    video.muted=true;

    //retrieve the token
    fetch('https://iambackend.netapps-5gmediahub.eu/realms/5GMediaHUB/protocol/openid-connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: {
        'grant_type': 'client_credentials',
        'client_id': 'my-cosmic-application',
        'client_secret': 'sOumyjC8mdu63z09QfhlqkHmgx6m2K7r'
      }
    }).then(response => response.json())
    .then(response => console.log(JSON.stringify(response)))


  } catch (e) {
    // onError is executed if the asynchronous load fails.
    onError(e);
  }

  // JSON for the KPI's
  json = {
    "test": {
      "use_case": "UC1",
      "test_case": "TC2",
      "test_case_id": sessionId,
    },
    "data": {
        "timestamp": "2020-11-10T03:45:37Z",
        "kpis": []
    }
  };   

  // json.data.kpis.push({
  //   "name": "framerate",
  //   "value": "25",
  //   "unit": "frameps"
  // });

  let d = new Date();
  let date = d.toISOString();
  let seconds = date.split(":")[2];
  seconds = Math.round(seconds.slice(0, -1));
  json.data.timestamp = date.split(":")[0] + ":" + date.split(":")[1] + ":" + seconds + "Z";
  // console.log(date.split(":")[0] + ":" + date.split(":")[1] + ":" + seconds + "Z");

//   console.log(json);
//   fetch('http://5gmediahub.vvservice.cttc.es/5gmediahub/data-collector/kpis', {
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(json)
// }).then(response => response.json())
//   .then(response => console.log(JSON.stringify(response)))

  //listen to the playing video
  let n=5;
  let count=1;
  let framesPrev=0;
  let frameRate;
  let videoTimePrev=0.0;
  let averageFrameRate, minFrameRate=9999, maxFrameRate=-1, sum=0;
  //cpu usage
  let sumCPUusage = 0;
  let averageCPUusage;
  let k = 0;
  //ram usage
  let sumRAMusage = 0;
  let averageRAMusage;
  let m = 0;
  const totalMemory = os2.totalmem();
  //stall
  let numberOfBufferings = 0;
  //frame error rate
  let frameErrorRate;
  //video jitter
  var lastFrameTime = 0;
  var frameDeltas = [];

  //measuring the latency1
  video.onplaying = function() {
    let date = new Date();
    appLatency.latency1.screen1 = date.getTime();
  };

  videoAlternativeEnding.onplaying = function() {
    let date = new Date();
    appLatency.latency6.screen1 = date.getTime();

    appLatency.latency6.dt = Math.abs(appLatency.latency6.screen1 - appLatency.latency6.screen2);
    // console.log("latency 6: ", appLatency.latency6);
  };

  video.addEventListener('waiting', function() {
    console.log("Video is buffering");
    // Do something when the video is buffering
    numberOfBufferings++;
  });

  // video.addEventListener('pause', function() {
  //   console.log("Video is paused");
  //   // Do something when the video is paused
  //   numberOfBufferings++;
  // });

  // video.addEventListener('error', function() {
  //   // console.error('Error loading or playing the video frame.');
  //   numberOfFramesError++;
  //   // You can update your error metrics here
  //   frameErrorRate = numberOfFramesError;
  // });

  video.addEventListener('timeupdate', () => {
    // console.log("frames dropped: "+player.getStats().droppedFrames);
    // console.log("total frames (rendered?): " + video.getVideoPlaybackQuality().totalVideoFrames);
    // frameErrorRate = player.getStats().droppedFrames/video.getVideoPlaybackQuality().totalVideoFrames;
    // console.log('frame error rate: ', frameErrorRate);

    //video jitter
    // Current time of the video in seconds
    var currentTime = video.currentTime;

    // Calculate the time difference between the current frame and the last frame
    var frameDelta = currentTime - lastFrameTime;

    // Store the frame delta in the array
    frameDeltas.push(frameDelta);

    // Update the last frame time
    lastFrameTime = currentTime;
    // console.log(frameDelta);

    if(Math.floor(video.currentTime)==count*n){
      // console.log("every 5 seconds "+Math.floor(video.currentTime));
      frameRate = (video.getVideoPlaybackQuality().totalVideoFrames-framesPrev)/(video.currentTime-videoTimePrev);
      sum += frameRate;
      averageFrameRate = sum/count;
      if(frameRate < minFrameRate)
        minFrameRate = frameRate;
      if(frameRate > maxFrameRate)
        maxFrameRate = frameRate;
      
      framesPrev=video.getVideoPlaybackQuality().totalVideoFrames;
      videoTimePrev=video.currentTime;
      count++;
    }

    //cpu usage
    os.cpuUsage((usage) => {
      k++;
      sumCPUusage += usage;
      averageCPUusage = sumCPUusage / k;
    });

    //ram usage
    if ('performance' in window && 'memory' in performance) {
      const memoryInfo = performance.memory;
      m++;
      sumRAMusage += memoryInfo.usedJSHeapSize;
      averageRAMusage = sumRAMusage / m;
      
      // console.log('ram-usage: ', averageRAMusage/totalMemory * 100 + " %");
      // console.log('Total JS Heap Size:', memoryInfo.totalJSHeapSize);
      // console.log('Used JS Heap Size:', memoryInfo.usedJSHeapSize);
    } else {
      console.warn('Performance API or Memory API not supported in this browser.');
    }
    // const memoryUsage = process.memoryUsage();
    // console.log('Memory Usage:', memoryUsage);

    for(let i=0; i < nrOfEvents; i++){
      if(Math.floor(video.currentTime*10)/10 < triggerTimes[i]+0.2 && Math.floor(video.currentTime*10)/10 > triggerTimes[i]-0.2){
        // console.log('TIME', video.currentTime);
        socket.send(JSON.stringify(
          {
            event: 'message',
            sessionId: sessionId,
            message: 'trigger'+(i+1).toString()
          }
        ));
        // latencies 2,3,4,5
        let date = new Date();
        appLatency.trigger[i].screen1 = date.getTime();

        triggerTimes[i]=-1;
      }
    }
  });

  //video has ended
  video.addEventListener('ended', function(e) {
    video.style.display="none";
    document.getElementById("pin").style.display = "block";
    document.getElementById("pin").style.display = "flex";
    
    averageCPUusage *= 100;
    averageRAMusage /= totalMemory;
    averageRAMusage *= 100;
    
    //frame error rate
    frameErrorRate = player.getStats().droppedFrames/video.getVideoPlaybackQuality().totalVideoFrames * 100;
    // console.log("frames dropped: "+player.getStats().droppedFrames);
    // console.log("total frames (rendered?): " + video.getVideoPlaybackQuality().totalVideoFrames);

    // Calculate the standard deviation of frame deltas
    var jitter = calculateStandardDeviation(frameDeltas)/video.duration * 100;

    json.data.kpis.push({
      "name": "framerate",
      "value": averageFrameRate.toString(),
      "unit": "frameps"
    });

    json.data.kpis.push({
      "name": "cpu-usage",
      "value": averageCPUusage.toString(),
      "unit": "percent"
    });

    json.data.kpis.push({
      "name": "ram-usage",
      "value": averageRAMusage.toString(),
      "unit": "percent"
    });

    json.data.kpis.push({
      "name": "video-bitrate",
      "value": videoBitrate.toString(),
      "unit": "kbps"
    });

    json.data.kpis.push({
      "name": "video-resolution",
      "value": "8K",
      "unit": " "
    });

    json.data.kpis.push({
      "name": "frame-error-rate",
      "value": frameErrorRate,
      "unit": " "
    });

    json.data.kpis.push({
      "name": "video-jitter",
      "value": jitter,
      "unit": "percent"
    });
    
    // if(!failed){
      let appLatencies = [appLatency.latency1.dt, appLatency.trigger[0].dt, appLatency.trigger[1].dt, appLatency.trigger[2].dt, appLatency.trigger[3].dt];
      json.data.kpis.push({
        "name": "application latency 1",
        "value": appLatencies[0].toString(),
        "unit": "ms"
      });
      json.data.kpis.push({
        "name": "application latency 2",
        "value": appLatencies[1].toString(),
        "unit": "ms"
      });
      json.data.kpis.push({
        "name": "application latency 3",
        "value": appLatencies[2].toString(),
        "unit": "ms"
      });
      json.data.kpis.push({
        "name": "application latency 4",
        "value": appLatencies[3].toString(),
        "unit": "ms"
      });
      json.data.kpis.push({
        "name": "application latency 5",
        "value": appLatencies[4].toString(),
        "unit": "ms"
      });
      console.log(json);
      fetch('http://5gmediahub.vvservice.cttc.es/5gmediahub/data-collector/kpis', {
          method: 'POST',
          headers: {
              'Authorization': 'application/json',
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(json)
        }).then(response => response.json())
          .then(response => console.log(JSON.stringify(response)))
      console.log("average framerate (frames/s): ", averageFrameRate);
      console.log("average cpu-usage (%): ", averageCPUusage);
      console.log('ram-usage (%): ', averageRAMusage);
      console.log('estimated video bitrate (Mbps):', videoBitrate);
      console.log('video resolution: 8K');
      console.log('frame error rate (%): ', frameErrorRate);
      console.log('stall probability (%): ', numberOfBufferings * 100);
      console.log('video jitter (%): ' + jitter);
      console.log("application latencies (ms): ", appLatencies);
    // }
    closeConnection();
  });

  videoAlternativeEnding.addEventListener('ended', function(e) {
    // console.log("average framerate (frames/sec): ", averageFrameRate);
    json.data.kpis.push({
      "name": "framerate",
      "value": averageFrameRate.toString(),
      "unit": "frameps"
    });

    json.data.kpis.push({
      "name": "cpu-usage",
      "value": averageCPUusage.toString(),
      "unit": "percent"
    });

    json.data.kpis.push({
      "name": "ram-usage",
      "value": averageRAMusage.toString(),
      "unit": "percent"
    });

    json.data.kpis.push({
      "name": "video-bitrate",
      "value": videoBitrate.toString(),
      "unit": "kbps"
    });

    json.data.kpis.push({
      "name": "video-resolution",
      "value": "8K",
      "unit": " "
    });

    json.data.kpis.push({
      "name": "frame-error-rate",
      "value": frameErrorRate,
      "unit": " "
    });

    json.data.kpis.push({
      "name": "video-jitter",
      "value": jitter,
      "unit": "percent"
    });

    let appLatencies = [appLatency.latency1.dt, appLatency.trigger[0].dt, appLatency.trigger[1].dt, appLatency.trigger[2].dt, appLatency.trigger[3].dt, appLatency.latency6.dt];
    json.data.kpis.push({
      "name": "application latency 1",
      "value": appLatencies[0].toString(),
      "unit": "ms"
    });
    json.data.kpis.push({
      "name": "application latency 2",
      "value": appLatencies[1].toString(),
      "unit": "ms"
    });
    json.data.kpis.push({
      "name": "application latency 3",
      "value": appLatencies[2].toString(),
      "unit": "ms"
    });
    json.data.kpis.push({
      "name": "application latency 4",
      "value": appLatencies[3].toString(),
      "unit": "ms"
    });
    json.data.kpis.push({
      "name": "application latency 5",
      "value": appLatencies[4].toString(),
      "unit": "ms"
    });
    json.data.kpis.push({
      "name": "application latency 6",
      "value": appLatencies[5].toString(),
      "unit": "ms"
    });
    console.log(json);
    fetch('http://5gmediahub.vvservice.cttc.es/5gmediahub/data-collector/kpis', {
        method: 'POST',
        headers: {
            'Authorization': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(json)
      }).then(response => response.json())
        .then(response => console.log(JSON.stringify(response)))
    console.log("average framerate (frames/s): ", averageFrameRate);
    console.log("average cpu-usage (%): ", averageCPUusage);
    console.log('ram-usage (%): ', averageRAMusage);
    console.log('estimated video bitrate (Mbps):', videoBitrate);
    console.log('video resolution: 8K');
    console.log('frame error rate: ', frameErrorRate);
    console.log('stall probability (%): ', numberOfBufferings * 100);
    console.log('video jitter (%): ' + jitter);
    console.log("application latencies (ms): ", appLatencies);
    closeConnection();
  });
}

function onErrorEvent(event) {
  // Extract the shaka.util.Error object from the event.
  onError(event.detail);
}

function onError(error) {
  // Log the error.
  console.error('Error code', error.code, 'object', error);
}

document.addEventListener('DOMContentLoaded', initApp);