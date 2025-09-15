// PNR Status Check JavaScript

document.addEventListener('DOMContentLoaded', function() {
    setupPNRForm();
});

function setupPNRForm() {
    const form = document.getElementById('pnr-search-form');
    const pnrInput = document.getElementById('pnr-number');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            checkPNRStatus();
        });
    }
    
    if (pnrInput) {
        // Format PNR input (only numbers, max 10 digits)
        pnrInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            if (value.length > 10) {
                value = value.substring(0, 10);
            }
            e.target.value = value;
        });
        
        // Auto-submit when 10 digits are entered
        pnrInput.addEventListener('input', function() {
            if (this.value.length === 10) {
                checkPNRStatus();
            }
        });
    }
}

async function checkPNRStatus() {
    const pnrInput = document.getElementById('pnr-number');
    const pnr = pnrInput.value.trim();
    
    if (pnr.length !== 10) {
        EasyRail.showNotification('Please enter a valid 10-digit PNR number.', 'warning');
        return;
    }
    
    // Show loading state
    showLoadingState();
    
    try {
        const pnrData = await fetchPNRData(pnr);
        displayPNRResults(pnrData);
    } catch (error) {
        console.error('PNR check error:', error);
        showErrorState('Unable to fetch PNR details. Please try again later.');
    }
}

async function fetchPNRData(pnr) {
    const url = `https://irctc-indian-railway-pnr-status.p.rapidapi.com/getPNRStatus/${pnr}`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': 'b0075d9fa8msh81b2609e08877a8p14ff09jsn738ea7672cad',
            'x-rapidapi-host': 'irctc-indian-railway-pnr-status.p.rapidapi.com'
        }
    };
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!data.success || !data.data) {
        throw new Error('Invalid PNR number or no data found');
    }
    
    return data.data;
}

function displayPNRResults(journeyDetails) {
    hideLoadingState();
    
    const resultsContainer = document.getElementById('pnr-results');
    resultsContainer.innerHTML = '';
    resultsContainer.classList.remove('hidden');
    
    const DOJ = new Date(journeyDetails.dateOfJourney).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Journey Details Card
    const journeyCard = createJourneyCard(journeyDetails, DOJ);
    resultsContainer.appendChild(journeyCard);
    
    // Passenger Details Card
    const passengerCard = createPassengerCard(journeyDetails.passengerList);
    resultsContainer.appendChild(passengerCard);
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

function createJourneyCard(journeyDetails, DOJ) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const chartStatus = journeyDetails.chartStatus;
    const statusClass = chartStatus === 'CHART NOT PREPARED' ? 'status-warning' : 
                       chartStatus === 'CHART PREPARED' ? 'status-success' : 'status-info';
    
    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">Journey Details</h3>
            <div class="status-badge ${statusClass}">${chartStatus}</div>
        </div>
        <div class="card-body">
            <div class="data-table">
                <table style="width: 100%; border-collapse: collapse;">
                    <tbody>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">PNR Number</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${journeyDetails.pnrNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">Date of Journey</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${DOJ}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">Train Number</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${journeyDetails.trainNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">Train Name</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${journeyDetails.trainName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">Source Station</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${journeyDetails.sourceStation}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">Destination Station</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${journeyDetails.destinationStation}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">Boarding Point</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${journeyDetails.boardingPoint}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">Journey Class</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${journeyDetails.journeyClass}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">Total Distance</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${journeyDetails.distance} km</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary);">Fare</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary);">₹${journeyDetails.bookingFare}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    return card;
}

function createPassengerCard(passengerList) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const passengerRows = passengerList.map(passenger => `
        <tr>
            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">${passenger.passengerSerialNumber}</td>
            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${passenger.bookingStatusDetails}</td>
            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${passenger.currentStatusDetails}</td>
        </tr>
    `).join('');
    
    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">Passenger Details</h3>
            <div class="status-badge status-info">${passengerList.length} Passenger(s)</div>
        </div>
        <div class="card-body">
            <div class="data-table">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)); color: var(--text-white);">
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Passenger No.</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Booking Status</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Current Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${passengerRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    return card;
}

function showLoadingState() {
    const loadingState = document.getElementById('loading-state');
    const resultsContainer = document.getElementById('pnr-results');
    
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
    
    const resultsContainer = document.getElementById('pnr-results');
    resultsContainer.innerHTML = `
        <div class="card text-center">
            <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
            <h3 style="color: var(--danger-color); margin-bottom: 1rem;">Error</h3>
            <p style="color: var(--text-secondary);">${message}</p>
            <button onclick="document.getElementById('pnr-number').focus()" class="btn btn-primary" style="margin-top: 1rem;">
                Try Again
            </button>
        </div>
    `;
    resultsContainer.classList.remove('hidden');
}
