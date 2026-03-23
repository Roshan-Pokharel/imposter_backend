const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// In-memory database
const rooms = {};

// 🌐 Multilingual word bank
const wordBank = [
  // 🐾 Animals
  { en: { word: "Tiger", clue: "Animal" }, np: { word: "बाघ", clue: "जनावर" } },
  { en: { word: "Elephant", clue: "Animal" }, np: { word: "हात्ती", clue: "जनावर" } },
  { en: { word: "Dog", clue: "Animal" }, np: { word: "कुकुर", clue: "जनावर" } },
  { en: { word: "Cat", clue: "Animal" }, np: { word: "बिरालो", clue: "जनावर" } },

  // 🍔 Food
  { en: { word: "Pizza", clue: "Food" }, np: { word: "पिज्जा", clue: "खाना" } },
  { en: { word: "Burger", clue: "Food" }, np: { word: "बर्गर", clue: "खाना" } },
  { en: { word: "Rice", clue: "Food" }, np: { word: "भात", clue: "खाना" } },
  { en: { word: "Momo", clue: "Food" }, np: { word: "मोमो", clue: "खाना" } },

  // 🚗 Vehicles
  { en: { word: "Car", clue: "Vehicle" }, np: { word: "कार", clue: "सवारी साधन" } },
  { en: { word: "Bus", clue: "Vehicle" }, np: { word: "बस", clue: "सवारी साधन" } },
  { en: { word: "Bicycle", clue: "Vehicle" }, np: { word: "साइकल", clue: "सवारी साधन" } },

  // 🎵 Instruments
  { en: { word: "Guitar", clue: "Instrument" }, np: { word: "गिटार", clue: "वाद्ययन्त्र" } },
  { en: { word: "Piano", clue: "Instrument" }, np: { word: "पियानो", clue: "वाद्ययन्त्र" } },

  // 🏠 Household
  { en: { word: "Chair", clue: "Furniture" }, np: { word: "कुर्सी", clue: "फर्निचर" } },
  { en: { word: "Table", clue: "Furniture" }, np: { word: "टेबल", clue: "फर्निचर" } },

  // 📱 Tech
  { en: { word: "Phone", clue: "Technology" }, np: { word: "फोन", clue: "प्रविधि" } },
  { en: { word: "Laptop", clue: "Technology" }, np: { word: "ल्यापटप", clue: "प्रविधि" } },

  // 🌍 Places
  { en: { word: "School", clue: "Place" }, np: { word: "विद्यालय", clue: "स्थान" } },
  { en: { word: "Hospital", clue: "Place" }, np: { word: "अस्पताल", clue: "स्थान" } },

  // ⚽ Sports
  { en: { word: "Football", clue: "Sport" }, np: { word: "फुटबल", clue: "खेल" } },
  { en: { word: "Cricket", clue: "Sport" }, np: { word: "क्रिकेट", clue: "खेल" } }
];

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // JOIN ROOM
  socket.on('joinRoom', ({ name, roomCode }) => {
    let code = roomCode || generateRoomCode();

    if (!rooms[code]) {
      rooms[code] = {
        host: socket.id,
        players: [],
        status: 'lobby',
        hints: [],
        votes: {},
        turnIndex: 0,
        wordData: null,
        lang: 'en' // ✅ default language
      };
    }

    const room = rooms[code];
    room.players.push({ id: socket.id, name, role: null, hasVoted: false });

    socket.join(code);
    socket.emit('roomJoined', { code, id: socket.id });
    io.to(code).emit('updatePlayers', room.players);
  });

  // 🌐 SET LANGUAGE
  socket.on('setLanguage', ({ roomCode, lang }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.lang = lang;
    console.log(`Room ${roomCode} language set to ${lang}`);
  });

  // START GAME
  socket.on('startGame', (roomCode) => {
    const room = rooms[roomCode];
    if (!room || room.players.length < 2) return;

    room.wordData = wordBank[Math.floor(Math.random() * wordBank.length)];
    const imposterIndex = Math.floor(Math.random() * room.players.length);

    room.players.forEach((p, index) => {
      p.role = index === imposterIndex ? 'imposter' : 'normal';
    });

    room.status = 'playing';
    room.hints = [];
    room.turnIndex = 0;
    room.votes = {};

    const langData = room.wordData[room.lang] || room.wordData.en;

    room.players.forEach(p => {
      io.to(p.id).emit('gameStarted', {
        role: p.role,
        secretWord: p.role === 'imposter' ? null : langData.word,
        clue: p.role === 'imposter' ? langData.clue : null
      });
    });

    io.to(roomCode).emit('gameStateUpdate', room);
  });

  // SUBMIT HINT
  socket.on('submitHint', ({ roomCode, hint }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const currentPlayer = room.players[room.turnIndex];
    if (currentPlayer.id !== socket.id) return;

    room.hints.push({ name: currentPlayer.name, hint });
    room.turnIndex++;

    if (room.turnIndex >= room.players.length) {
      room.status = 'voting';
    }

    io.to(roomCode).emit('gameStateUpdate', room);
  });

  // SUBMIT VOTE
  socket.on('submitVote', ({ roomCode, votedId }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.votes[socket.id] = votedId;
    const player = room.players.find(p => p.id === socket.id);
    if (player) player.hasVoted = true;

    if (Object.keys(room.votes).length === room.players.length) {
      room.status = 'results';

      const voteCounts = {};
      Object.values(room.votes).forEach(id => {
        voteCounts[id] = (voteCounts[id] || 0) + 1;
      });

      const votedOutId = Object.keys(voteCounts).reduce((a, b) =>
        voteCounts[a] > voteCounts[b] ? a : b
      );

      const votedOutPlayer = room.players.find(p => p.id === votedOutId);
      const imposter = room.players.find(p => p.role === 'imposter');

      const imposterWon = votedOutPlayer.role !== 'imposter';

      const word =
        room.wordData[room.lang]?.word || room.wordData.en.word;

      io.to(roomCode).emit('gameEnded', {
        votedOut: votedOutPlayer.name,
        imposterWon,
        imposter: imposter.name,
        word
      });
    }

    io.to(roomCode).emit('gameStateUpdate', room);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));