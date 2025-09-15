// Ask Disha 2.0 - AI Chatbot
class AskDisha {
    constructor() {
        this.chatHistory = [];
        this.isTyping = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupQuickActions();
    }

    setupEventListeners() {
        // Chat form submission
        document.getElementById('chat-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUserMessage();
        });

        // Enter key in chat input
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleUserMessage();
            }
        });
    }

    setupQuickActions() {
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    handleUserMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        input.value = '';
        
        // Process message and get response
        this.processMessage(message);
    }

    handleQuickAction(action) {
        const messages = {
            'book-ticket': 'I want to book a train ticket',
            'check-pnr': 'Check my PNR status',
            'live-status': 'Track my train live status',
            'station-info': 'Get station information',
            'pantry-order': 'Order food from pantry cart'
        };
        
        const message = messages[action];
        if (message) {
            this.addMessage(message, 'user');
            this.processMessage(message);
        }
    }

    addMessage(content, sender) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'user' ? '👤' : '🤖';
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-bubble">
                    <p>${this.formatMessage(content)}</p>
                </div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Store in chat history
        this.chatHistory.push({ content, sender, timestamp: new Date() });
    }

    formatMessage(content) {
        // Convert URLs to clickable links
        content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: var(--irctc-blue);">$1</a>');
        
        // Convert train numbers to bold
        content = content.replace(/\b(\d{5})\b/g, '<strong>$1</strong>');
        
        // Convert PNR numbers to bold
        content = content.replace(/\b(\d{10})\b/g, '<strong>$1</strong>');
        
        return content;
    }

    async processMessage(message) {
        if (this.isTyping) return;
        
        this.isTyping = true;
        this.showTypingIndicator();
        
        // Simulate AI processing delay
        await this.delay(1000 + Math.random() * 2000);
        
        const response = this.generateResponse(message);
        this.hideTypingIndicator();
        this.addMessage(response, 'bot');
        
        this.isTyping = false;
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-bubble">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span>Disha is typing</span>
                        <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    generateResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Booking related queries
        if (this.containsAny(lowerMessage, ['book', 'ticket', 'booking', 'reserve', 'availability'])) {
            return this.getBookingResponse(message);
        }
        
        // PNR related queries
        if (this.containsAny(lowerMessage, ['pnr', 'status', 'check pnr', 'ticket status'])) {
            return this.getPNRResponse(message);
        }
        
        // Live status queries
        if (this.containsAny(lowerMessage, ['live', 'track', 'tracking', 'status', 'delay', 'running'])) {
            return this.getLiveStatusResponse(message);
        }
        
        // Station queries
        if (this.containsAny(lowerMessage, ['station', 'platform', 'facility', 'amenities'])) {
            return this.getStationResponse(message);
        }
        
        // Pantry queries
        if (this.containsAny(lowerMessage, ['food', 'pantry', 'order', 'menu', 'eat', 'meal'])) {
            return this.getPantryResponse(message);
        }
        
        // General queries
        if (this.containsAny(lowerMessage, ['hello', 'hi', 'hey', 'help', 'assist'])) {
            return this.getGreetingResponse();
        }
        
        // Fare queries
        if (this.containsAny(lowerMessage, ['fare', 'price', 'cost', 'charge', 'rate'])) {
            return this.getFareResponse(message);
        }
        
        // Cancellation queries
        if (this.containsAny(lowerMessage, ['cancel', 'refund', 'return', 'modify'])) {
            return this.getCancellationResponse(message);
        }
        
        // Default response
        return this.getDefaultResponse(message);
    }

    getBookingResponse(message) {
        const responses = [
            "I can help you book train tickets! Please visit our 'Book Tickets' section to check availability and make reservations. You can search for trains between any two stations and select your preferred date and class.",
            "For train bookings, I recommend using our booking system. You can check real-time availability, compare fares, and book tickets instantly. Would you like me to guide you through the booking process?",
            "To book a train ticket, you'll need to select your departure and destination stations, choose your travel date, and pick your preferred class. Our system will show you all available trains with their timings and fares."
        ];
        return this.getRandomResponse(responses);
    }

    getPNRResponse(message) {
        const responses = [
            "I can help you check your PNR status! Please visit our 'PNR Status' section and enter your 10-digit PNR number. You'll get instant information about your booking status, seat details, and journey information.",
            "To check PNR status, you can use our PNR checker tool. Just enter your PNR number and you'll see your booking details, passenger information, and current status (Confirmed/RAC/Waitlisted).",
            "PNR status checking is quick and easy! Go to the PNR Status page, enter your PNR number, and get instant results about your ticket status and journey details."
        ];
        return this.getRandomResponse(responses);
    }

    getLiveStatusResponse(message) {
        const responses = [
            "For live train tracking, please use our 'Live Status' feature. Enter your train number and journey date to get real-time information about your train's current location, delays, and expected arrival times.",
            "I can help you track your train! Use the Live Status tool by entering your 5-digit train number. You'll get updates on the train's current position, running status, and estimated arrival times at upcoming stations.",
            "To track your train live, visit our Live Status section. Enter your train number and date to see real-time updates about delays, current location, and arrival/departure times at each station."
        ];
        return this.getRandomResponse(responses);
    }

    getStationResponse(message) {
        const responses = [
            "I can provide information about railway stations! Use our 'At Station' feature to get live information about trains currently at any station, including arrival and departure times.",
            "For station information, you can use our station lookup tool. Enter the station code to get details about facilities, live train information, and station amenities.",
            "Station information is available through our At Station feature. Just enter the 3-4 letter station code to see live train schedules and station details."
        ];
        return this.getRandomResponse(responses);
    }

    getPantryResponse(message) {
        const responses = [
            "Great! I can help you with pantry cart ordering. Visit our 'Pantry Cart' section, enter your train number, and browse the available food menu. You can order delicious meals delivered right to your seat!",
            "For food ordering, use our Pantry Cart service. Select your train, browse the menu with various categories like breakfast, lunch, snacks, and desserts, then place your order for delivery to your seat.",
            "Pantry cart ordering is easy! Go to the Pantry Cart page, enter your train number, and you'll see a complete menu. Add items to your cart and place your order for fresh food delivery on the train."
        ];
        return this.getRandomResponse(responses);
    }

    getGreetingResponse() {
        const responses = [
            "Hello! I'm Disha 2.0, your AI railway assistant. I'm here to help you with train bookings, PNR status, live tracking, station information, and more. What can I assist you with today?",
            "Hi there! Welcome to Easy-Rail. I'm Disha, your personal railway assistant. I can help you with ticket bookings, checking PNR status, tracking trains, and answering any railway-related questions. How can I help you?",
            "Hello! I'm Disha 2.0, your AI-powered railway helper. I'm available 24/7 to assist you with all your train travel needs. Whether it's booking tickets, checking status, or general queries, I'm here to help!"
        ];
        return this.getRandomResponse(responses);
    }

    getFareResponse(message) {
        const responses = [
            "For fare information, I recommend using our booking system to check real-time fares. Fares vary based on train type, class, and demand. You can compare different trains and classes to find the best option for your budget.",
            "Train fares depend on several factors like train type (Rajdhani, Shatabdi, Express), class (1AC, 2AC, 3AC, Sleeper, 2S), and demand. Use our booking tool to get accurate, real-time fare information.",
            "To check train fares, use our booking system where you can see live pricing for all available trains and classes. Fares are updated in real-time and may vary based on availability and demand."
        ];
        return this.getRandomResponse(responses);
    }

    getCancellationResponse(message) {
        const responses = [
            "For ticket cancellation and refunds, you can use our booking management system. Refund policies vary based on cancellation time and train type. Generally, you can cancel up to 4 hours before departure for most trains.",
            "Ticket cancellation is available through our booking system. Refund amounts depend on when you cancel - earlier cancellations get higher refunds. Check the specific refund policy for your train and class.",
            "I can help you with cancellation information. Use our booking management tool to cancel tickets and check refund eligibility. Refund policies are clearly displayed based on your specific booking."
        ];
        return this.getRandomResponse(responses);
    }

    getDefaultResponse(message) {
        const responses = [
            "I understand you're looking for help. I can assist you with train bookings, PNR status, live tracking, station information, pantry ordering, and general railway queries. Could you please be more specific about what you need?",
            "I'm here to help with all railway-related queries! I can assist with booking tickets, checking PNR status, tracking trains, station information, food ordering, and more. What specific information do you need?",
            "I'm Disha 2.0, your railway assistant. I can help with train bookings, PNR status, live tracking, station details, pantry orders, and general railway questions. Please let me know what you'd like to know more about.",
            "I'm here to help with your railway needs! I can assist with ticket booking, PNR checking, live train tracking, station information, food ordering, and answering general railway questions. What can I help you with today?"
        ];
        return this.getRandomResponse(responses);
    }

    containsAny(message, keywords) {
        return keywords.some(keyword => message.includes(keyword));
    }

    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize Ask Disha when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.askDisha = new AskDisha();
});
