// Create Web Audio API context
const audioContext = new AudioContext();

// saves when the first oscillator ever in the program starts
let firstStartTime = null;

// (NODE) Create the global analyser
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;

// all the tabs
const tabsContainer = document.getElementById('tabs');

// array which carries the data for all the tabs 
const tabArray = [];

// creates one instance of a tab
function makeTabObj() {

    // create a new tab element with html
    const newTab = document.createElement('div');
    newTab.innerHTML = `
                <p id="f">f(x) = </p>
                <div>
                    <label for="freq">Frequency (hz)/pitch: </label>
                    <input id="freq" type="text" value="440"></input>
                </div>

                <div>
                    <label for="amp">Amplitude/volume: </label>
                    <input id="amp" type="text" value="1">
                </div>

                <div>
                    <label for="phase">Phase</label>
                    <input id="phase" type="text" value="0">°</input>
                </div>

                <button id="activeButton">Start</button>
    `;

    // retrieve html input
    let freqInput = newTab.querySelector('#freq');
    freqInput.addEventListener('input', () => {freqInput = newTab.querySelector('#freq');});
    let ampInput = newTab.querySelector('#amp');
    ampInput.addEventListener('input', () => {ampInput = newTab.querySelector('#amp');});
    let phaseInput = newTab.querySelector('#phase');
    phaseInput.addEventListener('input', () => {phaseInput = newTab.querySelector('#phase');});

    // the tab object which will be replicated for each instance
    let tabObj = {
        freq: freqInput,
        amp: ampInput,
        phase: phaseInput,
        active: false,
        activeButton: newTab.querySelector('#activeButton'),
        htmlElement: newTab,
        oscillator: null,
        gainNode: null,
        activeButtonLabel: 'stop',
        inactiveButtonLabel: 'start'
        
    }
    
    // f(x) implementation
    // (having this be a function, especially with a parameter, is absolutely redunant, but looks cool)
    function f(x) {
        let formula = newTab.querySelector('#f');
        function updateFormula() {
            formula.textContent = 'f(x) = ' + tabObj.amp.value + 'sin(2π * ' + tabObj.freq.value + '(x - ' + tabObj.phase.value + '°))'
        }
        // build formula once to initialize
        updateFormula();

        // then build again consequence of input
        freqInput.addEventListener('input', () => {
            updateFormula()
        })
        ampInput.addEventListener('input', () => {
            updateFormula();
        });
        phaseInput.addEventListener('input', () => {
            updateFormula();
        });

        return x;
    }
    f(0);

    // creates an oscillator that outputs a specified sound wave and draws it out as a sine wave
    function createWave() {

        // resets oscillator associated with this instance
        if(tabObj.oscillator) {
            tabObj.oscillator.stop();
            tabObj.oscillator.disconnect();
        }
        // resets gain node associated with this instance
        if (tabObj.gainNode) {
            tabObj.gainNode.disconnect();
        }
        
        // (NODE) Create the oscillator
        tabObj.oscillator = audioContext.createOscillator();
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Set the frequency for the oscillator
        tabObj.oscillator.frequency.value = tabObj.freq.value;

        // Set the amplitude for the oscillator
        // (NODE)
        tabObj.gainNode = audioContext.createGain(); 
        tabObj.gainNode.gain.setValueAtTime(tabObj.amp.value, audioContext.currentTime);
        
        // set the phase for the oscillator
        // tabObj.oscillator.phase.value = tabObj.phase.value;

        // connect the (NODE)s
        tabObj.oscillator.connect(analyser);
        analyser.connect(tabObj.gainNode);
        tabObj.gainNode.connect(audioContext.destination);
        // oscillator (input) --> analyser --> gain --> destination (output)
        tabObj.oscillator.start();
        
        // the button must now display "stop"
        tabObj.activeButton.textContent = tabObj.activeButtonLabel;
        
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
        if (tabObj.oscillator){
            tabObj.oscillator.stop();
            tabObj.oscillator.disconnect();
        }
        if(tabObj.gainNode) {
            tabObj.gainNode.disconnect();
        }

        tabObj.activeButton.textContent = tabObj.inactiveButtonLabel;

    }

    // function calling
    createWave();
    killWave();


    function activateWave() {
            if(tabObj.active) {
            // checks whether there has already been a first oscillator that passed firstStartTime
            if (firstStartTime === null)
                firstStartTime = audioContext.currentTime
            
            // IMPLEMENT CODE HeRE
            if (Number.isInteger(audioContext.currentTime * tabObj.freq))
                createWave();
            else 
                requestAnimationFrame(activateWave)
        } else {
            killWave();
        }
    }

    // activity condition
    tabObj.activeButton.addEventListener('click', () => {
        tabObj.active = !tabObj.active;
        activateWave();
    });

    
    return tabObj;
}

function makeNewTab() {
    const newTab = makeTabObj();
    tabArray.push(newTab);
    tabsContainer.appendChild(newTab.htmlElement);
}
makeNewTab();

// get the new tab button
const newTabButton = document.getElementById('newTabButton');

// if user wants new tab
newTabButton.addEventListener('click', () => {
    // give them a new tab
    makeNewTab();
    
    // switch through tab states using the tabBar
    const tabBar = document.getElementById('tabBar');
    
})