import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const token = process.env.STRAVA_TOKEN; // fetch super sectret
if (!token) {
  console.error("Error: STRAVA_TOKEN is not defined.");
  process.exit(1);
}

const outputDir = "running";
const outputFile = path.join(outputDir, "runs.json");
const url = "https://www.strava.com/api/v3/athlete/activities?per_page=30";

async function fetchStrava() {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
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

fetchStrava();
