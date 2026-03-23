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

// Sample word database
const wordBank = [
  // 🐾 Animals
  { word: "Tiger", clue: "Animal" },
  { word: "Elephant", clue: "Animal" },
  { word: "Dog", clue: "Animal" },
  { word: "Cat", clue: "Animal" },
  { word: "Lion", clue: "Animal" },
  { word: "Horse", clue: "Animal" },
  { word: "Monkey", clue: "Animal" },
  { word: "Snake", clue: "Animal" },
  { word: "Frog", clue: "Animal" },
  { word: "Dolphin", clue: "Animal" },

  // 🍔 Food
  { word: "Pizza", clue: "Food" },
  { word: "Burger", clue: "Food" },
  { word: "Pasta", clue: "Food" },
  { word: "Rice", clue: "Food" },
  { word: "Momo", clue: "Food" },
  { word: "Noodles", clue: "Food" },
  { word: "Ice Cream", clue: "Food" },
  { word: "Chocolate", clue: "Food" },
  { word: "Cake", clue: "Food" },
  { word: "Apple", clue: "Food" },

  // 🚗 Vehicles
  { word: "Car", clue: "Vehicle" },
  { word: "Bus", clue: "Vehicle" },
  { word: "Airplane", clue: "Vehicle" },
  { word: "Bicycle", clue: "Vehicle" },
  { word: "Motorbike", clue: "Vehicle" },
  { word: "Train", clue: "Vehicle" },
  { word: "Helicopter", clue: "Vehicle" },
  { word: "Boat", clue: "Vehicle" },
  { word: "Truck", clue: "Vehicle" },
  { word: "Scooter", clue: "Vehicle" },

  // 🎵 Instruments
  { word: "Guitar", clue: "Instrument" },
  { word: "Piano", clue: "Instrument" },
  { word: "Drum", clue: "Instrument" },
  { word: "Flute", clue: "Instrument" },
  { word: "Violin", clue: "Instrument" },
  { word: "Trumpet", clue: "Instrument" },
  { word: "Harmonium", clue: "Instrument" },

  // 🏠 Household Items
  { word: "Chair", clue: "Furniture" },
  { word: "Table", clue: "Furniture" },
  { word: "Bed", clue: "Furniture" },
  { word: "Fan", clue: "Appliance" },
  { word: "Television", clue: "Appliance" },
  { word: "Refrigerator", clue: "Appliance" },
  { word: "Mirror", clue: "Object" },
  { word: "Door", clue: "Object" },

  // 📱 Technology
  { word: "Phone", clue: "Technology" },
  { word: "Laptop", clue: "Technology" },
  { word: "Keyboard", clue: "Technology" },
  { word: "Mouse", clue: "Technology" },
  { word: "Camera", clue: "Technology" },
  { word: "Internet", clue: "Technology" },

  // 🌍 Places
  { word: "School", clue: "Place" },
  { word: "Hospital", clue: "Place" },
  { word: "Temple", clue: "Place" },
  { word: "Park", clue: "Place" },
  { word: "Airport", clue: "Place" },
  { word: "Market", clue: "Place" },

  // ⚽ Sports
  { word: "Football", clue: "Sport" },
  { word: "Cricket", clue: "Sport" },
  { word: "Basketball", clue: "Sport" },
  { word: "Tennis", clue: "Sport" },
  { word: "Badminton", clue: "Sport" },

  // 🎬 Misc Fun
  { word: "Ghost", clue: "Spooky" },
  { word: "Robot", clue: "Sci-fi" },
  { word: "Superhero", clue: "Character" },
  { word: "Alien", clue: "Sci-fi" },
  { word: "Magic", clue: "Fantasy" },
  { word: "Treasure", clue: "Adventure" }
];

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Create / Join Room
  socket.on('joinRoom', ({ name, roomCode }) => {
    let code = roomCode || generateRoomCode();
    
    if (!rooms[code]) {
      rooms[code] = {
        host: socket.id,
        players: [],
        status: 'lobby', // lobby, playing, voting, results
        hints: [],
        votes: {},
        turnIndex: 0,
        wordData: null
      };
    }

    const room = rooms[code];
    room.players.push({ id: socket.id, name, role: null, hasVoted: false });
    
    socket.join(code);
    socket.emit('roomJoined', { code, id: socket.id });
    io.to(code).emit('updatePlayers', room.players);
  });

  // 2. Start Game
  socket.on('startGame', (roomCode) => {
    const room = rooms[roomCode];
    if (!room || room.players.length < 2) return; // Need at least 2 players

    // Pick random word and imposter
    room.wordData = wordBank[Math.floor(Math.random() * wordBank.length)];
    const imposterIndex = Math.floor(Math.random() * room.players.length);
    
    room.players.forEach((p, index) => {
      p.role = (index === imposterIndex) ? 'imposter' : 'normal';
    });

    room.status = 'playing';
    room.hints = [];
    room.turnIndex = 0;
    room.votes = {};

    // Send private data to each player
    room.players.forEach(p => {
      io.to(p.id).emit('gameStarted', {
        role: p.role,
        secretWord: p.role === 'imposter' ? null : room.wordData.word,
        clue: p.role === 'imposter' ? room.wordData.clue : null
      });
    });

    io.to(roomCode).emit('gameStateUpdate', room);
  });

  // 3. Submit Hint
  socket.on('submitHint', ({ roomCode, hint }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const currentPlayer = room.players[room.turnIndex];
    if (currentPlayer.id !== socket.id) return; // Not their turn

    room.hints.push({ name: currentPlayer.name, hint });
    room.turnIndex++;

    // Check if everyone has given a hint
    if (room.turnIndex >= room.players.length) {
      room.status = 'voting';
    }

    io.to(roomCode).emit('gameStateUpdate', room);
  });

  // 4. Submit Vote
  socket.on('submitVote', ({ roomCode, votedId }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.votes[socket.id] = votedId;
    const player = room.players.find(p => p.id === socket.id);
    if(player) player.hasVoted = true;

    // Check if everyone has voted
    if (Object.keys(room.votes).length === room.players.length) {
      room.status = 'results';
      
      // Calculate votes
      const voteCounts = {};
      Object.values(room.votes).forEach(id => {
        voteCounts[id] = (voteCounts[id] || 0) + 1;
      });

      // Find player with most votes
      const votedOutId = Object.keys(voteCounts).reduce((a, b) => voteCounts[a] > voteCounts[b] ? a : b);
      const votedOutPlayer = room.players.find(p => p.id === votedOutId);
      
      const imposterWon = votedOutPlayer.role !== 'imposter';

      io.to(roomCode).emit('gameEnded', {
        votedOut: votedOutPlayer.name,
        imposterWon,
        imposter: room.players.find(p => p.role === 'imposter').name,
        word: room.wordData.word
      });
    }

    io.to(roomCode).emit('gameStateUpdate', room);
  });

  socket.on('disconnect', () => {
    // Handle disconnect cleanup here (omitted for brevity)
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));