// Seat Availability Check JavaScript

document.addEventListener('DOMContentLoaded', function() {
    setupAvailabilityForm();
    setupDateTabs();
});

function setupAvailabilityForm() {
    const form = document.getElementById('availability-search-form');
    const fromInput = document.getElementById('station-from');
    const toInput = document.getElementById('station-to');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            checkAvailability();
        });
    }
    
    // Setup station search for both inputs
    if (fromInput) {
        setupStationInput(fromInput, 'suggestions-from');
    }
    
    if (toInput) {
        setupStationInput(toInput, 'suggestions-to');
    }
}

function setupDateTabs() {
    const dateTabs = document.querySelectorAll('.date-tab');
    const dateInput = document.getElementById('journey-date');
    
    dateTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            dateTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Update date input
            updateDateInput(this.id);
        });
    });
}

function updateDateInput(tabId) {
    const dateInput = document.getElementById('journey-date');
    const today = new Date();
    let selectedDate;
    
    switch (tabId) {
        case 'date-today':
            selectedDate = today;
            break;
        case 'date-tomorrow':
            selectedDate = new Date(today);
            selectedDate.setDate(today.getDate() + 1);
            break;
        case 'date-day-after':
            selectedDate = new Date(today);
            selectedDate.setDate(today.getDate() + 2);
            break;
    }
    
    const formattedDate = selectedDate.toISOString().split('T')[0];
    dateInput.value = formattedDate;
}

async function checkAvailability() {
    const fromStation = document.getElementById('station-from').value;
    const toStation = document.getElementById('station-to').value;
    const journeyDate = document.getElementById('journey-date').value;
    
    if (!fromStation || !toStation) {
        EasyRail.showNotification('Please select both departure and destination stations.', 'warning');
        return;
    }
    
    if (!journeyDate) {
        EasyRail.showNotification('Please select a journey date.', 'warning');
        return;
    }
    
    // Extract station codes
    const fromCode = extractStationCode(fromStation);
    const toCode = extractStationCode(toStation);
    
    if (!fromCode || !toCode) {
        EasyRail.showNotification('Please select valid stations from the suggestions.', 'warning');
        return;
    }
    
    // Show loading state
    showLoadingState();
    
    try {
        const availabilityData = await fetchAvailabilityData(fromCode, toCode, journeyDate);
        displayAvailabilityResults(availabilityData);
    } catch (error) {
        console.error('Availability check error:', error);
        showErrorState('Unable to fetch availability data. Please try again later.');
    }
}

async function fetchAvailabilityData(fromCode, toCode, journeyDate) {
    // Format date for API (DD-MM-YYYY)
    const date = new Date(journeyDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const indianFormatDate = `${day}-${month}-${year}`;
    
    const apiUrl = `https://cttrainsapi.confirmtkt.com/api/v1/trains/search?sourceStationCode=${fromCode}&destinationStationCode=${toCode}&addAvailabilityCache=true&excludeMultiTicketAlternates=false&excludeBoostAlternates=false&sortBy=DEFAULT&dateOfJourney=${indianFormatDate}&enableNearby=true&enableTG=true&tGPlan=CTG-3&showTGPrediction=false&tgColor=DEFAULT&showPredictionGlobal=true`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!data.data || !data.data.trainList) {
        throw new Error('No availability data found');
    }
    
    return data.data.trainList;
}

function displayAvailabilityResults(trains) {
    hideLoadingState();
    
    const resultsContainer = document.getElementById('availability-results');
    resultsContainer.innerHTML = '';
    resultsContainer.classList.remove('hidden');
    
    if (trains.length === 0) {
        resultsContainer.innerHTML = `
            <div class="card text-center">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🚫</div>
                <h3 style="color: var(--text-primary); margin-bottom: 1rem;">No Trains Found</h3>
                <p style="color: var(--text-secondary);">No trains available for the selected route and date.</p>
            </div>
        `;
        return;
    }
    
    // Create results header
    const headerCard = document.createElement('div');
    headerCard.className = 'card';
    headerCard.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">Available Trains</h3>
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
    
    // Create seat availability HTML
    const seatHTML = train.avlClassesSorted.map((classType) => {
        const isTatkal = classType.includes("_TQ");
        const classKey = isTatkal ? classType.replace("_TQ", "") : classType;
        const classData = isTatkal
            ? train.availabilityCacheTatkal[classKey] || {}
            : train.availabilityCache[classKey] || {};
        
        const isUnavailable = 
            classData.availabilityDisplayName === "Train Cancelled" ||
            classData.availabilityDisplayName === "Train Departed" ||
            classData.availabilityDisplayName === "Regret" ||
            classData.availabilityDisplayName === "Not Available";
        
        const availabilityClass = isUnavailable ? 'unavailable' : 
                                 classData.availabilityDisplayName?.includes('WL') ? 'waitlist' :
                                 classData.availabilityDisplayName?.includes('RAC') ? 'rac' : 'available';
        
        return `
            <div class="seat-availability ${availabilityClass}">
                <div class="seat-header">
                    <div class="seat-class">${classType}</div>
                    <div class="seat-fare">₹${classData.fare || "---"}</div>
                </div>
                <div class="seat-status">${classData.availabilityDisplayName || "WL --"}</div>
                <div class="seat-prediction">${isUnavailable ? "No Chance" : classData.prediction || "--%"}</div>
            </div>
        `;
    }).join('');
    
    card.innerHTML = `
        <div class="train-header">
            <div class="train-info">
                <h3 class="train-number">${train.trainNumber} - ${train.trainName}</h3>
                ${train.hasPantry ? '<div class="pantry-indicator">🍽️ Pantry Available</div>' : ''}
            </div>
        </div>
        <div class="train-timings">
            <div class="timing-item">
                <div class="timing-station">${train.fromStnCode}</div>
                <div class="timing-time">${train.departureTime}</div>
            </div>
            <div class="timing-duration">
                <div class="duration">${Math.floor(train.duration / 60)}h ${train.duration % 60}m</div>
            </div>
            <div class="timing-item">
                <div class="timing-station">${train.toStnCode}</div>
                <div class="timing-time">${train.arrivalTime}</div>
            </div>
        </div>
        <div class="seat-availability-grid">
            ${seatHTML}
        </div>
        <div class="train-actions">
            <a href="train-search.html?trainno=${train.trainNumber}" class="btn btn-secondary">
                View Schedule
            </a>
        </div>
    `;
    
    return card;
}

function showLoadingState() {
    const loadingState = document.getElementById('loading-state');
    const resultsContainer = document.getElementById('availability-results');
    
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
    
    const resultsContainer = document.getElementById('availability-results');
    resultsContainer.innerHTML = `
        <div class="card text-center">
            <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
            <h3 style="color: var(--danger-color); margin-bottom: 1rem;">Error</h3>
            <p style="color: var(--text-secondary);">${message}</p>
            <button onclick="document.getElementById('station-from').focus()" class="btn btn-primary" style="margin-top: 1rem;">
                Try Again
            </button>
        </div>
    `;
    resultsContainer.classList.remove('hidden');
}

// Add CSS for availability cards
if (!document.getElementById('availability-cards-style')) {
    const style = document.createElement('style');
    style.id = 'availability-cards-style';
    style.textContent = `
        .train-card {
            margin-bottom: 1.5rem;
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
        
        .train-number {
            font-family: var(--font-heading);
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0 0 0.5rem 0;
        }
        
        .pantry-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            background: var(--success-color);
            color: var(--text-white);
            padding: 0.25rem 0.75rem;
            border-radius: var(--radius-sm);
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .train-timings {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: var(--bg-tertiary);
            border-radius: var(--radius-md);
        }
        
        .timing-item {
            text-align: center;
        }
        
        .timing-station {
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.25rem;
        }
        
        .timing-time {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--primary-color);
        }
        
        .timing-duration {
            text-align: center;
        }
        
        .duration {
            background: var(--primary-color);
            color: var(--text-white);
            padding: 0.5rem 1rem;
            border-radius: var(--radius-md);
            font-weight: 600;
            font-size: 0.875rem;
        }
        
        .seat-availability-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .seat-availability {
            background: var(--bg-primary);
            border: 2px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: 1rem;
            text-align: center;
            transition: all 0.2s ease;
        }
        
        .seat-availability.available {
            border-color: var(--success-color);
            background: linear-gradient(135deg, #f0fdf4, #dcfce7);
        }
        
        .seat-availability.rac {
            border-color: var(--warning-color);
            background: linear-gradient(135deg, #fefce8, #fef3c7);
        }
        
        .seat-availability.waitlist {
            border-color: var(--info-color);
            background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        }
        
        .seat-availability.unavailable {
            border-color: var(--danger-color);
            background: linear-gradient(135deg, #fef2f2, #fee2e2);
        }
        
        .seat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .seat-class {
            font-weight: 600;
            color: var(--text-primary);
            font-size: 0.875rem;
        }
        
        .seat-fare {
            font-weight: 600;
            color: var(--text-primary);
            font-size: 0.875rem;
        }
        
        .seat-status {
            font-weight: 600;
            margin-bottom: 0.25rem;
            font-size: 0.875rem;
        }
        
        .seat-availability.available .seat-status {
            color: var(--success-color);
        }
        
        .seat-availability.rac .seat-status {
            color: var(--warning-color);
        }
        
        .seat-availability.waitlist .seat-status {
            color: var(--info-color);
        }
        
        .seat-availability.unavailable .seat-status {
            color: var(--danger-color);
        }
        
        .seat-prediction {
            font-size: 0.75rem;
            color: var(--text-secondary);
        }
        
        .train-actions {
            display: flex;
            justify-content: center;
            padding-top: 1rem;
            border-top: 1px solid var(--border-color);
        }
        
        .date-tab {
            padding: 0.5rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            background: var(--bg-primary);
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .date-tab:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
        }
        
        .date-tab.active {
            background: var(--primary-color);
            color: var(--text-white);
            border-color: var(--primary-color);
        }
        
        @media (max-width: 768px) {
            .train-timings {
                flex-direction: column;
                gap: 1rem;
            }
            
            .seat-availability-grid {
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 0.75rem;
            }
            
            .seat-availability {
                padding: 0.75rem;
            }
        }
    `;
    document.head.appendChild(style);
}
