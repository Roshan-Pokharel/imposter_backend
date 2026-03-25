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
  { word: "Dashain", clues: ["Blessing", "Tika", "Kite Flying"] },
  { word: "Tihar", clues: ["Lights", "Deusi Re", "Rangoli"] },
  { word: "Momo", clues: ["Steam", "Dumpling", "Chutney"] },
  { word: "Everest", clues: ["Highest", "Mountain", "Sagarmatha"] },
  { word: "Khukuri", clues: ["Blade", "Gurkha", "Curved Weapon"] },
  { word: "Kathmandu", clues: ["Valley", "Traffic", "Capital"] },
  { word: "Pokhara", clues: ["Lake", "Reflection", "Tourism"] },
  { word: "Lumbini", clues: ["Birthplace", "Peace", "Sacred"] },
  { word: "Bhaktapur", clues: ["Bricks", "Heritage", "Ancient"] },
  { word: "Holi", clues: ["Colors", "Water", "Joy"] },
  { word: "Teej", clues: ["Red", "Fasting", "Dance"] },
  { word: "MagheSankranti", clues: ["Winter", "Ghee", "Season"] },
  { word: "DalBhat", clues: ["Rice", "Daily", "Energy"] },
  { word: "SelRoti", clues: ["Ring", "Crispy", "Sweet"] },
  { word: "Gundruk", clues: ["Fermented", "Sour", "Village"] },
  { word: "Dhido", clues: ["Thick", "Traditional", "Flour"] },
  { word: "Topi", clues: ["Cap", "Formal", "Identity"] },
  { word: "DauraSuruwal", clues: ["Dress", "Cultural", "Formal"] },
  { word: "GunyoCholo", clues: ["Dress", "Ritual", "Girls"] },
  { word: "Thamel", clues: ["Tourists", "Shops", "Night"] },
  { word: "DurbarSquare", clues: ["Palace", "Temple", "History"] },
  { word: "Swayambhunath", clues: ["Monkey", "Hill", "View"] },
  { word: "Boudhanath", clues: ["Stupa", "Prayer", "Circle"] },
  { word: "Chitwan", clues: ["Jungle", "Safari", "Wildlife"] },
  { word: "Mustang", clues: ["Desert", "Wind", "Remote"] },
  { word: "RaraLake", clues: ["Blue", "Calm", "Remote"] },
  { word: "Namaste", clues: ["Greeting", "Respect", "Hands"] },
  { word: "Rupee", clues: ["Money", "Currency", "Notes"] },
  { word: "Flag", clues: ["Triangle", "Unique", "Nation"] },
  { word: "Bagmati", clues: ["River", "Temple", "Holy"] },
  { word: "Koshi", clues: ["Flood", "River", "East"] },
  { word: "Gandaki", clues: ["Flow", "River", "Valley"] },
  { word: "Rhino", clues: ["Horn", "Wild", "Rare"] },
  { word: "Tiger", clues: ["Stripes", "Predator", "Jungle"] },
  { word: "Yak", clues: ["Hairy", "Cold", "Mountain"] },
  { word: "RedPanda", clues: ["Cute", "Tree", "Rare"] },
  { word: "Gurkha", clues: ["Bravery", "Army", "Legend"] },
  { word: "Illam", clues: ["Tea", "Green", "Hills"] },
  { word: "Bandipur", clues: ["Hilltop", "Quiet", "View"] },
  { word: "PrayerFlag", clues: ["Colorful", "Wind", "Spiritual"] },
  { word: "Stupa", clues: ["Dome", "Peace", "Buddhist"] },
  { word: "Temple", clues: ["Worship", "Sacred", "Bell"] },
  { word: "Paragliding", clues: ["Sky", "Fly", "Adventure"] },
  { word: "Rafting", clues: ["River", "Rapid", "Adventure"] },
  { word: "Earthquake", clues: ["Shake", "Disaster", "Ground"] },
  { word: "Monsoon", clues: ["Rain", "Cloud", "Season"] },
  { word: "Sherpa", clues: ["Guide", "Mountain", "Climb"] },
  { word: "Farmer", clues: ["Field", "Crop", "Work"] },
  { word: "Rice", clues: ["Grain", "Staple", "White"] },
  { word: "Maize", clues: ["Corn", "Yellow", "Crop"] },
  { word: "Millet", clues: ["Grain", "Healthy", "Brown"] },
  { word: "Bus", clues: ["Crowd", "Public", "Travel"] },
  { word: "Motorbike", clues: ["Ride", "Fast", "Two"] },
  { word: "Taxi", clues: ["Fare", "City", "Ride"] },
  { word: "School", clues: ["Study", "Class", "Teacher"] },
  { word: "College", clues: ["Campus", "Degree", "Youth"] },
  { word: "Exam", clues: ["Test", "Marks", "Stress"] },
  { word: "Mobile", clues: ["Call", "App", "Screen"] },
  { word: "Internet", clues: ["Online", "Data", "Network"] },
  { word: "Football", clues: ["Goal", "Field", "Team"] },
  { word: "Cricket", clues: ["Bat", "Wicket", "Match"] },
  { word: "Volleyball", clues: ["Net", "Jump", "Team"] },
  { word: "Cinema", clues: ["Movie", "Screen", "Ticket"] },
  { word: "Actor", clues: ["Role", "Film", "Fame"] },
  { word: "YouTuber", clues: ["Video", "Channel", "Content"] },
  { word: "Shop", clues: ["Buy", "Sell", "Goods"] },
  { word: "Market", clues: ["Crowd", "Trade", "Local"] },
  { word: "Business", clues: ["Profit", "Trade", "Work"] },
  { word: "Bank", clues: ["Money", "Loan", "Save"] },
  { word: "ATM", clues: ["Cash", "Machine", "Card"] },
  { word: "Hospital", clues: ["Doctor", "Care", "Health"] },
  { word: "Pharmacy", clues: ["Medicine", "Shop", "Health"] },
  { word: "Police", clues: ["Law", "Security", "Uniform"] },
  { word: "Army", clues: ["Defense", "Nation", "Force"] },
  { word: "Road", clues: ["Travel", "Dust", "Path"] },
  { word: "Bridge", clues: ["Cross", "River", "Connect"] },
  { word: "Village", clues: ["Rural", "Simple", "Fields"] },
  { word: "City", clues: ["Crowd", "Buildings", "Busy"] },
  { word: "YouTube", clues: ["Video", "Platform", "Content"] },
  { word: "TikTok", clues: ["Short", "Viral", "Dance"] },
  { word: "Facebook", clues: ["Social", "Posts", "Friends"] },
  { word: "Instagram", clues: ["Photos", "Stories", "Reels"] },
  { word: "Camera", clues: ["Lens", "Capture", "Shoot"] },
  { word: "Director", clues: ["Vision", "Film", "Control"] },
  { word: "Producer", clues: ["Money", "Project", "Film"] },
  { word: "Script", clues: ["Story", "Dialogue", "Plan"] },
  { word: "Scene", clues: ["Shot", "Moment", "Frame"] },
  { word: "Trailer", clues: ["Preview", "Tease", "Movie"] },
  { word: "Premiere", clues: ["First", "Release", "Event"] },
  { word: "CinemaHall", clues: ["Screen", "Seats", "Movie"] },
  { word: "MusicVideo", clues: ["Song", "Visual", "Dance"] },
  { word: "Playback", clues: ["Voice", "Singer", "Film"] },
  { word: "Singer", clues: ["Voice", "Song", "Stage"] },
  { word: "Dance", clues: ["Move", "Rhythm", "Beat"] },
  { word: "Choreography", clues: ["Steps", "Design", "Dance"] },
  { word: "Award", clues: ["Prize", "Recognition", "Win"] },
  { word: "Fame", clues: ["Popularity", "Attention", "Star"] },
  { word: "Fan", clues: ["Support", "Follow", "Love"] },
  { word: "Vlog", clues: ["Daily", "Life", "Video"] },
  { word: "Podcast", clues: ["Talk", "Audio", "Discussion"] },
  { word: "Interview", clues: ["Questions", "Answers", "Talk"] },
  { word: "Comedy", clues: ["Laugh", "Fun", "Joke"] },
  { word: "Drama", clues: ["Emotion", "Story", "Acting"] },
  { word: "Action", clues: ["Fight", "Fast", "Stunts"] },
  { word: "Romance", clues: ["Love", "Emotion", "Couple"] },
  { word: "Viral", clues: ["Trending", "Spread", "Famous"] },
  { word: "Trend", clues: ["Popular", "Now", "Online"] },
  { word: "Editor", clues: ["Cut", "Arrange", "Video"] },
  { word: "Thumbnail", clues: ["Click", "Image", "Preview"] },
  { word: "Subscriber", clues: ["Follow", "Channel", "Count"] },
  { word: "Like", clues: ["Heart", "Click", "Support"] },
  { word: "Comment", clues: ["Opinion", "Text", "Feedback"] },
  { word: "Share", clues: ["Spread", "Send", "Post"] },
  { word: "Studio", clues: ["Recording", "Sound", "Work"] },
  { word: "Mic", clues: ["Voice", "Sound", "Record"] },
  { word: "Streaming", clues: ["Live", "Online", "Watch"] },
  { word: "Live", clues: ["Real-time", "Stream", "Now"] },
  { word: "Influencer", clues: ["Audience", "Impact", "Social"] },
  { word: "Creator", clues: ["Content", "Make", "Idea"] },
  { word: "Brand", clues: ["Product", "Name", "Identity"] },
  { word: "Promotion", clues: ["Advertise", "Reach", "Market"] },
  { word: "Shooting", clues: ["Camera", "Scene", "Film"] },
  { word: "Location", clues: ["Place", "Shoot", "Scene"] },
  { word: "Lighting", clues: ["Brightness", "Setup", "Scene"] },
  { word: "Sound", clues: ["Audio", "Noise", "Record"] },
  { word: "Makeup", clues: ["Face", "Beauty", "Style"] },
  { word: "Costume", clues: ["Dress", "Character", "Style"] },
  { word: "Stage", clues: ["Performance", "Live", "Audience"] },
  { word: "Audience", clues: ["Watch", "People", "Viewers"] },
  { word: "PrithviNarayanShah", clues: ["Unifier", "King", "Gorkha"] },
  { word: "Democracy", clues: ["Vote", "Freedom", "System"] },
  { word: "Monarchy", clues: ["King", "Rule", "Crown"] },
  { word: "Republic", clues: ["NoKing", "People", "System"] },
  { word: "Constitution", clues: ["Law", "Rights", "Nation"] },
  { word: "Panchayat", clues: ["System", "NoParty", "Past"] },
  { word: "Revolution", clues: ["Change", "Movement", "Struggle"] },
  { word: "CivilWar", clues: ["Conflict", "Internal", "Violence"] },
  { word: "PeaceProcess", clues: ["Agreement", "End", "Conflict"] },
  { word: "Election", clues: ["Vote", "People", "Choose"] },
  { word: "Parliament", clues: ["Law", "Debate", "Leaders"] },
  { word: "PrimeMinister", clues: ["Leader", "Government", "Power"] },
  { word: "President", clues: ["Head", "Nation", "Ceremonial"] },
  { word: "Gorkha", clues: ["Origin", "Kingdom", "History"] },
  { word: "KathmanduValley", clues: ["Cities", "Culture", "Valley"] },
  { word: "Treaty", clues: ["Agreement", "Nation", "History"] },
  { word: "Sugauli", clues: ["Border", "British", "Treaty"] },
  { word: "Earthquake2015", clues: ["Disaster", "Shake", "Loss"] },
  { word: "Blockade", clues: ["Shortage", "Border", "Crisis"] },
  { word: "Federalism", clues: ["States", "System", "Division"] },
  { word: "Province", clues: ["Region", "Division", "State"] },
  { word: "Citizenship", clues: ["Identity", "Rights", "Nation"] },
  { word: "Corruption", clues: ["Illegal", "Money", "Power"] },
  { word: "Tax", clues: ["Government", "Money", "Pay"] },
  { word: "Budget", clues: ["Plan", "Money", "Government"] },
  { word: "Development", clues: ["Progress", "Growth", "Change"] },
  { word: "Infrastructure", clues: ["Road", "Bridge", "System"] },
  { word: "Diplomacy", clues: ["Relations", "Talk", "Nation"] },
  { word: "Embassy", clues: ["Foreign", "Office", "Nation"] },
  { word: "Border", clues: ["Line", "Nation", "Divide"] },
  { word: "India", clues: ["Neighbor", "South", "Trade"] },
  { word: "China", clues: ["North", "Power", "Border"] },
  { word: "UN", clues: ["Global", "Peace", "Organization"] },
  { word: "Peacekeeping", clues: ["Army", "UN", "Mission"] },
  { word: "History", clues: ["Past", "Events", "Record"] },
  { word: "Culture", clues: ["Tradition", "Identity", "Life"] },
  { word: "Heritage", clues: ["Old", "Value", "Preserve"] },
  { word: "UNESCO", clues: ["World", "Heritage", "List"] },
  { word: "Museum", clues: ["Artifacts", "History", "Display"] },
  { word: "Archive", clues: ["Records", "Past", "Store"] },
  { word: "Leader", clues: ["Guide", "Power", "People"] },
  { word: "Party", clues: ["Politics", "Group", "Election"] },
  { word: "Manifesto", clues: ["Plan", "Promise", "Election"] },
  { word: "Campaign", clues: ["Promote", "Vote", "Election"] },
  { word: "Vote", clues: ["Choose", "Right", "Election"] },
  { word: "Ballot", clues: ["Paper", "Vote", "Box"] },
  { word: "Power", clues: ["Control", "Authority", "Rule"] },
  { word: "Authority", clues: ["Control", "Right", "Power"] },
  { word: "Justice", clues: ["Fairness", "Law", "Court"] },
  { word: "Court", clues: ["Judge", "Law", "Case"] },
  { word: "Lawyer", clues: ["Legal", "Case", "Court"] },
  { word: "Judge", clues: ["Decision", "Court", "Law"] },
  { word: "Agriculture", clues: ["Farming", "Land", "Production"] },
  { word: "Paddy", clues: ["Water", "Rice", "Field"] },
  { word: "Wheat", clues: ["Grain", "Harvest", "Flour"] },
  { word: "Barley", clues: ["Grain", "Cold", "Field"] },
  { word: "Harvest", clues: ["Cutting", "Season", "Crop"] },
  { word: "Irrigation", clues: ["Water", "Supply", "Field"] },
  { word: "Plough", clues: ["Soil", "Tool", "Farming"] },
  { word: "Buffalo", clues: ["Milk", "Farm", "Animal"] },
  { word: "Cow", clues: ["Milk", "Sacred", "Animal"] },
  { word: "Goat", clues: ["Meat", "Festival", "Animal"] },
  { word: "Chicken", clues: ["Egg", "Farm", "Bird"] },
  { word: "Dairy", clues: ["Milk", "Product", "Farm"] },
  { word: "Milk", clues: ["White", "Drink", "Nutrition"] },
  { word: "Ghee", clues: ["Fat", "Cooking", "Traditional"] },
  { word: "Vendor", clues: ["Street", "Sell", "Goods"] },
  { word: "Trade", clues: ["Exchange", "Goods", "Market"] },
  { word: "Import", clues: ["Foreign", "Goods", "Bring"] },
  { word: "Export", clues: ["Send", "Goods", "Foreign"] },
  { word: "Loan", clues: ["Borrow", "Money", "Interest"] },
  { word: "Interest", clues: ["Extra", "Bank", "Loan"] },
  { word: "Remittance", clues: ["Abroad", "Money", "Family"] },
  { word: "Salary", clues: ["Monthly", "Income", "Job"] },
  { word: "Income", clues: ["Earning", "Money", "Work"] },
  { word: "Expense", clues: ["Spend", "Money", "Daily"] },
  { word: "Saving", clues: ["Future", "Money", "Store"] },
  { word: "Job", clues: ["Work", "Office", "Income"] },
  { word: "Office", clues: ["Workplace", "Desk", "Job"] },
  { word: "Labor", clues: ["Physical", "Work", "Effort"] },
  { word: "Construction", clues: ["Building", "Work", "Site"] },
  { word: "Mason", clues: ["Brick", "Build", "Worker"] },
  { word: "Transport", clues: ["Move", "Goods", "Travel"] },
  { word: "Truck", clues: ["Goods", "Heavy", "Transport"] },
  { word: "Petrol", clues: ["Fuel", "Vehicle", "Energy"] },
  { word: "Diesel", clues: ["Fuel", "Engine", "Heavy"] },
  { word: "Electricity", clues: ["Power", "Light", "Energy"] },
  { word: "Hydropower", clues: ["Water", "Electric", "Energy"] },
  { word: "Student", clues: ["Learn", "Study", "Future"] },
  { word: "Teacher", clues: ["Guide", "Teach", "School"] },
  { word: "Doctor", clues: ["Heal", "Medicine", "Care"] },
  { word: "Medicine", clues: ["Health", "Cure", "Drug"] },
  { word: "Water", clues: ["Drink", "Life", "Essential"] },
  { word: "Tap", clues: ["Water", "Flow", "House"] },
  { word: "Well", clues: ["Water", "Ground", "Source"] },
  { word: "House", clues: ["Home", "Family", "Shelter"] },
  { word: "Rent", clues: ["Pay", "House", "Stay"] },
  { word: "Kitchen", clues: ["Cook", "Food", "Home"] },
  { word: "Gas", clues: ["Cook", "Fuel", "Cylinder"] },
  { word: "Clothes", clues: ["Wear", "Dress", "Fabric"] },
  { word: "Laundry", clues: ["Wash", "Clothes", "Clean"] },
  { word: "Festival", clues: ["Celebrate", "Culture", "Joy"] },
  { word: "Migration", clues: ["Move", "Abroad", "Work"] },
  { word: "Abroad", clues: ["Foreign", "Work", "Travel"] },
  { word: "Tourism", clues: ["Visitors", "Travel", "Economy"] },
  { word: "Guide", clues: ["Help", "Tour", "Explain"] },
  { word: "Hotel", clues: ["Stay", "Guest", "Room"] },
  { word: "Restaurant", clues: ["Food", "Eat", "Service"] },
  { word: "Tea", clues: ["Drink", "Hot", "Relax"] },
  { word: "Coffee", clues: ["Drink", "Energy", "Cafe"] },
  { word: "Traffic", clues: ["Jam", "Horns", "Slow"] },
  { word: "Politics", clues: ["Power", "Speech", "Debate"] }
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