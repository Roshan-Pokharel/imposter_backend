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

// Keep your full wordBank here (I've truncated it for brevity, but keep your 100+ words)
const wordBank = [
{ word:"Microwave", clue:"Radiation" },
{ word:"Vacuum", clue:"Space" },
{ word:"Shadow", clue:"Darkness" },
{ word:"Clock", clue:"Ticking" },
{ word:"Battery", clue:"Charge" },
{ word:"Magnet", clue:"Attraction" },
{ word:"Ice", clue:"Melting" },
{ word:"Fire", clue:"Heat" },
{ word:"Knife", clue:"Sharp" },
{ word:"Book", clue:"Knowledge" },
{ word:"Sun", clue:"Energy" },
{ word:"Moon", clue:"Night" },
{ word:"Rain", clue:"Falling" },
{ word:"Wind", clue:"Invisible" },
{ word:"Star", clue:"Distant" },
{ word:"Sky", clue:"Above" },
{ word:"Cloud", clue:"Floating" },
{ word:"Storm", clue:"Chaos" },
{ word:"Thunder", clue:"Loud" },
{ word:"Lightning", clue:"Flash" },
{ word:"Key", clue:"Unlock" },
{ word:"Lock", clue:"Secure" },
{ word:"Password", clue:"Access" },
{ word:"Map", clue:"Direction" },
{ word:"Compass", clue:"North" },
{ word:"Path", clue:"Way" },
{ word:"Road", clue:"Travel" },
{ word:"Bridge", clue:"Connect" },
{ word:"Tunnel", clue:"Underground" },
{ word:"Gate", clue:"Entry" },
{ word:"Brain", clue:"Thinking" },
{ word:"Heart", clue:"Beating" },
{ word:"Eye", clue:"Vision" },
{ word:"Ear", clue:"Hearing" },
{ word:"Hand", clue:"Grip" },
{ word:"Leg", clue:"Walk" },
{ word:"Blood", clue:"Flow" },
{ word:"Bone", clue:"Support" },
{ word:"Skin", clue:"Cover" },
{ word:"Voice", clue:"Sound" },
{ word:"Phone", clue:"Call" },
{ word:"Camera", clue:"Capture" },
{ word:"Speaker", clue:"Sound" },
{ word:"Screen", clue:"Display" },
{ word:"Internet", clue:"Network" },
{ word:"Laptop", clue:"Portable" },
{ word:"Keyboard", clue:"Typing" },
{ word:"Mouse", clue:"Pointer" },
{ word:"Code", clue:"Logic" },
{ word:"Bug", clue:"Error" },

{ word:"Money", clue:"Value" },
{ word:"Gold", clue:"Precious" },
{ word:"Diamond", clue:"Rare" },
{ word:"Bank", clue:"Storage" },
{ word:"Coin", clue:"Currency" },
{ word:"Market", clue:"Trade" },
{ word:"Shop", clue:"Buy" },
{ word:"Price", clue:"Cost" },
{ word:"Debt", clue:"Owe" },
{ word:"Profit", clue:"Gain" },

{ word:"Time", clue:"Running" },
{ word:"Memory", clue:"Past" },
{ word:"Dream", clue:"Sleep" },
{ word:"Fear", clue:"Emotion" },
{ word:"Love", clue:"Connection" },
{ word:"Hate", clue:"Opposite" },
{ word:"Hope", clue:"Future" },
{ word:"Luck", clue:"Chance" },
{ word:"Fate", clue:"Destiny" },
{ word:"Truth", clue:"Reality" },

{ word:"Ocean", clue:"Deep" },
{ word:"River", clue:"Flow" },
{ word:"Mountain", clue:"High" },
{ word:"Forest", clue:"Wild" },
{ word:"Desert", clue:"Dry" },
{ word:"Island", clue:"Alone" },
{ word:"Valley", clue:"Low" },
{ word:"Cave", clue:"Dark" },
{ word:"Volcano", clue:"Erupt" },
{ word:"Glacier", clue:"Slow" },

// Nepali 🇳🇵
{ word:"Dashain", clue:"Blessing" },
{ word:"Tihar", clue:"Lights" },
{ word:"Holi", clue:"Colors" },
{ word:"Teej", clue:"Fasting" },
{ word:"Chhath", clue:"Sun" },
{ word:"Maghe Sankranti", clue:"Season" },
{ word:"Losar", clue:"NewYear" },
{ word:"Momo", clue:"Steam" },
{ word:"Dal Bhat", clue:"Energy" },
{ word:"Sel Roti", clue:"Ring" },
{ word:"Gundruk", clue:"Fermented" },
{ word:"Dhido", clue:"Traditional" },
{ word:"Yomari", clue:"Sweet" },
{ word:"Chatamari", clue:"Flat" },
{ word:"Thukpa", clue:"Soup" },
{ word:"Everest", clue:"Highest" },
{ word:"Annapurna", clue:"Range" },
{ word:"Kathmandu", clue:"Capital" },
{ word:"Pokhara", clue:"Lake" },
{ word:"Lumbini", clue:"Birthplace" },
{ word:"Bhaktapur", clue:"Heritage" },
{ word:"Patan", clue:"Art" },
{ word:"Mustang", clue:"Remote" },
{ word:"Pashupatinath", clue:"Sacred" },
{ word:"Swayambhunath", clue:"Monkey" },
{ word:"Boudhanath", clue:"Stupa" },
{ word:"Khukuri", clue:"Blade" },
{ word:"Topi", clue:"Identity" },
{ word:"Daura Suruwal", clue:"Formal" },
{ word:"Gunyo Cholo", clue:"Ceremony" },

// Remaining handcrafted expansions (no filler, all unique)
{ word:"Robot", clue:"Artificial" },
{ word:"AI", clue:"Learning" },
{ word:"Server", clue:"Response" },
{ word:"CloudStorage", clue:"Remote" },
{ word:"Data", clue:"Information" },
{ word:"Algorithm", clue:"Steps" },
{ word:"Signal", clue:"Transmit" },
{ word:"Wave", clue:"Frequency" },
{ word:"Energy", clue:"Power" },
{ word:"Gravity", clue:"Pull" },

{ word:"Game", clue:"Play" },
{ word:"Puzzle", clue:"Solve" },
{ word:"Secret", clue:"Hidden" },
{ word:"Lie", clue:"False" },
{ word:"Clue", clue:"Hint" },
{ word:"Mystery", clue:"Unknown" },
{ word:"Trap", clue:"Catch" },
{ word:"Escape", clue:"Run" },
{ word:"Chase", clue:"Follow" },
{ word:"Hide", clue:"Cover" },

{ word:"Mirror", clue:"Reflect" },
{ word:"Glass", clue:"Transparent" },
{ word:"Paper", clue:"Write" },
{ word:"Pen", clue:"Ink" },
{ word:"Pencil", clue:"Sketch" },
{ word:"Eraser", clue:"Remove" },
{ word:"Bag", clue:"Carry" },
{ word:"Chair", clue:"Sit" },
{ word:"Table", clue:"Surface" },
{ word:"Bed", clue:"Rest" },

{ word:"Doorbell", clue:"Ring" },
{ word:"Fan", clue:"Air" },
{ word:"Light", clue:"Bright" },
{ word:"Switch", clue:"Toggle" },
{ word:"Wire", clue:"Connect" },
{ word:"Plug", clue:"Insert" },
{ word:"Socket", clue:"Power" },
{ word:"Generator", clue:"Backup" },
{ word:"Solar", clue:"Sunlight" },
{ word:"BatteryPack", clue:"Portable" },

// continue varied unique handcrafted...
{ word:"Teacher", clue:"Guide" },
{ word:"Student", clue:"Learn" },
{ word:"Exam", clue:"Pressure" },
{ word:"Result", clue:"Outcome" },
{ word:"School", clue:"Routine" },
{ word:"College", clue:"Future" },
{ word:"Library", clue:"Silent" },
{ word:"Homework", clue:"Task" },
{ word:"Classroom", clue:"Lesson" },
{ word:"Uniform", clue:"Dress" },

{ word:"Doctor", clue:"Heal" },
{ word:"Nurse", clue:"Care" },
{ word:"Hospital", clue:"Emergency" },
{ word:"Medicine", clue:"Cure" },
{ word:"Injection", clue:"Needle" },
{ word:"Tablet", clue:"Dose" },
{ word:"Ambulance", clue:"Siren" },
{ word:"Surgery", clue:"Operation" },
{ word:"Mask", clue:"Protect" },
{ word:"Virus", clue:"Infect" },

];

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Create / Join Room
  socket.on('joinRoom', ({ name, roomCode, userId, action }) => {
    let code = roomCode || generateRoomCode();
    
    // NEW: Check if room exists and is in progress
    if (rooms[code]) {
      const existingPlayer = rooms[code].players.find(p => p.userId === userId);
      // If they aren't already in the room AND the game is not in the lobby, block entry
      if (!existingPlayer && rooms[code].status !== 'lobby') {
        socket.emit('roomError', 'Game is already in progress. You cannot join right now.');
        return;
      }
    }

    if (!rooms[code]) {
      rooms[code] = {
        host: userId,
        players: [],
        status: 'lobby', 
        votes: {},
        wordData: null,
        settings: { numImposters: 1 } // NEW: Added settings object
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
    io.to(code).emit('gameStateUpdate', room); // NEW: Send state immediately so host is recognized
  });

  // NEW: Update Room Settings (Number of Imposters)
  socket.on('updateSettings', ({ roomCode, numImposters }) => {
    const room = rooms[roomCode];
    if (room && room.status === 'lobby') {
      room.settings.numImposters = numImposters;
      io.to(roomCode).emit('gameStateUpdate', room);
    }
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
          clue: player.role === 'imposter' ? room.wordData.clue : null
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

  // 2. Start Game
  socket.on('startGame', (roomCode) => {
    const room = rooms[roomCode];
    if (!room || room.players.length < 2) return; 

    room.wordData = wordBank[Math.floor(Math.random() * wordBank.length)];
    
    // NEW: Handle multiple imposters safely
    let actualImposters = Math.min(room.settings.numImposters, room.players.length - 1);
    if (actualImposters < 1) actualImposters = 1;

    room.players.forEach(p => {
      p.role = 'normal';
      p.hasVoted = false;
    });

    let assigned = 0;
    while (assigned < actualImposters) {
      let randIdx = Math.floor(Math.random() * room.players.length);
      if (room.players[randIdx].role !== 'imposter') {
        room.players[randIdx].role = 'imposter';
        assigned++;
      }
    }

    room.status = 'playing';
    room.votes = {};

    room.players.forEach(p => {
      io.to(p.socketId).emit('gameStarted', {
        role: p.role,
        secretWord: p.role === 'imposter' ? null : room.wordData.word,
        clue: p.role === 'imposter' ? room.wordData.clue : null
      });
    });

    io.to(roomCode).emit('gameStateUpdate', room);
  });

  // NEW: Force End Game (Admin only)
  socket.on('forceEndGame', ({ roomCode, userId }) => {
    const room = rooms[roomCode];
    if (!room || room.host !== userId) return;

    room.status = 'results';
    const imposterNames = room.players.filter(p => p.role === 'imposter').map(p => p.name).join(', ');

    io.to(roomCode).emit('gameEnded', {
      votedOut: "No one (Host Forced End)",
      imposterWon: true, // If host skips, imposters technically survive
      imposter: imposterNames,
      word: room.wordData.word
    });
    io.to(roomCode).emit('gameStateUpdate', room);
  });

  // 3. Submit Vote
  socket.on('submitVote', ({ roomCode, votedId }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const voter = room.players.find(p => p.socketId === socket.id);
    if(!voter) return;

    room.votes[voter.userId] = votedId;
    voter.hasVoted = true;

    // Trigger end game ONLY if everyone has submitted their vote
    if (Object.keys(room.votes).length === room.players.length) {
      room.status = 'results';
      
      const voteCounts = {};
      Object.values(room.votes).forEach(id => {
        voteCounts[id] = (voteCounts[id] || 0) + 1;
      });

      // Find the player with the most votes
      const votedOutId = Object.keys(voteCounts).reduce((a, b) => voteCounts[a] > voteCounts[b] ? a : b);
      const votedOutPlayer = room.players.find(p => p.userId === votedOutId);
      
      // NEW: Support multiple imposters
      const imposterWon = votedOutPlayer.role !== 'imposter';
      const imposterNames = room.players.filter(p => p.role === 'imposter').map(p => p.name).join(', ');

      io.to(roomCode).emit('gameEnded', {
        votedOut: votedOutPlayer.name,
        imposterWon,
        imposter: imposterNames,
        word: room.wordData.word
      });
    }

    io.to(roomCode).emit('gameStateUpdate', room);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));