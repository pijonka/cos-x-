
// Declare user variables with standard values
let freq = (document.getElementById('freq')).value;



// when the user clicks the start button
let startButton = (document.getElementById('startButton'));
startButton.addEventListener('click', () => {
    // Create Web Audio API context
    const audioContext = new AudioContext();

    // Create the oscillator
    const oscillator = audioContext.createOscillator();

    // Set the frequency on the oscillator
    oscillator.frequency.value = freq;

    oscillator.connect(audioContext.destination);
    oscillator.start();


});