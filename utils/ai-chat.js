const axios = require('axios');
const { Op } = require('sequelize');
const Vehicle = require('../models/Vehicle');

// Enhanced AI chat responses
class AIChatAssistant {
  constructor() {
    this.context = {};
    this.conversationHistory = [];
  }

  // Process user message
  async processMessage(message, userId = null) {
    try {
      const lowerMessage = message.toLowerCase();
      this.conversationHistory.push({ role: 'user', content: message });

      // Check for specific intents
      if (this.isGreeting(lowerMessage)) {
        return this.handleGreeting();
      } else if (this.isVehicleInquiry(lowerMessage)) {
        return await this.handleVehicleInquiry(lowerMessage);
      } else if (this.isFinancingQuestion(lowerMessage)) {
        return this.handleFinancingQuestion();
      } else if (this.isTestDriveQuestion(lowerMessage)) {
        return this.handleTestDriveQuestion();
      } else if (this.isPriceQuestion(lowerMessage)) {
        return await this.handlePriceQuestion(lowerMessage);
      } else if (this.isAvailabilityQuestion(lowerMessage)) {
        return await this.handleAvailabilityQuestion(lowerMessage);
      } else if (this.isContactQuestion(lowerMessage)) {
        return this.handleContactQuestion();
      } else if (this.isHoursQuestion(lowerMessage)) {
        return this.handleHoursQuestion();
      } else if (this.isWarrantyQuestion(lowerMessage)) {
        return this.handleWarrantyQuestion();
      } else {
        return this.handleGeneralQuestion();
      }
    } catch (error) {
      console.error('AI chat error:', error);
      return "I apologize, but I'm having trouble processing your request. Please try again or contact our support team directly.";
    }
  }

  // Intent detection methods
  isGreeting(message) {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => message.includes(greeting));
  }

  isVehicleInquiry(message) {
    const keywords = ['car', 'vehicle', 'suv', 'sedan', 'toyota', 'mercedes', 'bmw', 'subaru', 'honda', 'ford', 'nissan'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isFinancingQuestion(message) {
    const keywords = ['finance', 'loan', 'payment', 'installment', 'credit', 'interest rate', 'down payment'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isTestDriveQuestion(message) {
    const keywords = ['test drive', 'drive test', 'try car', 'test car'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isPriceQuestion(message) {
    const keywords = ['price', 'cost', 'how much', 'affordable', 'budget', 'expensive', 'cheap'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isAvailabilityQuestion(message) {
    const keywords = ['available', 'in stock', 'have', 'stock', 'inventory'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isContactQuestion(message) {
    const keywords = ['contact', 'call', 'phone', 'email', 'whatsapp', 'address', 'location'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isHoursQuestion(message) {
    const keywords = ['hour', 'open', 'close', 'time', 'when', 'weekend', 'sunday'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isWarrantyQuestion(message) {
    const keywords = ['warranty', 'guarantee', 'cover', 'insurance', 'protection'];
    return keywords.some(keyword => message.includes(keyword));
  }

  // Response handlers
  handleGreeting() {
    const greetings = [
      "Hello! I'm your Atro Motors assistant. How can I help you find your dream car today?",
      "Hi there! Ready to help you discover the perfect vehicle. What are you looking for?",
      "Welcome to Atro Motors! I'm here to assist with all your car needs. How can I help?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  async handleVehicleInquiry(message) {
    // Extract vehicle type from message
    const vehicleTypes = ['suv', 'sedan', 'hatchback', 'truck', 'luxury'];
    const makes = ['toyota', 'mercedes', 'bmw', 'subaru', 'honda', 'ford', 'nissan', 'mazda'];
    
    let type = vehicleTypes.find(t => message.includes(t));
    let make = makes.find(m => message.includes(m));
    
    // Search for vehicles
    const where = { status: 'available' };
    if (type) where.bodyType = type;
    if (make) where.make = make.charAt(0).toUpperCase() + make.slice(1);
    
    const vehicles = await Vehicle.findAll({
      where,
      limit: 5,
      order: [['price', 'ASC']]
    });

    if (vehicles.length === 0) {
      return "I couldn't find any vehicles matching your criteria. Could you be more specific or try different search terms?";
    }

    let response = `I found ${vehicles.length} vehicle(s) that might interest you:\n\n`;
    
    vehicles.forEach((vehicle, index) => {
      response += `${index + 1}. ${vehicle.make} ${vehicle.model} ${vehicle.year}\n`;
      response += `   Price: Ksh ${vehicle.price.toLocaleString()}\n`;
      response += `   Mileage: ${vehicle.mileage ? vehicle.mileage.toLocaleString() + ' km' : 'N/A'}\n`;
      response += `   Fuel: ${vehicle.fuelType}, Transmission: ${vehicle.transmission}\n\n`;
    });

    response += "Would you like more details on any of these vehicles?";
    return response;
  }

  handleFinancingQuestion() {
    return `We offer flexible financing options at Atro Motors:\n\n` +
           `• Competitive interest rates starting from 8.5%\n` +
           `• Loan terms from 12 to 84 months\n` +
           `• Low down payment options available\n` +
           `• Quick approval process (24-48 hours)\n` +
           `• Both employed and self-employed applicants welcome\n\n` +
           `Would you like to calculate monthly payments or apply for pre-approval?`;
  }

  handleTestDriveQuestion() {
    return `Scheduling a test drive is easy:\n\n` +
           `1. Choose your preferred vehicle\n` +
           `2. Select a convenient date and time\n` +
           `3. Visit our showroom or request a home test drive\n\n` +
           `We're open Monday-Friday 8:30 AM - 6:00 PM, Saturday 9:00 AM - 4:00 PM, and Sunday 10:00 AM - 2:00 PM.\n\n` +
           `Would you like me to help you schedule a test drive?`;
  }

  async handlePriceQuestion(message) {
    // Extract price range if mentioned
    const priceMatch = message.match(/(\d+)\s*(k|thousand|million|m)/i);
    let priceRange = null;
    
    if (priceMatch) {
      const number = parseInt(priceMatch[1]);
      const unit = priceMatch[2].toLowerCase();
      
      if (unit === 'k' || unit === 'thousand') {
        priceRange = number * 1000;
      } else if (unit === 'm' || unit === 'million') {
        priceRange = number * 1000000;
      }
    }

    const where = { status: 'available' };
    if (priceRange) {
      where.price = {
        [Op.lte]: priceRange
      };
    }

    const vehicles = await Vehicle.findAll({
      where,
      attributes: ['make', 'model', 'year', 'price'],
      order: [['price', 'ASC']],
      limit: 3
    });

    if (vehicles.length === 0) {
      return priceRange 
        ? `I couldn't find vehicles within Ksh ${priceRange.toLocaleString()}. Our vehicles typically range from Ksh 1.5M to Ksh 15M.`
        : `Our vehicles range from Ksh 1.5M to Ksh 15M. What's your budget range?`;
    }

    let response = "Here are some vehicles within your price range:\n\n";
    vehicles.forEach(vehicle => {
      response += `• ${vehicle.make} ${vehicle.model} ${vehicle.year}: Ksh ${vehicle.price.toLocaleString()}\n`;
    });
    
    response += `\nWe also offer financing options to make your dream car more affordable.`;
    return response;
  }

  async handleAvailabilityQuestion(message) {
    const makes = ['toyota', 'mercedes', 'bmw', 'subaru', 'honda', 'ford', 'nissan'];
    const make = makes.find(m => message.includes(m));
    
    const where = { status: 'available' };
    if (make) {
      where.make = make.charAt(0).toUpperCase() + make.slice(1);
    }

    const count = await Vehicle.count({ where });
    
    if (count === 0) {
      return make 
        ? `We currently don't have ${make} vehicles in stock, but we're expecting new arrivals soon.`
        : "We have a wide selection of vehicles available. Could you specify which make or type you're interested in?";
    }

    return make 
      ? `We have ${count} ${make} vehicle(s) currently available. Would you like me to show you the details?`
      : `We have ${count} vehicles currently available in our inventory. What type of vehicle are you looking for?`;
  }

  handleContactQuestion() {
    return `You can reach us through:\n\n` +
           `📍 Showroom: 123 Auto Plaza, Nairobi (Near ABC Mall, Off Mombasa Road)\n` +
           `📞 Phone: +254 700 123 456 / +254 712 345 678\n` +
           `📱 WhatsApp: +254 712 345 678\n` +
           `📧 Email: info@atromotors.com\n` +
           `🌐 Website: www.atromotors.com\n\n` +
           `Our team is available 7 days a week to assist you.`;
  }

  handleHoursQuestion() {
    return `Our business hours:\n\n` +
           `Monday - Friday: 8:30 AM - 6:00 PM\n` +
           `Saturday: 9:00 AM - 4:00 PM\n` +
           `Sunday: 10:00 AM - 2:00 PM\n` +
           `Public Holidays: 10:00 AM - 3:00 PM\n\n` +
           `Test drives can be scheduled during these hours.`;
  }

  handleWarrantyQuestion() {
    return `All our vehicles come with comprehensive warranty options:\n\n` +
           `• Standard 6-month warranty on all vehicles\n` +
           `• Extended warranty available up to 24 months\n` +
           `• Covers engine, transmission, and major components\n` +
           `• Includes roadside assistance\n` +
           `• Transferable to new owner\n\n` +
           `Warranty duration depends on vehicle age, mileage, and condition.`;
  }

  handleGeneralQuestion() {
    const responses = [
      "I'd be happy to help with that! Could you provide more details so I can assist you better?",
      "That's a great question! Let me connect you with the right information. What specifically would you like to know?",
      "I understand you're looking for information. Could you tell me more about what you need help with?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
    this.context = {};
  }
}

module.exports = new AIChatAssistant();// placeholder
