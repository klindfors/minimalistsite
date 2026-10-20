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
  const shown = runs.slice(0, 15);
  container.innerHTML = shown.map(formatActivity).join('');
  const now = new Date();
  addPostit(container, now, recap(runs, monthKey(now))
    || '<p>No runs yet this month. The first one is the best one!</p>');
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastText = recap(runs, monthKey(last));
  const row = shown.findIndex((run) => run.type === 'Run' && run.start_date_local?.startsWith(monthKey(last)));
  if (lastText && row !== -1) {
    const postit = addPostit(container, last, lastText);
    postit.style.top = container.querySelectorAll('.run')[row].offsetTop + 'px';
    postit.style.transform = 'rotate(-4deg)';
  }
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function addPostit(container, date, text) {
  const postit = document.createElement('div');
  postit.className = 'postit';
  const month = date.toLocaleString('en-GB', { month: 'long' });
  postit.innerHTML = `<h1>${month} highlights</h1>${text}`;
  container.appendChild(postit);
  initDrag(postit, container);
  return postit;
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
  if (weather.icon) return weather.icon.replace('d', 'n');
  const text = `${weather.main || ''} ${weather.description || ''}`.toLowerCase();
  if (text.includes('thunder')) return '11n';
  if (text.includes('snow') || text.includes('sleet') || text.includes('freezing')) return '13n';
  if (text.includes('drizzle') || text.includes('shower')) return '09n';
  if (text.includes('rain')) return '10n';
  if (text.includes('clear')) return '01n';
  if (text.includes('few clouds')) return '02n';
  if (text.includes('scattered clouds')) return '03n';
  if (text.includes('cloud')) return '04n';
  return '50n';
}

function recap(runs, key) {
  const month = runs.filter((run) => run.type === 'Run' && run.start_date_local?.startsWith(key));
  if (!month.length) return '';
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