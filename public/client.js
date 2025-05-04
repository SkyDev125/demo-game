// Simple quiz client
const socket = io();
let username = "";

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
});

socket.on('joinError', (msg) => {
    alert(msg);
});

socket.on('question', (q) => {
    document.getElementById('question').innerText = q.text;
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
    document.getElementById('result').innerText = `Correct users: ${users.join(', ')}`;
});

socket.on('winner', (winner) => {
    document.getElementById('winner').innerText = "Winner: " + winner;
});

socket.on('quizFinished', ({ winnersHistory, questions }) => {
    function renderWinnersSummary(winnersHistory, questions) {
        if (!Array.isArray(winnersHistory) || !Array.isArray(questions)) return '';
        let html = '<h3>Winners Summary</h3><table class="winner-table">';
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
    clearUI();
    document.getElementById('winner').innerHTML = renderWinnersSummary(winnersHistory, questions);
});

socket.on('quizRestarted', () => {
    clearUI();
});