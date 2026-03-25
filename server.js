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

const rooms = {};

// Updated wordBank to include multiple clues for multiple imposters
const wordBank = [
  { word: "Microwave", clues: ["Radiation", "Kitchen Appliance", "Heat"] },
  { word: "Vacuum", clues: ["Space", "Empty", "Suction"] },
  { word: "Shadow", clues: ["Darkness", "Silhouette", "Sunlight blocker"] },
  { word: "Clock", clues: ["Ticking", "Timekeeper", "Hands and Face"] },
  { word: "Battery", clues: ["Charge", "Power Source", "Voltage"] },
  { word: "Magnet", clues: ["Attraction", "Poles", "Metal Puller"] },
  { word: "Ice", clues: ["Melting", "Frozen", "Cold"] },
  { word: "Fire", clues: ["Heat", "Flames", "Burning"] },
  { word: "Knife", clues: ["Sharp", "Cutting", "Kitchen Tool"] },
  { word: "Book", clues: ["Knowledge", "Pages", "Reading"] },
  { word: "Sun", clues: ["Energy", "Solar", "Bright Star"] },
  { word: "Moon", clues: ["Night", "Orbit", "Lunar"] },
  // Nepali 🇳🇵
  { word: "Dashain", clues: ["Blessing", "Tika", "Kite Flying"] },
  { word: "Tihar", clues: ["Lights", "Deusi Re", "Rangoli"] },
  { word: "Momo", clues: ["Steam", "Dumpling", "Chutney"] },
  { word: "Everest", clues: ["Highest", "Mountain", "Sagarmatha"] },
  { word: "Khukuri", clues: ["Blade", "Gurkha", "Curved Weapon"] }
  // You can expand this list following the same pattern: clues: ["Clue1", "Clue2", "Clue3"]
];

// Helper to expand single clues dynamically if you add old formats back
const getClues = (wordData) => {
  if (wordData.clues && wordData.clues.length > 0) return wordData.clues;
  return [wordData.clue, `Think about: ${wordData.clue}`, `Related to: ${wordData.clue}`];
};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Create / Join Room
  socket.on('joinRoom', ({ name, roomCode, userId, action }) => {
    let code = roomCode || generateRoomCode();
    
    if (!rooms[code]) {
      rooms[code] = {
        host: userId,
        players: [],
        status: 'lobby', 
        votes: {},
        wordData: null,
        settings: { numImposters: 1, isRandomImposters: false } // Added Settings
      };
    }

    const room = rooms[code];
    
    let existingPlayer = room.players.find(p => p.userId === userId);
    if (existingPlayer) {
      existingPlayer.socketId = socket.id;
      existingPlayer.name = name;
    } else {
      room.players.push({ userId, socketId: socket.id, name, role: null, hasVoted: false });
    }
    
    socket.join(code);
    socket.emit('roomJoined', { code });
    io.to(code).emit('updatePlayers', room.players);
    io.to(code).emit('gameStateUpdate', room);
  });

  // 1.5 Handle Reconnections
  socket.on('rejoinRoom', ({ name, roomCode, userId }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players.find(p => p.userId === userId);
    if (player) {
      player.socketId = socket.id;
      player.name = name;
      socket.join(roomCode);
      
      socket.emit('roomJoined', { code: roomCode });
      socket.emit('gameStateUpdate', room);
      
      if (room.status === 'playing') {
        socket.emit('gameStarted', {
          role: player.role,
          secretWord: player.role === 'imposter' ? null : room.wordData.word,
          clue: player.role === 'imposter' ? player.assignedClue : null
        });
      }
    }
  });

  // 1.6 Leave Room
  socket.on('leaveRoom', ({ roomCode, userId }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.players = room.players.filter(p => p.userId !== userId);
    socket.leave(roomCode);

    if (room.players.length === 0) {
      delete rooms[roomCode];
    } else {
      if (room.host === userId) {
        room.host = room.players[0].userId;
      }
      io.to(roomCode).emit('updatePlayers', room.players);
      io.to(roomCode).emit('gameStateUpdate', room);
    }
  });

  // NEW: Settings Handlers
  socket.on('updateSettings', ({ roomCode, numImposters, isRandomImposters }) => {
    const room = rooms[roomCode];
    if (!room) return;
    if (numImposters !== undefined) room.settings.numImposters = numImposters;
    if (isRandomImposters !== undefined) room.settings.isRandomImposters = isRandomImposters;
    io.to(roomCode).emit('gameStateUpdate', room);
  });

  // 2. Start Game
  socket.on('startGame', (roomCode) => {
    const room = rooms[roomCode];
    if (!room || room.players.length < 2) return; 

    room.wordData = wordBank[Math.floor(Math.random() * wordBank.length)];
    const cluesAvailable = getClues(room.wordData).sort(() => 0.5 - Math.random());
    
    let numImps = room.settings.numImposters || 1;
    if (room.settings.isRandomImposters) {
      numImps = Math.floor(Math.random() * (room.players.length - 1)) + 1; 
    }
    // Prevent more imposters than players minus one
    numImps = Math.min(Math.max(1, numImps), room.players.length - 1);

    // Shuffle and pick imposters
    const shuffledIndices = room.players.map((_, i) => i).sort(() => 0.5 - Math.random());
    const imposterIndices = shuffledIndices.slice(0, numImps);

    room.players.forEach((p, index) => {
      p.role = imposterIndices.includes(index) ? 'imposter' : 'normal';
      p.hasVoted = false;
      
      if (p.role === 'imposter') {
        // Assign a unique clue if available, looping if there are more imposters than clues
        const imposterNumber = imposterIndices.indexOf(index);
        p.assignedClue = cluesAvailable[imposterNumber % cluesAvailable.length];
      } else {
        p.assignedClue = null;
      }
    });

    room.status = 'playing';
    room.votes = {};

    room.players.forEach(p => {
      io.to(p.socketId).emit('gameStarted', {
        role: p.role,
        secretWord: p.role === 'imposter' ? null : room.wordData.word,
        clue: p.role === 'imposter' ? p.assignedClue : null
      });
    });

    io.to(roomCode).emit('gameStateUpdate', room);
  });

  // 3. Submit Vote
  socket.on('submitVote', ({ roomCode, votedId }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const voter = room.players.find(p => p.socketId === socket.id);
    if (!voter) return;

    room.votes[voter.userId] = votedId;
    voter.hasVoted = true;

    if (Object.keys(room.votes).length === room.players.length) {
      room.status = 'results';
      
      const voteCounts = {};
      Object.values(room.votes).forEach(id => {
        voteCounts[id] = (voteCounts[id] || 0) + 1;
      });

      const votedOutId = Object.keys(voteCounts).reduce((a, b) => voteCounts[a] > voteCounts[b] ? a : b);
      const votedOutPlayer = room.players.find(p => p.userId === votedOutId);
      
      const imposterWon = votedOutPlayer.role !== 'imposter';
      const impostersList = room.players.filter(p => p.role === 'imposter').map(p => p.name).join(', ');

      io.to(roomCode).emit('gameEnded', {
        votedOut: votedOutPlayer.name,
        imposterWon,
        imposter: impostersList,
        word: room.wordData.word
      });
    }

    io.to(roomCode).emit('gameStateUpdate', room);
  });

  // NEW: Missing Lobby Handlers
  socket.on('playAgain', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.status = 'lobby';
    io.to(roomCode).emit('gameStateUpdate', room);
  });

  socket.on('forceEndGame', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.status = 'lobby';
    io.to(roomCode).emit('gameStateUpdate', room);
  });

  socket.on('kickPlayer', ({ roomCode, targetId }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const target = room.players.find(p => p.userId === targetId);
    if (target) {
      room.players = room.players.filter(p => p.userId !== targetId);
      io.to(target.socketId).emit('kicked');
      io.sockets.sockets.get(target.socketId)?.leave(roomCode);
      io.to(roomCode).emit('updatePlayers', room.players);
      io.to(roomCode).emit('gameStateUpdate', room);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));