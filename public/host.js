// Simple quiz host controller
const socket = io();

// Identify as host on load
socket.emit('host-join');

function startQuestion() {
    socket.emit('startQuestion');
    // Do not update button states here; wait for server confirmation
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
    document.getElementById('correctCount').innerText = '';
    // Hide correct users list
    document.querySelector('.user-list-card h3').style.visibility = 'hidden';
    document.getElementById('correctUsers').style.display = 'none';
    // Always show the restart button
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.style.display = '';
        restartBtn.disabled = false;
    }
    // Hide and clear winners summary and its title
    const summaryTitle = document.getElementById('summaryTitle');
    const winnersSummary = document.getElementById('winnersSummary');
    if (summaryTitle) summaryTitle.style.display = 'none';
    if (winnersSummary) {
        winnersSummary.style.display = 'none';
        winnersSummary.innerHTML = '';
    }
    // Show correct users section on reset
    document.querySelectorAll('.user-list-card')[0].style.display = '';
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
    document.getElementById('correctCount').innerText = '';
    document.getElementById('winner').innerText = '';
    // Hide correct users list at the start of a question
    document.querySelector('.user-list-card h3').style.visibility = 'hidden';
    document.getElementById('correctUsers').style.display = 'none';
});

socket.on('showCorrect', users => {
    const correctList = users || [];
    document.getElementById('correctUsers').innerHTML = renderUserList(correctList, correctList);
    document.getElementById('correctCount').innerText = `(${correctList.length})`;
    // Show correct users list after end question
    document.querySelector('.user-list-card h3').style.visibility = 'visible';
    document.getElementById('correctUsers').style.display = '';
});

socket.on('winner', winner => {
    document.getElementById('winner').innerText = 'Winner: ' + (winner ? winner : 'No winner');
});

socket.on('quizFinished', ({ winnersHistory, questions }) => {
    // Hide correct users section when showing winners summary
    document.querySelectorAll('.user-list-card')[0].style.display = 'none';
    const summaryTitle = document.getElementById('summaryTitle');
    const winnersSummary = document.getElementById('winnersSummary');
    if (summaryTitle) summaryTitle.style.display = 'block';
    if (winnersSummary) {
        winnersSummary.style.display = 'block';
        winnersSummary.innerHTML = renderWinnersSummary(winnersHistory, questions);
    }
    document.getElementById('winner').innerText = '';
    updateButtonStates('finish');
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.style.display = '';
        restartBtn.disabled = false;
    }
});

socket.on('userList', users => {
    const userList = users || [];
    document.getElementById('connectedUsers').innerHTML = renderUserList(userList);
    document.getElementById('connectedCount').innerText = `(${userList.length})`;
});

socket.on('hostError', msg => {
    alert(msg);
});

socket.on('quizRestarted', () => {
    // Only update the UI, don't emit another event
    resetHostUI();
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.style.display = '';
        restartBtn.disabled = false;
    }
    // Hide and clear winners summary and its title on restart
    const summaryTitle = document.getElementById('summaryTitle');
    const winnersSummary = document.getElementById('winnersSummary');
    if (summaryTitle) summaryTitle.style.display = 'none';
    if (winnersSummary) {
        winnersSummary.style.display = 'none';
        winnersSummary.innerHTML = '';
    }
    // Show correct users section again
    document.querySelectorAll('.user-list-card')[0].style.display = '';
});

socket.on('questionStarted', () => {
    updateButtonStates('start');
});

// Create the restart button on page load
window.onload = () => {
    updateButtonStates('restart');
    let restartBtn = document.getElementById('restartBtn');
    if (!restartBtn) {
        restartBtn = document.createElement('button');
        restartBtn.id = 'restartBtn';
        restartBtn.innerText = 'Restart';
        restartBtn.onclick = restartQuiz;
        document.body.appendChild(restartBtn);
    } else {
        restartBtn.onclick = restartQuiz;
        restartBtn.style.display = '';
    }
    // Hide correct users list on load
    document.querySelector('.user-list-card h3').style.visibility = 'hidden';
    document.getElementById('correctUsers').style.display = 'none';
    // Hide and clear winners summary and its title on load
    const summaryTitle = document.getElementById('summaryTitle');
    const winnersSummary = document.getElementById('winnersSummary');
    if (summaryTitle) summaryTitle.style.display = 'none';
    if (winnersSummary) {
        winnersSummary.style.display = 'none';
        winnersSummary.innerHTML = '';
    }
    // Show correct users section on load
    document.querySelectorAll('.user-list-card')[0].style.display = '';
};

function renderWinnersSummary(winnersHistory, questions) {
    if (!Array.isArray(winnersHistory) || !Array.isArray(questions)) return '';
    let html = '<table class="winner-table">';
    html += '<tr><th>#</th><th>Question</th><th>Winner</th></tr>';
    for (let i = 0; i < questions.length; i++) {
        html += `<tr><td>${i + 1}</td><td>${questions[i].text}</td><td>`;
        if (winnersHistory[i]) {
            html += `<span class="winner-badge">${winnersHistory[i]}</span>`;
        } else {
            html += '<span class="no-winner">No winner</span>';
        }
        html += '</td></tr>';
    }
    html += '</table>';
    return html;
}

function renderUserList(users, highlightList = []) {
    if (!Array.isArray(users)) return '';
    return users.map(u => {
        const initials = u[0] ? u[0].toUpperCase() : '?';
        const isCorrect = highlightList.includes(u);
        return `<li><span class="user-avatar">${initials}</span>${u}${isCorrect ? '<span class="user-badge">✔</span>' : ''}</li>`;
    }).join('');
}