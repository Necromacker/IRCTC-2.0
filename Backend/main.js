// Main JavaScript for Easy-Rail App

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    setupMobileMenu();
    setupActiveNavigation();
    setupDateInputs();
    setupStationSearch();
    setupQuickSearch();
}

// Mobile Menu Toggle
function setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navbar = document.getElementById('navbar');
    
    if (mobileMenuToggle && navbar) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenuToggle.classList.toggle('active');
            navbar.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        const navLinks = navbar.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenuToggle.classList.remove('active');
                navbar.classList.remove('active');
            });
        });
    }
}

// Set active navigation based on current page
function setupActiveNavigation() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (currentPage === linkHref || (currentPage === '' && linkHref === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Setup date inputs with current date
function setupDateInputs() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

// Station search functionality
function setupStationSearch() {
    const fromInput = document.getElementById('from-station');
    const toInput = document.getElementById('to-station');
    
    if (fromInput) {
        setupStationInput(fromInput, 'suggestions-from');
    }
    
    if (toInput) {
        setupStationInput(toInput, 'suggestions-to');
    }
}

// Setup individual station input with autocomplete
function setupStationInput(input, suggestionsId) {
    let debounceTimer;
    const suggestionsContainer = document.getElementById(suggestionsId);
    
    input.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        const query = this.value.trim();
        
        if (query.length < 2) {
            hideSuggestions(suggestionsContainer);
            return;
        }
        
        debounceTimer = setTimeout(() => {
            searchStations(query, suggestionsContainer, input);
        }, 300);
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            hideSuggestions(suggestionsContainer);
        }
    });
}

// Search stations with autocomplete
async function searchStations(query, container, input) {
    try {
        const response = await fetch('../assets/stations.json');
        const data = await response.json();
        
        const stations = data.stations.filter(station => 
            station.stnName.toLowerCase().includes(query.toLowerCase()) ||
            station.stnCode.toLowerCase().includes(query.toLowerCase()) ||
            station.stnCity.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
        
        displaySuggestions(stations, container, input);
    } catch (error) {
        console.error('Error fetching stations:', error);
        hideSuggestions(container);
    }
}

// Display station suggestions
function displaySuggestions(stations, container, input) {
    if (stations.length === 0) {
        hideSuggestions(container);
        return;
    }
    
    container.innerHTML = '';
    container.style.display = 'block';
    
    stations.forEach(station => {
        const suggestion = document.createElement('div');
        suggestion.className = 'suggestion-item';
        suggestion.style.cssText = `
            padding: 0.75rem 1rem;
            cursor: pointer;
            border-bottom: 1px solid var(--border-color);
            transition: background-color 0.2s ease;
        `;
        suggestion.innerHTML = `
            <div style="font-weight: 500; color: var(--text-primary);">${station.stnName}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">${station.stnCode} - ${station.stnCity}</div>
        `;
        
        suggestion.addEventListener('click', function() {
            input.value = `${station.stnName} (${station.stnCode})`;
            sessionStorage.setItem(input.id === 'from-station' ? 'from' : 'to', station.stnCode);
            hideSuggestions(container);
        });
        
        suggestion.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'var(--bg-tertiary)';
        });
        
        suggestion.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
        
        container.appendChild(suggestion);
    });
}

// Hide suggestions
function hideSuggestions(container) {
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
}

// Quick search form setup
function setupQuickSearch() {
    const form = document.getElementById('quick-search-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            performQuickSearch();
        });
    }
}

// Perform quick search
function performQuickSearch() {
    const fromStation = document.getElementById('from-station').value;
    const toStation = document.getElementById('to-station').value;
    const journeyDate = document.getElementById('journey-date').value;
    
    if (!fromStation || !toStation) {
        showNotification('Please select both departure and destination stations.', 'warning');
        return;
    }
    
    // Extract station codes from the input values
    const fromCode = extractStationCode(fromStation);
    const toCode = extractStationCode(toStation);
    
    if (!fromCode || !toCode) {
        showNotification('Please select valid stations from the suggestions.', 'warning');
        return;
    }
    
    // Store in session storage for the search page
    sessionStorage.setItem('from', fromCode);
    sessionStorage.setItem('to', toCode);
    sessionStorage.setItem('journeyDate', journeyDate);
    
    // Redirect to search results or show results inline
    showSearchResults(fromCode, toCode, journeyDate);
}

// Extract station code from formatted string
function extractStationCode(stationString) {
    const match = stationString.match(/\(([A-Z]{3,4})\)/);
    return match ? match[1] : null;
}

// Show search results
async function showSearchResults(fromCode, toCode, journeyDate) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) {
        // Create results container if it doesn't exist
        const container = document.querySelector('.container');
        const resultsDiv = document.createElement('div');
        resultsDiv.id = 'search-results';
        resultsDiv.className = 'results-container';
        container.appendChild(resultsDiv);
    }
    
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const apiUrl = `https://erail.in/rail/getTrains.aspx?Station_From=${fromCode}&Station_To=${toCode}&DataSource=0&Language=0&Cache=true`;
        
        const response = await fetch(apiUrl);
        const data = await response.text();
        
        const result = parseTrainData(data);
        
        if (result.success && result.data.length > 0) {
            displayTrainResults(result.data, resultsDiv, fromCode, toCode);
        } else {
            resultsDiv.innerHTML = `
                <div class="card text-center">
                    <h3>No Trains Found</h3>
                    <p>No direct trains found between the selected stations. Please try different stations or check for connecting trains.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Search error:', error);
        resultsDiv.innerHTML = `
            <div class="card text-center">
                <h3>Search Error</h3>
                <p>Unable to fetch train data. Please try again later.</p>
            </div>
        `;
    }
}

// Parse train data from API response
function parseTrainData(data) {
    try {
        const arr = [];
        const rawData = data.split("~~~~~~~~").filter((el) => el.trim() !== "");
        
        if (rawData[0].includes("No direct trains found")) {
            return {
                success: false,
                data: "No direct trains found between the selected stations."
            };
        }
        
        if (rawData[0].includes("Please try again after some time.") ||
            rawData[0].includes("From station not found") ||
            rawData[0].includes("To station not found")) {
            return {
                success: false,
                data: rawData[0].replace(/~/g, "")
            };
        }
        
        for (let i = 0; i < rawData.length; i++) {
            const trainData = rawData[i].split("~^");
            const nextData = rawData[i + 1] || "";
            const trainData2 = nextData.split("~^");
            
            if (trainData.length === 2) {
                const details = trainData[1].split("~").filter((el) => el.trim() !== "");
                const details2 = trainData2[0] ? trainData2[0].split("~").filter((el) => el.trim() !== "") : [];
                
                if (details.length >= 14) {
                    arr.push({
                        train_no: details[0],
                        train_name: details[1],
                        source_stn_name: details[2],
                        source_stn_code: details[3],
                        dstn_stn_name: details[4],
                        dstn_stn_code: details[5],
                        from_stn_name: details[6],
                        from_stn_code: details[7],
                        to_stn_name: details[8],
                        to_stn_code: details[9],
                        from_time: details[10].replace(".", ":"),
                        to_time: details[11].replace(".", ":"),
                        travel_time: details[12].replace(".", ":") + " hrs",
                        running_days: details[13],
                        distance: details2[18] || "N/A",
                        halts: details2[7] - details2[4] - 1
                    });
                }
            }
        }
        
        // Sort by departure time
        arr.sort((a, b) => {
            const timeA = a.from_time.split(":").map(Number);
            const timeB = b.from_time.split(":").map(Number);
            const minutesA = timeA[0] * 60 + timeA[1];
            const minutesB = timeB[0] * 60 + timeB[1];
            return minutesA - minutesB;
        });
        
        return {
            success: true,
            data: arr
        };
    } catch (err) {
        console.error("Parsing error:", err);
        return {
            success: false,
            data: "An error occurred while processing train data."
        };
    }
}

// Display train results
function displayTrainResults(trains, container, fromCode, toCode) {
    const selectedDate = document.getElementById('journey-date').value;
    const selectedDayIndex = getDayIndex(selectedDate);
    
    container.innerHTML = `
        <h2 class="results-title">Trains from ${fromCode} to ${toCode}</h2>
        <div class="trains-grid">
            ${trains.filter(train => train.running_days[selectedDayIndex] === "1").map(train => createTrainCard(train)).join('')}
        </div>
    `;
    
    // Add CSS for trains grid
    if (!document.getElementById('trains-grid-style')) {
        const style = document.createElement('style');
        style.id = 'trains-grid-style';
        style.textContent = `
            .trains-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 1.5rem;
                margin-top: 1rem;
            }
        `;
        document.head.appendChild(style);
    }
}

// Create train card
function createTrainCard(train) {
    const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
    const runningDaysFormatted = train.running_days
        .split("")
        .map((bit, index) => bit === "1" ? weekdays[index] : `<span style="color: var(--text-muted);">${weekdays[index]}</span>`)
        .join(" ");
    
    return `
        <div class="card" style="cursor: pointer;" onclick="window.location.href='train-search.html?trainno=${train.train_no}'">
            <div class="card-header">
                <h3 class="card-title">${train.train_name}</h3>
                <div class="status-badge status-info">${train.train_no}</div>
            </div>
            <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div>
                        <div style="font-weight: 600; color: var(--text-primary);">${train.from_stn_code} - ${train.from_time}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">${train.from_stn_name}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem;">🚆</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">${train.travel_time}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; color: var(--text-primary);">${train.to_stn_code} - ${train.to_time}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">${train.to_stn_name}</div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; color: var(--text-secondary);">
                    <span>Runs: ${runningDaysFormatted}</span>
                    <span>${train.halts || "N/A"} halts | ${train.distance || "N/A"} km</span>
                </div>
            </div>
        </div>
    `;
}

// Get day index for running days
function getDayIndex(dateString) {
    const date = new Date(dateString);
    const jsDayIndex = date.getDay();
    return (jsDayIndex + 6) % 7;
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-primary);
        color: var(--text-primary);
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        border-left: 4px solid var(--${type === 'warning' ? 'warning' : type === 'error' ? 'danger' : 'info'}-color);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    // Add animation styles
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Utility function to format time
function formatTime(timeString) {
    return timeString.replace(".", ":");
}

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Export functions for use in other scripts
window.EasyRail = {
    showNotification,
    formatTime,
    formatDate,
    parseTrainData,
    displayTrainResults
};
