const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

// Commented out Sequelize/database to avoid TypeError
// const sequelize = require('./config/database');
// const authRoutes = require('./routes/auth.routes');
// const vehicleRoutes = require('./routes/vehicles.routes');
// const inquiryRoutes = require('./routes/inquiries.routes');
// const financingRoutes = require('./routes/financing.routes');
// const testDriveRoutes = require('./routes/test-drives.routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', limiter);

// Static files
app.use('/uploads', express.static('uploads'));

// Commented out routes to avoid errors
// app.use('/api/auth', authRoutes);
// app.use('/api/vehicles', vehicleRoutes);
// app.use('/api/inquiries', inquiryRoutes);
// app.use('/api/financing', financingRoutes);
// app.use('/api/test-drives', testDriveRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// WebSocket for AI Chat
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
  });
  
  socket.on('chat-message', async (data) => {
    try {
      const aiResponse = await generateAIResponse(data.message);
      io.to(`user-${data.userId}`).emit('ai-response', {
        message: aiResponse,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Chat error:', error);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Server start (no database dependency)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
});

// AI Chat response generator
async function generateAIResponse(message) {
  const responses = {
    greeting: [
      "Hello! I'm your Atro Motors assistant. How can I help you find your dream car today?",
      "Hi there! Ready to help you discover the perfect vehicle. What are you looking for?",
      "Welcome to Atro Motors! I'm here to assist with all your car needs."
    ],
    vehicle: [
      "We have a wide range of quality pre-owned vehicles. What specific model are you interested in?",
      "Our inventory features carefully inspected SUVs, sedans, and luxury vehicles.",
      "I can help you find the perfect vehicle based on your needs and budget."
    ],
    financing: [
      "We offer flexible financing options with competitive rates.",
      "Our financing plans include low down payments and flexible terms.",
      "We make car ownership affordable with various payment plans."
    ],
    warranty: [
      "All our vehicles come with comprehensive warranty options.",
      "We provide warranty coverage based on vehicle age and condition.",
      "Our warranty packages include roadside assistance."
    ],
    contact: [
      "You can reach us at +254 700 123 456 or visit our showroom.",
      "Contact us via WhatsApp at +254 712 345 678 for immediate assistance.",
      "Our team is available 7 days a week to help you."
    ]
  };

  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
  } else if (lowerMessage.includes('car') || lowerMessage.includes('vehicle')) {
    return responses.vehicle[Math.floor(Math.random() * responses.vehicle.length)];
  } else if (lowerMessage.includes('finance') || lowerMessage.includes('loan')) {
    return responses.financing[Math.floor(Math.random() * responses.financing.length)];
  } else if (lowerMessage.includes('warranty')) {
    return responses.warranty[Math.floor(Math.random() * responses.warranty.length)];
  } else if (lowerMessage.includes('contact') || lowerMessage.includes('call')) {
    return responses.contact[Math.floor(Math.random() * responses.contact.length)];
  } else {
    return "I'd be happy to help with that! Could you provide more details so I can assist you better?";
  }
}
