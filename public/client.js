// Simple quiz client
const socket = io();
let username = "";

function setMainTitle(text) {
    document.getElementById('mainTitle').innerText = text;
}

setMainTitle('Join the Quiz');

function join() {
    username = document.getElementById('username').value;
    if (!username) return;
    socket.emit('join', username);
}

function clearUI() {
    document.getElementById('question').innerText = '';
    document.getElementById('options').innerHTML = '';
    document.getElementById('result').innerText = '';
    document.getElementById('progress').innerText = '';
    document.getElementById('winner').innerText = '';
}

function submitAnswer(option, btn) {
    Array.from(document.getElementsByClassName('option-btn')).forEach(b => b.disabled = true);
    socket.emit('answer', option);
}

// Handle server events
socket.on('joined', (name) => {
    document.getElementById('quiz').style.display = '';
    document.getElementById('username').style.display = 'none';
    document.querySelector('button[onclick="join()"]').style.display = 'none';
    clearUI();
    setMainTitle('Waiting for host to start game...');
});

socket.on('joinError', (msg) => {
    alert(msg);
});

socket.on('question', (q) => {
    setMainTitle(q.text);
    // Remove question text from body, only show options and progress
    document.getElementById('question').innerText = '';
    document.getElementById('result').innerText = '';
    document.getElementById('progress').innerText = `Question ${q.number} of ${q.total}`;
    document.getElementById('winner').innerText = '';
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    q.options.forEach(option => {
        const btn = document.createElement('button');
        btn.innerText = option;
        btn.onclick = () => submitAnswer(option, btn);
        btn.className = 'option-btn';
        optionsDiv.appendChild(btn);
    });
});

socket.on('answerResult', (correct) => {
    document.getElementById('result').innerText = correct ? "Correct!" : "Wrong!";
});

socket.on('showCorrect', (users) => {
    // Disable all option buttons so users can't answer after question ends
    Array.from(document.getElementsByClassName('option-btn')).forEach(b => b.disabled = true);
});

socket.on('winner', (winner) => {
    document.getElementById('winner').innerText = 'Winner: ' + (winner ? winner : 'No winner');
});

socket.on('quizFinished', ({ winnersHistory, questions }) => {
    clearUI();
    // Render the winners summary table in the winnersSummary div (not in the mainTitle)
    function renderWinnersSummary(winnersHistory, questions) {
        if (!Array.isArray(winnersHistory) || !Array.isArray(questions)) return '';
        let html = '<table class="winner-table">';
        html += '<tr><th>#</th><th>Question</th><th>Winner</th></tr>';
        for (let i = 0; i < questions.length; i++) {
            html += `<tr><td>${i + 1}</td><td>${questions[i].text}</td><td>`;
            if (winnersHistory[i]) {
                html += `<span class=\"winner-badge\">${winnersHistory[i]}</span>`;
            } else {
                html += '<span class=\"no-winner\">No winner</span>';
            }
            html += '</td></tr>';
        }
        html += '</table>';
        return html;
    }
    setMainTitle('Winners Summary');
    document.getElementById('winnersSummary').innerHTML = renderWinnersSummary(winnersHistory, questions);
    document.getElementById('winner').innerHTML = '';
});

socket.on('quizRestarted', () => {
    clearUI();
    setMainTitle('Waiting for host to start game...');
    document.getElementById('winnersSummary').innerHTML = '';
});