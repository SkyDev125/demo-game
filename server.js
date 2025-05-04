// server.js - Simplified quiz app server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Core state
let users = {};
let correctUsers = [];
let questionActive = false;
let currentQuestion = null;
let questions = [];
try {
    const questionsData = fs.readFileSync(path.join(__dirname, 'public', 'questions.json'), 'utf8');
    questions = JSON.parse(questionsData);
} catch (e) {
    console.error('Failed to load questions.json:', e);
    questions = [];
}
let questionIndex = 0;
let hostSocketId = null;
let winnersHistory = [];

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    let hasJoined = false;
    // Host identification
    socket.on('host-join', () => {
        hostSocketId = socket.id;
        socket.emit('host-ack');
        if (Object.keys(users).length > 0) {
            socket.emit('userList', Object.values(users).map(u => u.username));
        }
    });

    // User joins quiz
    socket.on('join', (username) => {
        if (Object.entries(users).some(([id, u]) => u.username === username && id !== socket.id)) {
            socket.emit('joinError', 'Username already taken.');
            return;
        }
        users[socket.id] = { username, correct: false };
        hasJoined = true;
        socket.emit('joined', username);
        if (hostSocketId) {
            io.to(hostSocketId).emit('userList', Object.values(users).map(u => u.username));
        }
    });

    // Only send updates to users who have joined
    function emitToJoined(event, data) {
        for (const [id, user] of Object.entries(users)) {
            io.to(id).emit(event, data);
        }
    }

    // Only send updates to users who have joined, AND to the host if needed
    function emitToJoinedAndHost(event, data) {
        for (const [id, user] of Object.entries(users)) {
            io.to(id).emit(event, data);
        }
        if (hostSocketId) {
            io.to(hostSocketId).emit(event, data);
        }
    }

    // Host starts a question
    socket.on('startQuestion', () => {
        if (socket.id !== hostSocketId) return;
        if (Object.keys(users).length < 1) {
            socket.emit('hostError', 'At least one user must be connected to start questions.');
            return;
        }
        if (questionIndex >= questions.length) return;

        questionActive = true;
        correctUsers = [];
        currentQuestion = questions[questionIndex];
        Object.keys(users).forEach(id => users[id].answered = false);
        emitToJoinedAndHost('question', {
            text: currentQuestion.text,
            options: currentQuestion.options,
            number: questionIndex + 1,
            total: questions.length
        });
        if (hostSocketId) io.to(hostSocketId).emit('questionStarted');
    });

    // User submits answer
    socket.on('answer', (answer) => {
        if (!questionActive || !currentQuestion || !users[socket.id] || users[socket.id].answered) return;

        users[socket.id].answered = true;
        const correct = answer === currentQuestion.answer;
        users[socket.id].correct = correct;

        if (correct && !correctUsers.includes(users[socket.id].username)) {
            correctUsers.push(users[socket.id].username);
        }
        socket.emit('answerResult', correct);
    });

    // Host ends current question
    socket.on('endQuestion', () => {
        if (socket.id !== hostSocketId) return;
        questionActive = false;
        Object.keys(users).forEach(id => {
            if (!users[id].answered) users[id].correct = false;
        });
        emitToJoinedAndHost('showCorrect', correctUsers);
    });

    // Host moves to next question
    socket.on('nextQuestion', () => {
        if (socket.id !== hostSocketId) return;
        questionIndex++;

        if (questionIndex < questions.length) {
            questionActive = true;
            correctUsers = [];
            currentQuestion = questions[questionIndex];
            Object.keys(users).forEach(id => users[id].answered = false);
            emitToJoinedAndHost('question', {
                text: currentQuestion.text,
                options: currentQuestion.options,
                number: questionIndex + 1,
                total: questions.length
            });
        } else {
            emitToJoinedAndHost('quizFinished', { winnersHistory, questions });
        }
    });

    // Host picks a winner
    socket.on('pickWinner', () => {
        if (socket.id !== hostSocketId) return;
        let winner = null;
        if (correctUsers.length > 0) {
            winner = correctUsers[Math.floor(Math.random() * correctUsers.length)];
            winnersHistory[questionIndex] = winner;
        } else {
            winnersHistory[questionIndex] = null;
        }
        emitToJoinedAndHost('winner', winner);
    });

    // Host restarts the quiz
    socket.on('restartQuiz', () => {
        correctUsers = [];
        questionActive = false;
        currentQuestion = null;
        questionIndex = 0;
        winnersHistory = [];
        emitToJoinedAndHost('quizRestarted');
    });

    // Handle disconnections
    socket.on('disconnect', () => {
        delete users[socket.id];
        if (socket.id === hostSocketId) hostSocketId = null;
        if (hostSocketId) {
            io.to(hostSocketId).emit('userList', Object.values(users).map(u => u.username));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
