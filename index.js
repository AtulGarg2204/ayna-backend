const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const authRoutes = require('./src/routes/auth');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
// Add this to your src/index.js
app.get('/', (req, res) => {
    res.json({ message: "Server is running" });
  });
// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);

// Socket.io connection handling
// In your server's index.js
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
  
    socket.on('message', (message) => {
      console.log('Message received:', message);
      
      // Send original message back to sender
      socket.emit('message', {
        ...message,
        isFromServer: false
      });
      
      // Send server response
      setTimeout(() => {
        socket.emit('message', {
          text: message.text,  // Echo the same text
          userId: 'server',
          sessionId: message.sessionId,
          timestamp: new Date().toISOString(),
          isFromServer: true
        });
      }, 100); // Small delay to ensure messages appear in order
    });
  
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});