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

// Bilingual word database (English & Nepali)
const wordBank = [
  // 🐾 Animals
  { en: { word: "Tiger", clue: "Animal" }, np: { word: "बाघ", clue: "जनावर" } },
  { en: { word: "Elephant", clue: "Animal" }, np: { word: "हात्ती", clue: "जनावर" } },
  { en: { word: "Dog", clue: "Animal" }, np: { word: "कुकुर", clue: "जनावर" } },
  { en: { word: "Cat", clue: "Animal" }, np: { word: "बिरालो", clue: "जनावर" } },
  { en: { word: "Lion", clue: "Animal" }, np: { word: "सिंह", clue: "जनावर" } },
  { en: { word: "Horse", clue: "Animal" }, np: { word: "घोडा", clue: "जनावर" } },
  { en: { word: "Monkey", clue: "Animal" }, np: { word: "बाँदर", clue: "जनावर" } },
  { en: { word: "Snake", clue: "Animal" }, np: { word: "सर्प", clue: "जनावर" } },
  { en: { word: "Frog", clue: "Animal" }, np: { word: "भ्यागुतो", clue: "जनावर" } },
  { en: { word: "Dolphin", clue: "Animal" }, np: { word: "डल्फिन", clue: "जनावर" } },

  // 🍔 Food
  { en: { word: "Pizza", clue: "Food" }, np: { word: "पिज्जा", clue: "खाना" } },
  { en: { word: "Burger", clue: "Food" }, np: { word: "बर्गर", clue: "खाना" } },
  { en: { word: "Pasta", clue: "Food" }, np: { word: "पास्ता", clue: "खाना" } },
  { en: { word: "Rice", clue: "Food" }, np: { word: "भात", clue: "खाना" } },
  { en: { word: "Momo", clue: "Food" }, np: { word: "ममो", clue: "खाना" } },
  { en: { word: "Noodles", clue: "Food" }, np: { word: "चाउचाउ", clue: "खाना" } },
  { en: { word: "Ice Cream", clue: "Food" }, np: { word: "आइसक्रिम", clue: "खाना" } },
  { en: { word: "Chocolate", clue: "Food" }, np: { word: "चकलेट", clue: "खाना" } },
  { en: { word: "Cake", clue: "Food" }, np: { word: "केक", clue: "खाना" } },
  { en: { word: "Apple", clue: "Food" }, np: { word: "स्याउ", clue: "खाना" } },

  // 🚗 Vehicles
  { en: { word: "Car", clue: "Vehicle" }, np: { word: "कार", clue: "सवारी साधन" } },
  { en: { word: "Bus", clue: "Vehicle" }, np: { word: "बस", clue: "सवारी साधन" } },
  { en: { word: "Airplane", clue: "Vehicle" }, np: { word: "हवाइजहाज", clue: "सवारी साधन" } },
  { en: { word: "Bicycle", clue: "Vehicle" }, np: { word: "साइकल", clue: "सवारी साधन" } },
  { en: { word: "Motorbike", clue: "Vehicle" }, np: { word: "मोटरसाइकल", clue: "सवारी साधन" } },
  { en: { word: "Train", clue: "Vehicle" }, np: { word: "रेल", clue: "सवारी साधन" } },
  { en: { word: "Helicopter", clue: "Vehicle" }, np: { word: "हेलिकप्टर", clue: "सवारी साधन" } },
  { en: { word: "Boat", clue: "Vehicle" }, np: { word: "डुङ्गा", clue: "सवारी साधन" } },
  { en: { word: "Truck", clue: "Vehicle" }, np: { word: "ट्रक", clue: "सवारी साधन" } },
  { en: { word: "Scooter", clue: "Vehicle" }, np: { word: "स्कुटर", clue: "सवारी साधन" } },

  // 🎵 Instruments
  { en: { word: "Guitar", clue: "Instrument" }, np: { word: "गितार", clue: "बाजा" } },
  { en: { word: "Piano", clue: "Instrument" }, np: { word: "पियानो", clue: "बाजा" } },
  { en: { word: "Drum", clue: "Instrument" }, np: { word: "ड्रम", clue: "बाजा" } },
  { en: { word: "Flute", clue: "Instrument" }, np: { word: "बाँसुरी", clue: "बाजा" } },
  { en: { word: "Violin", clue: "Instrument" }, np: { word: "भायोलिन", clue: "बाजा" } },
  { en: { word: "Trumpet", clue: "Instrument" }, np: { word: "ट्रम्पेट", clue: "बाजा" } },
  { en: { word: "Harmonium", clue: "Instrument" }, np: { word: "हारमोनियम", clue: "बाजा" } },

  // 🏠 Household Items
  { en: { word: "Chair", clue: "Furniture" }, np: { word: "कुर्सी", clue: "फर्निचर" } },
  { en: { word: "Table", clue: "Furniture" }, np: { word: "टेबुल", clue: "फर्निचर" } },
  { en: { word: "Bed", clue: "Furniture" }, np: { word: "ओछ्यान", clue: "फर्निचर" } },
  { en: { word: "Fan", clue: "Appliance" }, np: { word: "पंखा", clue: "उपकरण" } },
  { en: { word: "Television", clue: "Appliance" }, np: { word: "टेलिभिजन", clue: "उपकरण" } },
  { en: { word: "Refrigerator", clue: "Appliance" }, np: { word: "फ्रिज", clue: "उपकरण" } },
  { en: { word: "Mirror", clue: "Object" }, np: { word: "ऐना", clue: "वस्तु" } },
  { en: { word: "Door", clue: "Object" }, np: { word: "ढोका", clue: "वस्तु" } },

  // 📱 Technology
  { en: { word: "Phone", clue: "Technology" }, np: { word: "फोन", clue: "प्रविधि" } },
  { en: { word: "Laptop", clue: "Technology" }, np: { word: "ल्यापटप", clue: "प्रविधि" } },
  { en: { word: "Keyboard", clue: "Technology" }, np: { word: "किबोर्ड", clue: "प्रविधि" } },
  { en: { word: "Mouse", clue: "Technology" }, np: { word: "माउस", clue: "प्रविधि" } },
  { en: { word: "Camera", clue: "Technology" }, np: { word: "क्यामेरा", clue: "प्रविधि" } },
  { en: { word: "Internet", clue: "Technology" }, np: { word: "इन्टरनेट", clue: "प्रविधि" } },

  // 🌍 Places
  { en: { word: "School", clue: "Place" }, np: { word: "विद्यालय", clue: "ठाउँ" } },
  { en: { word: "Hospital", clue: "Place" }, np: { word: "अस्पताल", clue: "ठाउँ" } },
  { en: { word: "Temple", clue: "Place" }, np: { word: "मन्दिर", clue: "ठाउँ" } },
  { en: { word: "Park", clue: "Place" }, np: { word: "पार्क", clue: "ठाउँ" } },
  { en: { word: "Airport", clue: "Place" }, np: { word: "विमानस्थल", clue: "ठाउँ" } },
  { en: { word: "Market", clue: "Place" }, np: { word: "बजार", clue: "ठाउँ" } },

  // ⚽ Sports
  { en: { word: "Football", clue: "Sport" }, np: { word: "फुटबल", clue: "खेलकुद" } },
  { en: { word: "Cricket", clue: "Sport" }, np: { word: "क्रिकेट", clue: "खेलकुद" } },
  { en: { word: "Basketball", clue: "Sport" }, np: { word: "बास्केटबल", clue: "खेलकुद" } },
  { en: { word: "Tennis", clue: "Sport" }, np: { word: "टेनिस", clue: "खेलकुद" } },
  { en: { word: "Badminton", clue: "Sport" }, np: { word: "ब्याडमिन्टन", clue: "खेलकुद" } },

  // 🎬 Misc Fun
  { en: { word: "Ghost", clue: "Spooky" }, np: { word: "भूत", clue: "डरलाग्दो" } },
  { en: { word: "Robot", clue: "Sci-fi" }, np: { word: "रोबोट", clue: "विज्ञान कथा" } },
  { en: { word: "Superhero", clue: "Character" }, np: { word: "सुपरहिरो", clue: "पात्र" } },
  { en: { word: "Alien", clue: "Sci-fi" }, np: { word: "एलियन", clue: "विज्ञान कथा" } },
  { en: { word: "Magic", clue: "Fantasy" }, np: { word: "जादु", clue: "काल्पनिक" } },
  { en: { word: "Treasure", clue: "Adventure" }, np: { word: "खजाना", clue: "साहसिक" } }
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
        wordData: null,
        lang: 'en' // Default language is English
      };
    }

    const room = rooms[code];
    room.players.push({ id: socket.id, name, role: null, hasVoted: false });
    
    socket.join(code);
    socket.emit('roomJoined', { code, id: socket.id });
    io.to(code).emit('updatePlayers', room.players);
  });

  // Listen for language changes from the frontend
  socket.on('setLanguage', ({ roomCode, lang }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].lang = lang; // Update the room's current language
    }
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

    const currentLang = room.lang;

    // Send private data to each player based on current language
    room.players.forEach(p => {
      io.to(p.id).emit('gameStarted', {
        role: p.role,
        secretWord: p.role === 'imposter' ? null : room.wordData[currentLang].word,
        clue: p.role === 'imposter' ? room.wordData[currentLang].clue : null
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
      const currentLang = room.lang;

      io.to(roomCode).emit('gameEnded', {
        votedOut: votedOutPlayer.name,
        imposterWon,
        imposter: room.players.find(p => p.role === 'imposter').name,
        word: room.wordData[currentLang].word
      });
    }

    io.to(roomCode).emit('gameStateUpdate', room);
  });

  socket.on('disconnect', () => {
    // Handle disconnect cleanup here
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));