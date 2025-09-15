// Live Train Status JavaScript

let autoRefreshInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    setupLiveStatusForm();
});

function setupLiveStatusForm() {
    const form = document.getElementById('train-status-form');
    const trainInput = document.getElementById('train-number');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            trackTrainStatus();
        });
    }
    
    if (trainInput) {
        // Format train input (only numbers, max 5 digits)
        trainInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            if (value.length > 5) {
                value = value.substring(0, 5);
            }
            e.target.value = value;
        });
    }
}

async function trackTrainStatus() {
    const trainInput = document.getElementById('train-number');
    const dateInput = document.getElementById('journey-date');
    const trainNumber = trainInput.value.trim();
    const journeyDate = dateInput.value;
    
    if (trainNumber.length !== 5) {
        EasyRail.showNotification('Please enter a valid 5-digit train number.', 'warning');
        return;
    }
    
    if (!journeyDate) {
        EasyRail.showNotification('Please select a journey date.', 'warning');
        return;
    }
    
    // Clear any existing auto-refresh
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Show loading state
    showLoadingState();
    
    try {
        const trainData = await fetchTrainStatus(trainNumber, journeyDate);
        displayTrainStatus(trainData);
        
        // Start auto-refresh
        startAutoRefresh(trainNumber, journeyDate);
        
    } catch (error) {
        console.error('Train status error:', error);
        showErrorState('Unable to fetch train status. Please try again later.');
    }
}

async function fetchTrainStatus(trainNumber, journeyDate) {
    const response = await fetch('https://easy-rail.onrender.com/fetch-train-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainNumber, dates: journeyDate }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch train status');
    }
    
    if (data.length === 0) {
        throw new Error(`No details found for train number: ${trainNumber}`);
    }
    
    return data;
}

function displayTrainStatus(stations) {
    hideLoadingState();
    
    const resultsContainer = document.getElementById('train-status-results');
    const autoRefreshInfo = document.getElementById('auto-refresh-info');
    
    resultsContainer.innerHTML = '';
    resultsContainer.classList.remove('hidden');
    autoRefreshInfo.classList.remove('hidden');
    
    // Create station cards
    stations.forEach((station, index) => {
        const stationCard = createStationCard(station, index);
        resultsContainer.appendChild(stationCard);
    });
    
    // Scroll to current station
    const currentStation = resultsContainer.querySelector('.station.current');
    if (currentStation) {
        currentStation.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

function createStationCard(station, index) {
    const card = document.createElement('div');
    card.className = 'station-card';
    
    // Determine status and styling
    let statusClass = 'upcoming';
    let statusIcon = '⏰';
    let statusText = 'Upcoming';
    
    if (station.current === "true") {
        statusClass = 'current';
        statusIcon = '🚂';
        statusText = 'Current';
    } else if (station.status === "crossed") {
        statusClass = 'crossed';
        statusIcon = '✅';
        statusText = 'Passed';
    }
    
    // Format delay information
    const delayInfo = station.delay ? `Delay: ${station.delay}` : 'On Time';
    const delayClass = station.delay ? 'status-danger' : 'status-success';
    
    card.innerHTML = `
        <div class="station-card-content ${statusClass}">
            <div class="station-icon">
                <div class="status-indicator ${statusClass}">
                    <span class="status-icon">${statusIcon}</span>
                </div>
                <div class="station-line"></div>
            </div>
            <div class="station-details">
                <div class="station-header">
                    <h3 class="station-name">${station.station}</h3>
                    <div class="status-badge ${statusClass === 'current' ? 'status-info' : statusClass === 'crossed' ? 'status-success' : 'status-warning'}">
                        ${statusText}
                    </div>
                </div>
                <div class="station-timings">
                    <div class="timing-item">
                        <span class="timing-label">Est. Arrival:</span>
                        <span class="timing-value">${station.arr || "N/A"}</span>
                    </div>
                    <div class="timing-item">
                        <span class="timing-label">Est. Departure:</span>
                        <span class="timing-value">${station.dep || "N/A"}</span>
                    </div>
                </div>
                <div class="station-delay">
                    <span class="delay-text ${delayClass}">${delayInfo}</span>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

function startAutoRefresh(trainNumber, journeyDate) {
    autoRefreshInterval = setInterval(async () => {
        console.log('Auto-refreshing train status...');
        try {
            const trainData = await fetchTrainStatus(trainNumber, journeyDate);
            displayTrainStatus(trainData);
        } catch (error) {
            console.error('Auto-refresh error:', error);
            // Stop auto-refresh on error
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
            }
        }
    }, 60000); // Refresh every 60 seconds
}

function showLoadingState() {
    const loadingState = document.getElementById('loading-state');
    const resultsContainer = document.getElementById('train-status-results');
    const autoRefreshInfo = document.getElementById('auto-refresh-info');
    
    if (loadingState) {
        loadingState.classList.remove('hidden');
    }
    
    if (resultsContainer) {
        resultsContainer.classList.add('hidden');
    }
    
    if (autoRefreshInfo) {
        autoRefreshInfo.classList.add('hidden');
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
    
    const resultsContainer = document.getElementById('train-status-results');
    const autoRefreshInfo = document.getElementById('auto-refresh-info');
    
    resultsContainer.innerHTML = `
        <div class="card text-center">
            <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
            <h3 style="color: var(--danger-color); margin-bottom: 1rem;">Error</h3>
            <p style="color: var(--text-secondary);">${message}</p>
            <button onclick="document.getElementById('train-number').focus()" class="btn btn-primary" style="margin-top: 1rem;">
                Try Again
            </button>
        </div>
    `;
    resultsContainer.classList.remove('hidden');
    
    if (autoRefreshInfo) {
        autoRefreshInfo.classList.add('hidden');
    }
}

// Add CSS for station cards
if (!document.getElementById('station-cards-style')) {
    const style = document.createElement('style');
    style.id = 'station-cards-style';
    style.textContent = `
        .station-card {
            margin-bottom: 1rem;
            background: var(--bg-primary);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-md);
            border: 1px solid var(--border-color);
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .station-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }
        
        .station-card-content {
            display: flex;
            align-items: flex-start;
            padding: 1.5rem;
            position: relative;
        }
        
        .station-card-content.current {
            background: linear-gradient(135deg, #dbeafe, #bfdbfe);
            border-left: 4px solid var(--info-color);
        }
        
        .station-card-content.crossed {
            background: linear-gradient(135deg, #f0fdf4, #dcfce7);
            border-left: 4px solid var(--success-color);
        }
        
        .station-card-content.upcoming {
            background: linear-gradient(135deg, #fefce8, #fef3c7);
            border-left: 4px solid var(--warning-color);
        }
        
        .station-icon {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-right: 1rem;
            position: relative;
        }
        
        .status-indicator {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            position: relative;
            z-index: 2;
        }
        
        .status-indicator.current {
            background: var(--info-color);
            color: var(--text-white);
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
        }
        
        .status-indicator.crossed {
            background: var(--success-color);
            color: var(--text-white);
        }
        
        .status-indicator.upcoming {
            background: var(--warning-color);
            color: var(--text-white);
        }
        
        .station-line {
            width: 3px;
            height: 60px;
            background: var(--border-color);
            margin-top: -1px;
        }
        
        .station-card:last-child .station-line {
            display: none;
        }
        
        .station-details {
            flex: 1;
        }
        
        .station-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .station-name {
            font-family: var(--font-heading);
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0;
        }
        
        .station-timings {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .timing-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        
        .timing-label {
            font-size: 0.875rem;
            color: var(--text-secondary);
            font-weight: 500;
        }
        
        .timing-value {
            font-size: 1rem;
            color: var(--text-primary);
            font-weight: 600;
        }
        
        .station-delay {
            margin-top: 0.5rem;
        }
        
        .delay-text {
            font-weight: 500;
            font-size: 0.875rem;
        }
        
        @media (max-width: 768px) {
            .station-card-content {
                padding: 1rem;
            }
            
            .station-timings {
                grid-template-columns: 1fr;
                gap: 0.5rem;
            }
            
            .station-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }
        }
    `;
    document.head.appendChild(style);
}

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
});
