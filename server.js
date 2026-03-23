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

// 🌍 Bilingual Word Bank
const wordBank = [
  // 🐾 Animals
  { word: "Tiger", wordNp: "बाघ", clue: "Animal", clueNp: "जनावर" },
  { word: "Elephant", wordNp: "हात्ती", clue: "Animal", clueNp: "जनावर" },
  { word: "Dog", wordNp: "कुकुर", clue: "Animal", clueNp: "जनावर" },
  { word: "Cat", wordNp: "बिरालो", clue: "Animal", clueNp: "जनावर" },
  { word: "Lion", wordNp: "सिंह", clue: "Animal", clueNp: "जनावर" },
  { word: "Horse", wordNp: "घोडा", clue: "Animal", clueNp: "जनावर" },
  { word: "Monkey", wordNp: "बाँदर", clue: "Animal", clueNp: "जनावर" },
  { word: "Snake", wordNp: "सर्प", clue: "Animal", clueNp: "जनावर" },
  { word: "Frog", wordNp: "भ्यागुता", clue: "Animal", clueNp: "जनावर" },
  { word: "Dolphin", wordNp: "डोल्फिन", clue: "Animal", clueNp: "जनावर" },

  // 🍔 Food
  { word: "Pizza", wordNp: "पिज्जा", clue: "Food", clueNp: "खाना" },
  { word: "Burger", wordNp: "बर्गर", clue: "Food", clueNp: "खाना" },
  { word: "Pasta", wordNp: "पास्ता", clue: "Food", clueNp: "खाना" },
  { word: "Rice", wordNp: "भात", clue: "Food", clueNp: "खाना" },
  { word: "Momo", wordNp: "मम", clue: "Food", clueNp: "खाना" },
  { word: "Noodles", wordNp: "चाउमिन", clue: "Food", clueNp: "खाना" },
  { word: "Ice Cream", wordNp: "आइसक्रिम", clue: "Food", clueNp: "खाना" },
  { word: "Chocolate", wordNp: "चकलेट", clue: "Food", clueNp: "खाना" },
  { word: "Cake", wordNp: "केक", clue: "Food", clueNp: "खाना" },
  { word: "Apple", wordNp: "स्याउ", clue: "Food", clueNp: "खाना" },

  // 🚗 Vehicles
  { word: "Car", wordNp: "गाडी", clue: "Vehicle", clueNp: "सवारी साधन" },
  { word: "Bus", wordNp: "बस", clue: "Vehicle", clueNp: "सवारी साधन" },
  { word: "Airplane", wordNp: "जहाज", clue: "Vehicle", clueNp: "सवारी साधन" },
  { word: "Bicycle", wordNp: "साइकल", clue: "Vehicle", clueNp: "सवारी साधन" },
  { word: "Motorbike", wordNp: "मोटरसाइकल", clue: "Vehicle", clueNp: "सवारी साधन" },
  { word: "Train", wordNp: "रेल", clue: "Vehicle", clueNp: "सवारी साधन" },
  { word: "Helicopter", wordNp: "हेलिकप्टर", clue: "Vehicle", clueNp: "सवारी साधन" },
  { word: "Boat", wordNp: "डुंगा", clue: "Vehicle", clueNp: "सवारी साधन" },
  { word: "Truck", wordNp: "ट्रक", clue: "Vehicle", clueNp: "सवारी साधन" },
  { word: "Scooter", wordNp: "स्कुटर", clue: "Vehicle", clueNp: "सवारी साधन" },

  // 🎵 Instruments
  { word: "Guitar", wordNp: "गिटार", clue: "Instrument", clueNp: "वाद्ययन्त्र" },
  { word: "Piano", wordNp: "पियानो", clue: "Instrument", clueNp: "वाद्ययन्त्र" },
  { word: "Drum", wordNp: "ड्रम", clue: "Instrument", clueNp: "वाद्ययन्त्र" },
  { word: "Flute", wordNp: "बाँसुरी", clue: "Instrument", clueNp: "वाद्ययन्त्र" },
  { word: "Violin", wordNp: "भायोलिन", clue: "Instrument", clueNp: "वाद्ययन्त्र" },
  { word: "Trumpet", wordNp: "ट्रम्पेट", clue: "Instrument", clueNp: "वाद्ययन्त्र" },
  { word: "Harmonium", wordNp: "हार्मोनियम", clue: "Instrument", clueNp: "वाद्ययन्त्र" },

  // 🏠 Household Items
  { word: "Chair", wordNp: "कुर्सी", clue: "Furniture", clueNp: "फर्निचर" },
  { word: "Table", wordNp: "टेबल", clue: "Furniture", clueNp: "फर्निचर" },
  { word: "Bed", wordNp: "ओछ्यान", clue: "Furniture", clueNp: "फर्निचर" },
  { word: "Fan", wordNp: "पंखा", clue: "Appliance", clueNp: "उपकरण" },
  { word: "Television", wordNp: "टेलिभिजन", clue: "Appliance", clueNp: "उपकरण" },
  { word: "Refrigerator", wordNp: "फ्रिज", clue: "Appliance", clueNp: "उपकरण" },
  { word: "Mirror", wordNp: "ऐना", clue: "Object", clueNp: "वस्तु" },
  { word: "Door", wordNp: "ढोका", clue: "Object", clueNp: "वस्तु" },

  // 📱 Technology
  { word: "Phone", wordNp: "फोन", clue: "Technology", clueNp: "प्रविधि" },
  { word: "Laptop", wordNp: "ल्यापटप", clue: "Technology", clueNp: "प्रविधि" },
  { word: "Keyboard", wordNp: "किबोर्ड", clue: "Technology", clueNp: "प्रविधि" },
  { word: "Mouse", wordNp: "माउस", clue: "Technology", clueNp: "प्रविधि" },
  { word: "Camera", wordNp: "क्यामेरा", clue: "Technology", clueNp: "प्रविधि" },
  { word: "Internet", wordNp: "इन्टरनेट", clue: "Technology", clueNp: "प्रविधि" },

  // 🌍 Places
  { word: "School", wordNp: "विद्यालय", clue: "Place", clueNp: "स्थान" },
  { word: "Hospital", wordNp: "अस्पताल", clue: "Place", clueNp: "स्थान" },
  { word: "Temple", wordNp: "मन्दिर", clue: "Place", clueNp: "स्थान" },
  { word: "Park", wordNp: "पार्क", clue: "Place", clueNp: "स्थान" },
  { word: "Airport", wordNp: "विमानस्थल", clue: "Place", clueNp: "स्थान" },
  { word: "Market", wordNp: "बजार", clue: "Place", clueNp: "स्थान" },

  // ⚽ Sports
  { word: "Football", wordNp: "फुटबल", clue: "Sport", clueNp: "खेल" },
  { word: "Cricket", wordNp: "क्रिकेट", clue: "Sport", clueNp: "खेल" },
  { word: "Basketball", wordNp: "बास्केटबल", clue: "Sport", clueNp: "खेल" },
  { word: "Tennis", wordNp: "टेनिस", clue: "Sport", clueNp: "खेल" },
  { word: "Badminton", wordNp: "ब्याडमिन्टन", clue: "Sport", clueNp: "खेल" },

  // 🎬 Misc Fun
  { word: "Ghost", wordNp: "भूत", clue: "Spooky", clueNp: "डर लाग्दो" },
  { word: "Robot", wordNp: "रोबोट", clue: "Sci-fi", clueNp: "विज्ञान कथा" },
  { word: "Superhero", wordNp: "सुपरहिरो", clue: "Character", clueNp: "चरित्र" },
  { word: "Alien", wordNp: "एलियन", clue: "Sci-fi", clueNp: "विज्ञान कथा" },
  { word: "Magic", wordNp: "जादू", clue: "Fantasy", clueNp: "काल्पनिक" },
  { word: "Treasure", wordNp: "खजाना", clue: "Adventure", clueNp: "रोमाञ्चक" }
];

// Generate Room Code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 🔹 Join / Create Room
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
        language: 'en' // 'en' or 'np'
      };
    }

    const room = rooms[code];

    // Prevent duplicate
    if (room.players.some(p => p.id === socket.id)) return;

    room.players.push({
      id: socket.id,
      name,
      role: null,
      hasVoted: false
    });

    socket.join(code);

    socket.emit('roomJoined', { code, id: socket.id });
    io.to(code).emit('updatePlayers', room.players);
  });

  // 🔹 Set Language
  socket.on('setLanguage', ({ roomCode, lang }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.language = lang;
    io.to(roomCode).emit('gameStateUpdate', room);
  });

  // 🔹 Start Game
  socket.on('startGame', (roomCode) => {
    const room = rooms[roomCode];
    if (!room || room.players.length < 2) return;

    room.wordData = wordBank[Math.floor(Math.random() * wordBank.length)];

    const imposterIndex = Math.floor(Math.random() * room.players.length);

    room.players.forEach((p, index) => {
      p.role = (index === imposterIndex) ? 'imposter' : 'normal';
      p.hasVoted = false;
    });

    room.status = 'playing';
    room.hints = [];
    room.turnIndex = 0;
    room.votes = {};

    const isNp = room.language === 'np';

    // Send private role info
    room.players.forEach(p => {
      io.to(p.id).emit('gameStarted', {
        role: p.role,
        secretWord: p.role === 'imposter'
          ? null
          : (isNp ? room.wordData.wordNp : room.wordData.word),
        clue: p.role === 'imposter'
          ? (isNp ? room.wordData.clueNp : room.wordData.clue)
          : null
      });
    });

    io.to(roomCode).emit('gameStateUpdate', room);
  });

  // 🔹 Submit Hint
  socket.on('submitHint', ({ roomCode, hint }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const currentPlayer = room.players[room.turnIndex];
    if (!currentPlayer || currentPlayer.id !== socket.id) return;

    room.hints.push({ name: currentPlayer.name, hint });
    room.turnIndex++;

    if (room.turnIndex >= room.players.length) {
      room.status = 'voting';
    }

    io.to(roomCode).emit('gameStateUpdate', room);
  });

  // 🔹 Submit Vote
  socket.on('submitVote', ({ roomCode, votedId }) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (room.votes[socket.id]) return; // prevent double vote

    room.votes[socket.id] = votedId;

    const player = room.players.find(p => p.id === socket.id);
    if (player) player.hasVoted = true;

    if (Object.keys(room.votes).length === room.players.length) {
      room.status = 'results';

      const voteCounts = {};
      Object.values(room.votes).forEach(id => {
        voteCounts[id] = (voteCounts[id] || 0) + 1;
      });

      let maxVotes = 0;
      let votedOutId = null;
      let tie = false;

      for (let id in voteCounts) {
        if (voteCounts[id] > maxVotes) {
          maxVotes = voteCounts[id];
          votedOutId = id;
          tie = false;
        } else if (voteCounts[id] === maxVotes) {
          tie = true;
        }
      }

      const imposter = room.players.find(p => p.role === 'imposter');

      if (tie) {
        io.to(roomCode).emit('gameEnded', {
          votedOut: null,
          imposterWon: true,
          imposter: imposter.name,
          word: room.wordData.word
        });
        return;
      }

      const votedOutPlayer = room.players.find(p => p.id === votedOutId);

      const imposterWon = votedOutPlayer.role !== 'imposter';

      io.to(roomCode).emit('gameEnded', {
        votedOut: votedOutPlayer.name,
        imposterWon,
        imposter: imposter.name,
        word: room.wordData.word
      });
    }

    io.to(roomCode).emit('gameStateUpdate', room);
  });

  // 🔹 Disconnect Handling
  socket.on('disconnect', () => {
    for (const code in rooms) {
      const room = rooms[code];

      const index = room.players.findIndex(p => p.id === socket.id);

      if (index !== -1) {
        room.players.splice(index, 1);

        // Change host if needed
        if (room.host === socket.id && room.players.length > 0) {
          room.host = room.players[0].id;
        }

        // Delete empty room
        if (room.players.length === 0) {
          delete rooms[code];
        } else {
          io.to(code).emit('updatePlayers', room.players);
        }
      }
    }

    console.log(`User disconnected: ${socket.id}`);
  });

});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});