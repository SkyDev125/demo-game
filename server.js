// server.js
// Express + Socket.IO quiz demo server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// In-memory state
let users = {};
let correctUsers = [];
let questionActive = false;
let currentQuestion = null;
let questions = [
    { text: 'What is 2 + 2?', options: ['3', '4', '5', '6'], answer: '4' },
    { text: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Rome'], answer: 'Paris' },
    { text: 'What color is the sky on a clear day?', options: ['Red', 'Blue', 'Green', 'Yellow'], answer: 'Blue' }
];
let questionIndex = 0;
let hostSocketId = null;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    socket.on('host-join', () => {
        hostSocketId = socket.id;
        socket.emit('host-ack');
        // Send current users to host
        io.to(hostSocketId).emit('userList', Object.values(users).map(u => u.username));
    });

    socket.on('join', (username) => {
        users[socket.id] = { username, correct: false };
        socket.emit('joined', username);
        // Notify host of new user
        if (hostSocketId) io.to(hostSocketId).emit('userList', Object.values(users).map(u => u.username));
    });

    socket.on('startQuestion', () => {
        if (socket.id !== hostSocketId) return;
        if (questionIndex >= questions.length) return;
        questionActive = true;
        correctUsers = [];
        currentQuestion = questions[questionIndex];
        // Reset all users' answer state
        Object.keys(users).forEach(id => users[id].answered = false);
        io.emit('question', { text: currentQuestion.text, options: currentQuestion.options, number: questionIndex + 1, total: questions.length });
    });

    socket.on('answer', (answer) => {
        if (!questionActive || !currentQuestion) return;
        if (!users[socket.id] || users[socket.id].answered) return; // Prevent multiple answers
        users[socket.id].answered = true;
        if (answer === currentQuestion.answer) {
            users[socket.id].correct = true;
            if (!correctUsers.includes(users[socket.id].username)) {
                correctUsers.push(users[socket.id].username);
            }
            socket.emit('answerResult', true);
        } else {
            users[socket.id].correct = false;
            socket.emit('answerResult', false);
        }
    });

    socket.on('endQuestion', () => {
        if (socket.id !== hostSocketId) return;
        questionActive = false;
        // Mark users who didn't answer as wrong
        Object.keys(users).forEach(id => {
            if (!users[id].answered) users[id].correct = false;
        });
        io.emit('showCorrect', correctUsers);
    });

    socket.on('nextQuestion', () => {
        if (socket.id !== hostSocketId) return;
        questionIndex++;
        if (questionIndex < questions.length) {
            questionActive = true;
            correctUsers = [];
            currentQuestion = questions[questionIndex];
            // Reset all users' answer state
            Object.keys(users).forEach(id => users[id].answered = false);
            io.emit('question', { text: currentQuestion.text, options: currentQuestion.options, number: questionIndex + 1, total: questions.length });
        } else {
            io.emit('quizFinished');
        }
    });

    socket.on('pickWinner', () => {
        if (socket.id !== hostSocketId) return;
        if (correctUsers.length > 0) {
            const winner = correctUsers[Math.floor(Math.random() * correctUsers.length)];
            io.emit('winner', winner);
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        if (socket.id === hostSocketId) hostSocketId = null;
        // Notify host of user leaving
        if (hostSocketId) io.to(hostSocketId).emit('userList', Object.values(users).map(u => u.username));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
