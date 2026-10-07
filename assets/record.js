// Buen Camino 녹음실: 사람 목소리 녹음과 Gemini AI 목소리로 사이트의 스페인어 소리를 채운다.
// Pai Thiao 녹음실과 같은 방식: 너무 긴 AI 소리 찾기, 모델과 지시문을 바꿔 가며 다시 만들기, 끝만 잘라 내고 "확인할 것"으로 표시하기.
(() => {
const $ = id => document.getElementById(id);
const keyOf = BC.keyOf;
const SR_OUT = 24000;           // 저장 샘플레이트
const KBPS = 64;                // mp3 비트레이트
const VOICES_F = [['Kore', '단단하고 또렷함'], ['Aoede', '산뜻함'], ['Leda', '젊고 밝음'], ['Callirrhoe', '편안함'], ['Autonoe', '밝음'],
  ['Despina', '부드러움'], ['Erinome', '맑음'], ['Laomedeia', '경쾌함'], ['Achernar', '부드럽고 조용함'], ['Gacrux', '차분하고 성숙함'],
  ['Pulcherrima', '시원시원함'], ['Vindemiatrix', '다정함'], ['Sulafat', '따뜻함'], ['Zephyr', '밝음']];
const VOICES_M = [['Charon', '설명하듯 또렷함'], ['Puck', '경쾌함'], ['Fenrir', '활기참'], ['Orus', '단단함'], ['Enceladus', '숨결이 섞임'],
  ['Iapetus', '맑음'], ['Umbriel', '편안함'], ['Algieba', '부드러움'], ['Algenib', '거친 결'], ['Rasalgethi', '설명하듯'],
  ['Alnilam', '단단함'], ['Schedar', '고름'], ['Achird', '친근함'], ['Zubenelgenubi', '가벼움'], ['Sadachbia', '생기 있음'], ['Sadaltager', '박식함']];
const FALLBACK_MODELS = [['gemini-2.5-flash-preview-tts', 'Gemini 2.5 Flash TTS'], ['gemini-2.5-pro-preview-tts', 'Gemini 2.5 Pro TTS']];
const LS_KEY = 'buencamino:rec:settings';

/* ---------- 녹음할 말 모으기 ---------- */
function guessKind(text, origin) {
  if (origin === 'sound') return text.includes(',') ? 'syllables' : (text.length <= 2 ? 'sound' : 'word');
  if (text.startsWith('¿')) return 'question';
  return text.includes(' ') ? 'phrase' : 'word';
}
const KIND_KO = { sound: '소리 하나: 글자 이름이 아니라 소리로', syllables: '음절 여러 개: 하나씩 짧게 끊어서', word: '낱말 하나: 또렷하게', phrase: '문장: 자연스럽게', question: '질문: 묻는 억양으로' };
// 기대 길이: 모음 덩어리(음절) 수로 어림한다. 쉼표마다 쉬는 시간을 더한다.
// 이보다 훨씬 길면 AI가 지시문을 읽었거나 딴말을 한 것이다.
const syllables = it => Math.max(1, (it.text.toLowerCase().match(/[aeiouáéíóúü]+|\by\b/g) || []).length);
const commas = it => (it.text.match(/,/g) || []).length;
const maxDur = it => 1.6 + 0.45 * syllables(it) + 0.5 * commas(it);
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

const BYKEY = Object.fromEntries(ITEMS.map(i => [i.key, i]));
const tooLong = c => { if (!c || c.source !== 'ai') return false; const it = BYKEY[c.key] || { text: c.text || '' }; return c.dur > maxDur(it); };

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
// 다듬은 소리(24kHz)를 mp3로 만들기 전 상태로 돌려준다. AI 소리는 길이를 보고 나서 mp3로 만든다.
async function prepare(f32, sr) {
  const t = tidy(Float32Array.from(await resample(f32, sr)));
  if (!t) throw new Error('silent');
  return t;
}
// AI가 지시문을 읽고 맨 끝에 원래 말을 한 경우, 마지막 쉼(0.3초 이상) 뒤의 소리만 잘라 낸다.
// 쉼표 등으로 말 중간에 쉼이 있을 수 있어서, 말 길이로 보아 너무 짧은 꼬리는 버리고 한 칸 더 앞의 쉼에서 자른다.
const minDur = it => Math.max(0.3, 0.15 * syllables(it));
function tailCut(pcm, it) {
  const win = Math.floor(SR_OUT * 0.01), thr = Math.pow(10, -35 / 20), n = Math.floor(pcm.length / win);
  const loud = [];
  for (let f = 0; f < n; f++) { let m = 0; for (let k = f * win; k < (f + 1) * win; k++) m = Math.max(m, Math.abs(pcm[k])); loud.push(m > thr); }
  const starts = [];   // 쉼이 끝나고 소리가 다시 시작하는 자리
  let quiet = 0;
  for (let f = 0; f < n; f++) { if (!loud[f]) quiet++; else { if (quiet >= 30) starts.push(f); quiet = 0; } }
  for (let i = starts.length - 1; i >= 0; i--) {
    const from = Math.max(0, (starts[i] - 8) * win);
    if ((pcm.length - from) / SR_OUT < minDur(it)) continue;
    const t = tidy(pcm.slice(from));
    if (t && t.length / SR_OUT <= maxDur(it)) return t;
    return null;
  }
  return null;
}

/* ---------- 재생 ---------- */
let player = null;
function stopAll() { if (player) player.pause(); if ('speechSynthesis' in window) speechSynthesis.cancel(); }
function playBlob(blob) { stopAll(); player = new Audio(URL.createObjectURL(blob)); player.play().catch(() => {}); }
function deviceSpeak(text) { stopAll(); BC.tts(text, 0.85); }
function playItem(it) {
  if (pending && pending.key === it.key) return playBlob(pending.blob);
  const c = CLIPS[it.key];
  if (c) return playBlob(c.blob);
  if (PUB[it.key]) { stopAll(); player = new Audio(BC.ROOT + PUB[it.key]); player.play().catch(() => {}); return; }
  deviceSpeak(it.text);
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
const voiceFor = () => $('voice').value;
const SPEED = { slow: 'slowly and very clearly', bitslow: 'a little slowly and clearly', normal: 'at a natural pace' };
// 지시문이 길면 Gemini가 지시문까지 소리 내어 읽어 버린다. "말투 안내: 읽을 말" 한 줄로 짧게 쓴다.
// simple은 다시 시도할 때 쓰는 가장 짧은 형식.
const KIND_EN = {
  sound: 'only this Spanish sound, not the letter name',
  syllables: 'these Spanish syllables one at a time',
  word: 'this Spanish word clearly, like a teacher',
  phrase: 'this Spanish phrase naturally',
  question: 'this Spanish question with question intonation'
};
function prompt(it, opts = {}) {
  const accent = $('castilian').checked ? 'in a Castilian Spanish accent from Madrid' : 'in clear, neutral Spanish';
  if (opts.simple) return `Say in Spanish from Spain: ${it.text}`;
  const what = $('hints').checked && !opts.preview ? KIND_EN[it.kind] || 'this' : 'this';
  return `Say ${what}, ${SPEED[$('speed').value]}, ${accent}: ${it.text}`;
}
function parseRetry(err) {
  const d = (err && err.details || []).find(x => x['@type'] && x['@type'].includes('RetryInfo'));
  const s = d && d.retryDelay ? parseFloat(d.retryDelay) : NaN;
  return isNaN(s) ? 20 : Math.ceil(s) + 1;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
// 길이를 보고 이상하면 모델과 지시문을 바꿔 가며 여섯 번까지 다시 만든다.
// 끝까지 길면, 그동안 나온 소리 중 하나에서 마지막 말만 잘라 쓰고 "확인 필요"로 표시한다.
const exhausted = new Set();   // 하루 한도에 걸린 모델 (이 창을 닫을 때까지)
const pack = (o, check) => ({ blob: toMp3(o.pcm), dur: o.pcm.length / SR_OUT, voice: o.voice, model: o.model, check: !!check });
async function synth(it, opts = {}) {
  if (opts.preview) return pack(await synthOnce(it, opts));
  const sel = $('model').value;
  const all = [sel, ...[...$('model').options].map(o => o.value).filter(m => m !== sel)];
  const plans = [];
  [false, true].forEach(simple => all.forEach(model => plans.push({ model, simple })));
  let cut = null;
  for (let k = 0, tries = 0; tries < 6 && k < 40; k++) {
    const plan = plans[k % plans.length];
    if (exhausted.has(plan.model)) {
      if (all.every(m => exhausted.has(m))) { const e = new Error('모든 모델이 오늘 한도에 걸렸어요. 한도가 다시 채워진 뒤(인디애나 새벽 3시쯤) 이어서 하면 돼요.'); e.daily = true; throw e; }
      continue;
    }
    tries++;
    let o;
    try { o = await synthOnce(it, { ...opts, model: plan.model, simple: plan.simple }); }
    catch (e) { if (e.daily) { exhausted.add(plan.model); tries--; continue; } throw e; }
    const dur = o.pcm.length / SR_OUT;
    if (dur <= maxDur(it)) return pack(o, false);
    if (!cut) { const t = tailCut(o.pcm, it); if (t) cut = { ...o, pcm: t }; }
    msg(`AI 소리가 ${dur.toFixed(1)}초로 너무 길어요(지시문을 읽은 것 같아요). ${plan.model.replace(/^gemini-|-preview-tts$/g, '')}로 다시 만들어요...`);
  }
  if (cut) return pack(cut, true);
  const e = new Error(`"${it.text}"는 여섯 번 만들어도 소리가 너무 길었어요. 이 말은 건너뛰어요. 채우기를 한 번 더 누르면 다시 시도해요.`); e.tooLong = true; throw e;
}
async function synthOnce(it, opts = {}) {
  const key = settings.key;
  if (!key) throw new Error('먼저 위에서 Gemini API 키를 저장해 주세요.');
  const model = opts.model || $('model').value, voice = opts.voice || voiceFor();
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
      return { pcm: await prepare(f, rate), voice, model };
    }
    const err = j.error || {};
    const text = (err.message || '') + JSON.stringify(err.details || []);
    if (r.status === 429) {
      if (/PerDay|per day|daily/i.test(text)) { const e = new Error('이 모델의 하루 한도에 걸렸어요.'); e.daily = true; throw e; }
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
const inScope = it => { const st = $('stretch').value; return st === 'all' || String(it.stretch) === st; };
const view = () => ITEMS.filter(it => {
  if (!inScope(it)) return false;
  const f = $('filter').value, c = CLIPS[it.key];
  if (f === 'todo') return !c && !PUB[it.key];
  if (f === 'ai') return c && c.source === 'ai';
  if (f === 'mic') return c && c.source === 'mic';
  if (f === 'long') return tooLong(c);
  if (f === 'check') return c && c.check;
  return true;
});
let VIEW = [];
const cur = () => VIEW[idx] || ITEMS[0];
const stateOf = it => tooLong(CLIPS[it.key]) ? 'long' : CLIPS[it.key] && CLIPS[it.key].check ? 'check' : CLIPS[it.key] ? CLIPS[it.key].source : PUB[it.key] ? 'pub' : '';
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function msg(t, kind = '') { const m = $('msg'); m.textContent = t; m.className = 'feedback ' + kind; }
async function save(c) { await putClip(c); CLIPS[c.key] = c; renderCounts(); renderList(); renderItem(); }

function renderCounts() {
  const total = ITEMS.length;
  const mic = ITEMS.filter(i => CLIPS[i.key] && CLIPS[i.key].source === 'mic').length;
  const ai = ITEMS.filter(i => CLIPS[i.key] && CLIPS[i.key].source === 'ai').length;
  const pub = ITEMS.filter(i => !CLIPS[i.key] && PUB[i.key]).length;
  const bad = ITEMS.filter(i => tooLong(CLIPS[i.key])).length;
  const chk = ITEMS.filter(i => CLIPS[i.key] && CLIPS[i.key].check).length;
  $('count').textContent = `전체 ${total}개 중 ${mic + ai + pub}개 준비됨 (녹음 ${mic}, AI ${ai}, 올라간 것 ${pub})` + (bad ? `. 너무 긴 AI 소리 ${bad}개` : '') + (chk ? `. 들어 보고 확인할 것 ${chk}개` : '');
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
  $('status').textContent = pending && pending.key === it.key ? (pending.check ? 'AI 목소리, 끝만 잘라 냄 (아직 저장 안 함)' : 'AI 목소리 (아직 저장 안 함)') : st === 'check' ? `AI, 끝만 잘라 냄: 들어 보고 확인 (${CLIPS[it.key].voice})` : st === 'mic' ? '녹음됨' : st === 'long' ? `너무 긴 AI 소리 (${CLIPS[it.key].dur.toFixed(1)}초)` : st === 'ai' ? `AI (${CLIPS[it.key].voice})` : st === 'pub' ? '사이트에 올라감' : '아직 없음';
  $('text').textContent = it.text;
  $('ctx').textContent = it.ctx.map(c => `${c.t}구간 ${c.n}과 ${c.name}, ${c.where}`).join(' / ');
  $('kind').textContent = '말투: ' + KIND_KO[it.kind] + ` / 기대 길이 ${maxDur(it).toFixed(1)}초 이하 / AI 목소리: ${voiceFor()}`;
  $('aiSave').disabled = !(pending && pending.key === it.key);
  $('del').disabled = !CLIPS[it.key];
  $('okCheck').hidden = st !== 'check';
  document.querySelectorAll('.rec-list button').forEach(b => b.classList.toggle('now', b.dataset.k === it.key));
}
function renderList() {
  const items = ITEMS.filter(inScope);
  $('listNote').textContent = `(${items.length}개, 위에서 고른 구간)`;
  $('list').innerHTML = items.map(it => `<li><button data-k="${encodeURIComponent(it.key)}" title="${escH(KIND_KO[it.kind])}"><span class="dot ${stateOf(it)}"></span><span class="es">${escH(it.text)}</span></button></li>`).join('');
  document.querySelectorAll('.rec-list button').forEach(b => { b.dataset.k = decodeURIComponent(b.dataset.k); b.onclick = () => jumpTo(b.dataset.k); });
  const it = VIEW[idx]; if (it) document.querySelectorAll('.rec-list button').forEach(b => b.classList.toggle('now', b.dataset.k === it.key));
}
function jumpTo(key) {
  let i = VIEW.findIndex(x => x.key === key);
  if (i < 0) { $('filter').value = 'all'; VIEW = view(); i = VIEW.findIndex(x => x.key === key); }
  if (i < 0) { $('stretch').value = 'all'; VIEW = view(); i = VIEW.findIndex(x => x.key === key); renderList(); }
  idx = Math.max(0, i); pending = null; renderItem(); window.scrollTo({ top: document.querySelector('.rec-item').offsetTop - 10, behavior: 'smooth' });
}
function refilter() { const k = VIEW[idx] && VIEW[idx].key; VIEW = view(); const i = VIEW.findIndex(x => x.key === k); idx = i >= 0 ? i : 0; renderList(); renderItem(); }
function move(d) { if (!VIEW.length) return; pending = null; idx = (idx + d + VIEW.length) % VIEW.length; renderItem(); msg(''); }

async function aiMake() {
  const it = cur(); if (!it || !VIEW.length) return;
  $('aiMake').disabled = true; msg('AI 목소리를 만들고 있어요...');
  try {
    const out = await synth(it);
    pending = { key: it.key, text: it.text, source: 'ai', ...out, at: Date.now() };
    renderItem(); playBlob(out.blob);
    msg(out.check ? 'AI가 다른 말을 섞어서 마지막 말만 잘라 냈어요. 앞뒤가 잘리지 않았는지 들어 보고 저장(S)하거나 다시 만들어요(A).' : '들어 보고 마음에 들면 저장(S)을 눌러요. 다시 만들려면 A를 한 번 더.', 'ok');
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
  const todo = ITEMS.filter(it => inScope(it) && !CLIPS[it.key] && !PUB[it.key]);
  if (!todo.length) { $('batchMsg').textContent = '고른 범위에 채울 말이 없어요.'; return; }
  batchOn = true; $('batch').disabled = true; $('batchStop').disabled = false;
  let done = 0, trimmed = 0; const skipped = [];
  for (const it of todo) {
    if (!batchOn) break;
    $('batchMsg').textContent = `${done + 1} / ${todo.length}: ${it.text}`;
    const t0 = Date.now();
    try {
      const out = await synth(it);
      await save({ key: it.key, text: it.text, source: 'ai', ...out, at: Date.now() });
      done++; if (out.check) trimmed++;
    } catch (e) {
      if (e.tooLong) { skipped.push(it.text); continue; }
      $('batchMsg').textContent = `${done}개를 채우고 멈췄어요. ${e.message}`;
      batchOn = false; break;
    }
    const wait = 6500 - (Date.now() - t0); if (wait > 0 && batchOn) await sleep(wait);   // 분당 10개 한도에 맞춤
  }
  if (batchOn) $('batchMsg').textContent = `${done}개를 채웠어요.` + (trimmed ? ` 그중 ${trimmed}개는 끝만 잘라 낸 것이라 "들어 보고 확인할 것"으로 표시했어요.` : '') + (skipped.length ? ` 소리가 계속 너무 길어서 ${skipped.length}개는 건너뛰었어요: ${skipped.join(', ')}` : '');
  batchOn = false; $('batch').disabled = false; $('batchStop').disabled = true; refilter();
}

/* ---------- zip 내려받기 ---------- */
function hash(s) { let h = 0x811c9dc5; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); }
function slug(s) { return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x'; }
async function exportZip() {
  const keys = Object.keys(CLIPS).filter(k => !tooLong(CLIPS[k]));
  const skippedLong = Object.keys(CLIPS).length - keys.length;
  if (!keys.length) { $('exportMsg').textContent = '아직 저장한 소리가 없어요.'; return; }
  $('export').disabled = true; $('exportMsg').textContent = 'zip을 만들고 있어요...';
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
  $('exportMsg').textContent = `새 소리 ${keys.length}개, 목록 전체 ${Object.keys(sorted).length}개를 담았어요.` + (skippedLong ? ` 너무 긴 AI 소리 ${skippedLong}개는 뺐어요.` : '');
  $('export').disabled = false;
}

/* ---------- 시작 ---------- */
async function init() {
  const opts = list => list.map(([v, d]) => `<option value="${v}">${v} (${d})</option>`).join('');
  $('voice').innerHTML = `<optgroup label="여성 목소리">${opts(VOICES_F)}</optgroup><optgroup label="남성 목소리">${opts(VOICES_M)}</optgroup>`;
  $('voice').value = settings.voice || 'Kore';
  if (settings.speed) $('speed').value = settings.speed;
  if (settings.hints === false) $('hints').checked = false;
  if (settings.castilian === false) $('castilian').checked = false;
  if (settings.key) $('key').placeholder = '저장된 키가 있어요';
  $('stretch').innerHTML = '<option value="all">모든 구간</option>' + [...new Set(ITEMS.map(i => i.stretch))].map(t => `<option value="${t}">${t}구간</option>`).join('');
  try { await openDB(); (await allClips() || []).forEach(c => { CLIPS[c.key] = c; }); }
  catch (e) { msg('이 브라우저에서는 녹음을 저장할 수 없어요. 크롬이나 엣지로 열어 주세요.', 'no'); }
  await loadModels();
  VIEW = view();
  if (!VIEW.length) { $('filter').value = 'all'; VIEW = view(); }
  renderCounts(); renderList(); renderItem();

  $('keySave').onclick = async () => { const v = $('key').value.trim(); if (!v) return; settings.key = v; saveSettings(); $('key').value = ''; $('key').placeholder = '저장된 키가 있어요'; await loadModels(); };
  $('keyClear').onclick = async () => { delete settings.key; saveSettings(); $('key').placeholder = '키를 붙여 넣어요'; await loadModels(); };
  $('model').onchange = () => { settings.model = $('model').value; saveSettings(); };
  $('voice').onchange = () => { settings.voice = $('voice').value; saveSettings(); renderItem(); };
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
  $('device').onclick = () => deviceSpeak(cur().text);
  $('rec').onclick = toggleRec;
  $('play').onclick = () => playItem(cur());
  $('aiMake').onclick = aiMake; $('aiSave').onclick = aiSave;
  $('del').onclick = async () => { const it = cur(); if (!CLIPS[it.key] || !confirm(`"${it.text}"의 저장된 소리를 지울까요?`)) return; await delClip(it.key); delete CLIPS[it.key]; renderCounts(); renderList(); renderItem(); msg('지웠어요.'); };
  $('prev').onclick = () => move(-1); $('next').onclick = () => move(1);
  $('batch').onclick = batch; $('batchStop').onclick = () => { batchOn = false; $('batchMsg').textContent = '지금 것까지 하고 멈춰요...'; };
  $('export').onclick = exportZip;
  $('okCheck').onclick = async () => { const c = CLIPS[cur().key]; if (!c) return; c.check = false; await save(c); msg('확인했어요.', 'ok'); };
  $('purge').onclick = async () => {
    const bad = Object.values(CLIPS).filter(tooLong);
    if (!bad.length || !confirm(`길이가 비정상적으로 긴 AI 소리 ${bad.length}개를 지울까요? 지운 말은 "아직 안 한 것"으로 돌아가요.`)) return;
    for (const c of bad) { await delClip(c.key); delete CLIPS[c.key]; }
    refilter(); renderCounts(); msg(`${bad.length}개를 지웠어요. 이제 채우기를 다시 하면 돼요.`, 'ok');
  };
  document.addEventListener('keydown', e => {
    if (e.target.closest('input, select, textarea, summary')) return;
    if (e.code === 'Space') { e.preventDefault(); toggleRec(); }
    else if (e.key === 'ArrowRight') move(1);
    else if (e.key === 'ArrowLeft') move(-1);
    else if (e.key === 'p' || e.key === 'P') playItem(cur());
    else if (e.key === 'a' || e.key === 'A') aiMake();
    else if (e.key === 's' || e.key === 'S') aiSave();
  });
}
init();
window.__REC = { ITEMS, maxDur, tooLong, tailCut, prepare, finish, toMp3, synth, prompt, exportZip, CLIPS: () => CLIPS };   // 시험용
})();
