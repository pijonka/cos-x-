// all the tabs
const tabsContainer = document.getElementById('tabs');

// array which carries the data for all the tabs 
const tabArray = [];

// creates one instance of a tab
function makeTabObj() {


    const newTab = document.createElement('div');
    newTab.innerHTML = `
                <h1>Controls</h1>
                <p id="f(x)">f(x) = </p>
                <div>
                    <label for="freq">Frequency (hz)/pitch: </label>
                    <input id="freq" type="text" value="440"></input>
                </div>

                <div>
                    <label for="amp">Amplitude/volume: </label>
                    <input id="amp" type="text" value="1">
                </div>

                <div>
                    <label for="phase">Phase (PLACEHOLDER!)</label>
                    <input id="phase" type="text" value="0">
                </div>

                <button id="activeButton">Start</button>
    `;

    let freqInput = newTab.querySelector('#freq');
    let ampInput = newTab.querySelector('#amp');

    const obj = {
        freq: 440,
        amp: 1,
        active: false,
        activeButton: document.getElementById('activeButton'),
        htmlElement: newTab.innerHtml,
        oscillator: null

    }
    
    return obj;
}

const firstTab = makeTabObj();
tabArray.push(firstTab);
tabsContainer.appendChild(firstTab.htmlElement);


// get the new tab button
const newTabButton = document.getElementById('newTabButton');

// if user wants new tab
newTabButton.addEventListener('click', () => {
    // give them a new tab
    
    makeTabObj();
    tabArray.push(makeTabObj());
    tabsContainer.appendChild(newTab);

    // switch through tab states using the tabBar
    const tabBar = document.getElementById('tabBar');
    
})

// f(x) implementation

function f() {
    document.getElementById('f(x)').textContent = 'f(x) = ' + amp.value + "sin(" + freq.value + "x)";
}

// declare an oscillator so that the inactive state doesn't freak out
let oscillator;

// creates an audio context with an oscillator that outputs a specified sound wave and draws it out as a sine wave
function createWave() {

        // Create Web Audio API context
        const audioContext = new AudioContext();
        
        
        // (NODE) Create the oscillator
        oscillator = audioContext.createOscillator();
        
        // (NODE) Create the analyser
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        
        // Set the frequency for the oscillator
        oscillator.frequency.value = freq.value;

        
        // Set the amplitude for the oscillator
        // (NODE)
        const gainNode = audioContext.createGain(); 
        gainNode.gain.setValueAtTime(amp.value, audioContext.currentTime);
            
        // connect the (NODE)s
        oscillator.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioContext.destination);
        // oscillator (input) --> analyser --> gain --> destination (output)

        // start the oscillator, starting the chain
        oscillator.start();
        
        // the button must now display "stop"
        activeButton.textContent = activeButtonLabel;
        
        // And create the canvas
        const canvas = document.getElementById('oscilloscope');
        const canvasContext = canvas.getContext('2d');

        function draw() {
            requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);

            canvasContext.fillStyle = 'rgb(255, 255, 255)';
            canvasContext.fillRect(0, 0, canvas.width, canvas.height)

            canvasContext.lineWidth = 2;
            canvasContext.strokeStyle = "rgb(0 0 0)";

            canvasContext.beginPath();

            const sliceWidth = (canvas.width * 1.0) / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * canvas.height) / 2;

                if (i === 0) {
                    canvasContext.moveTo(x, y);
                } else {
                    canvasContext.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasContext.lineTo(canvas.width, canvas.height / 2);
            canvasContext.stroke();

        }
        
        draw();
    
}

function killWave() {

    oscillator.stop();
    activeButton.textContent = inactiveButtonLabel;

}

// function calling
f();
createWave();
killWave();