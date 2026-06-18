/*
╔══════════════════════════════════════════════════════════════════╗
║                    GUMMY ✿ SCRIPT.JS                            ║
║              Chicas en Tec · Grupo 8B                           ║
╠══════════════════════════════════════════════════════════════════╣
║  ÍNDICE DE SECCIONES:                                            ║
║   1.  Audio — efectos de sonido (clicks, teclas)                 ║
║   2.  Música de fondo — 3 pistas generativas                     ║
║   3.  Controles de audio (botones mute/pistas)                   ║
║   4.  Ciclo día/noche + lluvia aleatoria                         ║
║   5.  Estrellas y gotas de lluvia (generación dinámica)          ║
║   6.  Guirnalda de luces (SVG dinámico)                          ║
║   7.  Parallax al scrollear                                      ║
║   8.  Scroll reveal (aparición de secciones)                     ║
║   9.  Saludo animado letra a letra                               ║
║  10.  Frases motivacionales rotativas                            ║
║  11.  Gummy — sistema de estados y animaciones (PNG)             ║
║  12.  Gummy — reacciones a eventos (hover, click, scroll)        ║
║  13.  Corazones voladores (efecto al hacer click en Gummy)       ║
║  14.  Chat con IA (API de Anthropic)                             ║
║  15.  Plantas — configuración de sprites PNG                     ║
║  16.  Tareas — datos iniciales y cálculo de porcentaje           ║
║  17.  Tareas — renderizado de plantas                            ║
║  18.  Tareas — renderizado de lista y subtareas                  ║
║  19.  Post-its — configuración de grilla                         ║
║  20.  Post-its — datos iniciales y colores                       ║
║  21.  Post-its — renderizado y drag & drop con snap              ║
║  22.  Hover interactivo global                                   ║
║  23.  Pantalla de carga + arranque de música                     ║
╚══════════════════════════════════════════════════════════════════╝
*/


/* ================================================================
   1. AUDIO — EFECTOS DE SONIDO
   ================================================================
   Usamos la Web Audio API para generar sonidos sintéticos
   (sin archivos externos). El AudioContext se crea al primer uso
   porque los navegadores requieren una interacción del usuario antes
   de permitir audio.

   Para reemplazar por archivos de audio propios (mp3/wav):
     new Audio('sounds/click.mp3').play();
   en lugar de las funciones playClick() y playType()
================================================================ */

// API de audio del navegador (compatible con Safari vía webkit)
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;   // se crea al primer click (requerimiento del navegador)

let sfxEnabled    = true;   // efectos de sonido activados
let musicEnabled  = true;   // música de fondo activada
let currentTrack  = 0;      // pista actual (0, 1, 2 → ver sección 2) / -1 = ninguna
let musicGain     = null;   // nodo de ganancia (volumen) de la música
let musicLoopActive = false; // token único para controlar qué loop está activo

// Crea (o reutiliza) el contexto de audio
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

// ── Sonido de click (pitido corto ascendente) ──────────────────
// Para cambiar el tono: editá los valores de frequency (Hz)
// Para cambiar el volumen: editá los valores de gain (0.0 a 1.0)
function playClick() {
  if (!sfxEnabled) return;
  try {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);

    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    o.start();
    o.stop(ctx.currentTime + 0.2);
  } catch(e) {}
}

// ── Sonido de tecla (nota aleatoria suave) ─────────────────────
// Se llama cada vez que el usuario tipea en cualquier input.
// Para cambiar las notas posibles: editá el array freqs (en Hz)
function playType() {
  if (!sfxEnabled) return;
  try {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);

    // Notas de una escala mayor — suenan agradables al teclear
    const freqs = [440, 523, 587, 659, 784, 880];
    o.frequency.setValueAtTime(
      freqs[Math.floor(Math.random() * freqs.length)],
      ctx.currentTime
    );
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    o.start();
    o.stop(ctx.currentTime + 0.08);
  } catch(e) {}
}


/* ================================================================
   2. MÚSICA DE FONDO — PISTAS GENERATIVAS
   ================================================================
   La música se genera matemáticamente con la Web Audio API,
   sin archivos externos. Cada pista es un conjunto de notas
   que se reproducen en loop de forma aleatoria.

   PARA CAMBIAR LAS NOTAS DE UNA PISTA:
     Editá los arrays dentro de trackNotes[] (valores en Hz).
     Frecuencias de referencia:
       Do  = 261  Re  = 294  Mi  = 329  Fa  = 349
       Sol = 392  La  = 440  Si  = 494  Do5 = 523

   PARA AGREGAR UNA PISTA NUEVA:
     1. Sumá un array de notas en trackNotes[]
     2. En index.html agregá un botón con data-track="3"
     3. Si querés diferente timbre, editá o.type:
        'sine' (suave), 'triangle' (cálido), 'square' (retro), 'sawtooth' (brillante)

   PARA USAR ARCHIVOS DE AUDIO PROPIOS (mp3/wav):
     Reemplazá toda la función playCozyBg() con:
       const audio = new Audio('music/pista1.mp3');
       audio.loop = true;
       audio.volume = 0.3;
       audio.play();
     Y stopMusic() con: audio.pause();
================================================================ */

// Detiene la música actual con fade-out suave
function stopMusic() {
  musicLoopActive = false;

  if (musicGain) {
    try {
      const ctx = getAudioCtx();
      musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
      setTimeout(() => {
        try { musicGain.disconnect(); } catch(e) {}
        musicGain = null;
      }, 400);
    } catch(e) {
      musicGain = null;
    }
  }
}

// Arranca la música de la pista currentTrack
function playCozyBg() {
  if (!musicEnabled || currentTrack === -1) return;
  stopMusic();

  try {
    const ctx = getAudioCtx();
    const myToken = Symbol();
    musicLoopActive = myToken;

    const newGain = ctx.createGain();
    newGain.gain.value = 0;
    newGain.connect(ctx.destination);
    newGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.4);
    musicGain = newGain;

    // ── NOTAS DE CADA PISTA ────────────────────────────────────
    const trackNotes = [
      [261, 294, 329, 349, 392, 440, 494],   // 0: Café Cozy
      [220, 261, 294, 329, 392],              // 1: Lluvia & Jazz
      [196, 220, 261, 294, 329],              // 2: Otoño Suave
    ];
    const notes = trackNotes[currentTrack] || trackNotes[0];

    let time = ctx.currentTime + 0.1;

    const scheduleNote = () => {
      if (musicLoopActive !== myToken) return;

      const o  = ctx.createOscillator();
      const g2 = ctx.createGain();

      o.type = currentTrack === 1 ? 'triangle' : 'sine';
      o.connect(g2);
      g2.connect(newGain);

      const note = notes[Math.floor(Math.random() * notes.length)];
      o.frequency.setValueAtTime(note, time);

      const dur = 0.5 + Math.random() * 0.7;

      g2.gain.setValueAtTime(0, time);
      g2.gain.linearRampToValueAtTime(0.18, time + 0.04);
      g2.gain.setTargetAtTime(0, time + dur - 0.12, 0.06);

      o.start(time);
      o.stop(time + dur + 0.1);

      time += dur * 0.55;

      const delay = Math.max(0, (time - ctx.currentTime) * 1000 - 150);
      setTimeout(scheduleNote, delay);
    };

    scheduleNote();
  } catch(e) {}
}


/* ================================================================
   3. CONTROLES DE AUDIO — BOTONES DE LA INTERFAZ
================================================================ */

// ── Botón de efectos de sonido (🔔 / 🔕) ──────────────────────
document.getElementById('sfx-btn').addEventListener('click', () => {
  sfxEnabled = !sfxEnabled;
  document.getElementById('sfx-btn').classList.toggle('muted', !sfxEnabled);
  document.getElementById('sfx-btn').textContent = sfxEnabled ? '🔔' : '🔕';
});

// ── Botón de música (🎵 / 🔇) — abre/cierra el selector ───────
const musicBtn      = document.getElementById('music-btn');
const trackSelector = document.getElementById('track-selector');

musicBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  trackSelector.classList.toggle('open');
});

// ── Botones de pista dentro del selector ──────────────────────
document.querySelectorAll('.track-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const track = parseInt(btn.dataset.track);

    document.querySelectorAll('.track-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    trackSelector.classList.remove('open');

    if (track === -1) {
      currentTrack  = -1;
      musicEnabled  = false;
      stopMusic();
      musicBtn.classList.add('muted');
      musicBtn.textContent = '🔇';
    } else {
      currentTrack  = track;
      musicEnabled  = true;
      musicBtn.classList.remove('muted');
      musicBtn.textContent = '🎵';
      window._musicStarted = true;
      playCozyBg();
    }
    playClick();
  });
});

document.addEventListener('click', () => trackSelector.classList.remove('open'));
document.addEventListener('keydown', () => playType());


/* ================================================================
   4. CICLO DÍA / NOCHE + LLUVIA ALEATORIA
   ================================================================
   Detecta la hora actual del sistema y aplica la clase .day o .night
   al <body>. CSS cambia el cielo, las estrellas y el sol/luna.

   Para cambiar los rangos de día/noche:
     isNight = h < 6 || h >= 20
   Para cambiar la probabilidad de lluvia:
     Math.random() < 0.25  ← 25% de probabilidad
================================================================ */
function setDayNight() {
  const h = new Date().getHours();
  const isNight = h < 6 || h >= 20;

  document.body.classList.toggle('night', isNight);
  document.body.classList.toggle('day',   !isNight);

  const shouldRain = Math.random() < 0.25;
  document.getElementById('rain-container')
    .classList.toggle('raining', shouldRain && !isNight);
}

setDayNight();
setInterval(setDayNight, 60000);


/* ================================================================
   5. GENERACIÓN DINÁMICA DE ESTRELLAS Y LLUVIA
   ================================================================
   Para cambiar la cantidad de estrellas: editá el 60 del loop
   Para cambiar la cantidad de gotas:     editá el 80 del loop
================================================================ */

// ── Estrellas ─────────────────────────────────────────────────
const starsContainer = document.getElementById('stars-container');
for (let i = 0; i < 60; i++) {
  const s = document.createElement('div');
  s.className = 'star';
  s.style.cssText = [
    `left:${Math.random() * 100}%`,
    `top:${Math.random() * 60}%`,
    `width:${2 + Math.random() * 3}px`,
    `height:${2 + Math.random() * 3}px`,
    `animation-delay:${Math.random() * 3}s`,
  ].join(';');
  starsContainer.appendChild(s);
}

// ── Gotas de lluvia ───────────────────────────────────────────
const rainContainer = document.getElementById('rain-container');
for (let i = 0; i < 80; i++) {
  const d = document.createElement('div');
  d.className = 'raindrop';
  const h = 20 + Math.random() * 60;
  d.style.cssText = [
    `left:${Math.random() * 100}%`,
    `height:${h}px`,
    `animation-duration:${0.6 + Math.random() * 0.8}s`,
    `animation-delay:${Math.random() * 2}s`,
  ].join(';');
  rainContainer.appendChild(d);
}


/* ================================================================
   7. PARALLAX AL SCROLLEAR
   ================================================================
   Para cambiar la intensidad del parallax:
     Editá el 0.12 → más grande = más efecto
================================================================ */
window.addEventListener('scroll', () => {
  const scrollY      = window.scrollY;
  const sceneContent = document.getElementById('scene-content');
  if (sceneContent) {
    sceneContent.style.transform = `translateY(${scrollY * 0.12}px)`;
  }
});


/* ================================================================
   8. SCROLL REVEAL — APARICIÓN DE SECCIONES
   ================================================================
   Para agregar la animación a un elemento nuevo:
     Solo agregá la clase "reveal" en el HTML.
================================================================ */
const revealEls = document.querySelectorAll('.reveal');
const observer  = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.12 });

revealEls.forEach(el => observer.observe(el));


/* ================================================================
   9. SALUDO ANIMADO LETRA A LETRA
   ================================================================
   Para cambiar o agregar saludos: editá el array greetings[]
   Para cambiar la velocidad: editá el 55 y el 40 (ms por letra)
================================================================ */
const greetings = [
  '¡Hola, explorador! 👋',
  '¡Hola, soñador! ✨',
  '¡Bienvenido de vuelta! 🌿',
  '¡Hola, campeón! 🏆',
];
  
const greet   = greetings[Math.floor(Math.random() * greetings.length)];
const typedEl = document.getElementById('typed-greeting');
let ti = 0;

function typeChar() {
  if (ti < greet.length) {
    typedEl.textContent += greet[ti++];
    setTimeout(typeChar, 55 + Math.random() * 40);
  }
}
setTimeout(typeChar, 600);


/* ================================================================
   10. FRASES MOTIVACIONALES ROTATIVAS
   ================================================================
   Para cambiar o agregar frases: editá el array quotes[]
   Para cambiar el intervalo: editá el 5000 (ms)
================================================================ */
const quotes = [
  '"Cada pequeño paso cuenta. ¡Hoy es un buen día para empezar! 🌱"',
  '"Tu esfuerzo de hoy es tu éxito de mañana. ¡Seguí adelante! 💛"',
  '"No importa qué tan lento vayas, siempre que no te detengas. 🐰"',
  '"Sos más capaz de lo que creés. ¡Confía en vos! ✨"',
  '"Cada experto fue alguna vez un principiante. ¡Vos podés! 🌟"',
  '"Un día a la vez, un paso a la vez. ¡Estás haciendo genial! 🌿"',
];

const quoteEl = document.getElementById('motivational-quote');
let qi = 0;

setInterval(() => {
  quoteEl.classList.add('fading');
  setTimeout(() => {
    qi = (qi + 1) % quotes.length;
    quoteEl.textContent = quotes[qi];
    quoteEl.classList.remove('fading');
  }, 500);
}, 5000);


/* ================================================================
   11. GUMMY — SISTEMA DE ESTADOS Y ANIMACIONES (PNG)
   ================================================================
   Gummy tiene 5 estados posibles:
     'idle'  → alterna entre MainPetIdle1.png y MainPetIdle2.png (saltitos)
     'hover' → usa animación idle con label de saludo
     'happy' → MainPetPat.png + salta (al clickear / recibir respuesta IA)
     'sleep' → animación idle con movimiento lento y label zzz
     'study' → MainPetStudy.png con leve balanceo (al scrollear / chat)

   SPRITES USADOS:
     MainPetIdle1.png  → frame 1 del idle (se alterna con frame 2)
     MainPetIdle2.png  → frame 2 del idle
     MainPetPat.png    → al acariciar / recibir mimos
     MainPetStudy.png  → al scrollear o mientras el chat piensa

   PARA AGREGAR MÁS SPRITES:
     Agregá el .png en la carpeta y referencialo en el objeto SPRITES.

   Para cambiar la velocidad de alternancia idle:
     Editá el 700 en startIdleAnim() (milisegundos)
   Para cambiar cuánto tiempo hasta que se duerme:
     Editá el 15000 en resetIdleTimer() (milisegundos)
   Para cambiar cuánto dura el estado happy:
     Editá el 2500 en setGummyState() → caso 'happy'
================================================================ */

let gummyState   = 'idle';  // estado actual
let idleTimer    = null;    // timer para detectar inactividad
let gummyBounceT = 0;       // tiempo acumulado para la animación

const gummyWrapper = document.getElementById('gummy-wrapper');

// Referencia a la <img> de la mascota en el HTML
// ── IMPORTANTE: tu <img> debe tener id="MainPet" ──────────────
const mainPet = document.getElementById('MainPet');

// ── Sprites disponibles ────────────────────────────────────────
// Cambiá los valores si tus archivos tienen otra ruta o nombre.
const SPRITES = {
  idle1: 'MainPetIdle1.png',
  idle2: 'MainPetIdle2.png',
  pat:   'MainPetPat.png',
  study: 'MainPetStudy.png',
};

// ── Animación idle: alterna entre idle1 e idle2 ───────────────
let idleFrame    = 0;
let idleInterval = null;

function startIdleAnim() {
  stopIdleAnim(); // evita crear dos intervals al mismo tiempo
  const frames = [SPRITES.idle1, SPRITES.idle2];
  idleInterval = setInterval(() => {
    idleFrame = (idleFrame + 1) % frames.length;
    mainPet.src = frames[idleFrame];
  }, 700); // ms entre frames — editá para ir más rápido o lento
}

function stopIdleAnim() {
  clearInterval(idleInterval);
  idleInterval = null;
}

// ── Cambia a un sprite fijo (para estados no-idle) ────────────
function setGummySprite(src) {
  stopIdleAnim();      // frena la alternancia idle
  mainPet.src = src;
}

// ── Cambia el estado completo de Gummy ────────────────────────
function setGummyState(state) {
  gummyState = state;

  // Etiqueta de texto debajo del personaje
  const labels = {
    idle:  '¡Hola! 🐰',
    happy: '¡Mimito! 💕',
    sleep: 'zzz... 😴',
    study: 'Estudiando 📚',
    hover: '¡Hola! 👋',
  };
  const labelEl = document.getElementById('gummy-state-label');
  if (labelEl) labelEl.textContent = labels[state] || '🐰';

  if (state === 'idle' || state === 'hover' || state === 'sleep') {
    // Estos tres estados usan la animación de dos frames
    startIdleAnim();

  } else if (state === 'happy') {
    // Sprite de mimo — vuelve a idle automáticamente
    setGummySprite(SPRITES.pat);
    setTimeout(() => {
      if (gummyState === 'happy') setGummyState('idle');
    }, 2500);

  } else if (state === 'study') {
    // Sprite de estudio
    setGummySprite(SPRITES.study);
  }
}

// ── Animación continua (requestAnimationFrame) ────────────────
// Aplica movimiento con CSS transform según el estado actual.
// El sprite se controla por separado (arriba); acá solo se mueve.
//
// Para cambiar la intensidad del rebote:
//   idle:  * 4  → más grande = salta más
//   happy: * 8  → más grande = salta más alto
// Para cambiar la velocidad del bounce:
//   gummyBounceT += 0.05  → más grande = más rápido
function animateGummy() {
  gummyBounceT += 0.05;

  if (gummyState === 'idle' || gummyState === 'hover') {
    const bounce = Math.sin(gummyBounceT) * 4;
    mainPet.style.transform = `translateY(${bounce}px)`;

  } else if (gummyState === 'sleep') {
    const bounce = Math.sin(gummyBounceT * 0.4) * 2;
    mainPet.style.transform = `translateY(${bounce}px) rotate(${bounce * 0.5}deg)`;

  } else if (gummyState === 'happy') {
    const bounce = Math.abs(Math.sin(gummyBounceT * 2)) * 8;
    mainPet.style.transform = `translateY(-${bounce}px)`;

  } else if (gummyState === 'study') {
    mainPet.style.transform = `rotate(${Math.sin(gummyBounceT * 0.5) * 1.5}deg)`;

  } else {
    mainPet.style.transform = '';
  }

  requestAnimationFrame(animateGummy);
}

// Arrancar en idle + loop de animación
setGummyState('idle');
animateGummy();


/* ================================================================
   12. GUMMY — REACCIONES A EVENTOS DEL USUARIO
   ================================================================
   Timer de inactividad: si el usuario no hace nada durante 15 segundos,
   Gummy se queda dormida (sigue con idle animado pero label zzz).
================================================================ */

function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (gummyState !== 'happy') setGummyState('sleep');
  }, 15000); // 15 segundos sin actividad → duerme
}

// Pasar el mouse → saluda (sin cambiar sprite)
gummyWrapper.addEventListener('mouseenter', () => {
  if (gummyState !== 'sleep' && gummyState !== 'happy') setGummyState('hover');
});

// Sacar el mouse → vuelve a idle
gummyWrapper.addEventListener('mouseleave', () => {
  if (gummyState === 'hover') setGummyState('idle');
});

// Click en Gummy → mimo + corazones
gummyWrapper.addEventListener('click', () => {
  setGummyState('happy');
  spawnHearts(gummyWrapper);
  playClick();
  resetIdleTimer();
});

// Scrollear → study (vuelve a idle 1.5s después de parar)
document.addEventListener('scroll', () => {
  if (gummyState !== 'happy') setGummyState('study');
  resetIdleTimer();
  clearTimeout(window._scrollEndTimer);
  window._scrollEndTimer = setTimeout(() => {
    if (gummyState === 'study') setGummyState('idle');
  }, 1500);
});

document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('keydown',   resetIdleTimer);

resetIdleTimer();


/* ================================================================
   13. CORAZONES VOLADORES
   ================================================================
   Al hacer click en Gummy, 5 corazones vuelan desde su posición.

   Para cambiar los emojis: editá el array hearts[]
   Para cambiar la cantidad: editá el 5 del loop
   Para cambiar qué tan lejos se dispersan: editá el * 50 y * 30
================================================================ */
function spawnHearts(el) {
  const rect = el.getBoundingClientRect();
  const cx   = rect.left + rect.width  / 2;
  const cy   = rect.top  + rect.height / 3;

  const hearts = ['💗', '💕', '🩷', '💖', '❤️'];

  for (let i = 0; i < 5; i++) {
    const h = document.createElement('div');
    h.className = 'heart-particle';
    h.textContent = hearts[i % hearts.length];
    h.style.left         = (cx + (Math.random() - 0.5) * 50) + 'px';
    h.style.top          = (cy + (Math.random() - 0.5) * 30) + 'px';
    h.style.animationDelay = (i * 0.1) + 's';
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1200);
  }
}


/* ================================================================
   14. CHAT CON IA — API DE ANTHROPIC
   ================================================================
   PARA CAMBIAR LA PERSONALIDAD DE GUMMY:
     Editá el texto dentro de system: `...` en sendChat().

   PARA CAMBIAR EL MODELO:
     Editá model: 'claude-sonnet-4-6'
     Alternativa más rápida: 'claude-haiku-4-5-20251001'

   PARA CAMBIAR LA LONGITUD MÁXIMA DE RESPUESTA:
     Editá max_tokens: 1000
================================================================ */

const chatMessages = document.getElementById('chat-messages');
const chatInput    = document.getElementById('chat-input');
const chatSendBtn  = document.getElementById('chat-send-btn');

function addMsg(text, who) {
  const div = document.createElement('div');
  div.className = `chat-msg ${who}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addLoading() {
  const div = document.createElement('div');
  div.className = 'chat-msg gummy loading';
  div.id        = 'loading-msg';
  div.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

async function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;

  addMsg(text, 'user');
  chatInput.value = '';
  playClick();
  resetIdleTimer();

  const loading = addLoading();
  setGummyState('study'); // Gummy "piensa" mientras espera respuesta

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 1000,

        // ── PERSONALIDAD DE GUMMY ─────────────────────────────
        // Editá este texto para cambiar cómo responde Gummy.
        system: `Sos Gummy 🐰, una conejita estudiosa, tierna, alegre y muy empática.
Sos la asistente y amiga virtual de la app. Tu misión es ayudar a estudiantes,
personas buscando su primer empleo, freelancers y creativos junior.

Personalidad:
- Usás emojis lindos con moderación 🐰✨💛🌿
- Sos cálida, motivadora y escuchás antes de aconsejar
- Hablás en español rioplatense (vos, che, etc.)
- Cuando alguien busca trabajo, les preguntás sus habilidades, nivel y área
- Cuando alguien está mal emocionalmente, los escuchás y apoyás
- Sos concisa pero cariñosa
- A veces hacés preguntas para entender mejor qué necesitan

Si te preguntan por trabajos, pedí: área de interés, habilidades principales,
nivel de experiencia y ubicación. Luego sugerí roles y consejos prácticos.`,

        messages: [{ role: 'user', content: text }]
      })
    });

    const data  = await response.json();
    loading.remove();
    const reply = data.content?.map(c => c.text || '').join('') || '¡Ups! Algo salió mal 🐰';
    addMsg(reply, 'gummy');

  } catch (err) {
    loading.remove();
    addMsg('¡Ups! No pude conectarme ahora 🐰 ¡Intentá de nuevo en un ratito!', 'gummy');
  }

  setGummyState('happy');
  setTimeout(() => setGummyState('idle'), 2000);
}

chatSendBtn.addEventListener('click', sendChat);

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendChat();
  else playType();
});


/* ================================================================
   15. PLANTAS — CONFIGURACIÓN DE SPRITES PNG
   ================================================================
   ESTRUCTURA DE ARCHIVOS PARA TUS PNG:
     plants/
       plant1/ stage0.png ... stage4.png
       plant2/ stage0.png ... stage4.png
       plant3/ stage0.png ... stage4.png

   PARA USAR TUS PNG, reemplazá plantImageHTML() con:
     return `<img src="plants/plant${plantType}/stage${stage}.png"
                  class="plant-img" alt="planta">`;

   PARA CAMBIAR LOS UMBRALES DE CRECIMIENTO:
     Editá STAGE_THRESHOLDS[]:
       stage 0 = desde  0%
       stage 1 = desde 20%
       stage 2 = desde 45%
       stage 3 = desde 70%
       stage 4 = desde 95%
================================================================ */

const PLANT_TYPES      = 3;
const STAGE_THRESHOLDS = [0, 20, 45, 70, 95];

function getStage(pct) {
  let stage = 0;
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (pct >= STAGE_THRESHOLDS[i]) { stage = i; break; }
  }
  return stage;
}

function plantImageHTML(plantType, stage) {
  const colors  = ['#7AB648', '#E8A85A', '#C8853A'];
  const col     = colors[(plantType - 1) % colors.length];
  const heights = [8, 22, 40, 58, 76];
  const h       = heights[stage];
  const showFlower = stage >= 3;
  const showLeaves = stage >= 2;
  const potH    = 28;
  const totalH  = 100;
  const stemBottom = totalH - potH;
  const stemTop    = stemBottom - h;

  return `<svg
    width="64" height="${totalH}"
    viewBox="0 0 64 ${totalH}"
    xmlns="http://www.w3.org/2000/svg"
    class="plant-img"
    style="transition: all 0.6s cubic-bezier(.22,.68,0,1.2)"
  >
    <rect x="16" y="${totalH - potH}" width="32" height="${potH - 6}" rx="4" fill="#C8853A"/>
    <rect x="12" y="${totalH - potH}" width="40" height="8"          rx="4" fill="#A0622A"/>
    <ellipse cx="32" cy="${totalH - potH + 5}" rx="14" ry="4" fill="#5A3010"/>
    ${stage === 0
      ? `<circle cx="32" cy="${stemBottom - 4}" r="4" fill="#5A8A28" opacity="0.6"/>`
      : ''}
    ${stage > 0
      ? `<line x1="32" y1="${stemBottom}" x2="32" y2="${stemTop}"
               stroke="${col}" stroke-width="3" stroke-linecap="round"/>`
      : ''}
    ${showLeaves ? `
      <ellipse cx="22" cy="${stemTop + h * 0.4}" rx="10" ry="6"
               fill="${col}" transform="rotate(-25 22 ${stemTop + h * 0.4})" opacity="0.85"/>
      <ellipse cx="42" cy="${stemTop + h * 0.6}" rx="10" ry="6"
               fill="${col}" transform="rotate(25 42 ${stemTop + h * 0.6})" opacity="0.85"/>
    ` : ''}
    ${showFlower
      ? `<circle cx="32" cy="${stemTop}" r="${stage === 4 ? 11 : 8}"
                 fill="${stage === 4 ? '#FFD700' : '#FFB3C6'}" opacity="0.9"/>
         <circle cx="32" cy="${stemTop}" r="4"
                 fill="${stage === 4 ? '#FF8800' : '#FF6B9D'}"/>`
      : (stage >= 1
          ? `<ellipse cx="32" cy="${stemTop}" rx="6" ry="5" fill="${col}" opacity="0.9"/>`
          : '')
    }
  </svg>`;
}


/* ================================================================
   16. TAREAS — DATOS INICIALES Y CÁLCULO DE PORCENTAJE
   ================================================================
   Cada tarea:
     id        → número único
     name      → nombre editable
     plantType → tipo de planta (1, 2 o 3)
     subtasks  → array de { text: string, done: boolean }
     _expanded → (interno) si el acordeón está abierto
================================================================ */
let tasks = [
  {
    id: 1,
    name: 'Portfolio personal',
    plantType: 1,
    subtasks: [
      { text: 'Elegir proyectos',   done: false },
      { text: 'Diseñar la web',     done: true  },
      { text: 'Publicar online',    done: false },
    ]
  },
  {
    id: 2,
    name: 'LinkedIn optimizado',
    plantType: 2,
    subtasks: [
      { text: 'Foto profesional', done: true  },
      { text: 'Escribir bio',     done: false },
    ]
  },
  {
    id: 3,
    name: 'Practicar entrevistas',
    plantType: 3,
    subtasks: [
      { text: 'Estudiar preguntas comunes', done: false },
      { text: 'Mock interview',             done: false },
      { text: 'Feedback',                   done: false },
    ]
  },
];

function getTaskPct(task) {
  if (!task.subtasks.length) return 0;
  return Math.round(
    (task.subtasks.filter(s => s.done).length / task.subtasks.length) * 100
  );
}


/* ================================================================
   17. TAREAS — RENDERIZADO DE PLANTAS
================================================================ */
function renderPlants() {
  const row = document.getElementById('plants-row');
  row.innerHTML = '';

  tasks.forEach(task => {
    const pct   = getTaskPct(task);
    const stage = getStage(pct);

    const div     = document.createElement('div');
    div.className = 'plant-pot interactive';
    div.innerHTML = `
      <div class="plant-svg-wrap">
        ${plantImageHTML(task.plantType, stage)}
      </div>
      <div class="plant-label">${task.name}</div>
      <div class="plant-pct">${pct}%</div>
    `;

    div.addEventListener('click', () => {
      const taskEl = document.getElementById(`task-${task.id}`);
      if (taskEl) {
        taskEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        taskEl.classList.add('expanded');
        task._expanded = true;
      }
      playClick();
    });

    row.appendChild(div);
  });

  const addBtn     = document.createElement('button');
  addBtn.className = 'add-plant-btn interactive';
  addBtn.innerHTML = '+<span>Nueva tarea</span>';
  addBtn.addEventListener('click', addTask);
  row.appendChild(addBtn);
}


/* ================================================================
   18. TAREAS — RENDERIZADO DE LISTA Y SUBTAREAS
================================================================ */

function renderTasks() {
  const area = document.getElementById('tasks-area');

  const expanded = new Set(
    [...area.querySelectorAll('.task-item.expanded')].map(el => el.id)
  );

  area.innerHTML = '';

  tasks.forEach(task => {
    const pct = getTaskPct(task);
    const div = document.createElement('div');
    div.className = 'task-item';
    div.id        = `task-${task.id}`;

    if (expanded.has(`task-${task.id}`) || task._expanded) {
      div.classList.add('expanded');
      task._expanded = true;
    }

    div.innerHTML = `
      <div class="task-header">
        <button class="task-expand-btn interactive" title="Expandir">▶</button>
        <input  class="task-name-input" value="${task.name}" placeholder="Nombre de tarea..."/>
        <span   class="task-pct-display">${pct}%</span>
        <div    class="task-actions">
          <button class="task-action-btn interactive" title="Eliminar tarea" data-del="${task.id}">🗑</button>
        </div>
      </div>
      <div class="task-progress-bar">
        <div class="task-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="subtasks-area" id="subtasks-${task.id}"></div>
    `;

    div.querySelector('.task-expand-btn').addEventListener('click', () => {
      div.classList.toggle('expanded');
      task._expanded = div.classList.contains('expanded');
      playClick();
    });

    div.querySelector('.task-name-input').addEventListener('input', e => {
      task.name = e.target.value;
      renderPlants();
    });

    div.querySelector('[data-del]').addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      renderAll();
      playClick();
    });

    area.appendChild(div);
    renderSubtasks(task);
  });
}

function renderSubtasks(task) {
  const area = document.getElementById(`subtasks-${task.id}`);
  if (!area) return;
  area.innerHTML = '';

  task.subtasks.forEach((sub, si) => {
    const row     = document.createElement('div');
    row.className = 'subtask-row';
    row.innerHTML = `
      <input type="checkbox" class="subtask-check interactive" ${sub.done ? 'checked' : ''}/>
      <input class="subtask-input" value="${sub.text}" placeholder="Subtarea..."/>
      <button class="task-action-btn interactive" title="Eliminar subtarea">✕</button>
    `;

    row.querySelector('.subtask-check').addEventListener('change', e => {
      sub.done = e.target.checked;
      renderPlants();
      const newPct = getTaskPct(task);
      const pctEl  = document.querySelector(`#task-${task.id} .task-pct-display`);
      const fillEl = document.querySelector(`#task-${task.id} .task-progress-fill`);
      if (pctEl)  pctEl.textContent  = newPct + '%';
      if (fillEl) fillEl.style.width = newPct + '%';
      playClick();
    });

    row.querySelector('.subtask-input').addEventListener('input', e => {
      sub.text = e.target.value;
    });

    row.querySelector('.task-action-btn').addEventListener('click', () => {
      task.subtasks.splice(si, 1);
      renderSubtasks(task);
      renderPlants();
      const newPct = getTaskPct(task);
      const pctEl  = document.querySelector(`#task-${task.id} .task-pct-display`);
      const fillEl = document.querySelector(`#task-${task.id} .task-progress-fill`);
      if (pctEl)  pctEl.textContent  = newPct + '%';
      if (fillEl) fillEl.style.width = newPct + '%';
      playClick();
    });

    area.appendChild(row);
  });

  const addBtn     = document.createElement('button');
  addBtn.className = 'add-subtask-btn interactive';
  addBtn.textContent = '+ Agregar subtarea';
  addBtn.addEventListener('click', () => {
    task.subtasks.push({ text: '', done: false });
    task._expanded = true;
    renderSubtasks(task);
    const inputs = document.querySelectorAll(`#subtasks-${task.id} .subtask-input`);
    if (inputs.length) inputs[inputs.length - 1].focus();
    playClick();
  });

  area.appendChild(addBtn);
}

function renderAll() {
  renderPlants();
  renderTasks();
}

function addTask() {
  const id        = Date.now();
  const plantType = Math.floor(Math.random() * PLANT_TYPES) + 1;
  tasks.push({ id, name: 'Nueva tarea', plantType, subtasks: [] });
  renderAll();

  setTimeout(() => {
    const el = document.getElementById(`task-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('expanded');
    }
  }, 100);

  playClick();
}

renderAll();


/* ================================================================
   19. POST-ITS — CONFIGURACIÓN DE GRILLA
   ================================================================
   Para cambiar el tamaño de los post-its:
     Editá POSTIT_W (ancho) y POSTIT_H (alto) en px.
     También actualizá .postit en el CSS con los mismos valores.
   Para cambiar el espacio entre ellos: editá POSTIT_GAP.
================================================================ */

const POSTIT_W   = 190;
const POSTIT_H   = 175;
const POSTIT_GAP = 20;
const POSTIT_PAD = 16;

function getGridCols() {
  const container = document.getElementById('postits-container');
  if (!container) return 3;
  const w = container.clientWidth - POSTIT_PAD * 2;
  return Math.max(1, Math.floor((w + POSTIT_GAP) / (POSTIT_W + POSTIT_GAP)));
}

function slotToXY(slot, cols) {
  const col = slot % cols;
  const row = Math.floor(slot / cols);
  return {
    x: POSTIT_PAD + col * (POSTIT_W + POSTIT_GAP),
    y: POSTIT_PAD + row * (POSTIT_H + POSTIT_GAP),
  };
}

function assignSlots() {
  postits.forEach((p, i) => {
    if (p.slot === undefined) p.slot = i;
  });

  const used   = new Map();
  const sorted = [...postits].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  let nextFree = 0;

  sorted.forEach(p => {
    while (used.has(nextFree)) nextFree++;
    if (used.has(p.slot)) p.slot = nextFree;
    used.set(p.slot, true);
    nextFree = p.slot + 1;
  });
}


/* ================================================================
   20. POST-ITS — DATOS INICIALES Y COLORES
   ================================================================
   Para agregar un color:
     1. Sumá un objeto en postitColors[]
     2. Agregá .postit-nombre { background: #HEX; } en el CSS
================================================================ */

const postitColors = [
  { bg: '#FFF176', cls: 'postit-yellow' },
  { bg: '#FFCCBC', cls: 'postit-peach'  },
  { bg: '#C8E6C9', cls: 'postit-mint'   },
  { bg: '#E1BEE7', cls: 'postit-lilac'  },
  { bg: '#B3E5FC', cls: 'postit-sky'    },
];

let postits = [
  { id: 1, title: 'Primera etapa 🎯',  body: 'Crear CV actualizado y portfolio con 2-3 proyectos propios', color: 0, slot: 0 },
  { id: 2, title: 'Networking 🤝',     body: 'Conectar con 5 personas del área en LinkedIn esta semana',   color: 1, slot: 1 },
  { id: 3, title: 'Aplicar 🚀',        body: 'Enviar 3 solicitudes por semana y hacer seguimiento',        color: 2, slot: 2 },
];


/* ================================================================
   21. POST-ITS — RENDERIZADO Y DRAG & DROP CON SNAP
================================================================ */

let dragging = null;
let dragOffX = 0;
let dragOffY = 0;

function renderPostits() {
  const container = document.getElementById('postits-container');
  assignSlots();

  const cols = getGridCols();
  const rows = Math.ceil((postits.length + 1) / cols);

  container.style.minHeight = (POSTIT_PAD * 2 + rows * (POSTIT_H + POSTIT_GAP)) + 'px';
  container.innerHTML = '';

  postits.forEach(p => {
    const { x, y } = slotToXY(p.slot, cols);

    const div     = document.createElement('div');
    div.className = `postit ${postitColors[p.color].cls}`;
    div.id        = `postit-${p.id}`;
    div.draggable = false;
    div.style.position = 'absolute';
    div.style.width    = POSTIT_W + 'px';
    div.style.left     = x + 'px';
    div.style.top      = y + 'px';

    div.innerHTML = `
      <button class="postit-delete interactive" title="Eliminar">✕</button>
      <textarea class="postit-title-input" rows="1" placeholder="Título...">${p.title}</textarea>
      <textarea class="postit-body-input"  rows="4" placeholder="Escribí tu nota...">${p.body}</textarea>
      <div class="postit-colors">
        ${postitColors.map((c, i) =>
          `<div class="postit-color-dot interactive"
                style="background:${c.bg}"
                data-color="${i}"></div>`
        ).join('')}
      </div>
    `;

    div.addEventListener('mousedown', e => {
      if (
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'BUTTON'   ||
        e.target.classList.contains('postit-color-dot')
      ) return;

      e.preventDefault();
      const divRect = div.getBoundingClientRect();
      dragOffX = e.clientX - divRect.left;
      dragOffY = e.clientY - divRect.top;
      dragging = { id: p.id, el: div, data: p };
      div.classList.add('dragging');
      div.style.zIndex     = 100;
      div.style.transition = 'none';
    });

    div.querySelector('.postit-delete').addEventListener('click', () => {
      postits = postits.filter(pp => pp.id !== p.id);
      postits.forEach((pp, i) => { pp.slot = i; });
      renderPostits();
      playClick();
    });

    div.querySelectorAll('.postit-color-dot').forEach(dot => {
      dot.addEventListener('click', e => {
        p.color       = parseInt(dot.dataset.color);
        div.className = `postit ${postitColors[p.color].cls}`;
        div.style.position = 'absolute';
        playClick();
        e.stopPropagation();
      });
    });

    div.querySelector('.postit-title-input').addEventListener('input', e => { p.title = e.target.value; });
    div.querySelector('.postit-body-input').addEventListener('input',  e => { p.body  = e.target.value; });

    container.appendChild(div);
  });

  const nextSlot      = postits.length;
  const { x: bx, y: by } = slotToXY(nextSlot, cols);
  const addBtn        = document.createElement('button');
  addBtn.className    = 'add-postit-btn interactive';
  addBtn.style.position  = 'absolute';
  addBtn.style.left      = bx + 'px';
  addBtn.style.top       = by + 'px';
  addBtn.style.width     = POSTIT_W + 'px';
  addBtn.style.minHeight = POSTIT_H + 'px';
  addBtn.innerHTML       = '+<span>Nueva nota</span>';

  addBtn.addEventListener('click', () => {
    const id   = Date.now();
    const slot = postits.length;
    postits.push({ id, title: '', body: '', color: Math.floor(Math.random() * postitColors.length), slot });
    renderPostits();
    setTimeout(() => {
      const el = document.getElementById(`postit-${id}`);
      if (el) el.querySelector('.postit-title-input').focus();
    }, 50);
    playClick();
  });

  container.appendChild(addBtn);
}

document.addEventListener('mousemove', e => {
  if (!dragging) return;
  const container     = document.getElementById('postits-container');
  const containerRect = container.getBoundingClientRect();
  const x = e.clientX - containerRect.left - dragOffX;
  const y = e.clientY - containerRect.top  - dragOffY;
  dragging.el.style.left = x + 'px';
  dragging.el.style.top  = y + 'px';
});

document.addEventListener('mouseup', () => {
  if (!dragging) return;

  const cols = getGridCols();
  const x    = parseFloat(dragging.el.style.left);
  const y    = parseFloat(dragging.el.style.top);

  const occupiedSlots = new Set(
    postits.filter(p => p.id !== dragging.data.id).map(p => p.slot)
  );

  let bestSlot = dragging.data.slot;
  let bestDist = Infinity;

  for (let s = 0; s <= postits.length; s++) {
    if (occupiedSlots.has(s)) continue;
    const { x: sx, y: sy } = slotToXY(s, cols);
    const dist = Math.hypot(x - sx, y - sy);
    if (dist < bestDist) { bestDist = dist; bestSlot = s; }
  }

  dragging.data.slot = bestSlot;
  const { x: snapX, y: snapY } = slotToXY(bestSlot, cols);

  dragging.el.style.transition = 'left 0.35s cubic-bezier(.22,.68,0,1.5), top 0.35s cubic-bezier(.22,.68,0,1.5)';
  dragging.el.style.left       = snapX + 'px';
  dragging.el.style.top        = snapY + 'px';
  dragging.el.style.zIndex     = '';
  dragging.el.classList.remove('dragging');
  dragging.el.classList.add('dropped');

  const droppedEl = dragging.el;
  setTimeout(() => droppedEl.classList.remove('dropped'), 400);
  dragging = null;

  const container = document.getElementById('postits-container');
  const rows = Math.ceil((postits.length + 1) / getGridCols());
  container.style.minHeight = (POSTIT_PAD * 2 + rows * (POSTIT_H + POSTIT_GAP)) + 'px';

  playClick();
});

renderPostits();


/* ================================================================
   22. HOVER INTERACTIVO GLOBAL
================================================================ */
document.addEventListener('mouseover', e => {
  const el = e.target.closest('.interactive');
  if (el && !el.classList.contains('postit') && !el.classList.contains('task-item')) {
    el.style.transition = 'transform 0.2s cubic-bezier(.22,.68,0,1.5)';
    el.style.transform  = 'scale(1.06)';
  }
});

document.addEventListener('mouseout', e => {
  const el = e.target.closest('.interactive');
  if (el) el.style.transform = '';
});


/* ================================================================
   23. PANTALLA DE CARGA + ARRANQUE DE MÚSICA
   ================================================================
   Para cambiar el tiempo de la pantalla de carga:
     Editá el 1200 del setTimeout (milisegundos)
================================================================ */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loading-overlay').classList.add('hidden');

    document.addEventListener('click', () => {
      if (musicEnabled && !window._musicStarted) {
        window._musicStarted = true;
        playCozyBg();
      }
    }, { once: true });
  }, 1200);
});

document.addEventListener('click', e => {
  if (e.target.closest('button') || e.target.closest('.interactive')) {
    playClick();
  }
});