const fetch = require("node-fetch");
const fs = require("fs");
const openwtoken = process.env.OPENWEATHER_KEY;
const stravatoken = process.env.STRAVA_TOKEN; //keys stored as github secrets
if (!stravatoken) {
  console.error("Error: STRAVA_TOKEN is not defined.");
  process.exit(1);
}
if (!openwtoken) {
  console.error("Error: OPENWEATHER_KEY is not defined.");
  process.exit(1);
}
const outputFile = "runs.json";
const url = "https://www.strava.com/api/v3/athlete/activities?per_page=100";
const fields = ["name", "type", "sport_type", "start_date_local", "distance",
  "moving_time", "elapsed_time", "average_heartrate", "location_city"];

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
    return data.filter((run) => run.visibility === "everyone").slice(0, 30);
  } catch (err) {
    console.error("Fetch failed:", err);
    process.exit(1);
  }
}

async function updatePlaces(runs) {
  for (const post of runs) {
    if (!Array.isArray(post.start_latlng) || post.start_latlng.length < 2) {
      post.location_city = null;
      continue;
    }
    const [lat, lon] = post.start_latlng;
    try {
      const wres = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${openwtoken}`
      );
      if (!wres.ok) {
        console.error(`OpenWeather API error for activity ${post.id}:`, wres.status);
        post.location_city = null;
        continue;
      }
      const wdata = await wres.json();
      //debug:(
      console.log(`Run ${post.id}: ${wdata[0]?.name || "unknown"}`);
      post.location_city = wdata[0]?.name || null;
    } catch (err) {
      console.error("Failed to fetch city from coordinates:", post.id, err);
      post.location_city = null;
    }
  }
}

function slim(runs) {
  return runs.map((run) => Object.fromEntries(fields.map((f) => [f, run[f] ?? null])));
}

async function update() {
  const runs = await fetchStrava(); //updatePlaces will still run
  await updatePlaces(runs);
  const out = slim(runs);
  let existing = [];
  if (fs.existsSync(outputFile)) {
    existing = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
  }
  if (JSON.stringify(existing) === JSON.stringify(out)) {
    console.log("No changes in Strava data. Skipping update.");
    return;
  }
//debug check
  console.log(`runs.json updated with ${out.length} activities`);
  fs.writeFileSync(outputFile, JSON.stringify(out, null, 2));
}
update();