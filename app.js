// normalize any value to the range [0, 1)
function normalizeToRange(value) {
    const remainder = value % 1;
    return remainder >= 0 ? remainder : remainder + 1;
}

// create Web Audio API context
const audioContext = new AudioContext();

// saves when the first oscillator ever in the program starts
let firstStartTime = null;

// (NODE) create the global analyser
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;


// all the tabs
const tabsContainer = document.getElementById('tabs');

// array which carries the data for all the tabs 
const tabArray = [];

// switch through tab states using the tabBar
const tabBar = document.getElementById('tabBar');

// (one-based) tab that will be open
let activeTab = 1;

// function that makes the program display only the activeTab.
// must be initialized before tab instance function
function isolateActiveTab() {
    // for every element in tabArray
    for(i = 0; i < tabArray.length; i++) {
        if(i != (activeTab - 1)) { // if the element is not the active tab
            tabArray[i].htmlElement.style.display = 'none'; // do not display
            tabArray[i].tabHandle.querySelector('a').classList.remove('activeTab');
        }
        else { // else 
            tabArray[i].htmlElement.style.display = 'block'; // do
            tabArray[i].tabHandle.querySelector('a').classList.add('activeTab');
        }
    }
}

function defineTabHandle(obj) {
    // define a tab handle
    obj.tabHandle.innerHTML = `
        <a class="tabActiveButton">Oscillator ${obj.number}</a><button class="tabCloseButton">X</button>
    `;

    tabBar.appendChild(obj);
    
    activeTab = obj.number;
    
    obj.tabActiveButton = obj.tabHandle.querySelector('.tabActiveButton');
    obj.tabActiveButton.addEventListener('click', () => {
        activeTab = obj.number;
        isolateActiveTab();
        
    }, {signal: obj.controller.signal})

    obj.tabCloseButton = obj.tabHandle.querySelector('.tabCloseButton');
    obj.tabCloseButton.addEventListener('click', () => {
        // first stop the wave (obviously)
        killWave();
        // define the index of the object
        // destroy this object instance in the array
        tabArray.splice(tabArray.indexOf(obj), 1);
        // destroy the DOM elements
        obj.htmlElement.remove();
        obj.tabHandle.remove();
        // destroy the event listeners
        obj.controller.abort();

        // and for every element that is not this one in tabArray
        for (i = 0; i < tabArray.length; i++) {
            if(i != tabArray.indexOf(obj)) {
                objUpdate(i) // update values with new elements
            }
        }
        activeTab = 1;
        obj = {};

    })
}

// create a function that updates all values for tab closing (maybe should be more than tab closing?)
function objUpdate(index) {
    // remove the now outdated attributes
    tabArray[index].htmlElement.remove();
    tabArray[index].tabHandle.remove();
    tabArray[index].number = (tabArray.indexOf(tabArray[index]) + 1);

    defineTabHandle()

    // append the new elment
    tabsContainer.appendChild(tabArray[index].htmlElement)
    tabBar.appendChild(tabArray[index].tabHandle);
    
}

// creates one instance of a tab
function makeTabObj() {

    // create a new tab element with html
    const newTab = document.createElement('div');
    newTab.innerHTML = `
                <p class="f">f(x) = </p>
                <div class="control-container">
                    <label>Frequency (hz)/pitch: </label>
                    <input class="freq" type="number" value="440">

                    <label>Amplitude/volume: </label>
                    <input class="amp" type="number" value="1">

                    <label>Phase: </label>
                    <div class="input-wrapper">
                        <input class="phase" type="number" value="0">°
                    </div>

                </div>

                <button class="activeButton">Start</button>
    `;

    let tabObj;
    // create a controller ATTACHED TO THE OBJECT?
    tabObj.controller = new AbortController();

    // retrieve html input
    let freqInput = newTab.querySelector('.freq');
    freqInput.addEventListener('input', () => {freqInput = newTab.querySelector('.freq');}, {signal: tabObj.controller.signal});
    let ampInput = newTab.querySelector('.amp');
    ampInput.addEventListener('input', () => {ampInput = newTab.querySelector('.amp');}, {signal: tabObj.controller.signal} );
    let phaseInput = newTab.querySelector('.phase');
    phaseInput.addEventListener('input', () => {phaseInput = newTab.querySelector('.phase');}, {signal: tabObj.controller.signal});

    // the tab object which will be replicated for each instance
    tabObj = {
        freq: freqInput,
        amp: ampInput,
        phase: phaseInput,
        active: false,
        activeButton: newTab.querySelector('.activeButton'),
        htmlElement: newTab,
        oscillator: null,
        gainNode: null,
        activeButtonLabel: 'stop',
        inactiveButtonLabel: 'start',
        tabHandle: document.createElement('div'),
        number: (tabArray.length + 1) // tab array PLUS ONE
    }
    
    // f(x) implementation
    // (having this be a function, especially with a parameter, is absolutely redunant, but looks cool)
    function f(x) {
        let formula = newTab.querySelector('.f');
        function updateFormula() {
            const latex = `f(x) = ${tabObj.amp.value} \\sin(2\\pi \\cdot ${tabObj.freq.value}(x - ${tabObj.phase.value}^\\circ))`
            formula.innerHTML = `\\(${latex}\\)`;

            if(window.MathJax) {
                MathJax.typesetPromise([formula]).catch((err) => console.log(err.message));
            }
        }
        // build formula once to initialize
        updateFormula();

        // then build again consequence of input
        freqInput.addEventListener('input', () => {
            updateFormula()
        }, {signal: tabObj.controller.signal})
        ampInput.addEventListener('input', () => {
            updateFormula();
        }, {signal: tabObj.controller.signal});
        phaseInput.addEventListener('input', () => {
            updateFormula();
        }, {signal: tabObj.controller.signal});

        return x;
    }
    f(0);

    // creates an oscillator that outputs a specified sound wave and draws it out as a sine wave
    function createWave(when) {

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
        tabObj.oscillator.connect(tabObj.gainNode);
        tabObj.gainNode.connect(analyser);
        tabObj.gainNode.connect(audioContext.destination);
        // oscillator (input) --> gain --> analyser --> destination (output)
        tabObj.oscillator.start(when);
        
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




    // activity condition
    tabObj.activeButton.addEventListener('click', () => {
        tabObj.active = !tabObj.active;
        activateWave();
    }, {signal: tabObj.controller.signal});

    function activateWave() {
            if(tabObj.active) {
            // checks whether there has already been a first oscillator that passed firstStartTime
            if (firstStartTime === null) 
                firstStartTime = audioContext.currentTime

            // conversion from phase in degrees to phase in seconds (take how much it fits INTO 360 degrees)
            tabObj.phaseCycles = (tabObj.phase.value / 360);
            
            // distance between the starting point and the current time
            tabObj.elapsedTime = audioContext.currentTime - firstStartTime;

            // the amount of cycles that the oscillator has endured (neutralize the elapsed time by multiplying with frequency so that, when it is an integer, it will be a continuous value that tells you how many cycles have passed (integer if it is ON a period))
            tabObj.elapsedCycles = tabObj.freq.value * tabObj.elapsedTime;

            // the position that the wave should be on given its phase
            tabObj.pos = normalizeToRange(tabObj.elapsedCycles - tabObj.phaseCycles);

            // the amount of cycles to wait before starting the sound wave (will always be a fractional value)
            tabObj.cyclesToWait = 1 - tabObj.pos;

            // the amount of seconds to wait (divide by frequency so that it converts from cycles to seconds)
            tabObj.waitSeconds = tabObj.cyclesToWait / tabObj.freq.value;

            // start at the current time plus the calculated seconds to wait
            tabObj.startWhen = audioContext.currentTime + tabObj.waitSeconds;

            // pass start time
            createWave(tabObj.startWhen)
        } else {
            killWave();
        }
    }



    
    return tabObj;
}

function makeNewTab() {
    const newTab = makeTabObj();
    tabArray.push(newTab);
    tabsContainer.appendChild(newTab.htmlElement);
}
makeNewTab();
isolateActiveTab();

// get the new tab button
const newTabButton = document.getElementById('newTabButton');

// if user wants new tab
newTabButton.addEventListener('click', () => {
    // give them a new tab
    makeNewTab();
    isolateActiveTab();

})
