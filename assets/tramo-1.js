(() => {
const L = BC.L;
const app = document.getElementById('app');
const params = new URLSearchParams(location.search);
const etapa = parseInt(params.get('etapa'), 10);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const playBtn = (text, label) => `<button class="btn small play" data-say="${esc(text)}">${BC.playIcon}${label || L('Listen', '듣기')}</button>`;
const friend = (who, html) => {
  return `<div class="say"><div class="avatar">${BC.charImg(who, '../')}</div><p>${html}</p></div>`;
};
const small = t => `<small style="font:400 1rem var(--sans);color:var(--muted)">${t}</small>`;
app.addEventListener('click', e => {
  const b = e.target.closest('[data-say]');
  if (b && !BC.speak(b.dataset.say)) alert(L('This browser cannot play sound. Try Chrome or open the page on your phone.', '이 브라우저에서는 소리를 낼 수 없어요. 크롬이나 휴대전화로 열어 보세요.'));
});
function chrome() {
  document.getElementById('navT').textContent = L('First stretch', '첫째 구간');
  document.getElementById('navC').textContent = L('My credencial', '나의 크레덴시알');
  document.title = L('First stretch: Roncesvalles to Pamplona', '첫째 구간: 론세스바예스에서 팜플로나까지') + ' - Buen Camino';
}

/* 과 고르기 화면 */
function listPage() {
  app.innerHTML = `<h2 style="margin-top:1.5rem">${L('First stretch: Roncesvalles to Pamplona', '첫째 구간: 론세스바예스에서 팜플로나까지')}</h2>
    <p class="lead">${L('This stretch is all about the sounds and spelling of Spanish. There are eight lessons; walk one a day.', '스페인어의 소리와 철자를 익히는 구간이에요. 모두 여덟 과이고, 하루에 한 과씩 걸으면 돼요.')}</p>
    <ol class="etapas">${TRAMO1.map(e => {
      const s = BC.getStamp('1-' + e.n);
      const status = s ? L(s + ' of 3 steps', '걸음 ' + s + '개') : (e.open ? L('Start', '시작하기') : L('Coming soon', '준비 중'));
      const inner = `<span><span class="nm es">${e.n}. ${e.name}</span><br><span class="tp">${L(e.en, e.ko)}</span></span><span class="tag ${s ? 'open' : ''}">${status}</span>`;
      return `<li>${e.open ? `<a href="?etapa=${e.n}">${inner}</a>` : `<div class="locked">${inner}</div>`}</li>`;
    }).join('')}</ol>`;
}
function closedPage() {
  app.innerHTML = `<div class="panel" style="margin-top:1.5rem"><h2>${L('This lesson is not open yet', '이 과는 아직 준비 중이에요')}</h2><p>${L('Lesson 1, Roncesvalles, is open now.', '지금은 1과 론세스바예스가 열려 있어요.')}</p><a class="btn go" href="?etapa=1">${L('Go to lesson 1', '1과로 가기')}</a> <a class="btn" href="./">${L('Choose a lesson', '과 고르기')}</a></div>`;
}
const info = TRAMO1.find(e => e.n === etapa);
if (!etapa || !info || !info.open) {
  const page = !etapa ? listPage : closedPage;
  chrome(); page();
  BC.mountToggle(() => { chrome(); page(); });
  return;
}

/* 1과: 다섯 모음 */
const VOWELS = [
  { v: 'a', en: 'ah', ko: '아', ex: 'mapa', tipEn: 'an open "ah", as in father', tipKo: '입을 크게 벌린 "아"' },
  { v: 'e', en: 'eh', ko: '에', ex: 'mesa', tipEn: 'a short "eh", as in bet, never "ay"', tipKo: '한국어 "에"와 거의 같아요' },
  { v: 'i', en: 'ee', ko: '이', ex: 'piso', tipEn: 'a crisp "ee", as in see', tipKo: '입꼬리를 옆으로 당긴 "이"' },
  { v: 'o', en: 'oh', ko: '오', ex: 'oso', tipEn: 'a pure "oh" with rounded lips, no "oo" glide at the end', tipKo: '입술을 동그랗게, "오우"로 미끄러지지 않게' },
  { v: 'u', en: 'oo', ko: '우', ex: 'uva', tipEn: 'an "oo" as in moon, lips pushed forward', tipKo: '입술을 앞으로 내민 "우"' }
];
const CHOOSE = [
  { say: 'a', opts: ['a', 'e', 'o'], en: 'That was the open "ah" sound.', ko: '입을 크게 벌린 "아" 소리였어요.' },
  { say: 'u', opts: ['o', 'u', 'i'], en: 'That was "oo", lips pushed forward. The letter o says "oh".', ko: '입술을 앞으로 내민 "우" 소리였어요. o는 "오"예요.' },
  { say: 'e', opts: ['i', 'a', 'e'], en: 'That was "eh". The letter i says "ee", not "eye".', ko: '"에" 소리였어요. i는 "이"예요.' },
  { say: 'i', opts: ['e', 'i', 'u'], en: 'That was "ee". In Spanish, i always says "ee".', ko: '"이" 소리였어요.' },
  { say: 'o', opts: ['u', 'a', 'o'], en: 'That was "oh". Hold the same lip shape to the end.', ko: '"오" 소리였어요. 끝까지 같은 입 모양을 유지해요.' },
  { say: 'mesa', opts: ['misa', 'mesa', 'musa'], en: 'The middle vowel was e. Mesa is a table, misa is Mass at church, musa is a muse. One vowel changes the meaning.', ko: '가운데 모음이 e였어요. mesa는 탁자, misa는 성당 미사, musa는 뮤즈예요. 모음 하나로 뜻이 바뀌어요.' },
  { say: 'paso', opts: ['piso', 'peso', 'paso'], en: 'It was a. Paso means step; on the Camino you will hear paso a paso, step by step. Piso is a floor or flat, peso is weight.', ko: 'a였어요. paso는 걸음이에요. 순례길에서는 paso a paso(한 걸음씩)라는 말을 자주 들어요. piso는 층, peso는 무게예요.' },
  { say: 'oso', opts: ['uso', 'oso', 'osa'], en: 'Both vowels were o. Oso is a bear, osa a female bear, uso means use.', ko: '앞뒤 모두 o였어요. oso는 곰, osa는 암곰, uso는 사용이에요.' },
  { say: 'mapa', opts: ['mopa', 'mapa'], en: 'Both vowels were a. Mapa is a map, mopa is a mop.', ko: '두 모음 모두 a였어요. mapa는 지도, mopa는 대걸레예요.' }
];
const SPEAK = [
  { w: 'Hola', en: 'hello', ko: '안녕하세요', nEn: 'The h is silent: "OH-lah". You will meet it again in lesson 6.', nKo: 'h는 소리가 나지 않아요. "올라"처럼 말해요. 6과에서 다시 만나요.' },
  { w: 'Buen Camino', en: 'have a good Camino', ko: '좋은 순례 되세요', nEn: 'The greeting pilgrims share on the trail.', nKo: '순례자끼리 길에서 나누는 인사예요.' },
  { w: 'oso', en: 'bear', ko: '곰', nEn: '"OH-so". Keep both o sounds short and pure.', nKo: '"오소". 두 o 모두 짧고 또렷하게.' },
  { w: 'mesa', en: 'table', ko: '탁자', nEn: '"MEH-sah". Stress the first syllable.', nKo: '"메사". 첫 음절에 힘을 줘요.' },
  { w: 'uva', en: 'grape', ko: '포도', nEn: '"OO-bah". Lips forward for the u.', nKo: '"우바". 입술을 앞으로.' }
];
const FILL = [
  { w: 'mesa', t: 'm_s_' }, { w: 'uva', t: '_v_' }, { w: 'mapa', t: 'm_p_' }, { w: 'paso', t: 'p_s_' }, { w: 'oso', t: '_s_' }
];
const STEPS = [['Listen', '소리 듣기'], ['Pick the letter', '글자 고르기'], ['Say it', '따라 말하기'], ['Fill the vowels', '모음 채우기'], ['Get your stamp', '도장 받기']];
const TOTAL = CHOOSE.length + FILL.length;
let step = 0, score = 0, scoreAtStep = 0;

const warn = () => `<p class="feedback no voice-warn">${L('No Spain Spanish voice was found on this device. Add Spanish (Spain) in your system speech settings, or open the page on your phone.', '이 기기에서 스페인어 음성을 찾지 못했어요. 시스템 설정의 음성 항목에서 스페인어(스페인)를 추가하거나 휴대전화로 열어 보세요.')}</p>`;
let noVoice = false;
setTimeout(() => {
  if (BC.hasVoice() || Object.keys(window.BC_AUDIO || {}).length) return;
  noVoice = true;
  const p = app.querySelector('.panel');
  if (p && !p.querySelector('.voice-warn')) p.insertAdjacentHTML('afterbegin', warn());
}, 1500);

function frame(inner) {
  app.innerHTML = `<p style="margin:1.2rem 0 0"><a href="./">${L('First stretch', '첫째 구간')}</a></p>
    <h2 class="es" style="margin:.2rem 0 0;font-size:2.4rem;color:var(--camino)">1. Roncesvalles</h2>
    <p class="lead" style="margin:0">${L(info.en, info.ko)}</p>
    <ol class="steps">${STEPS.map((s, i) => `<li class="${i === step ? 'now' : i < step ? 'done' : ''}">${i + 1}. ${L(s[0], s[1])}</li>`).join('')}</ol>
    <div class="panel">${noVoice ? warn() : ''}${inner}</div>`;
}
const go = n => { step = n; scoreAtStep = score; window.scrollTo(0, 0); [listenStep, chooseStep, speakStep, fillStep, stampStep][n](); };

/* 1. 소리 듣기 */
function listenStep() {
  frame(`<h2>${L('Listen', '소리 듣기')}</h2>
    ${friend('ramon', L('Welcome, pilgrim. Spanish has only five vowel sounds, and each letter always makes the same one. Tap a letter to hear it, and tap a word to hear it inside a word.', '어서 와요, 순례자님. 스페인어 모음은 다섯 개뿐이고, 한국어 아, 에, 이, 오, 우와 거의 같아요. 글자를 눌러 소리를 들어 보세요. 낱말을 누르면 그 모음이 들어간 말이 나와요.'))}
    <div class="vowels">${VOWELS.map(x => `<button class="vowel" data-say="${x.v}" aria-label="${x.v}, ${L(x.en, x.ko)}"><span class="big">${x.v}</span><span class="ko">${L(x.en, x.ko)}</span></button>`).join('')}</div>
    <div class="vowels">${VOWELS.map(x => `<button class="vowel" data-say="${x.ex}"><span class="ex">${x.ex}</span></button>`).join('')}</div>
    ${friend('ramon', L('One thing to remember: English likes to slide vowels, turning "oh" into "oh-oo" and "eh" into "ay". Spanish vowels stay put. Start and finish with the same mouth shape, and keep them short.', '한 가지만 기억해요. 영어처럼 "오우", "에이"로 미끄러지지 않고, 처음 입 모양 그대로 짧게 끝내요.'))}
    <div class="nav-bottom"><span></span><button class="btn go" id="next">${L('On to picking letters', '글자 고르기로')}</button></div>`);
  document.getElementById('next').onclick = () => go(1);
}

/* 2. 글자 고르기 */
function chooseStep() {
  let i = 0;
  const render = () => {
    const q = CHOOSE[i]; let tried = false;
    frame(`<h2>${L('Pick the letter', '글자 고르기')} ${small(`${i + 1} / ${CHOOSE.length}`)}</h2>
      <p>${L('Listen, then pick what you heard.', '소리를 듣고 맞는 글자를 골라요.')}</p>
      ${playBtn(q.say, L('Listen again', '다시 듣기'))}
      <div class="choices">${q.opts.map(o => `<button class="choice" data-o="${o}">${o}</button>`).join('')}</div>
      <div class="feedback" id="fb" aria-live="polite"></div>
      <div id="why"></div>
      <div class="nav-bottom"><span></span><button class="btn go" id="next" hidden>${L('Next', '다음')}</button></div>`);
    setTimeout(() => BC.speak(q.say), 300);
    app.querySelectorAll('.choice').forEach(btn => btn.onclick = () => {
      const fb = document.getElementById('fb');
      if (btn.dataset.o === q.say) {
        if (!tried) score++;
        btn.classList.add('right'); fb.className = 'feedback ok'; fb.textContent = L('That is right.', '맞았어요.');
        app.querySelectorAll('.choice').forEach(b => b.disabled = true);
        document.getElementById('next').hidden = false;
      } else {
        tried = true; btn.classList.add('wrong'); btn.disabled = true;
        fb.className = 'feedback no'; fb.textContent = L('Listen once more and try again.', '다시 들어 보고 골라요.');
        document.getElementById('why').innerHTML = friend('ramon', L(q.en, q.ko));
        BC.speak(q.say);
      }
    });
    document.getElementById('next').onclick = () => { i++; i < CHOOSE.length ? render() : go(2); };
  };
  render();
}

/* 3. 따라 말하기 */
function speakStep() {
  const can = BC.canListen();
  frame(`<h2>${L('Say it', '따라 말하기')}</h2>
    ${friend('ramon', can ? L('Listen first, then tap Speak and say it out loud. If the machine understands you, you pass. Machine ears are not perfect, so if it fails a few times, it is fine to move on.', '먼저 듣고, 말하기를 눌러 소리 내어 따라 해 보세요. 기계가 알아들으면 통과예요. 기계 귀는 완벽하지 않으니 몇 번 안 되면 넘어가도 괜찮아요.')
      : L('This browser cannot check your speech. Listen, say it out loud, and compare on your own. Open the page in Chrome to use the checker.', '이 브라우저는 말한 소리를 확인하지 못해요. 듣고 소리 내어 따라 한 다음 스스로 비교해 보세요. 크롬에서 열면 확인 기능을 쓸 수 있어요.'))}
    ${SPEAK.map((s, k) => `<div class="speak-item"><span class="es">${s.w}</span><small>${L(s.en, s.ko)}. ${L(s.nEn, s.nKo)}</small>
      <div class="row" style="margin-top:.5rem">${playBtn(s.w)}${can ? `<button class="btn small" data-mic="${k}">${L('Speak', '말하기')}</button>` : ''}</div>
      <div class="result" id="r${k}" aria-live="polite"></div></div>`).join('')}
    <div class="nav-bottom"><button class="btn" id="prev">${L('Back to picking letters', '글자 고르기 다시')}</button><button class="btn go" id="next">${L('On to filling vowels', '모음 채우기로')}</button></div>`);
  app.querySelectorAll('[data-mic]').forEach(b => b.onclick = async () => {
    const k = +b.dataset.mic, out = document.getElementById('r' + k), target = BC.norm(SPEAK[k].w);
    out.textContent = L('Listening. Go ahead.', '듣고 있어요. 말해 보세요.'); out.className = 'result';
    try {
      const alts = await BC.listen();
      const hitAlt = alts.find(a => BC.norm(a).includes(target));
      out.className = 'result feedback ' + (hitAlt ? 'ok' : 'no');
      out.textContent = hitAlt ? L(`Heard you clearly: "${hitAlt}"`, `잘 들렸어요. "${hitAlt}"`) :
        (alts.length ? L(`That sounded like "${alts[0]}". Listen once more and keep the vowels clean.`, `"${alts[0]}"(으)로 들렸어요. 한 번 더 들어 보고 모음을 또렷하게 해 봐요.`)
                     : L('Nothing came through clearly. Try once more.', '소리가 잘 들리지 않았어요. 한 번 더 해 봐요.'));
    } catch (err) {
      out.className = 'result feedback no';
      out.textContent = err === 'not-allowed'
        ? L('Allow microphone access to use the checker. You can turn it on from the settings next to the address bar.', '마이크 사용을 허용해야 확인할 수 있어요. 주소창 옆 설정에서 마이크를 허용해 주세요.')
        : L('Could not check that one. Try once more.', '소리를 확인하지 못했어요. 한 번 더 해 봐요.');
    }
  });
  document.getElementById('prev').onclick = () => go(1);
  document.getElementById('next').onclick = () => go(3);
}

/* 4. 모음 채우기 */
function fillStep() {
  let i = 0;
  const render = () => {
    const q = FILL[i]; let tried = false; let filled = [];
    const blanks = [...q.t].filter(c => c === '_').length;
    const answer = [...q.w].filter((c, k) => q.t[k] === '_');
    const draw = () => {
      let b = 0;
      document.getElementById('word').innerHTML = [...q.t].map(c => c === '_' ? `<span class="blank">${filled[b++] || '&nbsp;'}</span>` : c).join('');
    };
    frame(`<h2>${L('Fill the vowels', '모음 채우기')} ${small(`${i + 1} / ${FILL.length}`)}</h2>
      <p>${L('Listen to the word, then tap the missing vowels in order.', '낱말을 듣고 빈칸에 들어갈 모음을 차례로 눌러요.')}</p>
      ${playBtn(q.w, L('Listen again', '다시 듣기'))}
      <div class="fill es" id="word" aria-live="polite"></div>
      <div class="row">${VOWELS.map(x => `<button class="choice" data-v="${x.v}">${x.v}</button>`).join('')}</div>
      <div class="row" style="margin-top:.8rem"><button class="btn small" id="clear">${L('Clear', '지우기')}</button><button class="btn small go" id="check">${L('Check', '확인')}</button></div>
      <div class="feedback" id="fb" aria-live="polite"></div><div id="why"></div>
      <div class="nav-bottom"><span></span><button class="btn go" id="next" hidden>${L('Next', '다음')}</button></div>`);
    draw(); setTimeout(() => BC.speak(q.w), 300);
    app.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { if (filled.length < blanks) { filled.push(b.dataset.v); draw(); } });
    document.getElementById('clear').onclick = () => { filled = []; draw(); };
    document.getElementById('check').onclick = () => {
      const fb = document.getElementById('fb');
      if (filled.length < blanks) { fb.className = 'feedback no'; fb.textContent = L(`There are ${blanks} blanks. Fill them all, then tap Check.`, `빈칸이 ${blanks}개예요. 모두 채운 다음 확인을 눌러요.`); return; }
      if (filled.join('') === answer.join('')) {
        if (!tried) score++;
        fb.className = 'feedback ok'; fb.textContent = L(`That is right: ${q.w}`, `맞았어요. ${q.w}`);
        app.querySelectorAll('[data-v],#clear,#check').forEach(b => b.disabled = true);
        document.getElementById('next').hidden = false;
      } else {
        tried = true; fb.className = 'feedback no'; fb.textContent = L('Listen again and try once more.', '다시 들어 보고 채워 봐요.');
        const at = filled.findIndex((v, k) => v !== answer[k]);
        const right = VOWELS.find(x => x.v === answer[at]);
        const ord = ['first', 'second', 'third'][at] || (at + 1) + 'th';
        document.getElementById('why').innerHTML = friend('ramon', L(`Listen to the ${ord} blank again. It is ${right.tipEn}.`, `${at + 1}번째 빈칸을 다시 들어 봐요. ${right.tipKo} 소리예요.`));
        filled = []; draw(); BC.speak(q.w, 0.6);
      }
    };
    document.getElementById('next').onclick = () => { i++; i < FILL.length ? render() : go(4); };
  };
  render();
}

/* 5. 도장 받기 */
function stampStep() {
  const stars = score >= TOTAL - 1 ? 3 : score >= TOTAL - 4 ? 2 : 1;
  BC.setStamp('1-1', stars);
  frame(`<h2>${L('Get your stamp', '도장 받기')}</h2>
    <div style="max-width:11rem;margin:.5rem auto 1rem">${BC.stampSVG('Roncesvalles', stars)}</div>
    <p style="text-align:center">${L(`You got ${score} of ${TOTAL} right on the first try and earned ${stars} of 3 steps.${stars < 3 ? ' Walk it again tomorrow to earn all three.' : ''}`,
      `${TOTAL}문제 중 ${score}문제를 한 번에 맞혀서 걸음 ${stars}개를 받았어요.${stars < 3 ? ' 내일 다시 걸으면 세 개를 받을 수 있어요.' : ''}`)}</p>
    ${friend('begona', L('In Basque, Roncesvalles is called Orreaga. In northern Navarra, road signs show both the Spanish and the Basque names. For many pilgrims, this is where they first hear someone say Buen Camino.',
      '론세스바예스는 바스크어로 오레아가(Orreaga)라고 해요. 나바라 북부에서는 표지판에 스페인어와 바스크어 이름이 함께 적혀 있어요. 많은 순례자가 이곳에서 처음으로 Buen Camino라는 인사를 듣는답니다.'))}
    <h3 style="font:600 1.15rem var(--serif);margin:1.2rem 0 0">${L('Words from today', '오늘 만난 말')}</h3>
    <ul class="words">${SPEAK.slice(0, 2).map(s => `<li><span class="es" style="font-size:1.2rem">${s.w}</span> ${L(s.en, s.ko)} ${playBtn(s.w)}</li>`).join('')}</ul>
    <div class="nav-bottom"><button class="btn" id="again">${L('Start over', '처음부터 다시')}</button><a class="btn go" href="../#credencial">${L('See my credencial', '크레덴시알 보기')}</a></div>`);
  document.getElementById('again').onclick = () => { score = 0; go(0); };
}

chrome();
BC.mountToggle(() => { chrome(); score = scoreAtStep; step === 4 ? stampStep() : go(step); });
go(0);
})();
