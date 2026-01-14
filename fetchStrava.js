import fetch from "node-fetch";
import fs from "fs";
import path from "path";
const openwtoken = process.env.OPENWEATHER_KEY;
const stravatoken = process.env.STRAVA_TOKEN; //keys stored as github secrets
if (!stravatoken) {
  console.error("Error: STRAVA_TOKEN is not defined.");
  process.exit(1);
}
const outputDir = "running";
const outputFile = path.join(outputDir, "runs.json");
const url = "https://www.strava.com/api/v3/athlete/activities?per_page=30";
      
async function fetchStrava() {


  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${stravatoken}` },
    });

    if (!res.ok) {
      console.error("Strava API error:", res.status, res.statusText);
      process.exit(1);
    }
    const data = await res.json();
    fs.mkdirSync(outputDir, { recursive: true });
    const last30 = data.slice(0, 30);
    let existing = [];
    if (fs.existsSync(outputFile)) {
      existing = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
    }
    if (JSON.stringify(existing) === JSON.stringify(last30)) {
      console.log("No changes in Strava data. Skipping update.");
      process.exit(0); 
    }
    fs.writeFileSync(outputFile, JSON.stringify(last30, null, 2));
    console.log(`runs.json updated with ${last30.length} activities`);
  } catch (err) {
    console.error("Fetch failed:", err);
    process.exit(1);
  }
}

async function updatePlaces() {
    if (!openwtoken) {
    console.error("Error: OPENWEATHER_KEY is not defined.");
    process.exit(1);
  }
  const fs = require('fs');
  const filePath = path.join(outputDir, "runs.json");
  const runsData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const posts = JSON.parse(runsData);


     for (const post of runsData) {
    const coord = post.start_latlng;
          const lat = coord[0];
          const lon = coord[1];    
    
    try {
      const wres = await fetch(
        `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${openwtoken}`
      );

      if (!wres.ok) {
        console.error(`OpenWeather API error for activity ${post.id}:`, wres.status);
        continue;
      }

      const wdata = await wres.json();
      post.location_city = wdata[0]?.name || "null";
    } catch (err) {
      console.error("Failed to fetch city from coordinates:", post.id, err);
      post.location_city = "null";
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(runsData, null, 2))
  
  const wurl = "http://api.openweathermap.org/geo/1.0/reverse?{lat}={${lat}}&lon={${lon}}&appid={${openwkey}}";
   //todo
  
}

fetchStrava();
updatePlaces();
