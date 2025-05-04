const socket = io();

// Identify as host
socket.emit('host-join');
socket.on('host-ack', () => {
    // Host acknowledged
});

function startQuestion() {
    socket.emit('startQuestion');
    document.querySelector('button[onclick="startQuestion()"]')?.setAttribute('disabled', 'disabled');
    // Enable End Question & Pick Winner, disable Next Question
    document.querySelector('button[onclick="endQuestion()"]')?.removeAttribute('disabled');
    document.querySelector('button[onclick="nextQuestion()"]')?.setAttribute('disabled', 'disabled');
}

function endQuestion() {
    socket.emit('endQuestion');
    socket.emit('pickWinner');
    // Disable End Question & Pick Winner, enable Next Question
    document.querySelector('button[onclick="endQuestion()"]')?.setAttribute('disabled', 'disabled');
    document.querySelector('button[onclick="nextQuestion()"]')?.removeAttribute('disabled');
}

function nextQuestion() {
    socket.emit('nextQuestion');
    // Enable End Question & Pick Winner, disable Next Question
    document.querySelector('button[onclick="endQuestion()"]')?.removeAttribute('disabled');
    document.querySelector('button[onclick="nextQuestion()"]')?.setAttribute('disabled', 'disabled');
    // Clear winner display
    document.getElementById('winner').innerText = '';
}

socket.on('question', (q) => {
    document.getElementById('quizProgress').innerText = `Question ${q.number} of ${q.total}`;
    document.getElementById('correctUsers').innerHTML = '';
    document.getElementById('winner').innerText = '';
});

socket.on('showCorrect', users => {
    document.getElementById('correctUsers').innerHTML = users.map(u => `<li>${u}</li>`).join('');
});

socket.on('quizFinished', () => {
    document.getElementById('quizProgress').innerText = 'Quiz finished!';
});

socket.on('winner', winner => {
    document.getElementById('winner').innerText = "Winner: " + winner;
});

socket.on('userList', users => {
    document.getElementById('connectedUsers').innerHTML = users.map(u => `<li>${u}</li>`).join('');
});

// On page load, only Start Questions is enabled
window.onload = () => {
    document.querySelector('button[onclick="startQuestion()"]')?.removeAttribute('disabled');
    document.querySelector('button[onclick="endQuestion()"]')?.setAttribute('disabled', 'disabled');
    document.querySelector('button[onclick="nextQuestion()"]')?.setAttribute('disabled', 'disabled');
};