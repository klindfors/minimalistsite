

    async function loadRuns() {
      const res = await fetch('../runs.json');
      const runs = await res.json();
      const container = document.getElementById('runs');

      container.innerHTML = runs.slice(0, 15)
        .map(run => {
          const date = new Date(run.start_date_local);
          const dateStr = date.toLocaleDateString('sv-SE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

          //todo: fix location by reverse geocoding with coordinates
          
          const km = (run.distance / 1000).toFixed(2);
          const hr = run.average_heartrate || '--';
          const coord = run.start_latlng;
          const lat = coord[0];
          const lon = coord[1];
          const location = run.location_city || run.location_state || run.location_country || 'Sydney';

        
          
          return `
            <div class="run">
              <p class="run-title">${run.name} in ${location}</p>
              <p class="run-details">${dateStr} • ${km} km  ❤ ${hr} bpm  </p>
            </div>

          `;
        })

        .join('');

  
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

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    postit.style.position = 'absolute';
    postit.style.left = e.pageX - offsetX + 'px';
    postit.style.top = e.pageY - offsetY + 'px';
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  postit.style.cursor = 'grab';
});


