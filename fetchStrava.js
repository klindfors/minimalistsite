import fetch from 'node-fetch';
import fs from 'fs';

const token = process.env.STRAVA_TOKEN; // fetch super sectret

async function fetchStrava() {
  try {
    const res = await fetch('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    // Spara anonymiserad data som JSON
    fs.writeFileSync('running/runs.json', JSON.stringify(data, null, 2));
    console.log('Strava data updated!');
  } catch (err) {
    console.error('Error fetching Strava data:', err);
  }
}

fetchStrava();
