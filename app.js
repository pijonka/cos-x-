
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

    
    // (NODE) Create the oscillator
    const oscillator = audioContext.createOscillator();
    
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
    gainNode.gain.setValueAtTime(1, audioContext.currentTime);
    
    // connect the (NODE)s and start the oscillator, creating sound
    oscillator.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    
    // And create the canvas
    const canvas = document.getElementById('oscilloscope');
    const canvasContext = canvas.getContext('2d');

    function draw() {
        requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        canvasContext.fillStyle = 'rgb(200 200 200)';
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
    

});
