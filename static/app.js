const recordButton = document.getElementById('recordButton');
const statusElement = document.getElementById('status');
let mediaRecorder;
let audioChunks = [];

recordButton.addEventListener('mousedown', startRecording);
recordButton.addEventListener('mouseup', stopRecording);
recordButton.addEventListener('touchstart', startRecording);
recordButton.addEventListener('touchend', stopRecording);

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
        mediaRecorder.onstop = sendAudio;
        audioChunks = [];
        mediaRecorder.start();
        statusElement.textContent = 'Recording...';
    } catch (error) {
        console.error('Error accessing microphone:', error);
        statusElement.textContent = 'Could not access microphone. Please grant permission.';
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        statusElement.textContent = 'Recording stopped. Sending...';
    }
}

async function sendAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            statusElement.textContent = 'Audio uploaded successfully!';
        } else {
            statusElement.textContent = 'Upload failed.';
        }
    } catch (error) {
        console.error('Error uploading audio:', error);
        statusElement.textContent = 'Error uploading audio.';
    }
}
