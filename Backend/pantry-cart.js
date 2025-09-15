// Pantry Cart Ordering System - New Design
class PantryCart {
    constructor() {
        this.cart = [];
        this.currentTrain = null;
        this.menuData = this.getMenuData();
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Train selection form
        document.getElementById('train-selection-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTrainSelection();
        });

        // New order button
        document.getElementById('new-order').addEventListener('click', () => {
            this.startNewOrder();
        });
    }

    async handleTrainSelection() {
        const trainNumber = document.getElementById('train-number').value.trim();
        const seatNumber = document.getElementById('seat-number').value.trim();
        
        if (!trainNumber) {
            this.showError('Please enter a train number');
            return;
        }

        if (trainNumber.length !== 5) {
            this.showError('Please enter a valid 5-digit train number');
            return;
        }

        if (!seatNumber) {
            this.showError('Please enter your seat number');
            return;
        }

        this.showLoading(true);
        
        try {
            // Simulate API call to get train details
            await this.delay(1000);
            
            this.currentTrain = {
                number: trainNumber,
                name: this.getTrainName(trainNumber),
                route: this.getTrainRoute(trainNumber),
                dateTime: this.getCurrentDateTime(),
                seat: seatNumber
            };

            this.showJourneyDetails();
            this.showPantryMenu();
            this.showLoading(false);
            
        } catch (error) {
            this.showLoading(false);
            this.showError('Failed to load train information. Please try again.');
        }
    }

    showJourneyDetails() {
        const journeyDetails = document.getElementById('journey-details');
        
        // Update journey details
        document.getElementById('display-train-number').textContent = this.currentTrain.number;
        document.getElementById('display-train-name').textContent = this.currentTrain.name;
        document.getElementById('display-route').textContent = this.currentTrain.route;
        document.getElementById('display-date-time').textContent = this.currentTrain.dateTime;
        document.getElementById('display-seat').textContent = this.currentTrain.seat;
        
        journeyDetails.classList.remove('hidden');
    }

    showPantryMenu() {
        const pantryMenu = document.getElementById('pantry-menu');
        const menuContainer = document.getElementById('menu-items');
        
        let menuHTML = '';
        
        this.menuData.forEach(item => {
            menuHTML += this.createMenuItemHTML(item);
        });
        
        menuContainer.innerHTML = menuHTML;
        this.setupMenuEventListeners();
        pantryMenu.classList.remove('hidden');
        document.getElementById('cart-button').classList.remove('hidden');
    }

    createMenuItemHTML(item) {
        const isAvailable = Math.random() > 0.2; // 80% chance of being available
        
        return `
            <div class="menu-item-card" data-item-id="${item.id}">
                <div class="menu-item-image">
                    <img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'">
                    ${!isAvailable ? '<div class="not-available-overlay">Not Available</div>' : ''}
                </div>
                <div class="menu-item-content">
                <div class="menu-item-header">
                        <h3 class="menu-item-title">${item.name}</h3>
                    <div class="menu-item-price">₹${item.price}</div>
                </div>
                <div class="menu-item-description">${item.description}</div>
                    <div class="menu-item-tags">
                        ${item.tags.map(tag => `<span class="menu-tag ${tag.class}">${tag.text}</span>`).join('')}
                    </div>
                    <button class="add-to-cart-btn" data-item-id="${item.id}" ${!isAvailable ? 'disabled' : ''}>
                        <span>+</span>
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    }

    setupMenuEventListeners() {
        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.dataset.itemId;
                this.addToCart(itemId);
            });
        });
    }

    addToCart(itemId) {
        const item = this.findMenuItem(itemId);
        if (!item) return;
        
        // Check if item already in cart
        const existingItem = this.cart.find(cartItem => cartItem.id === itemId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...item,
                quantity: 1
            });
        }
        
        this.updateCartDisplay();
    }

    findMenuItem(itemId) {
        return this.menuData.find(item => item.id === itemId);
    }

    updateCartDisplay() {
        const cartCount = document.getElementById('cart-count');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        
        this.updateCartSidebar();
    }

    updateCartSidebar() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-cart-icon">🛒</div>
                    <p>Your cart is empty</p>
                </div>
            `;
            cartTotal.textContent = '0';
            return;
        }
        
        let total = 0;
        let itemsHTML = '';
        
        this.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            itemsHTML += `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'">
                    </div>
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">₹${item.price}</div>
                        </div>
                    <div class="cart-item-controls">
                        <button class="cart-quantity-btn" onclick="pantryCart.updateCartQuantity('${item.id}', -1)">-</button>
                        <span class="cart-quantity-display">${item.quantity}</span>
                        <button class="cart-quantity-btn" onclick="pantryCart.updateCartQuantity('${item.id}', 1)">+</button>
                    </div>
                    <div class="cart-item-total">₹${itemTotal}</div>
                </div>
            `;
        });
        
        cartItems.innerHTML = itemsHTML;
        cartTotal.textContent = total;
    }

    updateCartQuantity(itemId, change) {
        const item = this.cart.find(cartItem => cartItem.id === itemId);
        if (!item) return;
        
        item.quantity = Math.max(0, item.quantity + change);
        
        if (item.quantity === 0) {
            this.cart = this.cart.filter(cartItem => cartItem.id !== itemId);
        }
        
        this.updateCartDisplay();
    }

    toggleCart() {
        const cartSidebar = document.getElementById('cart-sidebar');
        cartSidebar.classList.toggle('hidden');
    }

    placeOrder() {
        if (this.cart.length === 0) {
            this.showError('Your cart is empty');
            return;
        }
        
        // Generate order ID
        const orderId = 'PC' + Date.now().toString().slice(-6);
        
        // Show confirmation
        document.getElementById('order-id').textContent = orderId;
        document.getElementById('order-confirmation').classList.remove('hidden');
        document.getElementById('pantry-menu').classList.add('hidden');
        document.getElementById('cart-button').classList.add('hidden');
        document.getElementById('cart-sidebar').classList.add('hidden');
        
        // Clear cart
        this.cart = [];
    }

    startNewOrder() {
        document.getElementById('order-confirmation').classList.add('hidden');
        document.getElementById('pantry-menu').classList.add('hidden');
        document.getElementById('journey-details').classList.add('hidden');
        document.getElementById('cart-button').classList.add('hidden');
        document.getElementById('cart-sidebar').classList.add('hidden');
        document.getElementById('train-number').value = '';
        document.getElementById('seat-number').value = '';
        this.cart = [];
    }

    showLoading(show) {
        const loadingState = document.getElementById('loading-state');
        if (show) {
            loadingState.classList.remove('hidden');
        } else {
            loadingState.classList.add('hidden');
        }
    }

    showError(message) {
        alert(message); // In a real app, you'd use a proper notification system
    }

    getTrainName(trainNumber) {
        const trainNames = {
            '12001': 'Shatabdi Express',
            '12002': 'Shatabdi Express',
            '12951': 'Mumbai Rajdhani Express',
            '12952': 'Mumbai Rajdhani Express',
            '12301': 'Howrah Rajdhani Express',
            '12302': 'Howrah Rajdhani Express',
            '12615': 'Grand Trunk Express',
            '12616': 'Grand Trunk Express',
            '12345': 'Golden Temple Mail',
            '12346': 'Golden Temple Mail',
            '12901': 'Rajdhani Express',
            '12902': 'Rajdhani Express',
            '12627': 'Karnataka Express',
            '12628': 'Karnataka Express',
            '12953': 'August Kranti Rajdhani',
            '12954': 'August Kranti Rajdhani'
        };
        
        // If train number exists in predefined list, return it
        if (trainNames[trainNumber]) {
            return trainNames[trainNumber];
        }
        
        // Generate dummy train name for any train number
        const trainTypes = ['Express', 'Mail', 'Rajdhani', 'Shatabdi', 'Duronto', 'Jan Shatabdi', 'Sampark Kranti'];
        const cities = ['Mumbai', 'Delhi', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];
        const randomType = trainTypes[Math.floor(Math.random() * trainTypes.length)];
        const randomCity = cities[Math.floor(Math.random() * cities.length)];
        
        return `${randomCity} ${randomType}`;
    }

    getTrainRoute(trainNumber) {
        const routes = {
            '12001': 'New Delhi → Bhopal',
            '12002': 'Bhopal → New Delhi',
            '12951': 'New Delhi → Mumbai Central',
            '12952': 'Mumbai Central → New Delhi',
            '12301': 'New Delhi → Howrah',
            '12302': 'Howrah → New Delhi',
            '12615': 'Chennai → New Delhi',
            '12616': 'New Delhi → Chennai',
            '12345': 'Amritsar → New Delhi',
            '12346': 'New Delhi → Amritsar',
            '12901': 'New Delhi → Mumbai Central',
            '12902': 'Mumbai Central → New Delhi',
            '12627': 'Bangalore → New Delhi',
            '12628': 'New Delhi → Bangalore',
            '12953': 'Mumbai Central → New Delhi',
            '12954': 'New Delhi → Mumbai Central'
        };
        
        // If train number exists in predefined list, return it
        if (routes[trainNumber]) {
            return routes[trainNumber];
        }
        
        // Generate dummy route for any train number
        const stations = [
            'New Delhi', 'Mumbai Central', 'Chennai Central', 'Bangalore City', 'Kolkata', 
            'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Bhopal', 'Amritsar',
            'Chandigarh', 'Indore', 'Nagpur', 'Vijayawada', 'Coimbatore', 'Kochi',
            'Patna', 'Ranchi', 'Bhubaneswar', 'Visakhapatnam', 'Mysore', 'Mangalore'
        ];
        
        // Use train number to generate consistent route (same number = same route)
        const num = parseInt(trainNumber) % stations.length;
        const fromStation = stations[num];
        const toStation = stations[(num + Math.floor(Math.random() * 5) + 1) % stations.length];
        
        return `${fromStation} → ${toStation}`;
    }

    getCurrentDateTime() {
        const now = new Date();
        const date = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        return `${date}, ${time}`;
    }

    getRandomSeat() {
        const coaches = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
        const seats = Array.from({length: 72}, (_, i) => i + 1);
        const coach = coaches[Math.floor(Math.random() * coaches.length)];
        const seat = seats[Math.floor(Math.random() * seats.length)];
        return `Coach ${coach}, Seat ${seat}`;
    }

    getMenuData() {
        return [
            {
                id: 'veg-thali',
                name: 'Vegetarian Thali',
                price: 180,
                description: 'Complete meal with rice, dal, vegetables, roti, pickle & papad',
                image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
                tags: [
                    { text: 'Veg', class: 'veg' },
                    { text: 'Complete Meal', class: 'category' }
                ]
            },
            {
                id: 'non-veg-thali',
                name: 'Non-Vegetarian Thali',
                price: 250,
                description: 'Chicken curry with rice, dal, vegetables, roti & accompaniments',
                image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
                tags: [
                    { text: 'Non-Veg', class: 'non-veg' },
                    { text: 'Complete Meal', class: 'category' }
                ]
            },
            {
                id: 'snacks-combo',
                name: 'Snacks Combo',
                    price: 120,
                description: 'Veg sandwich, samosa, and pakora with chutney',
                image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
                tags: [
                    { text: 'Veg', class: 'veg' },
                    { text: 'Snacks', class: 'category' }
                ]
            },
            {
                id: 'south-indian-breakfast',
                name: 'South Indian Breakfast',
                price: 140,
                description: 'Idli, dosa, upma with sambar and coconut chutney',
                image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop',
                tags: [
                    { text: 'Veg', class: 'veg' },
                    { text: 'Jain', class: 'jain' },
                    { text: 'Breakfast', class: 'category' }
                ]
            },
            {
                id: 'beverages',
                name: 'Beverages',
                    price: 60,
                description: 'Tea, coffee, cold drinks, and packaged water',
                image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
                tags: [
                    { text: 'Veg', class: 'veg' },
                    { text: 'Beverages', class: 'category' }
                ]
            },
            {
                id: 'indian-sweets',
                name: 'Indian Sweets',
                price: 100,
                description: 'Gulab jamun, rasgulla, and kheer',
                image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
                tags: [
                    { text: 'Veg', class: 'veg' },
                    { text: 'Desserts', class: 'category' }
                ]
            }
        ];
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global functions for HTML onclick events
function toggleCart() {
    window.pantryCart.toggleCart();
}

function placeOrder() {
    window.pantryCart.placeOrder();
}

// Initialize pantry cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pantryCart = new PantryCart();
});
