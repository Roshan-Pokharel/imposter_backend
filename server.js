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

// Updated wordBank with English & Nepali translations
const wordBank = [
  { word: { en: "Tiger", np: "बाघ" }, clue: { en: "Animal", np: "जनावर" } },
  { word: { en: "Elephant", np: "हात्ती" }, clue: { en: "Animal", np: "जनावर" } },
  { word: { en: "Dog", np: "कुकुर" }, clue: { en: "Animal", np: "जनावर" } },
  { word: { en: "Pizza", np: "पिज्जा" }, clue: { en: "Food", np: "खाना" } },
  { word: { en: "Burger", np: "बर्गर" }, clue: { en: "Food", np: "खाना" } },
  { word: { en: "Pasta", np: "पास्ता" }, clue: { en: "Food", np: "खाना" } },
  { word: { en: "Car", np: "कार" }, clue: { en: "Vehicle", np: "गाडी" } },
  { word: { en: "Bus", np: "बस" }, clue: { en: "Vehicle", np: "गाडी" } },
  { word: { en: "Airplane", np: "हवाइजहाज" }, clue: { en: "Vehicle", np: "गाडी" } },
  { word: { en: "Guitar", np: "गितार" }, clue: { en: "Instrument", np: "बाजा" } },
  { word: { en: "Piano", np: "पियानो" }, clue: { en: "Instrument", np: "बाजा" } },
  { word: { en: "Drum", np: "ड्रम" }, clue: { en: "Instrument", np: "बाजा" } },
  { word: { en: "Chair", np: "कुर्सी" }, clue: { en: "Furniture", np: "फर्निचर" } },
  { word: { en: "Table", np: "टेबल" }, clue: { en: "Furniture", np: "फर्निचर" } },
  { word: { en: "Bed", np: "ओछ्यान" }, clue: { en: "Furniture", np: "फर्निचर" } },
  { word: { en: "Phone", np: "फोन" }, clue: { en: "Technology", np: "प्रविधि" } },
  { word: { en: "Laptop", np: "ल्यापटप" }, clue: { en: "Technology", np: "प्रविधि" } },
  { word: { en: "Keyboard", np: "किबोर्ड" }, clue: { en: "Technology", np: "प्रविधि" } },
  { word: { en: "School", np: "विद्यालय" }, clue: { en: "Place", np: "ठाउँ" } },
  { word: { en: "Hospital", np: "अस्पताल" }, clue: { en: "Place", np: "ठाउँ" } },
  { word: { en: "Temple", np: "मन्दिर" }, clue: { en: "Place", np: "ठाउँ" } },
  { word: { en: "Football", np: "फुटबल" }, clue: { en: "Sport", np: "खेल" } },
  { word: { en: "Cricket", np: "क्रिकेट" }, clue: { en: "Sport", np: "खेल" } },
  { word: { en: "Basketball", np: "बास्केटबल" }, clue: { en: "Sport", np: "खेल" } },
  { word: { en: "Ghost", np: "भूत" }, clue: { en: "Spooky", np: "डरलाग्दो" } },
  { word: { en: "Robot", np: "रोबोट" }, clue: { en: "Sci-fi", np: "विज्ञान कथा" } },
  { word: { en: "Superhero", np: "सुपरहिरो" }, clue: { en: "Character", np: "पात्र" } }
];

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinRoom', ({ name, roomCode, action }) => {
    let code;

    if (action === 'create') {
      code = generateRoomCode();
      rooms[code] = {
        host: socket.id,
        players: [],
        status: 'lobby',
        hints: [],
        votes: {},
        turnIndex: 0,
        wordData: null
      };
    } else {
      code = roomCode;
      if (!rooms[code]) {
        return socket.emit('roomError', 'Room does not exist!');
      }
      if (rooms[code].status === 'playing' || rooms[code].status === 'voting') {
        return socket.emit('roomError', 'Game is already in progress!');
      }
    }

    const room = rooms[code];
    room.players.push({ id: socket.id, name, role: null, hasVoted: false });
    
    socket.join(code);
    socket.emit('roomJoined', { code, id: socket.id });
    io.to(code).emit('updatePlayers', room.players);
    io.to(code).emit('gameStateUpdate', room);
  });

  socket.on('startGame', (roomCode) => {
    const room = rooms[roomCode];
    if (!room || room.players.length < 2) return;

    room.wordData = wordBank[Math.floor(Math.random() * wordBank.length)];
    const imposterIndex = Math.floor(Math.random() * room.players.length);
    
    room.status = 'playing';
    room.hints = [];
    room.turnIndex = 0;
    room.votes = {};

    room.players.forEach((p, index) => {
      p.role = (index === imposterIndex) ? 'imposter' : 'normal';
      p.hasVoted = false; 
    });

    // Send the whole object {en: '...', np: '...'} so frontend can switch instantly
    room.players.forEach(p => {
      io.to(p.id).emit('gameStarted', {
        role: p.role,
        secretWord: p.role === 'imposter' ? null : room.wordData.word,
        clue: p.role === 'imposter' ? room.wordData.clue : null
      });
    });

    io.to(roomCode).emit('gameStateUpdate', room);
  });

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

  socket.on('submitVote', ({ roomCode, votedId }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.votes[socket.id] = votedId;
    const player = room.players.find(p => p.id === socket.id);
    if(player) player.hasVoted = true;

    if (Object.keys(room.votes).length === room.players.length) {
      room.status = 'results';
      
      const voteCounts = {};
      Object.values(room.votes).forEach(id => {
        voteCounts[id] = (voteCounts[id] || 0) + 1;
      });

      let maxVotes = 0;
      let tied = false;
      let votedOutId = null;

      Object.entries(voteCounts).forEach(([id, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          votedOutId = id;
          tied = false;
        } else if (count === maxVotes) {
          tied = true;
        }
      });

      let votedOutName = "Tie";
      let imposterWon = true; 

      if (!tied && votedOutId) {
        const votedOutPlayer = room.players.find(p => p.id === votedOutId);
        votedOutName = votedOutPlayer.name;
        imposterWon = votedOutPlayer.role !== 'imposter';
      }

      io.to(roomCode).emit('gameEnded', {
        votedOut: votedOutName,
        imposterWon,
        imposter: room.players.find(p => p.role === 'imposter').name,
        word: room.wordData.word // Sending the whole {en, np} object
      });
    }

    io.to(roomCode).emit('gameStateUpdate', room);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const code in rooms) {
      const room = rooms[code];
      const pIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (pIndex !== -1) {
        room.players.splice(pIndex, 1);
        
        if (room.players.length === 0) {
          delete rooms[code];
        } else {
          if (room.host === socket.id) room.host = room.players[0].id;
          io.to(code).emit('updatePlayers', room.players);
          io.to(code).emit('gameStateUpdate', room);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));