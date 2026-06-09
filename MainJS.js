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
║  11.  Gummy — sistema de estados y animaciones                   ║
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

let sfxEnabled   = true;   // efectos de sonido activados
let musicEnabled = true;   // música de fondo activada
let currentTrack = 0;      // pista actual (0, 1, 2 → ver sección 2)
                           // -1 = ninguna música
let musicGain      = null; // nodo de ganancia (volumen) de la música
let musicLoopActive = false; // token único para controlar qué loop está activo
                             // evita que dos loops suenen al mismo tiempo

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
    const o = ctx.createOscillator(); // genera la onda
    const g = ctx.createGain();       // controla el volumen
    o.connect(g);
    g.connect(ctx.destination);       // sale por los parlantes

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
  musicLoopActive = false; // invalida el token del loop actual → se detiene solo

  if (musicGain) {
    try {
      const ctx = getAudioCtx();
      // Fade-out en 0.2 segundos para que no corte abruptamente
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
  stopMusic(); // primero frena cualquier cosa que esté sonando

  try {
    const ctx = getAudioCtx();

    // Token único: si se llama otra vez a playCozyBg() antes de que
    // termine este loop, el nuevo token reemplaza al viejo y el loop viejo
    // para en la próxima nota (condición if musicLoopActive !== myToken).
    const myToken = Symbol();
    musicLoopActive = myToken;

    // Nodo de ganancia para esta pista — arranca en silencio y sube gradualmente
    const newGain = ctx.createGain();
    newGain.gain.value = 0;
    newGain.connect(ctx.destination);
    newGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.4);
    musicGain = newGain;

    // ── NOTAS DE CADA PISTA ────────────────────────────────────
    // Para cambiar el carácter musical editá los arrays:
    //   Más notas = más variado; menos notas = más repetitivo y meditativo
    const trackNotes = [
      [261, 294, 329, 349, 392, 440, 494],   // 0: Café Cozy (escala completa, alegre)
      [220, 261, 294, 329, 392],              // 1: Lluvia & Jazz (pentatónica, melancólica)
      [196, 220, 261, 294, 329],              // 2: Otoño Suave (graves, tranquilo)
    ];
    const notes = trackNotes[currentTrack] || trackNotes[0];

    // ── LOOP DE NOTAS ──────────────────────────────────────────
    // Programa cada nota con un pequeño adelanto para que no haya
    // interrupciones (técnica de "lookahead scheduling").
    let time = ctx.currentTime + 0.1;

    const scheduleNote = () => {
      // Si ya hay un nuevo loop activo, este se detiene solo
      if (musicLoopActive !== myToken) return;

      const o  = ctx.createOscillator();
      const g2 = ctx.createGain();

      // Pista 1 usa 'triangle' para dar sensación jazzera
      o.type = currentTrack === 1 ? 'triangle' : 'sine';
      o.connect(g2);
      g2.connect(newGain);

      // Nota aleatoria de la escala de la pista
      const note = notes[Math.floor(Math.random() * notes.length)];
      o.frequency.setValueAtTime(note, time);

      // Duración aleatoria entre 0.5 y 1.2 segundos
      const dur = 0.5 + Math.random() * 0.7;

      // Envolvente ADSR simplificada (ataque → sostenido → caída)
      g2.gain.setValueAtTime(0, time);
      g2.gain.linearRampToValueAtTime(0.18, time + 0.04);     // ataque
      g2.gain.setTargetAtTime(0, time + dur - 0.12, 0.06);    // caída

      o.start(time);
      o.stop(time + dur + 0.1);

      // Siguiente nota a ~55% de la duración actual (superposición suave)
      time += dur * 0.55;

      // Programa el siguiente scheduleNote justo antes de que se necesite
      const delay = Math.max(0, (time - ctx.currentTime) * 1000 - 150);
      setTimeout(scheduleNote, delay);
    };

    scheduleNote(); // arranca el loop
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
  // No reproduce click si se acaba de silenciar
});

// ── Botón de música (🎵 / 🔇) — abre/cierra el selector ───────
const musicBtn      = document.getElementById('music-btn');
const trackSelector = document.getElementById('track-selector');

musicBtn.addEventListener('click', (e) => {
  e.stopPropagation(); // evita que el click llegue al document y cierre el menú
  trackSelector.classList.toggle('open');
});

// ── Botones de pista dentro del selector ──────────────────────
// Cada botón tiene data-track="0", "1", "2" o "-1" (ninguna).
// Al clickear: frena la pista anterior y arranca la nueva inmediatamente.
document.querySelectorAll('.track-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const track = parseInt(btn.dataset.track);

    // Marcar botón activo
    document.querySelectorAll('.track-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    trackSelector.classList.remove('open');

    if (track === -1) {
      // Opción "Ninguna" → silenciar completamente
      currentTrack  = -1;
      musicEnabled  = false;
      stopMusic();
      musicBtn.classList.add('muted');
      musicBtn.textContent = '🔇';
    } else {
      // Cambiar a la pista seleccionada
      currentTrack  = track;
      musicEnabled  = true;
      musicBtn.classList.remove('muted');
      musicBtn.textContent = '🎵';
      // Marca que ya hubo interacción (requerimiento del navegador para audio)
      window._musicStarted = true;
      playCozyBg(); // arranca inmediatamente
    }
    playClick();
  });
});

// Cierra el selector si se hace click en cualquier otro lado
document.addEventListener('click', () => trackSelector.classList.remove('open'));

// Sonido de tecla en cualquier input de la página
document.addEventListener('keydown', () => playType());


/* ================================================================
   4. CICLO DÍA / NOCHE + LLUVIA ALEATORIA
   ================================================================
   Detecta la hora actual del sistema y aplica la clase .day o .night
   al <body>. CSS cambia el cielo, las estrellas y el sol/luna.

   Para cambiar los rangos de día/noche:
     isNight = h < 6 || h >= 20   ← antes de las 6am o desde las 8pm
     Podés ajustar esos números a tu gusto.

   Para cambiar la probabilidad de lluvia:
     Math.random() < 0.25   ← 25% de probabilidad
     Aumentá el número para que llueva más seguido (máximo 1.0 = siempre)
================================================================ */
function setDayNight() {
  const h = new Date().getHours();
  const isNight = h < 6 || h >= 20; // noche: antes de las 6am o desde las 8pm

  document.body.classList.toggle('night', isNight);
  document.body.classList.toggle('day',   !isNight);

  // Lluvia aleatoria (solo de día, 25% de probabilidad)
  const shouldRain = Math.random() < 0.25;
  document.getElementById('rain-container')
    .classList.toggle('raining', shouldRain && !isNight);
}

setDayNight();                       // aplicar al cargar
setInterval(setDayNight, 60000);     // revisar cada minuto


/* ================================================================
   5. GENERACIÓN DINÁMICA DE ESTRELLAS Y LLUVIA
   ================================================================
   Las estrellas y las gotas de lluvia se crean con JS para poder
   tener posiciones y velocidades aleatorias sin repetir código HTML.

   Para cambiar la cantidad de estrellas: editá el 60 del loop
   Para cambiar la cantidad de gotas:     editá el 80 del loop
================================================================ */

// ── Estrellas ─────────────────────────────────────────────────
// Se generan en #stars-container (dentro del fondo fijo).
// CSS las hace visibles solo con la clase .night en body.
const starsContainer = document.getElementById('stars-container');
for (let i = 0; i < 60; i++) {
  const s = document.createElement('div');
  s.className = 'star';
  s.style.cssText = [
    `left:${Math.random() * 100}%`,
    `top:${Math.random() * 60}%`,                // solo en la mitad superior
    `width:${2 + Math.random() * 3}px`,
    `height:${2 + Math.random() * 3}px`,
    `animation-delay:${Math.random() * 3}s`,     // parpadeo desincronizado
  ].join(';');
  starsContainer.appendChild(s);
}

// ── Gotas de lluvia ───────────────────────────────────────────
// Se generan en #rain-container. CSS las anima cayendo.
const rainContainer = document.getElementById('rain-container');
for (let i = 0; i < 80; i++) {
  const d = document.createElement('div');
  d.className = 'raindrop';
  const h = 20 + Math.random() * 60; // largo de la gota (px)
  d.style.cssText = [
    `left:${Math.random() * 100}%`,
    `height:${h}px`,
    `animation-duration:${0.6 + Math.random() * 0.8}s`, // velocidad de caída
    `animation-delay:${Math.random() * 2}s`,             // inicio desincronizado
  ].join(';');
  rainContainer.appendChild(d);
}


/* ================================================================
   6. GUIRNALDA DE LUCES
   ================================================================
   Dibuja el cable ondulado (path SVG) y las lamparitas (círculo +
   elipse) con colores alternados y animación de parpadeo.

   Para cambiar los colores de las lamparitas:
     Editá el array colors[] abajo.
   Para cambiar el tamaño de las lamparitas:
     Editá los atributos r (radio del círculo) y rx/ry (de la elipse).
   Para cambiar la densidad de lamparitas:
     Cambiá el divisor 80 en segs = Math.floor(vw / 80)
     Número mayor = menos lamparitas; menor = más.
================================================================ */
(function buildGarland() {
  const vw   = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const segs = Math.floor(vw / 80) + 2; // cantidad de puntos del cable
  const spacing = vw / (segs - 1);

  // Cable ondulado usando curvas cuadráticas (Q)
  let d = `M 0 8`;
  for (let i = 1; i < segs; i++) {
    const x   = i * spacing;
    const cpx = (i - 0.5) * spacing;    // punto de control = mitad entre dos puntos
    d += ` Q ${cpx} 48 ${x} 8`;         // 48 = cuánto cae el cable en el medio
  }
  document.querySelector('#garland-path').setAttribute('d', d);

  // ── Lamparitas ──────────────────────────────────────────────
  // Para cambiar los colores: editá este array
  const colors = ['#FFD700', '#FF6B6B', '#7AB648', '#64B5F6', '#CE93D8', '#FFB74D'];
  const bulbs  = document.getElementById('garland-bulbs');

  for (let i = 0; i < segs; i++) {
    const x   = i * spacing;
    const col = colors[i % colors.length];

    // Punto de conexión (círculo pequeño donde el cable toca)
    const ci = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ci.setAttribute('cx', x);
    ci.setAttribute('cy', 8);
    ci.setAttribute('r', 5);
    ci.setAttribute('fill', col);
    ci.style.cssText = `
      filter: drop-shadow(0 0 4px ${col}99);
      animation: twinkle ${1.5 + Math.random() * 2}s infinite alternate;
      animation-delay: ${Math.random() * 2}s
    `;
    bulbs.appendChild(ci);

    // Cuerpo de la lamparita (elipse colgando)
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', x);
    ellipse.setAttribute('cy', 16);
    ellipse.setAttribute('rx', 4.5);
    ellipse.setAttribute('ry', 6);
    ellipse.setAttribute('fill', col);
    ellipse.style.cssText = `
      filter: drop-shadow(0 0 6px ${col}BB);
      animation: twinkle ${1.5 + Math.random() * 2}s infinite alternate;
      animation-delay: ${Math.random() * 2}s
    `;
    bulbs.appendChild(ellipse);
  }
})();


/* ================================================================
   7. PARALLAX AL SCROLLEAR
   ================================================================
   El fondo se mueve más lento que el contenido cuando scrolleás,
   dando sensación de profundidad.

   Para cambiar la intensidad del parallax:
     Editá el 0.12 → más grande = más efecto (0 = sin efecto)
================================================================ */
window.addEventListener('scroll', () => {
  const scrollY      = window.scrollY;
  const sceneContent = document.getElementById('scene-content');
  if (sceneContent) {
    // Se mueve un 12% de lo que se scrollea (más lento que el contenido)
    sceneContent.style.transform = `translateY(${scrollY * 0.12}px)`;
  }
});


/* ================================================================
   8. SCROLL REVEAL — APARICIÓN DE SECCIONES
   ================================================================
   IntersectionObserver detecta cuando un elemento .reveal entra
   en el viewport y le agrega la clase .visible, que dispara la
   animación CSS de fade + zoom.

   Para cambiar qué tan visible tiene que estar el elemento
   antes de disparar la animación:
     threshold: 0.12   ← 12% del elemento visible
     Aumentá para que espere más antes de aparecer.

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
   Escribe el saludo de bienvenida simulando que se escribe solo.
   Se elige uno al azar de la lista al cargar la página.

   Para cambiar o agregar saludos:
     Editá el array greetings[] abajo.
   Para cambiar la velocidad de escritura:
     Editá el 55 y el 40 en setTimeout (milisegundos por letra)
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
    // Velocidad levemente aleatoria para que parezca más natural
    setTimeout(typeChar, 55 + Math.random() * 40);
  }
}
setTimeout(typeChar, 600); // espera un poco antes de empezar


/* ================================================================
   10. FRASES MOTIVACIONALES ROTATIVAS
   ================================================================
   Cambia la frase cada 5 segundos con un fade suave.

   Para cambiar o agregar frases:
     Editá el array quotes[] abajo.
   Para cambiar el intervalo:
     Editá el 5000 del setInterval (milisegundos)
   Para cambiar la velocidad del fade:
     En style.css buscá .motivational-quote y editá transition: opacity
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
  quoteEl.classList.add('fading');        // CSS lo hace transparente
  setTimeout(() => {
    qi = (qi + 1) % quotes.length;       // siguiente frase en loop
    quoteEl.textContent = quotes[qi];
    quoteEl.classList.remove('fading');  // vuelve a ser visible
  }, 500); // espera a que termine el fade-out (500ms = transition en CSS)
}, 5000);


/* ================================================================
   11. GUMMY — SISTEMA DE ESTADOS Y ANIMACIONES
   ================================================================
   Gummy tiene 5 estados posibles:
     'idle'  → saltitos suaves (por defecto)
     'hover' → sonrisa, ojos felices (al pasar el mouse)
     'happy' → salta, corazones, cachetes rosados (al clickear)
     'sleep' → ojos cerrados, ZZZs, movimiento lento (inactiva 15s)
     'study' → anteojos, libro, leve balanceo (al scrollear)

   PARA ADAPTAR CON TU PROPIO SPRITE (PNG/GIF):
     Si usás una imagen en lugar del SVG, reemplazá las líneas que
     muestran/ocultan grupos SVG por cambios de src:
       const gummyImg = document.getElementById('gummy-img');
       // En setGummyState(), en lugar de setGummyEyes() etc:
       gummyImg.src = `sprites/gummy-${state}.png`;
     O si usás un spritesheet:
       gummyImg.style.backgroundPosition = spritePositions[state];

   Para cambiar cuánto tiempo hasta que se duerme:
     Editá el 15000 en resetIdleTimer() (milisegundos)
   Para cambiar cuánto dura el estado happy:
     Editá el 2500 en setGummyState() → caso 'happy'
================================================================ */

let gummyState    = 'idle';  // estado actual
let idleTimer     = null;    // timer para detectar inactividad
let gummyBounceT  = 0;       // tiempo acumulado para la animación (seno)

const gummyWrapper = document.getElementById('gummy-wrapper');
const gummySvg     = document.getElementById('gummy-svg');

// ── Cambia qué grupo de ojos es visible ───────────────────────
// Los grupos #eyes-normal, #eyes-happy, etc. están en el SVG del HTML.
// Si usás PNG, reemplazá esta función por un cambio de imagen.
function setGummyEyes(state) {
  ['normal', 'happy', 'sleep', 'study'].forEach(s => {
    const el = document.getElementById('eyes-' + s);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('eyes-' + state);
  if (target) target.style.display = '';
  else document.getElementById('eyes-normal').style.display = ''; // fallback
}

// ── Cambia entre boca sonriente y boca neutral ────────────────
function setGummyMouth(smile) {
  document.getElementById('mouth-smile').style.display = smile ? ''     : 'none';
  document.getElementById('mouth-sleep').style.display = smile ? 'none' : '';
}

// ── Muestra/oculta los extras según el estado ─────────────────
// #gummy-book  → libro en manos (study)
// #gummy-zzz   → letras Z flotando (sleep)
// #gummy-hearts → corazones (happy)
function showGummyExtras(state) {
  document.getElementById('gummy-book').style.display   = state === 'study' ? '' : 'none';
  document.getElementById('gummy-zzz').style.display    = state === 'sleep' ? '' : 'none';
  document.getElementById('gummy-hearts').style.display = state === 'happy' ? '' : 'none';
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
  document.getElementById('gummy-state-label').textContent = labels[state] || '🐰';

  // Configurar expresión y extras según el estado
  if (state === 'happy') {
    setGummyEyes('happy');
    setGummyMouth(true);
    document.getElementById('cheek-l').setAttribute('opacity', '0.9'); // cachetes muy rosas
    document.getElementById('cheek-r').setAttribute('opacity', '0.9');
    showGummyExtras('happy');
    // Vuelve a idle automáticamente después de 2.5 segundos
    setTimeout(() => {
      if (gummyState === 'happy') setGummyState('idle');
    }, 2500);

  } else if (state === 'sleep') {
    setGummyEyes('sleep');
    setGummyMouth(false);
    document.getElementById('cheek-l').setAttribute('opacity', '0.4');
    document.getElementById('cheek-r').setAttribute('opacity', '0.4');
    showGummyExtras('sleep');

  } else if (state === 'study') {
    setGummyEyes('study'); // pone anteojos
    setGummyMouth(true);
    document.getElementById('cheek-l').setAttribute('opacity', '0.5');
    document.getElementById('cheek-r').setAttribute('opacity', '0.5');
    showGummyExtras('study');

  } else if (state === 'hover') {
    setGummyEyes('happy');
    setGummyMouth(true);
    document.getElementById('cheek-l').setAttribute('opacity', '0.7');
    document.getElementById('cheek-r').setAttribute('opacity', '0.7');
    showGummyExtras('idle'); // sin extras en hover

  } else {
    // idle (default)
    setGummyEyes('normal');
    setGummyMouth(true);
    document.getElementById('cheek-l').setAttribute('opacity', '0.6');
    document.getElementById('cheek-r').setAttribute('opacity', '0.6');
    showGummyExtras('idle');
  }
}

// ── Animación continua (requestAnimationFrame) ────────────────
// Se ejecuta ~60 veces por segundo y aplica el movimiento del estado actual.
// Para cambiar la intensidad del rebote:
//   idle:  * 4  → más grande = salta más
//   happy: * 8  → más grande = salta más alto
// Para cambiar la velocidad:
//   gummyBounceT += 0.05  → más grande = más rápido
function animateGummy() {
  gummyBounceT += 0.05;

  if (gummyState === 'idle') {
    const bounce = Math.sin(gummyBounceT) * 4;
    gummySvg.style.transform = `translateY(${bounce}px)`;

  } else if (gummyState === 'sleep') {
    const bounce = Math.sin(gummyBounceT * 0.4) * 2;
    gummySvg.style.transform = `translateY(${bounce}px) rotate(${bounce * 0.5}deg)`;

  } else if (gummyState === 'happy') {
    const bounce = Math.abs(Math.sin(gummyBounceT * 2)) * 8;
    gummySvg.style.transform = `translateY(-${bounce}px)`;

  } else if (gummyState === 'study') {
    gummySvg.style.transform = `rotate(${Math.sin(gummyBounceT * 0.5) * 1.5}deg)`;
  }

  requestAnimationFrame(animateGummy); // se llama a sí misma en loop
}
animateGummy(); // arrancar el loop de animación


/* ================================================================
   12. GUMMY — REACCIONES A EVENTOS DEL USUARIO
   ================================================================
   Timer de inactividad: si el usuario no hace nada durante 15 segundos,
   Gummy se queda dormida.
================================================================ */

// Reinicia el timer de inactividad cada vez que el usuario hace algo
function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (gummyState !== 'happy') setGummyState('sleep');
  }, 15000); // 15 segundos sin actividad → duerme
}

// Al pasar el mouse por encima → saluda
gummyWrapper.addEventListener('mouseenter', () => {
  if (gummyState !== 'sleep') setGummyState('hover');
});

// Al sacar el mouse → vuelve a idle
gummyWrapper.addEventListener('mouseleave', () => {
  if (gummyState === 'hover') setGummyState('idle');
});

// Al hacer click en Gummy → se pone muy feliz y salen corazones
gummyWrapper.addEventListener('click', () => {
  setGummyState('happy');
  spawnHearts(gummyWrapper);
  playClick();
  resetIdleTimer();
});

// Al scrollear → se pone a estudiar
// Vuelve a idle 1.5 segundos después de dejar de scrollear
document.addEventListener('scroll', () => {
  if (gummyState !== 'happy') setGummyState('study');
  resetIdleTimer();
  clearTimeout(window._scrollEndTimer);
  window._scrollEndTimer = setTimeout(() => {
    if (gummyState === 'study') setGummyState('idle');
  }, 1500);
});

// Cualquier movimiento del mouse o tecla reinicia el timer de sueño
document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('keydown',   resetIdleTimer);

resetIdleTimer(); // arrancar el timer al cargar la página


/* ================================================================
   13. CORAZONES VOLADORES
   ================================================================
   Al hacer click en Gummy, 5 corazones vuelan desde su posición.
   Se crean como divs temporales y se eliminan solos.

   Para cambiar los emojis: editá el array hearts[]
   Para cambiar la cantidad: editá el 5 del loop
   Para cambiar qué tan lejos se dispersan: editá el * 50 y * 30
================================================================ */
function spawnHearts(el) {
  const rect = el.getBoundingClientRect();
  const cx   = rect.left + rect.width  / 2;
  const cy   = rect.top  + rect.height / 3; // sale del tercio superior

  const hearts = ['💗', '💕', '🩷', '💖', '❤️'];

  for (let i = 0; i < 5; i++) {
    const h = document.createElement('div');
    h.className = 'heart-particle';
    h.textContent = hearts[i % hearts.length];
    // Posición aleatoria alrededor del centro de Gummy
    h.style.left         = (cx + (Math.random() - 0.5) * 50) + 'px';
    h.style.top          = (cy + (Math.random() - 0.5) * 30) + 'px';
    h.style.animationDelay = (i * 0.1) + 's'; // escalonados
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1200); // limpieza automática
  }
}


/* ================================================================
   14. CHAT CON IA — API DE ANTHROPIC
   ================================================================
   Gummy usa la API de Claude para responder mensajes.
   El "system prompt" define su personalidad y comportamiento.

   PARA CAMBIAR LA PERSONALIDAD DE GUMMY:
     Editá el texto dentro de system: `...` en sendChat().
     Podés hacerla más seria, más divertida, cambiar el idioma, etc.

   PARA CAMBIAR EL MODELO:
     Editá model: 'claude-sonnet-4-20250514'
     Otros modelos disponibles: 'claude-haiku-4-5-20251001' (más rápido)

   PARA CAMBIAR LA LONGITUD MÁXIMA DE RESPUESTA:
     Editá max_tokens: 1000 (más = respuestas más largas, pero más lentas)

   NOTA: Esta app llama a la API directamente desde el navegador.
   En producción deberías usar un backend para no exponer la API key.
================================================================ */

const chatMessages = document.getElementById('chat-messages');
const chatInput    = document.getElementById('chat-input');
const chatSendBtn  = document.getElementById('chat-send-btn');

// Agrega un mensaje al historial visible
function addMsg(text, who) {
  const div = document.createElement('div');
  div.className = `chat-msg ${who}`; // 'gummy' o 'user'
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight; // scroll al final
}

// Agrega la burbuja de "Gummy está escribiendo..." (tres puntitos)
function addLoading() {
  const div = document.createElement('div');
  div.className = 'chat-msg gummy loading';
  div.id        = 'loading-msg';
  div.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

// Envía el mensaje del usuario a la API y muestra la respuesta
async function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return; // ignorar si el input está vacío

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
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,

        // ── PERSONALIDAD DE GUMMY ─────────────────────────────
        // Editá este texto para cambiar cómo responde Gummy.
        // Podés cambiar: nombre, idioma, tono, temas que maneja, etc.
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
    // Concatena todos los bloques de texto de la respuesta
    const reply = data.content?.map(c => c.text || '').join('') || '¡Ups! Algo salió mal 🐰';
    addMsg(reply, 'gummy');

  } catch (err) {
    loading.remove();
    addMsg('¡Ups! No pude conectarme ahora 🐰 ¡Intentá de nuevo en un ratito!', 'gummy');
  }

  setGummyState('happy');
  setTimeout(() => setGummyState('idle'), 2000);
}

// Botón enviar
chatSendBtn.addEventListener('click', sendChat);

// Enter para enviar, cualquier otra tecla para sonido de tipeo
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendChat();
  else playType();
});


/* ================================================================
   15. PLANTAS — CONFIGURACIÓN DE SPRITES PNG
   ================================================================
   Cada tarea tiene una planta asociada que crece según el progreso.

   ESTRUCTURA DE ARCHIVOS PARA TUS PNG:
     plants/
       plant1/
         stage0.png  ← 0% completado (semilla / tierra)
         stage1.png  ← ~20%          (brote)
         stage2.png  ← ~45%          (planta chica)
         stage3.png  ← ~70%          (planta mediana)
         stage4.png  ← ~95-100%      (planta grande / florecida)
       plant2/
         stage0.png ... stage4.png
       plant3/
         stage0.png ... stage4.png

   PARA USAR TUS PNG:
     Reemplazá el contenido de la función plantImageHTML() con:
       return `<img
         src="plants/plant${plantType}/stage${stage}.png"
         class="plant-img"
         alt="planta ${plantType} etapa ${stage}"
       >`;
     y borrá todo el SVG placeholder que hay adentro.

   PARA CAMBIAR LOS UMBRALES DE CRECIMIENTO:
     Editá STAGE_THRESHOLDS []. El índice corresponde al stage:
       stage 0 = desde  0%
       stage 1 = desde 20%
       stage 2 = desde 45%
       stage 3 = desde 70%
       stage 4 = desde 95%

   PARA AGREGAR MÁS TIPOS DE PLANTA:
     Cambiá PLANT_TYPES al número total que tenés,
     y creá las carpetas correspondientes.
================================================================ */

// ── Cantidad de tipos de planta disponibles ───────────────────
// Las nuevas tareas eligen un tipo al azar entre 1 y este número.
const PLANT_TYPES = 3;

// ── Umbrales de porcentaje para cada etapa ────────────────────
// Cuando el % de completado supera el umbral, la planta sube de stage.
const STAGE_THRESHOLDS = [0, 20, 45, 70, 95];

// Devuelve el número de stage (0-4) según el porcentaje
function getStage(pct) {
  let stage = 0;
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (pct >= STAGE_THRESHOLDS[i]) { stage = i; break; }
  }
  return stage;
}

// ── Genera el HTML de la imagen de la planta ──────────────────
// AHORA: SVG placeholder animado (simula crecimiento)
// DESPUÉS: reemplazá todo por:
//   return `<img src="plants/plant${plantType}/stage${stage}.png" class="plant-img" alt="planta">`;
function plantImageHTML(plantType, stage) {
  // Color distinto para cada tipo de planta
  // Para cambiar colores: editá este array (uno por tipo)
  const colors = ['#7AB648', '#E8A85A', '#C8853A'];
  const col    = colors[(plantType - 1) % colors.length];

  // Altura del tallo según el stage (en px dentro del SVG)
  const heights    = [8, 22, 40, 58, 76];
  const h          = heights[stage];
  const showFlower = stage >= 3; // flor aparece en stage 3 y 4
  const showLeaves = stage >= 2; // hojas aparecen en stage 2+
  const potH       = 28;         // altura de la maceta
  const totalH     = 100;        // alto total del SVG
  const stemBottom = totalH - potH;
  const stemTop    = stemBottom - h;

  return `<svg
    width="64" height="${totalH}"
    viewBox="0 0 64 ${totalH}"
    xmlns="http://www.w3.org/2000/svg"
    class="plant-img"
    style="transition: all 0.6s cubic-bezier(.22,.68,0,1.2)"
  >
    <!-- Maceta -->
    <rect x="16" y="${totalH - potH}" width="32" height="${potH - 6}" rx="4" fill="#C8853A"/>
    <rect x="12" y="${totalH - potH}" width="40" height="8"          rx="4" fill="#A0622A"/>
    <!-- Tierra -->
    <ellipse cx="32" cy="${totalH - potH + 5}" rx="14" ry="4" fill="#5A3010"/>

    <!-- Stage 0: solo un brote debajo de la tierra -->
    ${stage === 0
      ? `<circle cx="32" cy="${stemBottom - 4}" r="4" fill="#5A8A28" opacity="0.6"/>`
      : ''
    }

    <!-- Stage 1+: tallo -->
    ${stage > 0
      ? `<line x1="32" y1="${stemBottom}" x2="32" y2="${stemTop}"
               stroke="${col}" stroke-width="3" stroke-linecap="round"/>`
      : ''
    }

    <!-- Stage 2+: hojas -->
    ${showLeaves ? `
      <ellipse cx="22" cy="${stemTop + h * 0.4}" rx="10" ry="6"
               fill="${col}" transform="rotate(-25 22 ${stemTop + h * 0.4})" opacity="0.85"/>
      <ellipse cx="42" cy="${stemTop + h * 0.6}" rx="10" ry="6"
               fill="${col}" transform="rotate(25 42 ${stemTop + h * 0.6})" opacity="0.85"/>
    ` : ''}

    <!-- Stage 3-4: flor -->
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
   Cada tarea es un objeto con:
     id        → número único (Date.now() para las nuevas)
     name      → nombre editable
     plantType → tipo de planta (1, 2 o 3)
     subtasks  → array de { text: string, done: boolean }
     _expanded → (interno) si el acordeón está abierto

   PARA CAMBIAR LAS TAREAS DE EJEMPLO:
     Editá el array tasks[] abajo.
     Podés tener tantas como quieras.
   PARA CAMBIAR LAS SUBTAREAS DE EJEMPLO:
     Editá los arrays subtasks[] dentro de cada tarea.
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

// Calcula el porcentaje de completado de una tarea (0-100)
// basado en cuántas subtareas están tildadas.
function getTaskPct(task) {
  if (!task.subtasks.length) return 0;
  return Math.round(
    (task.subtasks.filter(s => s.done).length / task.subtasks.length) * 100
  );
}


/* ================================================================
   17. TAREAS — RENDERIZADO DE PLANTAS
   ================================================================
   Dibuja una planta por cada tarea en la fila del invernadero.
   Al hacer click en una planta, se hace scroll y se expande
   la tarea correspondiente en la lista de la derecha.
================================================================ */
function renderPlants() {
  const row = document.getElementById('plants-row');
  row.innerHTML = '';

  tasks.forEach(task => {
    const pct   = getTaskPct(task);
    const stage = getStage(pct);

    const div       = document.createElement('div');
    div.className   = 'plant-pot interactive';
    div.innerHTML   = `
      <div class="plant-svg-wrap">
        ${plantImageHTML(task.plantType, stage)}
      </div>
      <div class="plant-label">${task.name}</div>
      <div class="plant-pct">${pct}%</div>
    `;

    // Click en planta → scroll y expande la tarea correspondiente
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

  // Botón de agregar nueva tarea (al final de las plantas)
  const addBtn     = document.createElement('button');
  addBtn.className = 'add-plant-btn interactive';
  addBtn.innerHTML = '+<span>Nueva tarea</span>';
  addBtn.addEventListener('click', addTask);
  row.appendChild(addBtn);
}


/* ================================================================
   18. TAREAS — RENDERIZADO DE LISTA Y SUBTAREAS
   ================================================================
   renderTasks()    → dibuja la lista completa de tareas.
   renderSubtasks() → dibuja las subtareas de UNA tarea (sin cerrar el acordeón).
   renderAll()      → llama a ambas (se usa solo cuando cambia la estructura).

   IMPORTANTE: tildar/agregar/eliminar subtareas NO llama a renderAll()
   para que el acordeón no se cierre. Solo actualiza lo mínimo necesario.
================================================================ */

// Dibuja la lista completa de tareas preservando cuáles estaban expandidas
function renderTasks() {
  const area = document.getElementById('tasks-area');

  // Guardar qué tareas estaban expandidas ANTES de limpiar el DOM
  const expanded = new Set(
    [...area.querySelectorAll('.task-item.expanded')].map(el => el.id)
  );

  area.innerHTML = '';

  tasks.forEach(task => {
    const pct = getTaskPct(task);
    const div = document.createElement('div');
    div.className = 'task-item';
    div.id        = `task-${task.id}`;

    // Restaurar estado expandido (desde el DOM anterior o desde task._expanded)
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

    // Flecha para expandir/colapsar
    div.querySelector('.task-expand-btn').addEventListener('click', () => {
      div.classList.toggle('expanded');
      task._expanded = div.classList.contains('expanded');
      playClick();
    });

    // Editar nombre → actualiza las plantas en tiempo real
    div.querySelector('.task-name-input').addEventListener('input', e => {
      task.name = e.target.value;
      renderPlants();
    });

    // Eliminar tarea → reconstruye todo (cambia la cantidad de plantas)
    div.querySelector('[data-del]').addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      renderAll();
      playClick();
    });

    area.appendChild(div);
    renderSubtasks(task); // llenar las subtareas de esta tarea
  });
}

// Dibuja (o redibuja) solo las subtareas de UNA tarea
// Se llama sin tocar el resto de la lista para no cerrar acordeones
function renderSubtasks(task) {
  const area = document.getElementById(`subtasks-${task.id}`);
  if (!area) return;
  area.innerHTML = '';

  task.subtasks.forEach((sub, si) => {
    const row       = document.createElement('div');
    row.className   = 'subtask-row';
    row.innerHTML   = `
      <input type="checkbox" class="subtask-check interactive" ${sub.done ? 'checked' : ''}/>
      <input class="subtask-input" value="${sub.text}" placeholder="Subtarea..."/>
      <button class="task-action-btn interactive" title="Eliminar subtarea">✕</button>
    `;

    // Tildar/destildar → actualiza SOLO la barra de progreso y las plantas
    // (sin re-renderizar la lista → el acordeón permanece abierto)
    row.querySelector('.subtask-check').addEventListener('change', e => {
      sub.done = e.target.checked;

      // Actualizar solo la barra y el % de esta tarea
      renderPlants();
      const newPct = getTaskPct(task);
      const pctEl  = document.querySelector(`#task-${task.id} .task-pct-display`);
      const fillEl = document.querySelector(`#task-${task.id} .task-progress-fill`);
      if (pctEl)  pctEl.textContent   = newPct + '%';
      if (fillEl) fillEl.style.width  = newPct + '%';

      playClick();
    });

    // Editar texto de la subtarea
    row.querySelector('.subtask-input').addEventListener('input', e => {
      sub.text = e.target.value;
    });

    // Eliminar subtarea → redibuja solo las subtareas de esta tarea
    row.querySelector('.task-action-btn').addEventListener('click', () => {
      task.subtasks.splice(si, 1);
      renderSubtasks(task);   // solo esta tarea, acordeón no se cierra
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

  // Botón de agregar subtarea
  const addBtn     = document.createElement('button');
  addBtn.className = 'add-subtask-btn interactive';
  addBtn.textContent = '+ Agregar subtarea';
  addBtn.addEventListener('click', () => {
    task.subtasks.push({ text: '', done: false });
    task._expanded = true;
    renderSubtasks(task); // solo esta tarea
    // Foco automático en el nuevo input
    const inputs = document.querySelectorAll(`#subtasks-${task.id} .subtask-input`);
    if (inputs.length) inputs[inputs.length - 1].focus();
    playClick();
  });

  area.appendChild(addBtn);
}

// Reconstruye plantas + lista completa (solo para agregar/eliminar tareas)
function renderAll() {
  renderPlants();
  renderTasks();
}

// Agrega una nueva tarea con planta aleatoria y abre su acordeón
function addTask() {
  const id        = Date.now(); // id único basado en timestamp
  const plantType = Math.floor(Math.random() * PLANT_TYPES) + 1; // planta al azar
  tasks.push({ id, name: 'Nueva tarea', plantType, subtasks: [] });
  renderAll();

  // Hacer scroll y abrir el acordeón de la tarea nueva
  setTimeout(() => {
    const el = document.getElementById(`task-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('expanded');
    }
  }, 100);

  playClick();
}

// Primer renderizado al cargar la página
renderAll();


/* ================================================================
   19. POST-ITS — CONFIGURACIÓN DE GRILLA
   ================================================================
   Los post-its se posicionan en una grilla invisible.
   Al soltar un post-it, hace snap al slot más cercano disponible.

   PARA CAMBIAR EL TAMAÑO DE LOS POST-ITS:
     Editá POSTIT_W (ancho) y POSTIT_H (alto) en píxeles.
     También actualizá .postit en style.css con los mismos valores.

   PARA CAMBIAR EL ESPACIO ENTRE ELLOS:
     Editá POSTIT_GAP.

   PARA CAMBIAR EL PADDING INTERNO DEL CONTENEDOR:
     Editá POSTIT_PAD.
================================================================ */

const POSTIT_W   = 190; // ancho de cada post-it en px
const POSTIT_H   = 175; // alto de cada post-it en px
const POSTIT_GAP = 20;  // espacio entre post-its en px
const POSTIT_PAD = 16;  // padding del contenedor en px

// Calcula cuántas columnas caben según el ancho actual del contenedor
function getGridCols() {
  const container = document.getElementById('postits-container');
  if (!container) return 3;
  const w = container.clientWidth - POSTIT_PAD * 2;
  return Math.max(1, Math.floor((w + POSTIT_GAP) / (POSTIT_W + POSTIT_GAP)));
}

// Convierte un número de slot a coordenadas (x, y) en el contenedor
// slot 0 = primera columna, primera fila
// slot 1 = segunda columna, primera fila, etc.
function slotToXY(slot, cols) {
  const col = slot % cols;
  const row = Math.floor(slot / cols);
  return {
    x: POSTIT_PAD + col * (POSTIT_W + POSTIT_GAP),
    y: POSTIT_PAD + row * (POSTIT_H + POSTIT_GAP),
  };
}

// Asigna slots a los post-its si no tienen, resolviendo conflictos
function assignSlots() {
  postits.forEach((p, i) => {
    if (p.slot === undefined) p.slot = i; // asignar en orden si es nuevo
  });

  // Resolver conflictos: si dos post-its tienen el mismo slot,
  // el que aparece segundo en el array se mueve al siguiente libre
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
   Cada post-it es un objeto con:
     id    → número único
     title → texto del título
     body  → texto del cuerpo
     color → índice del color (0-4, ver postitColors[])
     slot  → posición en la grilla (se asigna automáticamente)

   PARA CAMBIAR LOS POST-ITS DE EJEMPLO:
     Editá el array postits[] abajo.

   PARA CAMBIAR LOS COLORES DISPONIBLES:
     Editá postitColors[]. Cada objeto tiene:
       bg  → color de fondo (hex)
       cls → clase CSS (debés agregarla también en style.css)
================================================================ */

// ── Colores disponibles para los post-its ─────────────────────
// Para agregar un color:
//   1. Sumá un objeto aquí
//   2. Agregá .postit-nombre { background: #HEXCOLOR; } en style.css
const postitColors = [
  { bg: '#FFF176', cls: 'postit-yellow' }, // amarillo
  { bg: '#FFCCBC', cls: 'postit-peach'  }, // durazno
  { bg: '#C8E6C9', cls: 'postit-mint'   }, // verde menta
  { bg: '#E1BEE7', cls: 'postit-lilac'  }, // lila
  { bg: '#B3E5FC', cls: 'postit-sky'    }, // celeste
];

// ── Post-its iniciales de ejemplo ─────────────────────────────
let postits = [
  { id: 1, title: 'Primera etapa 🎯',  body: 'Crear CV actualizado y portfolio con 2-3 proyectos propios', color: 0, slot: 0 },
  { id: 2, title: 'Networking 🤝',     body: 'Conectar con 5 personas del área en LinkedIn esta semana',   color: 1, slot: 1 },
  { id: 3, title: 'Aplicar 🚀',        body: 'Enviar 3 solicitudes por semana y hacer seguimiento',        color: 2, slot: 2 },
];


/* ================================================================
   21. POST-ITS — RENDERIZADO Y DRAG & DROP CON SNAP
   ================================================================
   Funcionamiento del drag:
   1. mousedown → guarda el offset entre el cursor y la esquina del post-it
   2. mousemove → mueve el post-it libre siguiendo el cursor
   3. mouseup   → calcula el slot más cercano disponible y anima el snap

   El snap garantiza que los post-its siempre queden ordenados
   en la grilla, sin importar dónde los sueltes.
================================================================ */

let dragging  = null; // post-it que se está arrastrando { id, el, data }
let dragOffX  = 0;    // offset horizontal cursor → esquina izquierda
let dragOffY  = 0;    // offset vertical cursor → esquina superior

// Dibuja todos los post-its en sus posiciones de grilla
function renderPostits() {
  const container = document.getElementById('postits-container');
  assignSlots();

  const cols = getGridCols();
  const rows = Math.ceil((postits.length + 1) / cols); // +1 = botón agregar

  // Ajustar altura del contenedor para que quepan todos los post-its
  container.style.minHeight = (POSTIT_PAD * 2 + rows * (POSTIT_H + POSTIT_GAP)) + 'px';
  container.innerHTML = '';

  postits.forEach(p => {
    const { x, y } = slotToXY(p.slot, cols);

    const div       = document.createElement('div');
    div.className   = `postit ${postitColors[p.color].cls}`;
    div.id          = `postit-${p.id}`;
    div.draggable   = false; // usamos nuestro propio drag, no el nativo
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

    // ── Iniciar drag ──────────────────────────────────────────
    div.addEventListener('mousedown', e => {
      // No arrastrar si se está usando el textarea, botones o puntos de color
      if (
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'BUTTON'   ||
        e.target.classList.contains('postit-color-dot')
      ) return;

      e.preventDefault();

      // Calcular offset: distancia del cursor a la esquina del post-it
      const divRect = div.getBoundingClientRect();
      dragOffX = e.clientX - divRect.left;
      dragOffY = e.clientY - divRect.top;

      dragging = { id: p.id, el: div, data: p };
      div.classList.add('dragging');
      div.style.zIndex     = 100;
      div.style.transition = 'none'; // sin transición durante el drag
    });

    // ── Eliminar post-it ──────────────────────────────────────
    div.querySelector('.postit-delete').addEventListener('click', () => {
      postits = postits.filter(pp => pp.id !== p.id);
      // Renumerar slots para que no queden huecos en la grilla
      postits.forEach((pp, i) => { pp.slot = i; });
      renderPostits();
      playClick();
    });

    // ── Cambiar color ─────────────────────────────────────────
    div.querySelectorAll('.postit-color-dot').forEach(dot => {
      dot.addEventListener('click', e => {
        p.color     = parseInt(dot.dataset.color);
        div.className = `postit ${postitColors[p.color].cls}`;
        div.style.position = 'absolute'; // preservar posicionamiento
        playClick();
        e.stopPropagation();
      });
    });

    // ── Editar texto ──────────────────────────────────────────
    div.querySelector('.postit-title-input').addEventListener('input', e => { p.title = e.target.value; });
    div.querySelector('.postit-body-input').addEventListener('input',  e => { p.body  = e.target.value; });

    container.appendChild(div);
  });

  // ── Botón "Nueva nota" en el siguiente slot libre ─────────
  const nextSlot      = postits.length;
  const { x: bx, y: by } = slotToXY(nextSlot, cols);
  const addBtn        = document.createElement('button');
  addBtn.className    = 'add-postit-btn interactive';
  addBtn.style.position  = 'absolute';
  addBtn.style.left      = bx + 'px';
  addBtn.style.top       = by + 'px';
  addBtn.style.width     = POSTIT_W + 'px';
  addBtn.style.minHeight = POSTIT_H + 'px';
  addBtn.innerHTML   = '+<span>Nueva nota</span>';

  addBtn.addEventListener('click', () => {
    const id   = Date.now();
    const slot = postits.length;
    postits.push({
      id,
      title: '',
      body:  '',
      color: Math.floor(Math.random() * postitColors.length),
      slot,
    });
    renderPostits();
    // Foco en el título del nuevo post-it
    setTimeout(() => {
      const el = document.getElementById(`postit-${id}`);
      if (el) el.querySelector('.postit-title-input').focus();
    }, 50);
    playClick();
  });

  container.appendChild(addBtn);
}

// ── Mover post-it libremente mientras se arrastra ─────────────
document.addEventListener('mousemove', e => {
  if (!dragging) return;

  const container     = document.getElementById('postits-container');
  const containerRect = container.getBoundingClientRect();

  // Posición relativa al contenedor, descontando el offset del grab
  const x = e.clientX - containerRect.left - dragOffX;
  const y = e.clientY - containerRect.top  - dragOffY;

  dragging.el.style.left = x + 'px';
  dragging.el.style.top  = y + 'px';
});

// ── Soltar post-it y hacer snap al slot más cercano ───────────
document.addEventListener('mouseup', () => {
  if (!dragging) return;

  const cols = getGridCols();
  const x    = parseFloat(dragging.el.style.left);
  const y    = parseFloat(dragging.el.style.top);

  // Slots ocupados por los OTROS post-its (no el que se está soltando)
  const occupiedSlots = new Set(
    postits
      .filter(p => p.id !== dragging.data.id)
      .map(p => p.slot)
  );

  // Buscar el slot libre más cercano al punto de suelta
  let bestSlot = dragging.data.slot; // fallback: vuelve a su slot original
  let bestDist = Infinity;

  for (let s = 0; s <= postits.length; s++) {
    if (occupiedSlots.has(s)) continue; // saltar slots ocupados

    const { x: sx, y: sy } = slotToXY(s, cols);
    const dist = Math.hypot(x - sx, y - sy); // distancia euclidiana
    if (dist < bestDist) {
      bestDist = dist;
      bestSlot = s;
    }
  }

  // Asignar el nuevo slot al post-it
  dragging.data.slot = bestSlot;
  const { x: snapX, y: snapY } = slotToXY(bestSlot, cols);

  // Animar el snap con transición bounce
  dragging.el.style.transition = 'left 0.35s cubic-bezier(.22,.68,0,1.5), top 0.35s cubic-bezier(.22,.68,0,1.5)';
  dragging.el.style.left       = snapX + 'px';
  dragging.el.style.top        = snapY + 'px';
  dragging.el.style.zIndex     = '';
  dragging.el.classList.remove('dragging');
  dragging.el.classList.add('dropped');

  const droppedEl = dragging.el;
  setTimeout(() => droppedEl.classList.remove('dropped'), 400);

  dragging = null;

  // Recalcular altura del contenedor por si cambió de fila
  const container = document.getElementById('postits-container');
  const rows = Math.ceil((postits.length + 1) / getGridCols());
  container.style.minHeight = (POSTIT_PAD * 2 + rows * (POSTIT_H + POSTIT_GAP)) + 'px';

  playClick();
});

// Primer renderizado al cargar la página
renderPostits();


/* ================================================================
   22. HOVER INTERACTIVO GLOBAL
   ================================================================
   Todos los elementos con clase .interactive se agrandan levemente
   al pasar el mouse por encima. Se excluyen los post-its y tareas
   porque tienen sus propios efectos hover en CSS.
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
   La pantalla de carga desaparece 1.2 segundos después de que
   la página terminó de cargar.

   La música no puede arrancar automáticamente (política del navegador:
   requiere interacción del usuario primero). Se arranca al primer click.

   Para cambiar el tiempo de la pantalla de carga:
     Editá el 1200 del setTimeout (milisegundos)
================================================================ */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loading-overlay').classList.add('hidden');

    // Arrancar música al primer click en la página
    // (el navegador bloquea el audio antes de una interacción del usuario)
    document.addEventListener('click', () => {
      if (musicEnabled && !window._musicStarted) {
        window._musicStarted = true;
        playCozyBg();
      }
    }, { once: true }); // { once: true } → se ejecuta una sola vez
  }, 1200);
});

// Sonido de click en cualquier botón o elemento interactivo
document.addEventListener('click', e => {
  if (e.target.closest('button') || e.target.closest('.interactive')) {
    playClick();
  }
});