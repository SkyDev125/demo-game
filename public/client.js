const socket = io();
let username = "";

function join() {
    username = document.getElementById('username').value;
    if (!username) return;
    socket.emit('join', username);
}

socket.on('joined', (name) => {
    document.getElementById('quiz').style.display = '';
    document.getElementById('username').style.display = 'none';
    // Hide the Join button as well
    document.querySelector('button[onclick="join()"]')?.style.setProperty('display', 'none');
});

socket.on('question', (q) => {
    document.getElementById('question').innerText = q.text;
    document.getElementById('result').innerText = '';
    document.getElementById('progress').innerText = `Question ${q.number} of ${q.total}`;
    // Render options
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    q.options.forEach(option => {
        const btn = document.createElement('button');
        btn.innerText = option;
        btn.onclick = () => submitAnswer(option, btn);
        btn.className = 'option-btn';
        optionsDiv.appendChild(btn);
    });
    // Disable answer input for MC
    document.getElementById('answer').style.display = 'none';
    document.getElementById('winner').innerText = '';
});

function submitAnswer(option, btn) {
    // Disable all option buttons after selection
    Array.from(document.getElementsByClassName('option-btn')).forEach(b => b.disabled = true);
    socket.emit('answer', option);
}

socket.on('answerResult', (correct) => {
    document.getElementById('result').innerText = correct ? "Correct!" : "Wrong!";
});

socket.on('showCorrect', (users) => {
    document.getElementById('result').innerText = `Correct users: ${users.join(', ')}`;
});

socket.on('quizFinished', () => {
    document.getElementById('question').innerText = 'Quiz finished!';
    document.getElementById('progress').innerText = '';
});

socket.on('winner', (winner) => {
    document.getElementById('winner').innerText = "Winner: " + winner;
});