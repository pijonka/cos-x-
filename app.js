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

class tabObj {
    constructor() { // the method that runs everytime a new instance is initialized
        // define main html element
        this.htmlBody = document.createElement('div')
        this.htmlBody.innerHTML = `
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
        // grab references
        this.freqInit = this.htmlBody.querySelector('.freq');
        this.ampInit = this.htmlBody.querySelector('.amp');
        this.phaseInit = this.htmlBody.querySelector('.phase');
        this.activeButton = this.htmlBody.querySelector('.activeButton');
        this.formulaDisplay = this.htmlBody.querySelector('.f');

        // set up listeners
        this.initListeners();


        // call f(x) function
        this.f()

    }

    get freq() { return Number(this.freqInit.value); }
    get amp() { return Number(this.ampInit.value); }
    get phase() { return Number(this.phaseInit.value); }

    initListeners() {
        this.activeButton.addEventListener('click', () => {
            this.active = !this.active;
            // wave function call
        })
    }

    // update formula function
    f(x) {
        const latex = `f(x) = ${this.amp} \\sin(2\\pi \\cdot ${this.freq}(x - ${this.phase}^\\circ))`;
        this.formulaDisplay.innerHTML = `\\(${latex}\\)`

        // latex equation
        if(window.MathJax) {
                MathJax.typesetPromise([this.formulaDisplay]).catch((err) => console.log(err.message));
        }
    }

    
    // define create wave function

    // define active button function?

    // define tab handle function

    // define activate wave function
}

function makeNewTab() {
    const newTab = new tabObj
    tabArray.push(newTab);
    tabsContainer.appendChild(newTab.htmlBody);
}
makeNewTab();
// isolateActiveTab();

// get the new tab button
const newTabButton = document.getElementById('newTabButton');

// if user wants new tab
newTabButton.addEventListener('click', () => {
    // give them a new tab
    makeNewTab();
    isolateActiveTab();

})
