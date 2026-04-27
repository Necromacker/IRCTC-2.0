const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:8080', 'http://127.0.0.1:5173', 'http://127.0.0.1:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express.json());

const { parseBookingRequest } = require('./ai-assistant');

app.post('/api/ai/parse-booking', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    
    const result = await parseBookingRequest(text);
    res.json(result);
});


// Load data
const stationsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'stations.json'), 'utf8'));
const trainsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'trains.json'), 'utf8'));

// API Routes
app.get('/api/stations', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    if (!query) {
        return res.json(stationsData.stations.slice(0, 10));
    }
    const filtered = stationsData.stations.filter(s => 
        s.stnName.toLowerCase().includes(query) || 
        s.stnCode.toLowerCase().includes(query)
    ).slice(0, 10);
    res.json(filtered);
});

app.get('/api/trains', (req, res) => {
    const from = req.query.from;
    const to = req.query.to;
    
    if (!from || !to) {
        return res.json(trainsData.slice(0, 20));
    }
    
    const filtered = trainsData.filter(t => 
        t.source.toLowerCase().includes(from.toLowerCase()) && 
        t.dest.toLowerCase().includes(to.toLowerCase())
    );
    res.json(filtered);
});

app.get('/api/train/:number', (req, res) => {
    const train = trainsData.find(t => t.trainno === req.params.number);
    if (train) {
        res.json(train);
    } else {
        res.status(404).json({ error: 'Train not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
