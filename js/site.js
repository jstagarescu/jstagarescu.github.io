function initPlayer() {
  const audio   = new Audio('media/song.mp3');
  audio.preload = 'metadata';

  const vizEl  = document.getElementById('player-viz');
  const progEl = document.getElementById('player-prog');
  const btnEl  = document.getElementById('player-playbtn');
  const curEl  = document.getElementById('player-cur');
  const durEl  = document.getElementById('player-dur');
  const volEl  = document.getElementById('player-vol');
  if (!vizEl) return;

  const VOL_N = 8;
  let volume = 1;
  function renderVol() {
    if (!volEl) return;
    const filled = Math.round(volume * VOL_N);
    volEl.textContent = '█'.repeat(filled) + '░'.repeat(VOL_N - filled);
    volEl.setAttribute('aria-valuenow', Math.round(volume * 100));
    audio.volume = volume;
  }
  renderVol();

  function setVolAt(clientX) {
    const r = volEl.getBoundingClientRect();
    volume = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    renderVol();
  }
  let volDragging = false;
  if (volEl) {
    volEl.addEventListener('mousedown', e => { volDragging = true; setVolAt(e.clientX); });
    volEl.addEventListener('touchstart', e => { e.preventDefault(); setVolAt(e.touches[0].clientX); }, { passive: false });
    volEl.addEventListener('touchmove',  e => { e.preventDefault(); setVolAt(e.touches[0].clientX); }, { passive: false });
  }

  let actx = null, analyser = null, freqData = null;
  function boot() {
    if (actx) return;
    actx     = new (window.AudioContext || window.webkitAudioContext)();
    analyser = actx.createAnalyser();
    analyser.fftSize               = 64;
    analyser.smoothingTimeConstant = 0.82;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    actx.createMediaElementSource(audio).connect(analyser);
    analyser.connect(actx.destination);
  }

  const fmt = s => isNaN(s) || !isFinite(s)
    ? '—'
    : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const BLOCKS = ['▁','▂','▃','▄','▅','▆','▇','█'];

  let vizCW = 18, progCW = 8;
  requestAnimationFrame(() => {
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font-family:SF Mono,Fira Mono,Consolas,Courier New,monospace;';
    document.body.appendChild(probe);
    probe.style.fontSize = getComputedStyle(vizEl).fontSize;
    probe.textContent    = '█'.repeat(20);
    vizCW = probe.offsetWidth / 20;
    probe.style.fontSize = getComputedStyle(progEl).fontSize;
    progCW = probe.offsetWidth / 20;
    document.body.removeChild(probe);
  });

  let idleT = 0;
  function tick() {
    requestAnimationFrame(tick);

    const nViz = Math.max(8, Math.floor(vizEl.offsetWidth / vizCW));
    let viz = '';
    if (analyser && !audio.paused) {
      analyser.getByteFrequencyData(freqData);
      for (let i = 0; i < nViz; i++) {
        const bin = Math.floor(i / nViz * freqData.length);
        const v   = Math.pow(freqData[bin] / 255, 0.6);
        viz += BLOCKS[Math.min(7, Math.floor(v * 8))];
      }
    } else {
      idleT += 0.032;
      for (let i = 0; i < nViz; i++) {
        const v = Math.max(0,
          Math.sin(idleT       + i * 0.45) * 0.17 +
          Math.sin(idleT * 0.6 + i * 0.22) * 0.10 + 0.09
        );
        viz += BLOCKS[Math.min(7, Math.floor(v * 8))];
      }
    }
    vizEl.textContent = viz;

    const nProg  = Math.max(8, Math.floor(progEl.offsetWidth / progCW));
    const pct    = audio.duration ? audio.currentTime / audio.duration : 0;
    const filled = Math.round(pct * nProg);
    progEl.textContent = '█'.repeat(filled) + '░'.repeat(nProg - filled);
    progEl.setAttribute('aria-valuenow', Math.round(pct * 100));

    curEl.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
  }
  tick();

  btnEl.addEventListener('click', async () => {
    boot();
    if (actx.state === 'suspended') await actx.resume();
    if (audio.paused) { await audio.play(); btnEl.textContent = '[ ■ ]'; }
    else              { audio.pause();      btnEl.textContent = '[ ▶ ]'; }
  });

  audio.addEventListener('ended',          () => { btnEl.textContent = '[ ▶ ]'; });
  audio.addEventListener('loadedmetadata', () => { durEl.textContent = fmt(audio.duration); });

  function seekAt(clientX) {
    if (!audio.duration) return;
    const r = progEl.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * audio.duration;
  }
  let dragging = false;
  progEl.addEventListener('mousedown', e => { dragging = true; seekAt(e.clientX); });
  window.addEventListener('mousemove', e => {
    if (dragging)    seekAt(e.clientX);
    if (volDragging) setVolAt(e.clientX);
  });
  window.addEventListener('mouseup', () => { dragging = false; volDragging = false; });
  progEl.addEventListener('touchstart', e => { e.preventDefault(); seekAt(e.touches[0].clientX); }, { passive: false });
  progEl.addEventListener('touchmove',  e => { e.preventDefault(); seekAt(e.touches[0].clientX); }, { passive: false });

  window.addEventListener('pagehide', () => audio.pause());
}

function initNav() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  const pattern = '𓆝  𓆟  𓆞  𓆝  𓆟  ';
  const reps = Math.ceil((window.innerWidth * 2) / (pattern.length * 40)) + 4;
  const ticker = document.createElement('div');
  ticker.className = 'nav-ticker';
  ticker.setAttribute('aria-hidden', 'true');
  ticker.textContent = pattern.repeat(reps * 2);
  nav.prepend(ticker);
}

initNav();
if (document.getElementById('music-player')) initPlayer();
