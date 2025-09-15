// At Station JavaScript

document.addEventListener('DOMContentLoaded', function() {
    setupStationSearchForm();
    setupQuickStationButtons();
});

function setupStationSearchForm() {
    const form = document.getElementById('station-search-form');
    const stationInput = document.getElementById('station-code');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            searchStation();
        });
    }
    
    if (stationInput) {
        // Format station input (only letters, uppercase)
        stationInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
            if (value.length > 4) {
                value = value.substring(0, 4);
            }
            e.target.value = value;
        });
    }
}

function setupQuickStationButtons() {
    const quickButtons = document.querySelectorAll('.station-quick-btn');
    
    quickButtons.forEach(button => {
        button.addEventListener('click', function() {
            const stationCode = this.getAttribute('data-station');
            document.getElementById('station-code').value = stationCode;
            searchStation();
        });
    });
}

async function searchStation() {
    const stationInput = document.getElementById('station-code');
    const stationCode = stationInput.value.trim().toUpperCase();
    
    if (!stationCode) {
        EasyRail.showNotification('Please enter a station code.', 'warning');
        return;
    }
    
    if (stationCode.length < 3) {
        EasyRail.showNotification('Please enter a valid station code (3-4 letters).', 'warning');
        return;
    }
    
    // Show loading state
    showLoadingState();
    
    try {
        const stationData = await fetchStationData(stationCode);
        displayStationResults(stationData);
    } catch (error) {
        console.error('Station search error:', error);
        showErrorState('Unable to fetch station information. Please try again later.');
    }
}

async function fetchStationData(stationCode) {
    const response = await fetch('https://easy-rail.onrender.com/at-station', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stnCode: stationCode }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch station data');
    }
    
    if (!data || data.length === 0) {
        throw new Error(`No trains found at station: ${stationCode}`);
    }
    
    return data;
}

function displayStationResults(trains) {
    hideLoadingState();
    
    const resultsContainer = document.getElementById('station-results');
    resultsContainer.innerHTML = '';
    resultsContainer.classList.remove('hidden');
    
    // Create results header
    const headerCard = document.createElement('div');
    headerCard.className = 'card';
    headerCard.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">Trains at Station</h3>
            <div class="status-badge status-info">${trains.length} Train(s)</div>
        </div>
    `;
    resultsContainer.appendChild(headerCard);
    
    // Create train cards
    trains.forEach(train => {
        const trainCard = createTrainCard(train);
        resultsContainer.appendChild(trainCard);
    });
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

function createTrainCard(train) {
    const card = document.createElement('div');
    card.className = 'card train-card';
    card.style.cursor = 'pointer';
    
    // Format time
    const timeAt = formatTime(train.timeat);
    
    card.innerHTML = `
        <div class="train-header">
            <div class="train-info">
                <h3 class="train-name">${train.trainname}</h3>
                <div class="train-number">${train.trainno}</div>
            </div>
            <div class="train-time">
                <div class="time-label">At Station</div>
                <div class="time-value">${timeAt}</div>
            </div>
        </div>
        <div class="train-route">
            <div class="route-item">
                <div class="route-label">From</div>
                <div class="route-station">${train.source}</div>
            </div>
            <div class="route-arrow">→</div>
            <div class="route-item">
                <div class="route-label">To</div>
                <div class="route-station">${train.dest}</div>
            </div>
        </div>
    `;
    
    // Add click event to view train details
    card.addEventListener('click', function() {
        window.location.href = `train-search.html?trainno=${train.trainno}`;
    });
    
    return card;
}

function formatTime(timeString) {
    if (!timeString) return 'N/A';
    
    // If time is already in HH:MM format, return as is
    if (timeString.includes(':')) {
        return timeString;
    }
    
    // If time is in HH.MM format, convert to HH:MM
    if (timeString.includes('.')) {
        return timeString.replace('.', ':');
    }
    
    return timeString;
}

function showLoadingState() {
    const loadingState = document.getElementById('loading-state');
    const resultsContainer = document.getElementById('station-results');
    
    if (loadingState) {
        loadingState.classList.remove('hidden');
    }
    
    if (resultsContainer) {
        resultsContainer.classList.add('hidden');
    }
}

function hideLoadingState() {
    const loadingState = document.getElementById('loading-state');
    
    if (loadingState) {
        loadingState.classList.add('hidden');
    }
}

function showErrorState(message) {
    hideLoadingState();
    
    const resultsContainer = document.getElementById('station-results');
    resultsContainer.innerHTML = `
        <div class="card text-center">
            <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
            <h3 style="color: var(--danger-color); margin-bottom: 1rem;">Error</h3>
            <p style="color: var(--text-secondary);">${message}</p>
            <button onclick="document.getElementById('station-code').focus()" class="btn btn-primary" style="margin-top: 1rem;">
                Try Again
            </button>
        </div>
    `;
    resultsContainer.classList.remove('hidden');
}

// Add CSS for station-specific styles
if (!document.getElementById('station-styles')) {
    const style = document.createElement('style');
    style.id = 'station-styles';
    style.textContent = `
        .station-quick-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1rem;
            background: var(--bg-primary);
            border: 2px solid var(--border-color);
            border-radius: var(--radius-md);
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: center;
        }
        
        .station-quick-btn:hover {
            border-color: var(--primary-color);
            background: var(--bg-tertiary);
            transform: translateY(-2px);
        }
        
        .station-code {
            font-weight: 700;
            font-size: 1.25rem;
            color: var(--primary-color);
            margin-bottom: 0.25rem;
        }
        
        .station-name {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
        
        .train-card {
            margin-bottom: 1rem;
            transition: all 0.3s ease;
        }
        
        .train-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }
        
        .train-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
        }
        
        .train-info {
            flex: 1;
        }
        
        .train-name {
            font-family: var(--font-heading);
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0 0 0.25rem 0;
        }
        
        .train-number {
            font-size: 0.875rem;
            color: var(--text-secondary);
            font-weight: 500;
        }
        
        .train-time {
            text-align: right;
        }
        
        .time-label {
            font-size: 0.75rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
        }
        
        .time-value {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--primary-color);
        }
        
        .train-route {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .route-item {
            flex: 1;
            text-align: center;
        }
        
        .route-label {
            font-size: 0.75rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
        }
        
        .route-station {
            font-weight: 600;
            color: var(--text-primary);
            font-size: 0.875rem;
        }
        
        .route-arrow {
            font-size: 1.5rem;
            color: var(--primary-color);
            font-weight: 700;
        }
        
        @media (max-width: 768px) {
            .train-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }
            
            .train-time {
                text-align: left;
            }
            
            .train-route {
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .route-arrow {
                transform: rotate(90deg);
            }
        }
    `;
    document.head.appendChild(style);
}
