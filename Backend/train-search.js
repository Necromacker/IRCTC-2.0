// Train Search JavaScript

document.addEventListener('DOMContentLoaded', function() {
    setupTrainSearchForm();
    setupTrainSuggestions();
    checkURLParams();
});

function setupTrainSearchForm() {
    const form = document.getElementById('train-search-form');
    const trainInput = document.getElementById('train-number');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            searchTrain();
        });
    }
    
    if (trainInput) {
        // Format train input (only numbers and letters)
        trainInput.addEventListener('input', function(e) {
            let value = e.target.value;
            // Allow alphanumeric characters and spaces
            value = value.replace(/[^a-zA-Z0-9\s]/g, '');
            e.target.value = value;
        });
    }
}

function setupTrainSuggestions() {
    const trainInput = document.getElementById('train-number');
    const suggestionsContainer = document.getElementById('train-suggestions');
    
    if (trainInput && suggestionsContainer) {
        let debounceTimer;
        
        trainInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            const query = this.value.trim();
            
            if (query.length < 2) {
                hideSuggestions(suggestionsContainer);
                return;
            }
            
            debounceTimer = setTimeout(() => {
                searchTrainSuggestions(query, suggestionsContainer, trainInput);
            }, 300);
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (!trainInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                hideSuggestions(suggestionsContainer);
            }
        });
    }
}

async function searchTrainSuggestions(query, container, input) {
    try {
        const response = await fetch('../assets/trains.json');
        const data = await response.json();
        
        const trains = data.filter(train => 
            train.trainName.toLowerCase().includes(query.toLowerCase()) ||
            train.trainno.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
        
        displayTrainSuggestions(trains, container, input);
    } catch (error) {
        console.error('Error fetching train suggestions:', error);
        hideSuggestions(container);
    }
}

function displayTrainSuggestions(trains, container, input) {
    if (trains.length === 0) {
        hideSuggestions(container);
        return;
    }
    
    container.innerHTML = '';
    container.style.display = 'block';
    
    trains.forEach(train => {
        const suggestion = document.createElement('div');
        suggestion.className = 'suggestion-item';
        suggestion.style.cssText = `
            padding: 0.75rem 1rem;
            cursor: pointer;
            border-bottom: 1px solid var(--border-color);
            transition: background-color 0.2s ease;
        `;
        suggestion.innerHTML = `
            <div style="font-weight: 500; color: var(--text-primary);">${train.trainName}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">${train.trainno}</div>
        `;
        
        suggestion.addEventListener('click', function() {
            input.value = train.trainno;
            hideSuggestions(container);
            searchTrain();
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

function hideSuggestions(container) {
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
}

function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const trainNo = urlParams.get('trainno');
    
    if (trainNo) {
        document.getElementById('train-number').value = trainNo;
        searchTrain();
    }
}

async function searchTrain() {
    const trainInput = document.getElementById('train-number');
    const trainNumber = trainInput.value.trim();
    
    if (!trainNumber) {
        EasyRail.showNotification('Please enter a train number or name.', 'warning');
        return;
    }
    
    // Show loading state
    showLoadingState();
    
    try {
        const trainData = await fetchTrainDetails(trainNumber);
        displayTrainDetails(trainData);
        
        // Also fetch route details
        if (trainData.train_id) {
            const routeData = await fetchTrainRoute(trainData.train_id);
            displayTrainSchedule(routeData);
        }
    } catch (error) {
        console.error('Train search error:', error);
        showErrorState('Unable to fetch train details. Please try again later.');
    }
}

async function fetchTrainDetails(trainNumber) {
    const response = await fetch(`https://erail.in/rail/getTrains.aspx?TrainNo=${trainNumber}&DataSource=0&Language=0&Cache=true`);
    const rawData = await response.text();
    
    const trainInfo = parseTrainData(rawData);
    
    if (!trainInfo.success) {
        throw new Error(trainInfo.data);
    }
    
    return trainInfo.data;
}

function parseTrainData(string) {
    try {
        let obj = {};
        let retval = {};
        let data = string.split("~~~~~~~~");
        
        if (data[0] === "~~~~~Please try again after some time." || data[0] === "~~~~~Train not found") {
            retval["success"] = false;
            retval["data"] = data[0].replaceAll("~", "");
            return retval;
        }
        
        let data1 = data[0].split("~").filter((el) => el !== "");
        if (data1[1].length > 6) data1.shift();
        
        obj["train_no"] = data1[1].replace("^", "");
        obj["train_name"] = data1[2];
        obj["from_stn_name"] = data1[3];
        obj["from_stn_code"] = data1[4];
        obj["to_stn_name"] = data1[5];
        obj["to_stn_code"] = data1[6];
        obj["from_time"] = data1[11].replace(".", ":");
        obj["to_time"] = data1[12].replace(".", ":");
        obj["travel_time"] = data1[13].replace(".", ":") + " hrs";
        obj["running_days"] = data1[14];
        
        let data2 = data[1].split("~").filter((el) => el !== "");
        obj["type"] = data2[11];
        obj["train_id"] = data2[12];
        
        retval["success"] = true;
        retval["data"] = obj;
        
        return retval;
    } catch (err) {
        console.error(err);
        return { success: false, data: "Error parsing train data" };
    }
}

async function fetchTrainRoute(trainId) {
    const response = await fetch(`https://erail.in/data.aspx?Action=TRAINROUTE&Password=2012&Data1=${trainId}&Data2=0&Cache=true`);
    const rawData = await response.text();
    
    return parseTrainRoute(rawData);
}

function parseTrainRoute(string) {
    try {
        let data = string.split("~^");
        
        let arr = data.map((item) => {
            let details = item.split("~").filter((el) => el !== "");
            return {
                source_stn_name: details[2],
                source_stn_code: details[1],
                arrive: details[3].replace(".", ":"),
                depart: details[4].replace(".", ":"),
                distance: details[6],
                day: details[7],
                zone: details[9],
            };
        });
        
        return {
            success: true,
            data: arr,
        };
    } catch (err) {
        console.error("Error parsing train route data:", err.message);
        return {
            success: false,
            error: err.message,
        };
    }
}

function displayTrainDetails(trainData) {
    hideLoadingState();
    
    const detailsContainer = document.getElementById('train-details');
    detailsContainer.innerHTML = '';
    detailsContainer.classList.remove('hidden');
    
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const runningDaysFormatted = trainData.running_days
        .split("")
        .map((bit, index) => (bit === "1" ? weekdays[index] : "_"))
        .join(" ");
    
    const card = document.createElement('div');
    card.className = 'card';
    
    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${trainData.train_name}</h3>
            <div class="status-badge status-info">${trainData.train_no}</div>
        </div>
        <div class="card-body">
            <div class="data-table">
                <table style="width: 100%; border-collapse: collapse;">
                    <tbody>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">Train Number</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${trainData.train_no}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">Train Name</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${trainData.train_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">Source</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${trainData.from_stn_name} (${trainData.from_stn_code})</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">Destination</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${trainData.to_stn_name} (${trainData.to_stn_code})</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">Departure</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${trainData.from_time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">Arrival</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${trainData.to_time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">Travel Time</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${trainData.travel_time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem; font-weight: 600; color: var(--text-primary);">Running Days</td>
                            <td style="padding: 0.75rem; color: var(--text-secondary);">${runningDaysFormatted}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    detailsContainer.appendChild(card);
}

function displayTrainSchedule(routeData) {
    if (!routeData.success || !routeData.data) {
        return;
    }
    
    const scheduleContainer = document.getElementById('train-schedule');
    scheduleContainer.innerHTML = '';
    scheduleContainer.classList.remove('hidden');
    
    const card = document.createElement('div');
    card.className = 'card';
    
    const scheduleRows = routeData.data.map(station => `
        <tr>
            <td style="padding: 0.75rem; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">${station.source_stn_name}</td>
            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${station.source_stn_code}</td>
            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${station.arrive}</td>
            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${station.depart}</td>
            <td style="padding: 0.75rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${station.distance}</td>
        </tr>
    `).join('');
    
    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">Complete Train Schedule</h3>
            <div class="status-badge status-info">${routeData.data.length} Stations</div>
        </div>
        <div class="card-body">
            <div class="data-table">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)); color: var(--text-white);">
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Station Name</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Code</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Arrival</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Departure</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Distance (km)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${scheduleRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    scheduleContainer.appendChild(card);
}

function showLoadingState() {
    const loadingState = document.getElementById('loading-state');
    const detailsContainer = document.getElementById('train-details');
    const scheduleContainer = document.getElementById('train-schedule');
    
    if (loadingState) {
        loadingState.classList.remove('hidden');
    }
    
    if (detailsContainer) {
        detailsContainer.classList.add('hidden');
    }
    
    if (scheduleContainer) {
        scheduleContainer.classList.add('hidden');
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
    
    const detailsContainer = document.getElementById('train-details');
    detailsContainer.innerHTML = `
        <div class="card text-center">
            <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
            <h3 style="color: var(--danger-color); margin-bottom: 1rem;">Error</h3>
            <p style="color: var(--text-secondary);">${message}</p>
            <button onclick="document.getElementById('train-number').focus()" class="btn btn-primary" style="margin-top: 1rem;">
                Try Again
            </button>
        </div>
    `;
    detailsContainer.classList.remove('hidden');
}
