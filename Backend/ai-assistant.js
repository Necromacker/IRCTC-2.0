const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY");

const stationsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'stations.json'), 'utf8'));

// Models to try in order of preference (must match currently available models)
const MODELS = ["gemini-flash-latest"];

async function parseBookingRequest(text) {
  const prompt = `
    Extract railway booking details from the following user request: "${text}"
    
    Current date is ${new Date().toDateString()}.
    
    Return a JSON object with the following fields:
    - fromStation: (string, name of the source station)
    - toStation: (string, name of the destination station)
    - date: (string, in YYYY-MM-DD format)
    - passengers: (array of objects with 'name', 'age', 'gender' fields)
    - trainName: (string, optional)
    - class: (string, optional, e.g., '3A', 'SL', '2A', '1A')

    If any detail is missing, leave it as null.
    For gender, use 'male', 'female', or 'other'.
    
    Important: If the user mentions "tomorrow", calculate the date based on ${new Date().toDateString()}.
    If the user mentions "day after tomorrow", add 2 days.
    If the user mentions a city name like "Delhi", use the full station name "New Delhi".
    If the user mentions "Mumbai", use "Mumbai Central".
    If the user mentions "Bangalore" or "Bengaluru", use "Bangalore City Junction".
    If the user mentions "Chennai", use "Chennai Central".
    If the user mentions "Kolkata" or "Calcutta", use "Kolkata".
    If the user mentions "Hyderabad", use "Hyderabad Deccan".
    
    Respond ONLY with a valid JSON object. No markdown, no code fences, just JSON.
  `;

  let lastError = null;

  for (const modelName of MODELS) {
    try {
      console.log(`Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();
      console.log(`Raw AI response (${modelName}):`, rawText);

      // Clean up any markdown fences
      const jsonStr = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(jsonStr);

      // Resolve station names to codes
      if (parsed.fromStation) {
        const stn = findStation(parsed.fromStation);
        if (stn) {
          parsed.fromCode = stn.stnCode;
          parsed.fromStation = stn.stnName;
        }
      }
      if (parsed.toStation) {
        const stn = findStation(parsed.toStation);
        if (stn) {
          parsed.toCode = stn.stnCode;
          parsed.toStation = stn.stnName;
        }
      }

      console.log("Parsed result:", JSON.stringify(parsed, null, 2));
      return parsed;

    } catch (error) {
      console.error(`Model ${modelName} failed:`, error.message || error);
      lastError = error;
      // Continue to next model
    }
  }

  console.error("All models failed. Last error:", lastError?.message);
  return { error: "Failed to parse request. " + (lastError?.message || "All AI models failed.") };
}

function findStation(query) {
  const q = query.toLowerCase().trim();

  // Try exact code match first
  const exactCode = stationsData.stations.find(s => s.stnCode.toLowerCase() === q);
  if (exactCode) return exactCode;

  // Try exact city match
  const exactCity = stationsData.stations.find(s => s.stnCity.toLowerCase() === q);
  if (exactCity) return exactCity;

  // Try name includes
  const nameMatch = stationsData.stations.find(s => s.stnName.toLowerCase().includes(q));
  if (nameMatch) return nameMatch;

  // Try city includes  
  const cityMatch = stationsData.stations.find(s => (s.stnCity || "").toLowerCase().includes(q));
  if (cityMatch) return cityMatch;

  return null;
}

module.exports = { parseBookingRequest };
