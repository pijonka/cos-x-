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

// returns a hashed string with tab data for the url
function serializeState() {
    return "#" + tabManager.tabs
        .map(t => `${t.freq},${t.amp},${t.phase}`)
        .join('&')
}

// updates tab state
function saveState() {
    history.replaceState(null, '', serializeState())
}

function loadStateFromUrl() {
    // extract behind the #
    const hash = window.location.hash.slice(1);
    // if the string is empty don't even bother
    if (!hash) return;

    // convert the format of the url to digestable data
    const tabDefs = hash.split('&').map(s => {
        const [freq, amp, phase] = s.split(',').map(Number);
        return { freq, amp, phase };
    });

    // create tabs from url state instead of the default blank one
    for (const def of tabDefs) {
        tabManager.addTab();
        const tab = tabManager.tabs[tabManager.tabs.length - 1];
        tab.freqInit.value = def.freq;
        tab.ampInit.value = def.amp;
        tab.phaseInit.value = def.phase;
        tab.f();
    }
}

// define the TabManager class
class TabManager {

    // constructor contains
    constructor() {
        // object that carries every tab
        this.tabs = [];
        // value that is used to controls which tab will be visible at any time
        this.activeTabId = null;
        // the html element to append the tabs object into
        this.tabsContainer = document.getElementById('tabs');
        // the html element to append the tab bars into
        this.tabBar = document.getElementById('tabBar');
        // tab counter
        this.counter = 0;
    }

    // creates new tab instances
    addTab() {
        // check if this is the first tab ever being made
        const firstTab = (this.activeTabId == null)
        // increment the counter of new tabs that have been generated
        this.counter++;
        // define the id that the tab instance will get
        this.newTabId = this.counter;
        // define a new instance of tab object
        this.newTab = new TabObj(this.newTabId)
        // append the html of the tab object
        this.tabsContainer.appendChild(this.newTab.htmlBody);
        // append the html of the tab handle
        this.tabBar.appendChild(this.newTab.tabHandle)
        // push the new instance into the array
        this.tabs.push(this.newTab);
        // set new tab to active tab
        this.setActiveTab(this.newTabId);

        // if this is the first tab
        if (firstTab === true) {
            // hide the tab close button
            this.tabs[0].tabCloseButton.style.display = 'none';
        } else if (this.tabs.length === 2) { // or, if there are now two tabs
            // give the lonely tab its close button back
            this.tabs[0].tabCloseButton.style.display = '';
        }
        // save this in the new url
        saveState()
    }

    // sets the passed tab as the active one by hiding the old active tab (if there was one) and displaying the new one
    setActiveTab(id) {
        // find the index of the currently active tab using id
        const currentActiveTabIndex = this.tabs.findIndex(element => element.id === this.activeTabId)
        // find the index of the to be active tab using id
        const toBeActiveTabIndex = this.tabs.findIndex(element => element.id === id)
        // if there was an old active tab
        if (currentActiveTabIndex != -1) {
            // hide the old active tab
            this.tabs[currentActiveTabIndex].htmlBody.style.display = 'none';
            // and remove the tab handle active tab class in css
            this.tabs[currentActiveTabIndex].tabHandle.querySelector('.tabOpenButton').classList.remove('activeTab');
        }
        // in either case, display the html body of the new active tab,
        this.tabs[toBeActiveTabIndex].htmlBody.style.display = 'block';
        // add the active tab class to the tab handle,
        this.tabs[toBeActiveTabIndex].tabHandle.querySelector('.tabOpenButton').classList.add('activeTab');
        // and set the new active tab
        this.activeTabId = id;
    }

    // remove an existing tab
    removeTab(id) {
        // find the index of the tab to be removed using id
        const toBeRemovedTabIndex = this.tabs.findIndex(element => element.id === id)
        const activeTabIndex = this.tabs.findIndex(element => element.id === this.activeTabId)
        // if it's the active tab being deleted
        if (toBeRemovedTabIndex === activeTabIndex) {
            // if there is a tab left to it
            if (toBeRemovedTabIndex != 0)
                // set the active tab to the tab left of it
                this.setActiveTab(this.tabs[activeTabIndex - 1].id)
            else // if there is no tab left to it
                // set the active tab to the tab right of it
                this.setActiveTab(this.tabs[activeTabIndex + 1].id);

        }

        // remove html elements
        this.tabs[toBeRemovedTabIndex].htmlBody.remove();
        this.tabs[toBeRemovedTabIndex].tabHandle.remove();

        // kill the wave
        this.tabs[toBeRemovedTabIndex].killWave();

        // delete the tab
        this.tabs.splice(toBeRemovedTabIndex, 1)

        // if there is now only one tab
        if (this.tabs.length === 1) {
            // hide the tab close button
            this.tabs[0].tabCloseButton.style.display = 'none';
        }
        // save this in the new url
        saveState()
    }
}

class TabObj {
    constructor(id) { // the method that runs everytime a new instance is initialized
        this.id = id;
        // define a name for every instance
        this.name = `Oscillator ${this.id}`
        // define main html element
        this.htmlBody = document.createElement('div')
        this.htmlBody.innerHTML = `
                <p class="f">f(x) = </p>
                <div class="control-container">
                    <label>Frequency (hz)/pitch: </label>
                    <input class="freq" type="number" value="440">

                    <label>Amplitude/volume: </label>
                    <input class="amp" type="number" value="0.1" step="0.1">

                    <label>Phase: </label>
                    <div class="input-wrapper">
                        <input class="phase" type="number" value="0">°
                    </div>

                </div>

                <button class="activeButton">Start</button>
        `;

        // define the tab handle html
        this.tabHandle = document.createElement('div');
        this.tabHandle.innerHTML = `
 <a class="tabOpenButton">${this.name}</a><button class="tabCloseButton">X</button>
        `;

        // grab references
        /// of the body
        this.freqInit = this.htmlBody.querySelector('.freq');
        this.ampInit = this.htmlBody.querySelector('.amp');
        this.phaseInit = this.htmlBody.querySelector('.phase');
        this.activeButton = this.htmlBody.querySelector('.activeButton');
        this.formulaDisplay = this.htmlBody.querySelector('.f');
        /// and the tab handle
        this.tabOpenButton = this.tabHandle.querySelector('.tabOpenButton');
        this.tabCloseButton = this.tabHandle.querySelector('.tabCloseButton');

        // define other object variables 
        this.activeButtonLabel = 'stop';
        this.inactiveButtonLabel = 'start';
        this.active = false;

        // set up listeners
        this.initListeners();


        // call f(x) function
        this.f()

        // create and kill the wave
        this.createWave(0);
        this.killWave();

    }

    // dynamically retrieve DOM input values to numbers
    get freq() { return Number(this.freqInit.value); }
    get amp() { return Number(this.ampInit.value); }
    get phase() { return Number(this.phaseInit.value); }

    initListeners() {
        // active button manages tab activeness
        this.activeButton.addEventListener('click', async () => {
            // wait until the audio context is ready to play
            if (audioContext.state === 'suspended')
                await audioContext.resume();
            this.active = !this.active;
            if (this.active) {
                this.createWaveAtStart()
            } else {
                this.killWave()
            }
        })

        this.freqInit.addEventListener('input', () => {
            this.f();
            // also update the frequency value of the running oscillator if it's running
            if (this.active) {
                this.oscillator.frequency.value = this.freq;
            }
            // and save changes in the new url
            saveState()
        });

        this.ampInit.addEventListener('input', () => {
            this.f();
            // also update the amp value of the running oscillator if it's running
            if (this.active) {
                this.gainNode.gain.setValueAtTime(this.amp, audioContext.currentTime);
            }
            // and save changes in the new url
            saveState()
        });

        this.phaseInit.addEventListener('input', () => {
            // if the wave is active
            if (this.active) {
                // note that the oscillator cannot change phase while active
                // TODO make this visible in the html
                console.log("Changes will not go into effect until the oscillator stops and resumes once");
            }
            this.f();
            // and save changes in the new url
            saveState()
        });

        this.tabOpenButton.addEventListener('click', () => {
            // set tab manager's active tab to this one
            tabManager.setActiveTab(this.id);
        })

        this.tabCloseButton.addEventListener('click', () => {
            // remove this tab using the tab manager
            tabManager.removeTab(this.id);
        })


    }

    // update formula function
    f(x) {
        const latex = `f(x) = ${this.amp} \\sin(2\\pi \\cdot ${this.freq}(x - ${this.phase}^\\circ))`;
        this.formulaDisplay.innerHTML = `\\(${latex}\\)`

        // latex equation
        if (window.MathJax) {
            MathJax.typesetPromise([this.formulaDisplay]).catch((err) => console.log(err.message));
        }
    }

    // create wave at passed parameter
    createWave(when) {

        // resets oscillator associated with this instance
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
        }
        // resets gain node associated with this instance
        if (this.gainNode) {
            this.gainNode.disconnect();
        }

        // (NODE) Create the oscillator
        this.oscillator = audioContext.createOscillator();

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Set the frequency for the oscillator
        this.oscillator.frequency.value = this.freq;

        // Set the amplitude for the oscillator
        // (NODE)
        this.gainNode = audioContext.createGain();
        this.gainNode.gain.setValueAtTime(this.amp, audioContext.currentTime);

        // set the phase for the oscillator
        // tabObj.oscillator.phase.value = tabObj.phase.value;

        // connect the (NODE)s
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(analyser);
        this.gainNode.connect(audioContext.destination);
        // oscillator (input) --> gain --> analyser --> destination (output)
        this.oscillator.start(when);

        // the button must now display "stop"
        this.activeButton.textContent = this.activeButtonLabel;

        // And create the canvas
        const canvas = document.getElementById('oscilloscope');
        const canvasContext = canvas.getContext('2d');

        function draw() {
            // schedule the function at every frame
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

    // creates the wave at firstStartTime
    createWaveAtStart() {
        // checks whether there has already been a first oscillator that passed firstStartTime
        if (!firstStartTime)
            // if so, define the first start time as an anchor point for future new waves
            firstStartTime = audioContext.currentTime

        // conversion from phase in degrees to phase in seconds (take how much it fits INTO 360 degrees)
        this.phaseCycles = (this.phase / 360);

        // distance between the starting point and the current time
        this.elapsedTime = audioContext.currentTime - firstStartTime;

        // the amount of cycles that the oscillator has endured (neutralize the elapsed time by multiplying with frequency so that, when it is an integer, it will be a continuous value that tells you how many cycles have passed (integer if it is ON a period))
        this.elapsedCycles = this.freq * this.elapsedTime;

        // the position that the wave should be on given its phase
        this.pos = normalizeToRange(this.elapsedCycles - this.phaseCycles);

        // the amount of cycles to wait before starting the sound wave (will always be a fractional value)
        this.cyclesToWait = 1 - this.pos;

        // the amount of seconds to wait (divide by frequency so that it converts from cycles to seconds)
        this.waitSeconds = this.cyclesToWait / this.freq;

        // start at the current time plus the calculated seconds to wait
        this.startWhen = audioContext.currentTime + this.waitSeconds;

        // pass start time
        this.createWave(this.startWhen)
    }

    killWave() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
        }

        this.activeButton.textContent = this.inactiveButtonLabel;
    }

}

let tabManager = new TabManager();

// if the url contains state
if (window.location.hash) {
    // load the state
    loadStateFromUrl()
} else {
    // create at least one new tab
    tabManager.addTab();
}

// find the independent new tab button
const newTabButton = document.getElementById('newTabButton');

// if user wants new tab
newTabButton.addEventListener('click', () => {
    // add a new tab
    tabManager.addTab();
})
