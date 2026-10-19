async function loadRuns() {
  const container = document.getElementById('runs');
  let runs = [];
  try {
    const res = await fetch('../runs.json');
    if (!res.ok) throw new Error(res.status);
    runs = await res.json();
  } catch (err) {
    container.textContent = 'Could not load activities right now.';
    return;
  }
  container.innerHTML = runs.slice(0, 15).map(formatActivity).join('');
  const postit = document.createElement('div');
  postit.className = 'postit';
  postit.id = 'postit';
  const month = new Date().toLocaleString('en-GB', { month: 'long' });
  postit.innerHTML = `<h1>${month} highlights</h1>${recap(runs)}`;
  container.appendChild(postit);
  initDrag(postit, container);
}

function list(items) {
  return new Intl.ListFormat('en-GB', { type: 'conjunction' }).format(items);
}

function timeOfDay(run) {
  const hour = parseInt(run.start_date_local.slice(11, 13), 10);
  if (hour < 5 || hour >= 22) return 'at night';
  if (hour < 11) return 'in the morning';
  if (hour < 14) return 'at lunchtime';
  if (hour < 18) return 'in the afternoon';
  return 'in the evening';
}

function weatherType(weather) {
  const text = `${weather.main || ''} ${weather.description || ''}`.toLowerCase();
  if (text.includes('thunder')) return 'thunder';
  if (text.includes('snow') || text.includes('sleet')) return 'snow';
  if (text.includes('rain') || text.includes('drizzle')) return 'rain';
  if (text.includes('clear') || text.includes('few clouds')) return 'sun';
  if (text.includes('cloud')) return 'cloudy weather';
  if (/mist|fog|haze/.test(text)) return 'fog';
  return null;
}

function weatherIcon(weather) {
  if (weather.icon) return weather.icon;
  const text = `${weather.main || ''} ${weather.description || ''}`.toLowerCase();
  if (text.includes('thunder')) return '11d';
  if (text.includes('snow') || text.includes('sleet') || text.includes('freezing')) return '13d';
  if (text.includes('drizzle') || text.includes('shower')) return '09d';
  if (text.includes('rain')) return '10d';
  if (text.includes('clear')) return '01d';
  if (text.includes('few clouds')) return '02d';
  if (text.includes('scattered clouds')) return '03d';
  if (text.includes('cloud')) return '04d';
  return '50d';
}

function recap(runs) {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const month = runs.filter((run) => run.type === 'Run' && run.start_date_local?.startsWith(ym));
  if (!month.length) return '<p>No runs yet this month. The first one is the best one!</p>';
  const order = ['in the morning', 'at lunchtime', 'in the afternoon', 'in the evening', 'at night'];
  const times = order.filter((t) => month.some((run) => timeOfDay(run) === t));
  const kinds = ['rain', 'sun', 'cloudy weather', 'snow', 'fog', 'thunder'];
  const seen = month.filter((run) => run.weather).map((run) => weatherType(run.weather));
  const weathers = kinds.filter((k) => seen.includes(k));
  let html = `<p>You ran ${list(times)}.</p>`;
  if (weathers.length) html += `<p>You ran in ${list(weathers)}!</p>`;
  return html;
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

function isStrength(run) {
  return run.sport_type === "WeightTraining" || run.type === "WeightTraining";
}

function formatActivity(run) {
  const date = new Date(run.start_date_local);
  const dateStr = date.toLocaleDateString('sv-SE', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'
  });
  
  const isoDate = date.toISOString().split('T')[0];
  const hr = run.average_heartrate || '--';
  const name = esc(run.name);
  const title = isStrength(run) || !run.location_city ? name : `${name} in ${esc(run.location_city)}`;
  const mins = Math.round((run.elapsed_time || run.moving_time || 0) / 60);
  const km = ((run.distance || 0) / 1000).toFixed(2);
  const weather = run.weather
    ? `<span class="run-weather"><img src="https://openweathermap.org/payload/api/media/file/${esc(weatherIcon(run.weather))}.png" alt="${esc(run.weather.description)}" title="${esc(run.weather.description)}" width="24" height="24"> ${run.weather.temp}°C</span>`
    : '';
  const metric = isStrength(run)
    ? `<data value="${mins}">${mins} min</data>`
    : `<data value="${km}">${km} km</data>`;
  return `
    <article class="run" itemscope itemtype="https://schema.org/ExerciseAction">
      <h3 class="run-title" itemprop="name">${title}</h3>
      <p class="run-details">
        <time datetime="${isoDate}" itemprop="startTime">${dateStr}</time>
        • ${metric}
        • <data value="${hr}" itemprop="heartRate">❤ ${hr} bpm</data>
        ${weather ? `• ${weather}` : ''}
      </p>
    </article>
  `;
}

function initDrag(postit, container) {
  let isDragging = false;
  let offsetX, offsetY;

  postit.addEventListener('pointerdown', (e) => {
    isDragging = true;
    const box = postit.getBoundingClientRect();
    offsetX = e.clientX - box.left;
    offsetY = e.clientY - box.top;
    postit.setPointerCapture(e.pointerId);
    postit.style.cursor = 'grabbing';
  });

  postit.addEventListener('pointermove', (e) => {
    if (isDragging) {
      const rect = container.getBoundingClientRect();
      postit.style.left = (e.clientX - rect.left - offsetX) + 'px';
      postit.style.top = (e.clientY - rect.top - offsetY) + 'px';
    }
  });

  const stop = () => {
    isDragging = false;
    postit.style.cursor = 'grab';
  };
  postit.addEventListener('pointerup', stop);
  postit.addEventListener('pointercancel', stop);
}

loadRuns();