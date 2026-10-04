// Buen Camino 공용 기능: 진도 저장, 스페인어 음성, 음성 인식
const BC = (() => {
  // 캐릭터 그림: 새 그림으로 바꿀 때는 같은 이름으로 덮어쓰거나 여기 파일 이름만 바꾸면 된다 (예: 'lucia.webp')
  const CHARS = { lucia: 'lucia.svg', ramon: 'ramon.svg', begona: 'begona.svg' };
  const charSrc = (who, base = '') => `${base}assets/chars/${CHARS[who]}`;
  const charImg = (who, base = '') => `<img src="${charSrc(who, base)}" alt="" width="120" height="120">`;
  // 언어: 기본 영어, 한국어 전환 가능
  const LKEY = 'buencamino:lang';
  const getLang = () => { try { return localStorage.getItem(LKEY) === 'ko' ? 'ko' : 'en'; } catch (e) { return 'en'; } };
  const setLang = l => { try { localStorage.setItem(LKEY, l); } catch (e) {} };
  const L = (en, ko) => getLang() === 'ko' ? ko : en;
  function applyI18n(dict) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
      const k = el.dataset.i18n;
      el.innerHTML = getLang() === 'ko' && dict[k] !== undefined ? dict[k] : el.dataset.en;
    });
  }
  function mountToggle(onChange) {
    const b = document.getElementById('lang');
    const paint = () => {
      const ko = getLang() === 'ko';
      b.textContent = ko ? 'English' : '한국어';
      b.setAttribute('lang', ko ? 'en' : 'ko');
      b.setAttribute('aria-label', ko ? 'Switch to English' : '한국어로 보기');
      document.documentElement.lang = getLang();
    };
    paint();
    b.onclick = () => { setLang(getLang() === 'ko' ? 'en' : 'ko'); paint(); onChange(); };
  }
  const KEY = 'buencamino:v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { stamps: {} }; } catch (e) { return { stamps: {} }; } };
  const save = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} };
  const getStamp = id => load().stamps[id] || 0;
  const setStamp = (id, stars) => { const d = load(); d.stamps[id] = Math.max(d.stamps[id] || 0, stars); save(d); };

  // 녹음 파일이 생기면 assets/audio/manifest.js 에 BC_AUDIO = { "mesa": "assets/audio/mesa.mp3" } 형태로 추가
  let voice = null;
  const pickVoice = () => {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find(v => v.lang === 'es-ES') || vs.find(v => /^es[-_]ES/i.test(v.lang)) || vs.find(v => /^es/i.test(v.lang)) || null;
  };
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

  function speak(text, rate = 0.8) {
    const map = window.BC_AUDIO || {};
    if (map[text]) { new Audio(map[text]).play(); return true; }
    if (!('speechSynthesis' in window)) return false;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES'; if (voice) u.voice = voice; u.rate = rate;
    speechSynthesis.speak(u);
    return true;
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canListen = () => !!SR;
  function listen() {
    return new Promise((resolve, reject) => {
      const r = new SR();
      r.lang = 'es-ES'; r.interimResults = false; r.maxAlternatives = 5;
      r.onresult = e => resolve([...e.results[0]].map(a => a.transcript));
      r.onnomatch = () => resolve([]);
      r.onerror = e => reject(e.error);
      r.start();
    });
  }
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

  const playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';

  // 도장 그림: 이름과 받은 걸음(1~3) 표시
  function stampSVG(name, stars) {
    const dots = [0, 1, 2].map(i => `<circle cx="${38 + i * 12}" cy="66" r="4" fill="${i < stars ? '#8C2F4E' : 'none'}" stroke="#8C2F4E" stroke-width="1.5"/>`).join('');
    return `<svg viewBox="0 0 100 100" role="img" aria-label="${L(name + ' stamp, ' + stars + ' of 3 steps', name + ' 도장, 걸음 ' + stars + '개')}" style="transform:rotate(-8deg)">
      <circle cx="50" cy="50" r="44" fill="none" stroke="#8C2F4E" stroke-width="3"/>
      <circle cx="50" cy="50" r="37" fill="none" stroke="#8C2F4E" stroke-width="1"/>
      <g transform="translate(50 38)" fill="none" stroke="#8C2F4E" stroke-width="1.6" stroke-linecap="round">
        <path d="M-13 6 Q0 -18 13 6 Z"/><path d="M0 6 L0 -9 M-6 6 L-3 -7 M6 6 L3 -7"/>
      </g>
      <text x="50" y="56" text-anchor="middle" font-family="Alegreya,serif" font-size="8.5" font-weight="700" fill="#8C2F4E">${name.toUpperCase()}</text>
      ${dots}</svg>`;
  }
  return { charSrc, charImg, getLang, L, applyI18n, mountToggle, getStamp, setStamp, speak, canListen, listen, norm, playIcon, stampSVG, hasVoice: () => !!voice };
})();
