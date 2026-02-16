
// Declare user variables with standard values
let freq = document.getElementById('freq');
let amp = document.getElementById('amp');

// f(x) implementation

function f() {
    document.getElementById('f(x)').textContent = 'f(x) = ' + amp.value + "sin(" + freq.value + "x)";
}
f();

freq.addEventListener('input', f);
amp.addEventListener('input', f);

// when the user clicks the start button
let startButton = (document.getElementById('startButton'));
startButton.addEventListener('click', () => {
    // Create Web Audio API context
    const audioContext = new AudioContext();

    // Create the oscillator
    const oscillator = audioContext.createOscillator();

    // Set the frequency for the oscillator
    oscillator.frequency.value = freq.value;

    // Set the amplitude for the oscillator
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(1, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();


});
