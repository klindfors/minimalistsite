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
  postit.innerHTML = `<h1>${month} highlights</h1><p>April recap</p>`;
  container.appendChild(postit);
  initDrag(postit, container);
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
    year: 'numeric', month: 'short', day: 'numeric'
  });
  
  const isoDate = date.toISOString().split('T')[0];
  //todo: include weather data for runs
  const hr = run.average_heartrate || '--';
  const name = esc(run.name);
  const title = isStrength(run) || !run.location_city ? name : `${name} in ${esc(run.location_city)}`;
  const mins = Math.round((run.elapsed_time || run.moving_time || 0) / 60);
  const km = ((run.distance || 0) / 1000).toFixed(2);
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
      </p>
    </article>
  `;
}
function initDrag(postit, container) {
    let isDragging = false;
    let offsetX, offsetY;
    postit.addEventListener('pointerdown', (e) => {
    isDragging = true;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
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
 
  postit.addEventListener('pointerup', () => {
    isDragging = false;
    postit.style.cursor = 'grab';
  });
}
 
loadRuns();
