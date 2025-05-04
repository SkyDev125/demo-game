// Simple quiz host controller
const socket = io();

// Identify as host on load
socket.emit('host-join');

function startQuestion() {
    socket.emit('startQuestion');
    updateButtonStates('start');
}

function endQuestion() {
    socket.emit('endQuestion');
    socket.emit('pickWinner');
    updateButtonStates('end');
}

function nextQuestion() {
    socket.emit('nextQuestion');
    updateButtonStates('next');
    document.getElementById('winner').innerText = '';
}

// Separate UI reset from event emission
function resetHostUI() {
    updateButtonStates('restart');
    document.getElementById('quizProgress').innerText = '';
    document.getElementById('winner').innerText = '';
    document.getElementById('correctUsers').innerHTML = '';
}

function restartQuiz() {
    // Only emit the event, don't update UI here
    socket.emit('restartQuiz');
}

// Update button states based on current action
function updateButtonStates(action) {
    const startBtn = document.querySelector('button[onclick="startQuestion()"]');
    const endBtn = document.querySelector('button[onclick="endQuestion()"]');
    const nextBtn = document.querySelector('button[onclick="nextQuestion()"]');

    switch (action) {
        case 'start':
            startBtn.disabled = true;
            endBtn.disabled = false;
            nextBtn.disabled = true;
            break;
        case 'end':
            startBtn.disabled = true;
            endBtn.disabled = true;
            nextBtn.disabled = false;
            break;
        case 'next':
            startBtn.disabled = true;
            endBtn.disabled = false;
            nextBtn.disabled = true;
            break;
        case 'restart':
            startBtn.disabled = false;
            endBtn.disabled = true;
            nextBtn.disabled = true;
            break;
        case 'finish':
            startBtn.disabled = true;
            endBtn.disabled = true;
            nextBtn.disabled = true;
            break;
    }
}

// Handle server events
socket.on('question', (q) => {
    document.getElementById('quizProgress').innerText = `Question ${q.number} of ${q.total}`;
    document.getElementById('correctUsers').innerHTML = '';
    document.getElementById('winner').innerText = '';
});

socket.on('showCorrect', users => {
    document.getElementById('correctUsers').innerHTML = users.map(u => `<li>${u}</li>`).join('');
});

socket.on('winner', winner => {
    document.getElementById('winner').innerText = "Winner: " + winner;
});

socket.on('quizFinished', (winnersHistory) => {
    let summary = '<h3>Winners Summary</h3><ul>';
    winnersHistory.forEach((winner, idx) => {
        summary += `<li>Question ${idx + 1}: ${winner || 'No winner'}</li>`;
    });
    summary += '</ul>';
    document.getElementById('quizProgress').innerHTML = summary;
    document.getElementById('winner').innerText = '';
    updateButtonStates('finish');
});

socket.on('userList', users => {
    document.getElementById('connectedUsers').innerHTML = users.map(u => `<li>${u}</li>`).join('');
});

socket.on('hostError', msg => {
    alert(msg);
});

socket.on('quizRestarted', () => {
    // Only update the UI, don't emit another event
    resetHostUI();
});

// Create the restart button on page load
window.onload = () => {
    updateButtonStates('restart');
    if (!document.getElementById('restartBtn')) {
        const restartBtn = document.createElement('button');
        restartBtn.id = 'restartBtn';
        restartBtn.innerText = 'Restart';
        restartBtn.onclick = restartQuiz;
        document.body.appendChild(restartBtn);
    }
};