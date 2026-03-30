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
        // define index ?
        // call html extractor function
        // call f(x) function

    }

    // define f(x) function
    
    // define a function that extracts values from html (updates with every call)
    
    // define create wave function

    // define active button function?

    // define tab handle function

    // define activate wave function
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
