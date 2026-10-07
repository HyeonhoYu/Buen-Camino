// Buen Camino 녹음실: 사람 목소리 녹음과 Gemini AI 목소리로 사이트의 스페인어 소리를 채운다.
(() => {
const $ = id => document.getElementById(id);
const keyOf = BC.keyOf;
const SR_OUT = 24000;           // 저장 샘플레이트
const KBPS = 64;                // mp3 비트레이트
const VOICES = [
  ['Kore', '단단하고 또렷함'], ['Aoede', '산뜻함'], ['Leda', '젊고 밝음'], ['Callirrhoe', '편안함'], ['Autonoe', '밝음'],
  ['Despina', '부드러움'], ['Erinome', '맑음'], ['Laomedeia', '경쾌함'], ['Achernar', '부드럽고 조용함'], ['Gacrux', '차분하고 성숙함'],
  ['Pulcherrima', '시원시원함'], ['Vindemiatrix', '다정함'], ['Sulafat', '따뜻함'], ['Zephyr', '밝음'],
  ['Puck', '경쾌함'], ['Charon', '설명하듯 또렷함'], ['Fenrir', '활기참'], ['Orus', '단단함'], ['Enceladus', '숨결이 섞임'],
  ['Iapetus', '맑음'], ['Umbriel', '편안함'], ['Algieba', '부드러움'], ['Algenib', '거친 결'], ['Rasalgethi', '설명하듯'],
  ['Alnilam', '단단함'], ['Schedar', '고름'], ['Achird', '친근함'], ['Zubenelgenubi', '가벼움'], ['Sadachbia', '생기 있음'], ['Sadaltager', '박식함']
];
const FALLBACK_MODELS = [['gemini-2.5-flash-preview-tts', 'Gemini 2.5 Flash TTS'], ['gemini-2.5-pro-preview-tts', 'Gemini 2.5 Pro TTS']];
const LS_KEY = 'buencamino:rec:settings';

/* ---------- 녹음할 말 모으기 ---------- */
function guessKind(text, origin) {
  if (origin === 'sound') return text.includes(',') ? 'syllables' : (text.length <= 2 ? 'sound' : 'word');
  if (text.startsWith('¿')) return 'question';
  return text.includes(' ') ? 'phrase' : 'word';
}
const KIND_KO = { sound: '소리 하나: 글자 이름이 아니라 소리로', syllables: '음절 여러 개: 하나씩 짧게 끊어서', word: '낱말 하나: 또렷하게', phrase: '문장: 자연스럽게', question: '질문: 묻는 억양으로' };
// AI에게 주는 말투 안내. 지시문이 길면 Gemini가 지시문까지 소리 내어 읽어 버리므로 아주 짧게 둔다.
const KIND_EN = {
  sound: 'only this Spanish sound as heard inside a word, not the letter name',
  syllables: 'these Spanish syllables one by one, with a short pause between them',
  word: 'this Spanish word clearly, like a teacher',
  phrase: 'this Spanish phrase naturally',
  question: 'this Spanish question with question intonation'
};
// 기대 길이: 음절 수로 어림한다. 이보다 훨씬 길면 AI가 지시문을 읽었거나 딴말을 한 것이다.
const syllables = t => Math.max(1, (t.toLowerCase().match(/[aeiouáéíóúü]+/g) || []).length);
const maxDur = t => 1.6 + 0.6 * syllables(t);
const tooLong = c => c && c.source === 'ai' && c.dur > maxDur(c.text);
function collect() {
  const map = new Map();
  const add = (text, ctx, origin) => {
    if (!text) return;
    const key = keyOf(text);
    if (!map.has(key)) map.set(key, { key, text, ctx: [], kind: guessKind(text, origin), order: map.size, stretch: ctx.t });
    const it = map.get(key);
    if (it.ctx.length < 3) it.ctx.push(ctx);
  };
  const sets = [[1, typeof TRAMO1 !== 'undefined' && TRAMO1, typeof LESSONS !== 'undefined' && LESSONS],
                [2, typeof TRAMO2 !== 'undefined' && TRAMO2, typeof LESSONS2 !== 'undefined' && LESSONS2],
                [3, typeof TRAMO3 !== 'undefined' && TRAMO3, typeof LESSONS3 !== 'undefined' && LESSONS3]];
  sets.forEach(([t, list, lx]) => {
    if (!list || !lx) return;
    list.forEach(e => {
      const ls = lx[e.n]; if (!ls) return;
      const c = where => ({ t, n: e.n, name: e.name, where });
      (ls.units || []).forEach(u => { add(u.say, c('소리 카드'), t === 1 ? 'sound' : 'word'); add(u.ex, c('카드 예시')); });
      (ls.phrases || []).forEach(p => add(p.w, c('듣기 문장')));
      (ls.choose || []).forEach(q => add(q.say, c('고르기')));
      (ls.speak || []).forEach(s => add(s.w, c('따라 말하기')));
      (ls.fill || []).forEach(f => add(f.w, c('채우기')));
      (ls.build || []).forEach(b => add(b.s, c('문장 만들기')));
    });
  });
  return [...map.values()];
}
const ITEMS = collect();

/* ---------- 저장소 ---------- */
let db;
function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('buencamino-rec', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('clips', { keyPath: 'key' });
    r.onsuccess = () => { db = r.result; res(); };
    r.onerror = () => rej(r.error);
  });
}
const tx = (mode, fn) => new Promise((res, rej) => {
  const t = db.transaction('clips', mode), st = t.objectStore('clips');
  const out = fn(st); t.oncomplete = () => res(out && out.result); t.onerror = () => rej(t.error);
});
const putClip = c => tx('readwrite', st => st.put(c));
const delClip = k => tx('readwrite', st => st.delete(k));
const allClips = () => tx('readonly', st => st.getAll());
let CLIPS = {};
const PUB = window.BC_AUDIO || {};

const settings = (() => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; } })();
const saveSettings = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(settings)); } catch (e) {} };

/* ---------- 소리 다듬기: 24kHz로 맞추고, 앞뒤 빈 소리 자르고, 음량 맞추고, mp3로 ---------- */
let actx;
const ac = () => actx || (actx = new (window.AudioContext || window.webkitAudioContext)());
async function resample(data, sr) {
  if (sr === SR_OUT) return data;
  const len = Math.ceil(data.length * SR_OUT / sr);
  const off = new OfflineAudioContext(1, len, SR_OUT);
  const buf = off.createBuffer(1, data.length, sr); buf.copyToChannel(data, 0);
  const src = off.createBufferSource(); src.buffer = buf; src.connect(off.destination); src.start();
  return (await off.startRendering()).getChannelData(0);
}
function tidy(d) {
  const thr = Math.pow(10, -42 / 20), win = Math.floor(SR_OUT * 0.01);
  const loud = i => { let m = 0; for (let k = i; k < Math.min(i + win, d.length); k++) m = Math.max(m, Math.abs(d[k])); return m > thr; };
  let a = 0; while (a < d.length && !loud(a)) a += win;
  let b = d.length - win; while (b > a && !loud(b)) b -= win;
  if (a >= d.length) return null;
  a = Math.max(0, a - Math.floor(SR_OUT * 0.08)); b = Math.min(d.length, b + win + Math.floor(SR_OUT * 0.14));
  const out = d.slice(a, b);
  let peak = 0; for (const v of out) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? 0.89 / peak : 1, f = Math.floor(SR_OUT * 0.01);
  for (let i = 0; i < out.length; i++) {
    let v = out[i] * g;
    if (i < f) v *= i / f; else if (i > out.length - f) v *= (out.length - i) / f;
    out[i] = v;
  }
  return out;
}
function toMp3(f32) {
  const enc = new lamejs.Mp3Encoder(1, SR_OUT, KBPS), chunks = [], N = 1152;
  const i16 = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) i16[i] = Math.max(-1, Math.min(1, f32[i])) * 0x7fff;
  for (let i = 0; i < i16.length; i += N) { const b = enc.encodeBuffer(i16.subarray(i, i + N)); if (b.length) chunks.push(new Uint8Array(b)); }
  const e = enc.flush(); if (e.length) chunks.push(new Uint8Array(e));
  return new Blob(chunks, { type: 'audio/mpeg' });
}
async function finish(f32, sr) {
  const r = await resample(f32, sr);
  const t = tidy(Float32Array.from(r));
  if (!t) throw new Error('silent');
  return { blob: toMp3(t), dur: t.length / SR_OUT };
}

/* ---------- 재생 ---------- */
let player = null;
function playBlob(blob) { if (player) player.pause(); player = new Audio(URL.createObjectURL(blob)); player.play(); }
function playItem(it) {
  if (pending && pending.key === it.key) return playBlob(pending.blob);
  const c = CLIPS[it.key];
  if (c) return playBlob(c.blob);
  if (PUB[it.key]) { if (player) player.pause(); player = new Audio(BC.ROOT + PUB[it.key]); player.play(); return; }
  BC.tts(it.text, 0.85);
}

/* ---------- 마이크 ---------- */
let stream = null, mrec = null, chunks = [], meterRAF = 0;
async function startRec() {
  if (!stream) stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: false, channelCount: 1 } });
  chunks = [];
  mrec = new MediaRecorder(stream);
  mrec.ondataavailable = e => e.data.size && chunks.push(e.data);
  mrec.start();
  const an = ac().createAnalyser(); ac().createMediaStreamSource(stream).connect(an);
  const buf = new Float32Array(an.fftSize);
  const tick = () => { an.getFloatTimeDomainData(buf); let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v)); $('meter').style.width = Math.min(100, m * 140) + '%'; meterRAF = requestAnimationFrame(tick); };
  tick();
  $('rec').classList.add('on'); $('rec').textContent = '녹음 끝내기';
  msg('듣고 있어요. 말한 뒤 스페이스나 단추를 눌러요.');
}
function stopRec() {
  return new Promise(res => {
    mrec.onstop = async () => {
      cancelAnimationFrame(meterRAF); $('meter').style.width = '0';
      $('rec').classList.remove('on'); $('rec').textContent = '녹음 시작';
      try {
        const ab = await new Blob(chunks).arrayBuffer();
        const buf = await ac().decodeAudioData(ab);
        const out = await finish(buf.getChannelData(0), buf.sampleRate);
        const it = cur();
        await save({ key: it.key, text: it.text, source: 'mic', blob: out.blob, dur: out.dur, at: Date.now() });
        playBlob(out.blob);
        msg(`녹음을 저장했어요 (${out.dur.toFixed(1)}초).`, 'ok');
      } catch (e) {
        msg(e.message === 'silent' ? '소리가 거의 없었어요. 마이크 가까이에서 다시 해 봐요.' : '녹음을 처리하지 못했어요: ' + e.message, 'no');
      }
      res();
    };
    mrec.stop();
  });
}
const recording = () => mrec && mrec.state === 'recording';
async function toggleRec() {
  try { recording() ? await stopRec() : await startRec(); }
  catch (e) { msg('마이크를 켤 수 없어요. 주소창 옆 설정에서 마이크를 허용해 주세요.', 'no'); }
}

/* ---------- Gemini AI 목소리 ---------- */
const API = 'https://generativelanguage.googleapis.com/v1beta';
const SPEED = { slow: 'slowly and very clearly', bitslow: 'a little slowly and clearly', normal: 'at a natural pace' };
// Gemini TTS 권장 형식: "말투 안내: 읽을 말". 콜론 뒤만 읽도록 짧게 쓴다. simple은 다시 시도할 때 쓰는 가장 짧은 형식.
function prompt(it, opts = {}) {
  const accent = $('castilian').checked ? 'in Castilian Spanish from Madrid (z and ce, ci like English th)' : 'in clear neutral Spanish';
  if (opts.simple) return `Say ${accent}: ${it.text}`;
  const what = $('hints').checked && !opts.preview ? KIND_EN[it.kind] : 'this';
  return `Say ${what}, ${SPEED[$('speed').value]}, ${accent}: ${it.text}`;
}
function parseRetry(err) {
  const d = (err && err.details || []).find(x => x['@type'] && x['@type'].includes('RetryInfo'));
  const s = d && d.retryDelay ? parseFloat(d.retryDelay) : NaN;
  return isNaN(s) ? 20 : Math.ceil(s) + 1;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
// 길이를 보고 이상하면 가장 짧은 지시문으로 두 번 더 만든다. 그래도 길면 저장하지 않는다.
async function synth(it, opts = {}) {
  if (opts.preview) return synthOnce(it, opts);
  for (let k = 0; k < 3; k++) {
    const out = await synthOnce(it, { ...opts, simple: k > 0 });
    if (out.dur <= maxDur(it.text)) return out;
    msg(`AI 소리가 ${out.dur.toFixed(1)}초로 너무 길어요(지시문을 읽은 것 같아요). 다시 만들어요...`);
  }
  const e = new Error(`"${it.text}"는 세 번 만들어도 소리가 너무 길었어요. 이 말은 건너뛰어요. 직접 녹음하거나 나중에 다시 해 보세요.`); e.tooLong = true; throw e;
}
async function synthOnce(it, opts = {}) {
  const key = settings.key;
  if (!key) throw new Error('먼저 위에서 Gemini API 키를 저장해 주세요.');
  const model = $('model').value, voice = $('voice').value;
  const body = { contents: [{ parts: [{ text: prompt(it, opts) }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } };
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(`${API}/models/${model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      const part = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts || []).find(p => p.inlineData);
      if (!part) throw new Error('AI가 소리를 돌려주지 않았어요. 한 번 더 해 보세요.');
      const rate = parseInt((part.inlineData.mimeType.match(/rate=(\d+)/) || [])[1] || '24000', 10);
      const bin = atob(part.inlineData.data), n = bin.length >> 1, f = new Float32Array(n);
      for (let i = 0; i < n; i++) { let v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8); if (v >= 32768) v -= 65536; f[i] = v / 32768; }
      const out = await finish(f, rate);
      return { ...out, voice, model };
    }
    const err = j.error || {};
    const text = (err.message || '') + JSON.stringify(err.details || []);
    if (r.status === 429) {
      if (/PerDay|per day|daily/i.test(text)) { const e = new Error('이 모델의 하루 한도에 걸렸어요. 위에서 다른 모델로 바꾸고 이어서 하면 돼요.'); e.daily = true; throw e; }
      const wait = parseRetry(err);
      msg(`분당 한도예요. ${wait}초 기다렸다가 다시 시도해요.`);
      await sleep(wait * 1000); continue;
    }
    if (r.status === 400 && /API key/i.test(text)) throw new Error('API 키가 맞지 않아요. 키를 다시 확인해 주세요.');
    if (r.status >= 500) { await sleep(3000); continue; }
    throw new Error(`AI 요청이 실패했어요 (${r.status}). ${err.message || ''}`);
  }
  throw new Error('여러 번 시도했지만 실패했어요. 잠시 뒤 다시 해 주세요.');
}
async function loadModels() {
  const sel = $('model'); let list = [];
  if (settings.key) {
    try {
      const r = await fetch(`${API}/models?pageSize=200`, { headers: { 'x-goog-api-key': settings.key } });
      const j = await r.json();
      list = (j.models || []).filter(m => /tts/i.test(m.name)).map(m => [m.name.replace('models/', ''), m.displayName || m.name]);
      list.sort((a, b) => b[0].localeCompare(a[0], undefined, { numeric: true }));
      $('keyState').textContent = list.length ? `키가 저장되어 있어요. TTS 모델 ${list.length}개를 찾았어요.` : '키는 저장됐지만 TTS 모델을 찾지 못했어요.';
    } catch (e) { $('keyState').textContent = '모델 목록을 불러오지 못해서 기본 목록을 보여 줘요.'; }
  } else $('keyState').textContent = '아직 키가 없어요. AI 없이 녹음만 해도 돼요.';
  if (!list.length) list = FALLBACK_MODELS;
  sel.innerHTML = list.map(([id, name]) => `<option value="${id}">${name}</option>`).join('');
  if (settings.model && list.some(m => m[0] === settings.model)) sel.value = settings.model;
}

/* ---------- 화면 ---------- */
let idx = 0, pending = null;
const view = () => ITEMS.filter(it => {
  const st = $('stretch').value; if (st !== 'all' && String(it.stretch) !== st) return false;
  const f = $('filter').value, c = CLIPS[it.key];
  if (f === 'todo') return !c && !PUB[it.key];
  if (f === 'ai') return c && c.source === 'ai';
  if (f === 'mic') return c && c.source === 'mic';
  if (f === 'long') return tooLong(c);
  return true;
});
let VIEW = [];
const cur = () => VIEW[idx] || ITEMS[0];
const stateOf = it => tooLong(CLIPS[it.key]) ? 'long' : CLIPS[it.key] ? CLIPS[it.key].source : PUB[it.key] ? 'pub' : '';
function msg(t, kind = '') { const m = $('msg'); m.textContent = t; m.className = 'feedback ' + kind; }
async function save(c) { await putClip(c); CLIPS[c.key] = c; renderCounts(); renderList(); renderItem(); }

function renderCounts() {
  const total = ITEMS.length;
  const mic = ITEMS.filter(i => CLIPS[i.key] && CLIPS[i.key].source === 'mic').length;
  const ai = ITEMS.filter(i => CLIPS[i.key] && CLIPS[i.key].source === 'ai').length;
  const pub = ITEMS.filter(i => !CLIPS[i.key] && PUB[i.key]).length;
  const bad = ITEMS.filter(i => tooLong(CLIPS[i.key])).length;
  $('count').textContent = `전체 ${total}개 중 ${mic + ai + pub}개 준비됨 (녹음 ${mic}, AI ${ai}, 올라간 것 ${pub})` + (bad ? `. 이 중 너무 긴 AI 소리 ${bad}개` : '');
  $('purge').hidden = !bad; $('purge').textContent = `너무 긴 AI 소리 ${bad}개 지우기`;
  $('barMic').style.width = (mic / total * 100) + '%'; $('barAi').style.width = (ai / total * 100) + '%'; $('barPub').style.width = (pub / total * 100) + '%';
}
function renderItem() {
  if (!VIEW.length) {
    $('text').textContent = '이 목록에는 남은 말이 없어요';
    $('ctx').textContent = '위에서 "전체"를 고르면 모든 말을 다시 볼 수 있어요.'; $('kind').textContent = ''; $('pos').textContent = ''; $('status').textContent = '';
    return;
  }
  const it = cur(), st = stateOf(it);
  $('pos').textContent = `${idx + 1} / ${VIEW.length}`;
  $('status').className = 'tag ' + st;
  $('status').textContent = pending && pending.key === it.key ? 'AI 목소리 (아직 저장 안 함)' : st === 'mic' ? '녹음됨' : st === 'long' ? `너무 긴 AI 소리 (${CLIPS[it.key].dur.toFixed(1)}초)` : st === 'ai' ? `AI (${CLIPS[it.key].voice})` : st === 'pub' ? '사이트에 올라감' : '아직 없음';
  $('text').textContent = it.text;
  $('ctx').textContent = it.ctx.map(c => `${c.t}구간 ${c.n}과 ${c.name}, ${c.where}`).join(' / ');
  $('kind').textContent = '말투: ' + KIND_KO[it.kind];
  $('aiSave').disabled = !(pending && pending.key === it.key);
  $('del').disabled = !CLIPS[it.key];
  document.querySelectorAll('.rec-list button').forEach(b => b.classList.toggle('now', b.dataset.k === it.key));
}
function renderList() {
  $('list').innerHTML = ITEMS.map(it => `<li><button data-k="${encodeURIComponent(it.key)}"><span class="dot ${stateOf(it)}"></span><span class="es">${it.text.replace(/</g, '&lt;')}</span></button></li>`).join('');
  document.querySelectorAll('.rec-list button').forEach(b => { b.dataset.k = decodeURIComponent(b.dataset.k); b.onclick = () => jumpTo(b.dataset.k); });
}
function jumpTo(key) {
  let i = VIEW.findIndex(x => x.key === key);
  if (i < 0) { $('filter').value = 'all'; $('stretch').value = 'all'; VIEW = view(); i = VIEW.findIndex(x => x.key === key); }
  idx = Math.max(0, i); pending = null; renderItem(); window.scrollTo({ top: document.querySelector('.rec-item').offsetTop - 10, behavior: 'smooth' });
}
function refilter() { const k = VIEW[idx] && VIEW[idx].key; VIEW = view(); const i = VIEW.findIndex(x => x.key === k); idx = i >= 0 ? i : 0; renderItem(); }
function move(d) { if (!VIEW.length) return; pending = null; idx = (idx + d + VIEW.length) % VIEW.length; renderItem(); msg(''); }

async function aiMake() {
  const it = cur(); if (!it) return;
  $('aiMake').disabled = true; msg('AI 목소리를 만들고 있어요...');
  try {
    const out = await synth(it);
    pending = { key: it.key, text: it.text, source: 'ai', ...out, at: Date.now() };
    renderItem(); playBlob(out.blob);
    msg('들어 보고 마음에 들면 저장(S)을 눌러요. 다시 만들려면 A를 한 번 더.', 'ok');
  } catch (e) { msg(e.message, 'no'); }
  $('aiMake').disabled = false;
}
async function aiSave() {
  if (!pending || pending.key !== cur().key) return;
  if (CLIPS[pending.key] && CLIPS[pending.key].source === 'mic' && !confirm('사람 목소리 녹음이 있어요. AI 목소리로 바꿀까요?')) return;
  const p = pending; pending = null; await save(p); msg('AI 목소리를 저장했어요.', 'ok');
}

/* ---------- 한꺼번에 채우기 ---------- */
let batchOn = false;
async function batch() {
  if (!settings.key) { $('batchMsg').textContent = '먼저 API 키를 저장해 주세요.'; return; }
  const todo = ITEMS.filter(it => !CLIPS[it.key] && !PUB[it.key]);
  if (!todo.length) { $('batchMsg').textContent = '채울 말이 없어요.'; return; }
  batchOn = true; $('batch').disabled = true; $('batchStop').disabled = false;
  let done = 0; const skipped = [];
  for (const it of todo) {
    if (!batchOn) break;
    $('batchMsg').textContent = `${done + 1} / ${todo.length}: ${it.text}`;
    const t0 = Date.now();
    try {
      const out = await synth(it);
      await save({ key: it.key, text: it.text, source: 'ai', ...out, at: Date.now() });
      done++;
    } catch (e) {
      if (e.tooLong) { skipped.push(it.text); continue; }
      $('batchMsg').textContent = `${done}개를 채우고 멈췄어요. ${e.message}`;
      batchOn = false; break;
    }
    const wait = 6500 - (Date.now() - t0); if (wait > 0 && batchOn) await sleep(wait);   // 분당 10개 한도에 맞춤
  }
  if (batchOn) $('batchMsg').textContent = `${done}개를 채웠어요.` + (skipped.length ? ` 소리가 계속 너무 길어서 ${skipped.length}개는 건너뛰었어요: ${skipped.join(', ')}` : '');
  batchOn = false; $('batch').disabled = false; $('batchStop').disabled = true; refilter();
}

/* ---------- zip 내려받기 ---------- */
function hash(s) { let h = 0x811c9dc5; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); }
function slug(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x'; }
async function exportZip() {
  const keys = Object.keys(CLIPS).filter(k => !tooLong(CLIPS[k]));
  const skippedLong = Object.keys(CLIPS).length - keys.length;
  if (!keys.length) { $('exportMsg').textContent = '아직 저장한 소리가 없어요.'; return; }
  const zip = new JSZip(), manifest = { ...PUB };
  for (const k of keys) {
    const path = `assets/audio/es/${slug(k)}-${hash(k)}.mp3`;
    zip.file(path, CLIPS[k].blob);
    manifest[k] = path;
  }
  const sorted = Object.fromEntries(Object.keys(manifest).sort().map(k => [k, manifest[k]]));
  zip.file('assets/audio/manifest.js', `// Buen Camino 녹음실에서 만든 파일 (${new Date().toLocaleString('ko-KR')}). 손으로 고치지 않아도 돼요.\nwindow.BC_AUDIO = ${JSON.stringify(sorted, null, 1)};\n`);
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'buen-camino-audio.zip'; a.click();
  $('exportMsg').textContent = `새 소리 ${keys.length}개, 목록 전체 ${Object.keys(sorted).length}개를 담았어요.` + (skippedLong ? ` 너무 긴 AI 소리 ${skippedLong}개는 빼고 담았어요.` : '');
}

/* ---------- 시작 ---------- */
async function init() {
  $('voice').innerHTML = VOICES.map(([v, d]) => `<option value="${v}">${v} (${d})</option>`).join('');
  if (settings.voice) $('voice').value = settings.voice;
  if (settings.speed) $('speed').value = settings.speed;
  if (settings.hints === false) $('hints').checked = false;
  if (settings.castilian === false) $('castilian').checked = false;
  if (settings.key) $('key').placeholder = '저장된 키가 있어요';
  $('stretch').innerHTML = '<option value="all">모든 구간</option>' + [...new Set(ITEMS.map(i => i.stretch))].map(t => `<option value="${t}">${t}구간</option>`).join('');
  await openDB();
  (await allClips() || []).forEach(c => { CLIPS[c.key] = c; });
  await loadModels();
  VIEW = view();
  if (!VIEW.length) { $('filter').value = 'all'; VIEW = view(); }
  renderCounts(); renderList(); renderItem();

  $('keySave').onclick = async () => { const v = $('key').value.trim(); if (!v) return; settings.key = v; saveSettings(); $('key').value = ''; $('key').placeholder = '저장된 키가 있어요'; await loadModels(); };
  $('keyClear').onclick = async () => { delete settings.key; saveSettings(); $('key').placeholder = '키를 붙여 넣어요'; await loadModels(); };
  $('model').onchange = () => { settings.model = $('model').value; saveSettings(); };
  $('voice').onchange = () => { settings.voice = $('voice').value; saveSettings(); };
  $('speed').onchange = () => { settings.speed = $('speed').value; saveSettings(); };
  $('hints').onchange = () => { settings.hints = $('hints').checked; saveSettings(); };
  $('castilian').onchange = () => { settings.castilian = $('castilian').checked; saveSettings(); };
  $('preview').onclick = async () => {
    $('preview').disabled = true; msg('목소리를 불러오고 있어요...');
    try { const o = await synth({ text: 'Hola, peregrino. Buen camino, y bienvenido a Navarra.', kind: 'phrase' }, { preview: true }); playBlob(o.blob); msg('미리 듣기예요. 이 소리는 저장되지 않아요.', 'ok'); }
    catch (e) { msg(e.message, 'no'); }
    $('preview').disabled = false;
  };
  $('filter').onchange = refilter; $('stretch').onchange = refilter;
  $('device').onclick = () => BC.tts(cur().text, 0.85);
  $('rec').onclick = toggleRec;
  $('play').onclick = () => playItem(cur());
  $('aiMake').onclick = aiMake; $('aiSave').onclick = aiSave;
  $('del').onclick = async () => { const it = cur(); if (!CLIPS[it.key] || !confirm(`"${it.text}"의 저장된 소리를 지울까요?`)) return; await delClip(it.key); delete CLIPS[it.key]; renderCounts(); renderList(); renderItem(); msg('지웠어요.'); };
  $('prev').onclick = () => move(-1); $('next').onclick = () => move(1);
  $('batch').onclick = batch; $('batchStop').onclick = () => { batchOn = false; $('batchMsg').textContent = '지금 것까지 하고 멈춰요...'; };
  $('export').onclick = exportZip;
  $('purge').onclick = async () => {
    const bad = Object.values(CLIPS).filter(tooLong);
    if (!bad.length || !confirm(`길이가 비정상적으로 긴 AI 소리 ${bad.length}개를 지울까요? 지운 말은 "아직 안 한 것"으로 돌아가요.`)) return;
    for (const c of bad) { await delClip(c.key); delete CLIPS[c.key]; }
    refilter(); renderCounts(); renderList(); msg(`${bad.length}개를 지웠어요. 이제 채우기를 다시 하면 돼요.`, 'ok');
  };
  document.addEventListener('keydown', e => {
    if (e.target.closest('input, select, textarea')) return;
    if (e.code === 'Space') { e.preventDefault(); toggleRec(); }
    else if (e.key === 'ArrowRight') move(1);
    else if (e.key === 'ArrowLeft') move(-1);
    else if (e.key === 'p' || e.key === 'P') playItem(cur());
    else if (e.key === 'a' || e.key === 'A') aiMake();
    else if (e.key === 's' || e.key === 'S') aiSave();
  });
}
init();
window.__REC = { ITEMS, prompt, maxDur, tooLong, finish, toMp3, exportZip, synth, CLIPS: () => CLIPS };   // 시험용
})();
