async function loadRuns() {
  const res = await fetch('../runs.json');
  const runs = await res.json();
  const container = document.getElementById('runs');
  container.insertAdjacentHTML('beforeend', runs.slice(0, 15).map(formatActivity).join(''));
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
  const title = isStrength(run) ? run.name : `${run.name} in ${run.location_city}`;
  const metric = isStrength(run)
    ? `<data value="${Math.round((run.elapsed_time || run.moving_time || 0) / 60)}">
         ${Math.round((run.elapsed_time || run.moving_time || 0) / 60)} min
       </data>`
    : `<data value="${(run.distance / 1000).toFixed(2)}">
         ${(run.distance / 1000).toFixed(2)} km
       </data>`;

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

loadRuns();

//todo: postit with summary of latest month
const postit = document.getElementById('postit');
let isDragging = false;
let offsetX, offsetY;

postit.addEventListener('mousedown', (e) => {
  isDragging = true;
  offsetX = e.offsetX;
  offsetY = e.offsetY;
  postit.style.cursor = 'grabbing';
});
postit.addEventListener('mousemove', (e) => {
  if (isDragging) {
    postit.style.position = 'absolute';
    postit.style.left = e.pageX - offsetX + 'px';
    postit.style.top = e.pageY - offsetY + 'px';
  }
});
postit.addEventListener('mouseup', () => {
  isDragging = false;
  postit.style.cursor = 'grab';
});