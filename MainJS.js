/*
╔══════════════════════════════════════════════════════════════════╗
║                    GUMMY ✿ SCRIPT.JS                            ║
║         Asistente Inteligente con Memoria y Contexto            ║
╚══════════════════════════════════════════════════════════════════╝
*/

// ================================================================
// 1. AUDIO
// ================================================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let sfxEnabled = true;
let musicEnabled = true;
let currentTrack = 0;
let musicGain = null;
let musicLoopActive = false;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

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

function playType() {
  if (!sfxEnabled) return;
  try {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    const freqs = [440, 523, 587, 659, 784, 880];
    o.frequency.setValueAtTime(freqs[Math.floor(Math.random() * freqs.length)], ctx.currentTime);
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    o.start();
    o.stop(ctx.currentTime + 0.08);
  } catch(e) {}
}

// ================================================================
// 2. MÚSICA
// ================================================================
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
    } catch(e) { musicGain = null; }
  }
}

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

    const trackNotes = [
      [261, 294, 329, 349, 392, 440, 494],
      [220, 261, 294, 329, 392],
      [196, 220, 261, 294, 329],
    ];
    const notes = trackNotes[currentTrack] || trackNotes[0];
    let time = ctx.currentTime + 0.1;

    const scheduleNote = () => {
      if (musicLoopActive !== myToken) return;
      const o = ctx.createOscillator();
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

// ================================================================
// 3. CONTROLES DE AUDIO
// ================================================================
document.getElementById('sfx-btn').addEventListener('click', () => {
  sfxEnabled = !sfxEnabled;
  document.getElementById('sfx-btn').classList.toggle('muted', !sfxEnabled);
  document.getElementById('sfx-btn').textContent = sfxEnabled ? '🔔' : '🔕';
});

const musicBtn = document.getElementById('music-btn');
const trackSelector = document.getElementById('track-selector');

musicBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  trackSelector.classList.toggle('open');
});

document.querySelectorAll('.track-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const track = parseInt(btn.dataset.track);
    document.querySelectorAll('.track-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    trackSelector.classList.remove('open');

    if (track === -1) {
      currentTrack = -1;
      musicEnabled = false;
      stopMusic();
      musicBtn.classList.add('muted');
      musicBtn.textContent = '🔇';
    } else {
      currentTrack = track;
      musicEnabled = true;
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

// ================================================================
// 4. ROTACIÓN DE FONDOS
// ================================================================
function rotateBackgrounds() {
  document.body.classList.toggle('bg-pattern-2');
}
setInterval(rotateBackgrounds, 30000);

// ================================================================
// 5. SCROLL REVEAL
// ================================================================
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.12 });
revealEls.forEach(el => observer.observe(el));

// ================================================================
// 6. SALUDO ANIMADO
// ================================================================
const greetings = [
  '¡Hola, explorador! 👋',
  '¡Hola, soñador! ✨',
  '¡Bienvenido de vuelta! 🌿',
  '¡Hola, campeón! 🏆',
];
const greet = greetings[Math.floor(Math.random() * greetings.length)];
const typedEl = document.getElementById('typed-greeting');
let ti = 0;
function typeChar() {
  if (ti < greet.length) {
    typedEl.textContent += greet[ti++];
    setTimeout(typeChar, 55 + Math.random() * 40);
  }
}
setTimeout(typeChar, 600);

// ================================================================
// 7. FRASES MOTIVACIONALES
// ================================================================
const quotes = [
  '"Cada pequeño paso cuenta. ¡Hoy es un buen día para empezar! 🌱"',
  '"Tu esfuerzo de hoy es tu éxito de mañana. ¡Seguí adelante! 💛"',
  '"No importa qué tan lento vayas, siempre que no te detengas. 🐰"',
  '"Sos más capaz de lo que creés. ¡Confía en vos! ✨"',
  '"Cada experto fue alguna vez un principiante. ¡Vos podés! 🌟"',
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

// ================================================================
// 8. GUMMY — SPRITES
// ================================================================
let gummyState = 'idle';
let idleTimer = null;
let gummyBounceT = 0;
const gummyWrapper = document.getElementById('gummy-wrapper');
const mainPet = document.getElementById('MainPet');

const SPRITES = {
  idle1: 'gummy-idle1.png',
  idle2: 'gummy-idle2.png',
  pat: 'gummy-pat.png',
  study: 'gummy-study.png',
};

let idleFrame = 0;
let idleInterval = null;

function startIdleAnim() {
  stopIdleAnim();
  const frames = [SPRITES.idle1, SPRITES.idle2];
  idleInterval = setInterval(() => {
    idleFrame = (idleFrame + 1) % frames.length;
    mainPet.src = frames[idleFrame];
  }, 700);
}

function stopIdleAnim() {
  clearInterval(idleInterval);
  idleInterval = null;
}

function setGummySprite(src) {
  stopIdleAnim();
  mainPet.src = src;
}

function setGummyState(state) {
  gummyState = state;
  const labels = {
    idle: '¡Hola! 🐰',
    happy: '¡Mimito! 💕',
    sleep: 'zzz... 😴',
    study: 'Estudiando 📚',
    hover: '¡Hola! 👋',
  };
  const labelEl = document.getElementById('gummy-state-label');
  if (labelEl) labelEl.textContent = labels[state] || '🐰';

  if (state === 'idle' || state === 'hover' || state === 'sleep') {
    startIdleAnim();
  } else if (state === 'happy') {
    setGummySprite(SPRITES.pat);
    setTimeout(() => {
      if (gummyState === 'happy') setGummyState('idle');
    }, 2500);
  } else if (state === 'study') {
    setGummySprite(SPRITES.study);
  }
}

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

setGummyState('idle');
animateGummy();

// ================================================================
// 9. GUMMY — REACCIONES
// ================================================================
function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (gummyState !== 'happy') setGummyState('sleep');
  }, 15000);
}

gummyWrapper.addEventListener('mouseenter', () => {
  if (gummyState !== 'sleep' && gummyState !== 'happy') setGummyState('hover');
});
gummyWrapper.addEventListener('mouseleave', () => {
  if (gummyState === 'hover') setGummyState('idle');
});
gummyWrapper.addEventListener('click', () => {
  setGummyState('happy');
  spawnHearts(gummyWrapper);
  playClick();
  resetIdleTimer();
});

document.addEventListener('scroll', () => {
  if (gummyState !== 'happy') setGummyState('study');
  resetIdleTimer();
  clearTimeout(window._scrollEndTimer);
  window._scrollEndTimer = setTimeout(() => {
    if (gummyState === 'study') setGummyState('idle');
  }, 1500);
});

document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('keydown', resetIdleTimer);
resetIdleTimer();

// ================================================================
// 10. CORAZONES
// ================================================================
function spawnHearts(el) {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 3;
  const hearts = ['💗', '💕', '🩷', '💖', '❤️'];
  for (let i = 0; i < 5; i++) {
    const h = document.createElement('div');
    h.className = 'heart-particle';
    h.textContent = hearts[i % hearts.length];
    h.style.left = (cx + (Math.random() - 0.5) * 50) + 'px';
    h.style.top = (cy + (Math.random() - 0.5) * 30) + 'px';
    h.style.animationDelay = (i * 0.1) + 's';
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1200);
  }
}

// ================================================================
// 11. CHAT — FUNCIONES PRINCIPALES
// ================================================================
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');

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
  div.id = 'loading-msg';
  div.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

// ── MEMORIA DEL USUARIO ──
let userMemory = {
  nombre: null,
  edad: null,
  estudios: null,
  profesion: null,
  habilidades: [],
  intereses: [],
  objetivos: [],
  herramientas: [],
  rutinas: null,
  proyectos: [],
  emocion: null,
  contextoLaboral: null,
  ultimoTema: null,
  conversaciones: []
};

function loadMemory() {
  const saved = localStorage.getItem('gummy_memory');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      Object.assign(userMemory, data);
    } catch(e) {}
  }
}
loadMemory();

function saveMemory() {
  try {
    localStorage.setItem('gummy_memory', JSON.stringify(userMemory));
  } catch(e) {}
}

function extractInfo(text) {
  const lower = text.toLowerCase();
  const info = {};

  const nombreMatch = text.match(/me llamo\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i) || 
                      text.match(/soy\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i) ||
                      text.match(/mi nombre es\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i);
  if (nombreMatch) info.nombre = nombreMatch[1].trim();

  const edadMatch = text.match(/(\d+)\s*años?/i);
  if (edadMatch) info.edad = parseInt(edadMatch[1]);

  if (lower.includes('estudio') || lower.includes('estudiando') || lower.includes('cursando')) {
    const estudioMatch = text.match(/estudio\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i) ||
                         text.match(/estudiando\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i);
    if (estudioMatch) info.estudios = estudioMatch[1].trim();
  }

  if (lower.includes('trabajo') || lower.includes('trabajo de') || lower.includes('soy') && lower.includes('de')) {
    const profMatch = text.match(/trabajo de\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i) ||
                      text.match(/soy\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i);
    if (profMatch && !info.nombre) info.profesion = profMatch[1].trim();
  }

  const skillsList = ['html', 'css', 'javascript', 'js', 'python', 'java', 'c#', 'csharp', 'unity', 'unreal', 
                      'diseño', 'ux', 'ui', 'photoshop', 'illustrator', 'figma', 'sketch', 'blender', 
                      '3d', 'modelado', 'animación', 'ilustración', 'fotografía', 'edición', 'video',
                      'marketing', 'seo', 'social media', 'community manager', 'copywriting', 'redacción',
                      'gestión', 'proyectos', 'liderazgo', 'teamwork', 'trabajo en equipo', 'comunicación',
                      'resolución', 'problemas', 'análisis', 'investigación', 'organización', 'planificación'];
  
  const foundSkills = skillsList.filter(skill => lower.includes(skill));
  if (foundSkills.length > 0) {
    info.habilidades = foundSkills;
  }

  if (lower.includes('me interesa') || lower.includes('me gusta') || lower.includes('apasiona')) {
    const interestMatch = text.match(/me interesa\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i) ||
                          text.match(/me gusta\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i) ||
                          text.match(/me apasiona\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i);
    if (interestMatch) info.intereses = [interestMatch[1].trim()];
  }

  if (lower.includes('quiero') || lower.includes('objetivo') || lower.includes('meta')) {
    const objMatch = text.match(/quiero\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i) ||
                     text.match(/objetivo es\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i) ||
                     text.match(/meta es\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i);
    if (objMatch) info.objetivos = [objMatch[1].trim()];
  }

  return info;
}

function detectEmotion(text) {
  const lower = text.toLowerCase();
  
  if (lower.match(/triste|mal|deprimid|bajón|llor|angustia|desanim|sin ganas|no puedo|no puedo más|cansad|agotad|saturad|quemad|estresad|ansiedad|nervios|miedo|preocupad|angusti|desesper|abatid|desmotivad|sin fuerzas|derrumb|fracas|fracaso|solo|sola|soledad/)) {
    return 'triste';
  }
  
  if (lower.match(/enojad|enojada|enojado|frustrad|rabia|bronca|indignad|molest|fastidiad/)) {
    return 'enojado';
  }
  
  if (lower.match(/ansios|ansiedad|nervios|preocupad|inquiet|intranquil/)) {
    return 'ansioso';
  }
  
  if (lower.match(/feliz|alegre|content|emocionad|genial|excelente|increíble|maravilloso|buena noticia|logré|conseguí|gané|triunf|éxito|orgullos|fiesta|celebr|disfrut|entusiasm|ilusionad|soñ|sueño|amor|amoroso/)) {
    return 'feliz';
  }
  
  if (lower.match(/motivad|inspirad|energía|vibr|optimist|esperanz|ilusion/)) {
    return 'motivado';
  }
  
  return 'neutral';
}

function generateResponse(userText, emotion, info) {
  const lower = userText.toLowerCase();
  
  // ================================================================
  // 1. DETECCIÓN DE TEXTO INCOMPRENSIBLE (menos restrictiva)
  // ================================================================
  // Solo si el texto es muy corto y NO contiene letras comunes
  const commonWords = ['hola', 'buen', 'gracias', 'si', 'no', 'ok', 'vale', 'que', 'como', 'cuando', 'donde', 'porque', 'pero', 'y', 'o', 'a', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'];
  const hasCommonWord = commonWords.some(word => lower.includes(word));
  
  // Si el texto tiene menos de 2 caracteres O solo son caracteres especiales sin palabras
  if (userText.length < 2 || (userText.match(/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/g) || []).length === 0) {
    return "No estoy seguro de haber entendido tu mensaje. ¿Podrías reformularlo o darme un poco más de contexto? 🐰";
  }
  
  // Si el texto tiene letras pero son muy pocas y no tiene palabras comunes
  if (userText.length < 4 && !hasCommonWord && userText.length > 0) {
    return "No estoy seguro de haber entendido tu mensaje. ¿Podrías reformularlo o darme un poco más de contexto? 🐰";
  }

  // ================================================================
  // 2. SALUDOS
  // ================================================================
  if (lower.match(/^(hola|buen|buenos|buenas|hey|ey|que tal|qué tal|como estas|como estás|qué onda|que onda|saludos|hi|hello)/i)) {
    const nombre = userMemory.nombre ? `, ${userMemory.nombre}` : '';
    const estado = userMemory.emocion === 'triste' ? 'Espero que estés un poco mejor hoy' : 
                   userMemory.emocion === 'feliz' ? '¡Qué lindo verte tan alegre!' : 
                   '¿Cómo estás hoy?';
    return `¡Hola${nombre}! ${estado} 🐰✨ ¿En qué puedo ayudarte hoy?`;
  }

  // ================================================================
  // 3. EMOCIONES NEGATIVAS
  // ================================================================
  if (emotion === 'triste') {
    const respuestas = [
      `Escucharte me duele el corazón 🐰💛 ${userMemory.nombre ? userMemory.nombre + ', ' : ''}no estás sola. Lo que sentís es válido y merece ser escuchado. ¿Querés contarme qué está pasando? Estoy aquí para escucharte sin juzgar.`,
      `Siento mucho que estés pasando por esto 🐰🌿 ${userMemory.nombre ? userMemory.nombre + ', ' : ''}a veces las cosas se ponen difíciles, pero quiero que sepas que este momento no define quién sos. ¿Qué te tiene así?`,
      `Te abrazo fuerte desde acá 🐰🤗 ${userMemory.nombre ? userMemory.nombre + ', ' : ''}es normal sentirse abrumada a veces. No tenés que cargar con todo sola. Contame lo que necesites.`,
    ];
    return respuestas[Math.floor(Math.random() * respuestas.length)];
  }

  if (emotion === 'enojado') {
    return `Entiendo que estés enojada/o 🐰💛 ${userMemory.nombre ? userMemory.nombre + ', ' : ''}a veces las cosas nos frustran y es válido sentirlo. ¿Querés hablarlo? Tal vez juntas podamos encontrar una forma de canalizar esa energía.`;
  }

  if (emotion === 'ansioso') {
    return `Noto que estás con ansiedad 🐰🌿 ${userMemory.nombre ? userMemory.nombre + ', ' : ''}respirá profundo conmigo. A veces la mente se acelera y necesitamos un momento para pausar. ¿Querés contarme qué te tiene así? Estoy aquí para acompañarte.`;
  }

  // ================================================================
  // 4. EMOCIONES POSITIVAS
  // ================================================================
  if (emotion === 'feliz') {
    return `¡Me alegra muchísimo escuchar eso! 🐰💛 ${userMemory.nombre ? userMemory.nombre + ', ' : ''}esa energía es contagiosa. Contame todo, quiero celebrar con vos cada detalle de lo que te tiene así de radiante.`;
  }

  if (emotion === 'motivado') {
    return `¡Qué energía tan linda! 🐰✨ ${userMemory.nombre ? userMemory.nombre + ', ' : ''}me encanta verte así de motivada. Esa actitud es la que te va a llevar lejos. ¿Qué es lo que te tiene con tanta fuerza hoy?`;
  }

  // ================================================================
  // 5. TEMAS LABORALES
  // ================================================================
  if (lower.match(/trabajo|empleo|buscar|conseguir|postular|aplicar|laburo/)) {
    if (userMemory.habilidades.length > 0 || userMemory.profesion) {
      const perfil = userMemory.profesion || userMemory.habilidades.join(', ');
      return `¡Qué bueno que estás enfocada en tu búsqueda laboral! 🐰💪 Según lo que me contaste (${perfil}), te recomendaría: 1) Actualizar tu CV destacando logros concretos, 2) Optimizar tu LinkedIn con palabras clave de tu área, 3) Buscar en portales como LinkedIn, Computrabajo o portales específicos de tu rubro. ¿Querés que profundice en alguno de estos puntos?`;
    }
    return `Buscar trabajo es un viaje importante 🐰🌿 ¿En qué área te gustaría trabajar? Contame sobre tus habilidades y experiencias, así puedo ayudarte mejor a encontrar el camino adecuado.`;
  }

  if (lower.match(/cv|currículum|curriculum/)) {
    return `Tu CV es tu carta de presentación 📄🐰 ${userMemory.nombre ? userMemory.nombre + ', ' : ''}recordá incluir: datos de contacto, un resumen profesional que refleje quién sos, experiencia con logros concretos (no solo tareas), educación y habilidades relevantes. Si querés, puedo darte tips más específicos según tu área.`;
  }

  if (lower.match(/entrevista|entrevistas/)) {
    return `¡Las entrevistas son un desafío pero vos podés! 🐰💪 ${userMemory.nombre ? userMemory.nombre + ', ' : ''}mi consejo: investigá la empresa antes, prepará respuestas para preguntas comunes (como "contame sobre vos" o "cuáles son tus fortalezas"), y mostrá tu mejor versión auténtica. ¿Querés que practiquemos juntos?`;
  }

  if (lower.match(/linkedin|linked in/)) {
    return `LinkedIn es tu vitrina profesional 🤝🐰 ${userMemory.nombre ? userMemory.nombre + ', ' : ''}asegurate de tener: foto profesional, titular atractivo, resumen que cuente tu historia, y recomendaciones. Conectá con personas del sector y compartí contenido de valor. ¿Necesitás ayuda con algún aspecto en particular?`;
  }

  if (lower.match(/portfolio|portafolio|proyectos/)) {
    return `Tu portfolio es tu escaparate 🎨🐰 ${userMemory.nombre ? userMemory.nombre + ', ' : ''}incluí tus mejores proyectos, explicá tu proceso y mostrá resultados. Si es digital, mejor. ¿Querés que te dé ideas para mejorarlo?`;
  }

  // ================================================================
  // 6. ORIENTACIÓN Y ESTUDIOS
  // ================================================================
  if (lower.match(/qu[eé] estudiar|carrera|qu[eé] hacer|no s[eé] qu[eé] hacer|estudiar|estudio|facultad|universidad|curso|capacitaci[oó]n/)) {
    if (userMemory.intereses.length > 0) {
      return `Elegir un camino es importante 🐰✨ ${userMemory.nombre ? userMemory.nombre + ', ' : ''}según lo que me contaste que te interesa (${userMemory.intereses.join(', ')}), te recomendaría investigar carreras o cursos relacionados. ¿Qué tipo de actividades te gustan? ¿Trabajar en equipo o individual? ¿Creatividad o análisis?`;
    }
    return `Elegir un camino profesional es una decisión importante 🐰✨ Preguntate: ¿Qué te apasiona? ¿En qué sos buena? ¿Qué tipo de vida querés tener? Investigá diferentes rubros y hablá con personas que trabajen en lo que te interesa. ¿Qué áreas te llaman la atención?`;
  }

  // ================================================================
  // 7. RELACIONES Y SITUACIONES PERSONALES
  // ================================================================
  if (lower.match(/amigo|amiga|pareja|novio|novia|familia|mam[aá]|pap[aá]|herman|sola|solo|compañero|compañera|conflicto|pelea|discusi[oó]n|problema con|relaci[oó]n/)) {
    return `Las relaciones humanas son complejas 🐰💛 ${userMemory.nombre ? userMemory.nombre + ', ' : ''}¿querés contarme qué está pasando? A veces hablar ayuda a encontrar claridad. Estoy aquí para escucharte y apoyarte sin juzgar.`;
  }

  // ================================================================
  // 8. AUTOESTIMA E INSEGURIDAD
  // ================================================================
  if (lower.match(/no sirvo|no puedo|no soy capaz|insegur|dudo|dudas|miedo a|fracaso|equivoc|error|no merezco|no valgo|in[úu]til|tonta|tonto|fea|feo/)) {
    return `Esas palabras duelen, y sé que a veces nos las decimos a nosotras mismas 🐰💔 ${userMemory.nombre ? userMemory.nombre + ', ' : ''}pero quiero recordarte que sos mucho más de lo que tu mente te dice ahora. Merecés amor, respeto y oportunidades. ¿Qué te está haciendo sentir así? Vamos a ponerlo en perspectiva juntas.`;
  }

  // ================================================================
  // 9. PREGUNTAS SOBRE GUMMY
  // ================================================================
  if (lower.match(/qui[eé]n eres|qu[eé] eres|quien sos|que sos|qu[eé] hac[eé]s|qu[eé] haces|que hacés/)) {
    return `¡Soy Gummy! 🐰✨ Tu conejita consejera, compañera y amiga virtual. Estoy aquí para ayudarte en tu camino profesional y personal, escucharte cuando lo necesites y darte ese empujoncito de motivación que a veces hace falta. ${userMemory.nombre ? 'Me encanta hablar con vos, ' + userMemory.nombre + ' 💛' : '¿Qué puedo hacer por vos hoy?'}`;
  }

  // ================================================================
  // 10. AGRADECIMIENTOS
  // ================================================================
  if (lower.match(/gracias|muchas gracias|thank you|merci/)) {
    return `¡De nada! 🐰💛 ${userMemory.nombre ? userMemory.nombre + ', ' : ''}para eso estoy aquí. Si necesitas algo más, solo decimelo. ¡Estoy para ayudarte!`;
  }

  // ================================================================
  // 11. PROCRASTINACIÓN Y ORGANIZACIÓN
  // ================================================================
  if (lower.match(/procrastin|diferir|dejar para despu[eé]s|no tengo tiempo|no llego|atrasad|atrasada|me cuesta organizar/)) {
    return `La procrastinación es algo que nos pasa a todos 🐰🌿 ${userMemory.nombre ? userMemory.nombre + ', ' : ''}un tip que funciona: dividí las tareas grandes en pasos pequeños y alcanzables. Empezá con lo más fácil para ganar impulso. ¿Qué tarea te está costando arrancar?`;
  }

  // ================================================================
  // 12. DESPEDIDA
  // ================================================================
  if (lower.match(/chau|adi[oó]s|nos vemos|hasta luego|bye|goodbye/)) {
    return `¡Chau! 🐰💛 ${userMemory.nombre ? userMemory.nombre + ', ' : ''}fue lindo hablar con vos. Recordá que siempre estoy aquí cuando me necesites. ¡Cuidate y nos vemos pronto! ✨`;
  }

  // ================================================================
  // 13. RESPUESTA POR DEFECTO CON CONTEXTO
  // ================================================================
  if (userMemory.nombre) {
    const respuestas = [
      `Qué interesante lo que me contás ${userMemory.nombre} 🐰✨ ¿Hay algo específico en lo que pueda ayudarte?`,
      `Valoro mucho que me compartas esto ${userMemory.nombre} 🐰💛 ¿Querés que exploremos juntas este tema o preferís que te escuche sin más?`,
      `Gracias por confiarme esto ${userMemory.nombre} 🐰🤗 ¿Qué te parece si profundizamos un poco más en lo que estás pensando?`,
      `${userMemory.nombre}, me parece un tema súper importante 🐰🌿 ¿Cómo te sentís al respecto?`
    ];
    return respuestas[Math.floor(Math.random() * respuestas.length)];
  }

  const respuestasDefault = [
    "Qué interesante lo que me compartís 🐰✨ ¿Te gustaría contarme más sobre eso?",
    "Me encantaría entender mejor lo que estás pensando 🐰💛 ¿Querés profundizar en algún tema en particular?",
    "Qué bien que estás compartiendo esto conmigo 🐰💫 ¿Hay alguna parte de esto que te gustaría analizar juntos?",
    "Me quedé con ganas de saber más 🐰🌿 ¿Querés contarme con más detalle?"
  ];
  return respuestasDefault[Math.floor(Math.random() * respuestasDefault.length)];
}

// ── Enviar mensaje ──
async function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;

  const emotion = detectEmotion(text);
  userMemory.emocion = emotion;
  userMemory.ultimoTema = text;

  const info = extractInfo(text);
  if (info.nombre) userMemory.nombre = info.nombre;
  if (info.edad) userMemory.edad = info.edad;
  if (info.estudios) userMemory.estudios = info.estudios;
  if (info.profesion) userMemory.profesion = info.profesion;
  if (info.habilidades) {
    userMemory.habilidades = [...new Set([...userMemory.habilidades, ...info.habilidades])];
  }
  if (info.intereses) {
    userMemory.intereses = [...new Set([...userMemory.intereses, ...info.intereses])];
  }
  if (info.objetivos) {
    userMemory.objetivos = [...new Set([...userMemory.objetivos, ...info.objetivos])];
  }

  userMemory.conversaciones.push({ role: 'user', content: text, emotion: emotion });
  if (userMemory.conversaciones.length > 50) {
    userMemory.conversaciones.shift();
  }
  saveMemory();

  addMsg(text, 'user');
  chatInput.value = '';
  playClick();
  resetIdleTimer();

  const loading = addLoading();
  setGummyState('study');

  const delay = Math.min(400 + text.length * 2, 2000) + Math.random() * 500;
  
  setTimeout(() => {
    loading.remove();
    const reply = generateResponse(text, emotion, info);
    addMsg(reply, 'gummy');
    
    userMemory.conversaciones.push({ role: 'assistant', content: reply });
    saveMemory();

    setGummyState('happy');
    setTimeout(() => setGummyState('idle'), 2000);
  }, delay);
}

chatSendBtn.addEventListener('click', sendChat);
chatInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendChat();
  } else {
    playType();
  }
});

window.addEventListener('DOMContentLoaded', function() {
  if (userMemory.nombre) {
    setTimeout(function() {
      addMsg('¡Hola de nuevo, ' + userMemory.nombre + '! 🐰✨ ¿Cómo estás hoy?', 'gummy');
    }, 1500);
  }
});

// ================================================================
// 12. PLANTAS
// ================================================================
const PLANT_TYPES = 3;
const STAGE_THRESHOLDS = [0, 20, 45, 70, 95];

function getStage(pct) {
  let stage = 0;
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (pct >= STAGE_THRESHOLDS[i]) { stage = i; break; }
  }
  return stage;
}

function plantImageHTML(plantType, stage) {
  const colors = ['#7AB648', '#E8A85A', '#C8853A'];
  const col = colors[(plantType - 1) % colors.length];
  const heights = [8, 22, 40, 58, 76];
  const h = heights[stage];
  const showFlower = stage >= 3;
  const showLeaves = stage >= 2;
  const potH = 28;
  const totalH = 100;
  const stemBottom = totalH - potH;
  const stemTop = stemBottom - h;

  return `<svg width="64" height="${totalH}" viewBox="0 0 64 ${totalH}" xmlns="http://www.w3.org/2000/svg" class="plant-img" style="transition: all 0.6s cubic-bezier(.22,.68,0,1.2)">
    <rect x="16" y="${totalH - potH}" width="32" height="${potH - 6}" rx="4" fill="#C8853A"/>
    <rect x="12" y="${totalH - potH}" width="40" height="8" rx="4" fill="#A0622A"/>
    <ellipse cx="32" cy="${totalH - potH + 5}" rx="14" ry="4" fill="#5A3010"/>
    ${stage === 0 ? `<circle cx="32" cy="${stemBottom - 4}" r="4" fill="#5A8A28" opacity="0.6"/>` : ''}
    ${stage > 0 ? `<line x1="32" y1="${stemBottom}" x2="32" y2="${stemTop}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>` : ''}
    ${showLeaves ? `<ellipse cx="22" cy="${stemTop + h * 0.4}" rx="10" ry="6" fill="${col}" transform="rotate(-25 22 ${stemTop + h * 0.4})" opacity="0.85"/>
    <ellipse cx="42" cy="${stemTop + h * 0.6}" rx="10" ry="6" fill="${col}" transform="rotate(25 42 ${stemTop + h * 0.6})" opacity="0.85"/>` : ''}
    ${showFlower ? `<circle cx="32" cy="${stemTop}" r="${stage === 4 ? 11 : 8}" fill="${stage === 4 ? '#FFD700' : '#FFB3C6'}" opacity="0.9"/>
    <circle cx="32" cy="${stemTop}" r="4" fill="${stage === 4 ? '#FF8800' : '#FF6B9D'}"/>` : (stage >= 1 ? `<ellipse cx="32" cy="${stemTop}" rx="6" ry="5" fill="${col}" opacity="0.9"/>` : '')}
  </svg>`;
}

// ================================================================
// 13. TAREAS
// ================================================================
let tasks = [
  { id: 1, name: 'Portfolio personal', plantType: 1, subtasks: [{ text: 'Elegir proyectos', done: false }, { text: 'Diseñar la web', done: true }, { text: 'Publicar online', done: false }] },
  { id: 2, name: 'LinkedIn optimizado', plantType: 2, subtasks: [{ text: 'Foto profesional', done: true }, { text: 'Escribir bio', done: false }] },
  { id: 3, name: 'Practicar entrevistas', plantType: 3, subtasks: [{ text: 'Estudiar preguntas', done: false }, { text: 'Mock interview', done: false }, { text: 'Feedback', done: false }] },
];

function getTaskPct(task) {
  if (!task.subtasks.length) return 0;
  return Math.round((task.subtasks.filter(s => s.done).length / task.subtasks.length) * 100);
}

function renderPlants() {
  const row = document.getElementById('plants-row');
  row.innerHTML = '';
  tasks.forEach(task => {
    const pct = getTaskPct(task);
    const stage = getStage(pct);
    const div = document.createElement('div');
    div.className = 'plant-pot interactive';
    div.innerHTML = `<div class="plant-svg-wrap">${plantImageHTML(task.plantType, stage)}</div><div class="plant-label">${task.name}</div><div class="plant-pct">${pct}%</div>`;
    div.addEventListener('click', () => {
      const taskEl = document.getElementById(`task-${task.id}`);
      if (taskEl) { taskEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); taskEl.classList.add('expanded'); task._expanded = true; }
      playClick();
    });
    row.appendChild(div);
  });
  const addBtn = document.createElement('button');
  addBtn.className = 'add-plant-btn interactive';
  addBtn.innerHTML = '+<span>Nueva tarea</span>';
  addBtn.addEventListener('click', addTask);
  row.appendChild(addBtn);
}

function renderSubtasks(task) {
  const area = document.getElementById(`subtasks-${task.id}`);
  if (!area) return;
  area.innerHTML = '';
  task.subtasks.forEach((sub, si) => {
    const row = document.createElement('div');
    row.className = 'subtask-row';
    row.innerHTML = `<input type="checkbox" class="subtask-check interactive" ${sub.done ? 'checked' : ''}/>
      <input class="subtask-input" value="${sub.text}" placeholder="Subtarea..."/>
      <button class="task-action-btn interactive" title="Eliminar subtarea">✕</button>`;
    row.querySelector('.subtask-check').addEventListener('change', e => {
      sub.done = e.target.checked;
      renderPlants();
      const newPct = getTaskPct(task);
      const pctEl = document.querySelector(`#task-${task.id} .task-pct-display`);
      const fillEl = document.querySelector(`#task-${task.id} .task-progress-fill`);
      if (pctEl) pctEl.textContent = newPct + '%';
      if (fillEl) fillEl.style.width = newPct + '%';
      playClick();
    });
    row.querySelector('.subtask-input').addEventListener('input', e => { sub.text = e.target.value; });
    row.querySelector('.task-action-btn').addEventListener('click', () => {
      task.subtasks.splice(si, 1);
      renderSubtasks(task);
      renderPlants();
      const newPct = getTaskPct(task);
      const pctEl = document.querySelector(`#task-${task.id} .task-pct-display`);
      const fillEl = document.querySelector(`#task-${task.id} .task-progress-fill`);
      if (pctEl) pctEl.textContent = newPct + '%';
      if (fillEl) fillEl.style.width = newPct + '%';
      playClick();
    });
    area.appendChild(row);
  });
  const addBtn = document.createElement('button');
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

function renderTasks() {
  const area = document.getElementById('tasks-area');
  const expanded = new Set([...area.querySelectorAll('.task-item.expanded')].map(el => el.id));
  area.innerHTML = '';
  tasks.forEach(task => {
    const pct = getTaskPct(task);
    const div = document.createElement('div');
    div.className = 'task-item';
    div.id = `task-${task.id}`;
    if (expanded.has(`task-${task.id}`) || task._expanded) { div.classList.add('expanded'); task._expanded = true; }
    div.innerHTML = `<div class="task-header">
      <button class="task-expand-btn interactive" title="Expandir">▶</button>
      <input class="task-name-input" value="${task.name}" placeholder="Nombre de tarea..."/>
      <span class="task-pct-display">${pct}%</span>
      <div class="task-actions"><button class="task-action-btn interactive" title="Eliminar tarea" data-del="${task.id}">🗑</button></div>
    </div>
    <div class="task-progress-bar"><div class="task-progress-fill" style="width:${pct}%"></div></div>
    <div class="subtasks-area" id="subtasks-${task.id}"></div>`;
    div.querySelector('.task-expand-btn').addEventListener('click', () => {
      div.classList.toggle('expanded');
      task._expanded = div.classList.contains('expanded');
      playClick();
    });
    div.querySelector('.task-name-input').addEventListener('input', e => { task.name = e.target.value; renderPlants(); });
    div.querySelector('[data-del]').addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      renderAll();
      playClick();
    });
    area.appendChild(div);
    renderSubtasks(task);
  });
}

function renderAll() { renderPlants(); renderTasks(); }

function addTask() {
  const id = Date.now();
  const plantType = Math.floor(Math.random() * PLANT_TYPES) + 1;
  tasks.push({ id, name: 'Nueva tarea', plantType, subtasks: [] });
  renderAll();
  setTimeout(() => {
    const el = document.getElementById(`task-${id}`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('expanded'); }
  }, 100);
  playClick();
}
renderAll();

// ================================================================
// 14. POST-ITS
// ================================================================
const POSTIT_W = 190;
const POSTIT_H = 175;
const POSTIT_GAP = 20;
const POSTIT_PAD = 16;

const postitColors = [
  { bg: '#FFF176', cls: 'postit-yellow' },
  { bg: '#FFCCBC', cls: 'postit-peach' },
  { bg: '#C8E6C9', cls: 'postit-mint' },
  { bg: '#E1BEE7', cls: 'postit-lilac' },
  { bg: '#B3E5FC', cls: 'postit-sky' },
];

let postits = [
  { id: 1, title: 'Primera etapa 🎯', body: 'Crear CV actualizado y portfolio con 2-3 proyectos propios', color: 0, slot: 0 },
  { id: 2, title: 'Networking 🤝', body: 'Conectar con 5 personas del área en LinkedIn esta semana', color: 1, slot: 1 },
  { id: 3, title: 'Aplicar 🚀', body: 'Enviar 3 solicitudes por semana y hacer seguimiento', color: 2, slot: 2 },
];

function getGridCols() {
  const container = document.getElementById('postits-container');
  if (!container) return 3;
  const w = container.clientWidth - POSTIT_PAD * 2;
  return Math.max(1, Math.floor((w + POSTIT_GAP) / (POSTIT_W + POSTIT_GAP)));
}

function slotToXY(slot, cols) {
  const col = slot % cols;
  const row = Math.floor(slot / cols);
  return { x: POSTIT_PAD + col * (POSTIT_W + POSTIT_GAP), y: POSTIT_PAD + row * (POSTIT_H + POSTIT_GAP) };
}

function assignSlots() {
  postits.forEach((p, i) => { if (p.slot === undefined) p.slot = i; });
  const used = new Map();
  const sorted = [...postits].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  let nextFree = 0;
  sorted.forEach(p => {
    while (used.has(nextFree)) nextFree++;
    if (used.has(p.slot)) p.slot = nextFree;
    used.set(p.slot, true);
    nextFree = p.slot + 1;
  });
}

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
    const div = document.createElement('div');
    div.className = `postit ${postitColors[p.color].cls}`;
    div.id = `postit-${p.id}`;
    div.draggable = false;
    div.style.position = 'absolute';
    div.style.width = POSTIT_W + 'px';
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    div.innerHTML = `
      <button class="postit-delete interactive" title="Eliminar">✕</button>
      <textarea class="postit-title-input" rows="1" placeholder="Título...">${p.title}</textarea>
      <textarea class="postit-body-input" rows="4" placeholder="Escribí tu nota...">${p.body}</textarea>
      <div class="postit-colors">${postitColors.map((c, i) => `<div class="postit-color-dot interactive" style="background:${c.bg}" data-color="${i}"></div>`).join('')}</div>
    `;

    div.addEventListener('mousedown', e => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.classList.contains('postit-color-dot')) return;
      e.preventDefault();
      const divRect = div.getBoundingClientRect();
      dragOffX = e.clientX - divRect.left;
      dragOffY = e.clientY - divRect.top;
      dragging = { id: p.id, el: div, data: p };
      div.classList.add('dragging');
      div.style.zIndex = 100;
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
        p.color = parseInt(dot.dataset.color);
        div.className = `postit ${postitColors[p.color].cls}`;
        div.style.position = 'absolute';
        playClick();
        e.stopPropagation();
      });
    });

    div.querySelector('.postit-title-input').addEventListener('input', e => { p.title = e.target.value; });
    div.querySelector('.postit-body-input').addEventListener('input', e => { p.body = e.target.value; });
    container.appendChild(div);
  });

  const nextSlot = postits.length;
  const { x: bx, y: by } = slotToXY(nextSlot, cols);
  const addBtn = document.createElement('button');
  addBtn.className = 'add-postit-btn interactive';
  addBtn.style.position = 'absolute';
  addBtn.style.left = bx + 'px';
  addBtn.style.top = by + 'px';
  addBtn.style.width = POSTIT_W + 'px';
  addBtn.style.minHeight = POSTIT_H + 'px';
  addBtn.innerHTML = '+<span>Nueva nota</span>';
  addBtn.addEventListener('click', () => {
    const id = Date.now();
    const slot = postits.length;
    postits.push({ id, title: '', body: '', color: Math.floor(Math.random() * postitColors.length), slot });
    renderPostits();
    setTimeout(() => { const el = document.getElementById(`postit-${id}`); if (el) el.querySelector('.postit-title-input').focus(); }, 50);
    playClick();
  });
  container.appendChild(addBtn);
}

document.addEventListener('mousemove', e => {
  if (!dragging) return;
  const container = document.getElementById('postits-container');
  const containerRect = container.getBoundingClientRect();
  const x = e.clientX - containerRect.left - dragOffX;
  const y = e.clientY - containerRect.top - dragOffY;
  dragging.el.style.left = x + 'px';
  dragging.el.style.top = y + 'px';
});

document.addEventListener('mouseup', () => {
  if (!dragging) return;
  const cols = getGridCols();
  const x = parseFloat(dragging.el.style.left);
  const y = parseFloat(dragging.el.style.top);
  const occupiedSlots = new Set(postits.filter(p => p.id !== dragging.data.id).map(p => p.slot));
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
  dragging.el.style.left = snapX + 'px';
  dragging.el.style.top = snapY + 'px';
  dragging.el.style.zIndex = '';
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

// ================================================================
// 15. METAS
// ================================================================
let dailyMetas = [
  { text: 'Aplicar a 3 empleos', done: false },
  { text: 'Actualizar CV', done: false },
  { text: 'Mejorar portfolio', done: false },
];
let weeklyMetas = [
  { text: 'Conectar con 5 reclutadores', done: false },
  { text: 'Completar un curso corto', done: false },
];

function renderMetas() {
  const dailyList = document.getElementById('metas-list-daily');
  const weeklyList = document.getElementById('metas-list-weekly');
  dailyList.innerHTML = '';
  weeklyList.innerHTML = '';

  dailyMetas.forEach((meta, i) => {
    const div = document.createElement('div');
    div.className = `meta-item${meta.done ? ' done' : ''}`;
    div.innerHTML = `<input type="checkbox" class="meta-check" ${meta.done ? 'checked' : ''}/>
      <input class="meta-text" value="${meta.text}" placeholder="Escribí tu meta..."/>
      <button class="meta-delete" data-index="${i}" data-period="daily">✕</button>`;
    div.querySelector('.meta-check').addEventListener('change', e => {
      meta.done = e.target.checked;
      renderMetas();
      playClick();
    });
    div.querySelector('.meta-text').addEventListener('input', e => { meta.text = e.target.value; });
    div.querySelector('.meta-delete').addEventListener('click', () => {
      dailyMetas.splice(i, 1);
      renderMetas();
      playClick();
    });
    dailyList.appendChild(div);
  });

  weeklyMetas.forEach((meta, i) => {
    const div = document.createElement('div');
    div.className = `meta-item${meta.done ? ' done' : ''}`;
    div.innerHTML = `<input type="checkbox" class="meta-check" ${meta.done ? 'checked' : ''}/>
      <input class="meta-text" value="${meta.text}" placeholder="Escribí tu meta..."/>
      <button class="meta-delete" data-index="${i}" data-period="weekly">✕</button>`;
    div.querySelector('.meta-check').addEventListener('change', e => {
      meta.done = e.target.checked;
      renderMetas();
      playClick();
    });
    div.querySelector('.meta-text').addEventListener('input', e => { meta.text = e.target.value; });
    div.querySelector('.meta-delete').addEventListener('click', () => {
      weeklyMetas.splice(i, 1);
      renderMetas();
      playClick();
    });
    weeklyList.appendChild(div);
  });

  updateProgress();
}

function updateProgress() {
  const all = [...dailyMetas, ...weeklyMetas];
  const done = all.filter(m => m.done).length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;
  document.getElementById('metas-progress-fill').style.width = pct + '%';
  document.getElementById('metas-progress-pct').textContent = pct + '%';
}

document.querySelectorAll('.add-meta-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const period = btn.dataset.period;
    if (period === 'daily') {
      dailyMetas.push({ text: 'Nueva meta diaria', done: false });
    } else {
      weeklyMetas.push({ text: 'Nueva meta semanal', done: false });
    }
    renderMetas();
    playClick();
    const inputs = document.querySelectorAll(`#metas-list-${period} .meta-text`);
    if (inputs.length) inputs[inputs.length - 1].focus();
  });
});

renderMetas();

// ================================================================
// 16. FRASES MOTIVACIONALES (metas)
// ================================================================
const metaQuotes = [
  'Cada aplicación enviada es una oportunidad nueva 🌱',
  'El progreso lento sigue siendo progreso 🍃',
  'Pequeñas acciones constantes crean grandes resultados 🌿',
  'Confía en el proceso. Cada paso te acerca a tu meta ✨',
  'Tu futuro se construye con las decisiones de hoy 💛',
];
const quoteBubble1 = document.getElementById('quote-bubble-1');
const quoteBubble2 = document.getElementById('quote-bubble-2');
let qi2 = 0;

function updateQuotes() {
  quoteBubble1.classList.add('fading');
  quoteBubble2.classList.add('fading');
  setTimeout(() => {
    const q1 = metaQuotes[qi2 % metaQuotes.length];
    const q2 = metaQuotes[(qi2 + 1) % metaQuotes.length];
    quoteBubble1.textContent = `"${q1}"`;
    quoteBubble2.textContent = `"${q2}"`;
    quoteBubble1.classList.remove('fading');
    quoteBubble2.classList.remove('fading');
    qi2 = (qi2 + 2) % metaQuotes.length;
  }, 500);
}
updateQuotes();
setInterval(updateQuotes, 8000);

// ================================================================
// 17. PERFIL — AVATARES
// ================================================================
const avatarFiles = [
  'avatar-bunny.png',
  'avatar-cat.png',
  'avatar-fox.png',
  'avatar-panda.png',
  'avatar-koala.png',
  'avatar-raccoon.png',
  'avatar-cow.png',
  'avatar-pig.png',
  'avatar-octopus.png',
  'avatar-butterfly.png',
];
let currentAvatar = avatarFiles[0];

function renderAvatarOptions() {
  const container = document.getElementById('avatar-options');
  container.innerHTML = '';
  avatarFiles.forEach((file, i) => {
    const div = document.createElement('div');
    div.className = `avatar-option interactive${i === 0 ? ' active' : ''}`;
    div.innerHTML = `<img src="${file}" alt="Avatar ${i+1}">`;
    div.dataset.index = i;
    div.addEventListener('click', () => {
      currentAvatar = file;
      document.getElementById('avatar-img').src = file;
      document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('active'));
      div.classList.add('active');
      playClick();
      localStorage.setItem('jobquest_avatar', file);
    });
    container.appendChild(div);
  });
}
renderAvatarOptions();

function loadProfile() {
  const saved = localStorage.getItem('jobquest_profile');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      document.getElementById('perfil-nombre').value = data.nombre || '';
      document.getElementById('perfil-preferencias').value = data.preferencias || '';
      document.getElementById('perfil-habilidades').value = data.habilidades || '';
      document.getElementById('perfil-tecnologias').value = data.tecnologias || '';
      if (data.avatar) {
        currentAvatar = data.avatar;
        document.getElementById('avatar-img').src = data.avatar;
        document.querySelectorAll('.avatar-option').forEach(el => {
          const img = el.querySelector('img');
          el.classList.toggle('active', img && img.src.includes(data.avatar));
        });
      }
      if (data.cvName) {
        document.getElementById('perfil-cv-name').textContent = data.cvName;
      }
    } catch(e) {}
  }
}
loadProfile();

document.getElementById('perfil-save-btn').addEventListener('click', () => {
  const data = {
    nombre: document.getElementById('perfil-nombre').value,
    preferencias: document.getElementById('perfil-preferencias').value,
    habilidades: document.getElementById('perfil-habilidades').value,
    tecnologias: document.getElementById('perfil-tecnologias').value,
    avatar: currentAvatar,
    cvName: document.getElementById('perfil-cv-name').textContent,
  };
  localStorage.setItem('jobquest_profile', JSON.stringify(data));
  const msg = document.getElementById('perfil-save-msg');
  msg.textContent = '✅ ¡Ficha guardada!';
  playClick();
  setTimeout(() => { msg.textContent = ''; }, 3000);
});

document.getElementById('perfil-cv').addEventListener('change', function(e) {
  const file = this.files[0];
  if (file) {
    document.getElementById('perfil-cv-name').textContent = file.name;
    playClick();
  }
});

// ================================================================
// 18. LOGIN
// ================================================================
const loginScreen = document.getElementById('login-screen');
const loginTabs = document.querySelectorAll('.login-tab-btn');
const loginPanels = document.querySelectorAll('.login-tab-panel');

loginTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    loginTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    loginPanels.forEach(p => p.classList.remove('active'));
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
  });
});

const sessionUser = localStorage.getItem('jobquest_user');
if (sessionUser) {
  loginScreen.classList.add('hidden');
  document.querySelector('.greeting-line #typed-greeting').textContent = `¡Hola, ${sessionUser}! ✨`;
}

document.getElementById('tab-ingresar').addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value.trim();
  const error = document.getElementById('login-error');

  if (!user || !pass) {
    error.textContent = '❌ Por favor, completá ambos campos.';
    return;
  }

  const savedUser = localStorage.getItem('jobquest_user');
  const savedPass = localStorage.getItem('jobquest_pass');

  if (savedUser === user && savedPass === pass) {
    error.textContent = '';
    loginScreen.classList.add('hidden');
    document.querySelector('.greeting-line #typed-greeting').textContent = `¡Hola, ${user}! ✨`;
    playClick();
  } else if (!savedUser) {
    error.textContent = '❌ No hay usuario registrado. Creá una cuenta.';
  } else {
    error.textContent = '❌ Usuario o contraseña incorrectos.';
  }
});

document.getElementById('tab-registrarme').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const user = document.getElementById('register-user').value.trim();
  const pass = document.getElementById('register-pass').value.trim();
  const error = document.getElementById('register-error');

  if (!name || !user || !pass) {
    error.textContent = '❌ Completá todos los campos.';
    return;
  }

  if (localStorage.getItem('jobquest_user')) {
    error.textContent = '❌ Ya existe un usuario registrado. Ingresá directamente.';
    return;
  }

  localStorage.setItem('jobquest_user', user);
  localStorage.setItem('jobquest_pass', pass);
  localStorage.setItem('jobquest_name', name);
  error.textContent = '✅ ¡Cuenta creada! Ahora ingresá.';
  playClick();
});

document.getElementById('tab-recuperar').addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('recover-user').value.trim();
  const note = document.querySelector('#tab-recuperar .login-note');
  if (user) {
    note.textContent = '🌿 Si el usuario existe, recibirás instrucciones por correo (simulado).';
    playClick();
  } else {
    note.textContent = '🌿 Por favor, ingresá tu usuario.';
  }
});

// ================================================================
// 19. CARGA
// ================================================================
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

console.log('🐰✿ JobQuest — Tu espacio cozy para crecer profesionalmente ✿🐰');