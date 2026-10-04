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
      const inner = `<span><span class="nm es">${e.n}. ${e.name}</span><br><span class="tp">${L(e.en, e.ko)}</span></span><span class="tag ${s || e.open ? 'open' : ''}">${status}</span>`;
      return `<li>${e.open ? `<a href="?etapa=${e.n}">${inner}</a>` : `<div class="locked">${inner}</div>`}</li>`;
    }).join('')}</ol>`;
}
function closedPage() {
  app.innerHTML = `<div class="panel" style="margin-top:1.5rem"><h2>${L('This lesson is not open yet', '이 과는 아직 준비 중이에요')}</h2><p>${L('Lesson 1, Roncesvalles, is open now.', '지금은 1과 론세스바예스가 열려 있어요.')}</p><a class="btn go" href="?etapa=1">${L('Go to lesson 1', '1과로 가기')}</a> <a class="btn" href="./">${L('Choose a lesson', '과 고르기')}</a></div>`;
}
const info = TRAMO1.find(e => e.n === etapa);
if (!etapa || !info || !info.open || !LESSONS[etapa]) {
  const page = !etapa ? listPage : closedPage;
  chrome(); page();
  BC.mountToggle(() => { chrome(); page(); });
  return;
}

/* 수업 진행: 내용은 tramo-1-lessons.js */
const LS = LESSONS[etapa];
const T = pair => L(pair[0], pair[1]);
const STEPS = [['Listen', '소리 듣기'], ['Pick the letter', '글자 고르기'], ['Say it', '따라 말하기'], LS.fillTitle, ['Get your stamp', '도장 받기']];
const TOTAL = LS.choose.length + LS.fill.length;
const tipOf = letter => (LS.units.find(u => u.l === letter) || LESSONS[1].units.find(u => u.l === letter) || { tip: ['', ''] }).tip;
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
    <h2 class="es" style="margin:.2rem 0 0;font-size:2.4rem;color:var(--camino)">${info.n}. ${info.name}</h2>
    <p class="lead" style="margin:0">${L(info.en, info.ko)}</p>
    <ol class="steps">${STEPS.map((s, i) => `<li class="${i === step ? 'now' : i < step ? 'done' : ''}">${i + 1}. ${T(s)}</li>`).join('')}</ol>
    <div class="panel">${noVoice ? warn() : ''}${inner}</div>`;
}
const go = n => { step = n; scoreAtStep = score; window.scrollTo(0, 0); [listenStep, chooseStep, speakStep, fillStep, stampStep][n](); };

/* 1. 소리 듣기 */
function listenStep() {
  frame(`<h2>${L('Listen', '소리 듣기')}</h2>
    ${friend('ramon', T(LS.intro))}
    <div class="units">${LS.units.map(u => `<div class="unit"><button class="vowel" data-say="${u.say}" aria-label="${u.l}, ${esc(T(u.s))}"><span class="big">${u.l}</span><span class="ko">${T(u.s)}</span></button><button class="ex-btn es" data-say="${u.ex}">${u.ex}</button></div>`).join('')}</div>
    ${friend('ramon', T(LS.tip))}
    <div class="nav-bottom"><span></span><button class="btn go" id="next">${L('On to picking letters', '글자 고르기로')}</button></div>`);
  document.getElementById('next').onclick = () => go(1);
}

/* 2. 글자 고르기 */
function chooseStep() {
  let i = 0;
  const render = () => {
    const q = LS.choose[i]; let tried = false;
    frame(`<h2>${L('Pick the letter', '글자 고르기')} ${small(`${i + 1} / ${LS.choose.length}`)}</h2>
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
        if (!tried) document.getElementById('why').innerHTML = friend('ramon', T(q.why));
        document.getElementById('next').hidden = false;
      } else {
        tried = true; btn.classList.add('wrong'); btn.disabled = true;
        fb.className = 'feedback no'; fb.textContent = L('Listen once more and try again.', '다시 들어 보고 골라요.');
        document.getElementById('why').innerHTML = friend('ramon', T(q.why));
        BC.speak(q.say);
      }
    });
    document.getElementById('next').onclick = () => { i++; i < LS.choose.length ? render() : go(2); };
  };
  render();
}

/* 3. 따라 말하기 */
function speakStep() {
  const can = BC.canListen();
  frame(`<h2>${L('Say it', '따라 말하기')}</h2>
    ${friend('ramon', can ? L('Listen first, then tap Speak and say it out loud. If the machine understands you, you pass. Machine ears are not perfect, so if it fails a few times, it is fine to move on.', '먼저 듣고, 말하기를 눌러 소리 내어 따라 해 보세요. 기계가 알아들으면 통과예요. 기계 귀는 완벽하지 않으니 몇 번 안 되면 넘어가도 괜찮아요.')
      : L('This browser cannot check your speech. Listen, say it out loud, and compare on your own. Open the page in Chrome to use the checker.', '이 브라우저는 말한 소리를 확인하지 못해요. 듣고 소리 내어 따라 한 다음 스스로 비교해 보세요. 크롬에서 열면 확인 기능을 쓸 수 있어요.'))}
    ${LS.speak.map((s, k) => `<div class="speak-item"><span class="es">${s.w}</span><small>${T(s.m)}. ${T(s.n)}</small>
      <div class="row" style="margin-top:.5rem">${playBtn(s.w)}${can ? `<button class="btn small" data-mic="${k}">${L('Speak', '말하기')}</button>` : ''}</div>
      <div class="result" id="r${k}" aria-live="polite"></div></div>`).join('')}
    <div class="nav-bottom"><button class="btn" id="prev">${L('Back to picking letters', '글자 고르기 다시')}</button><button class="btn go" id="next">${L('On to the next step', '다음 단계로')}</button></div>`);
  app.querySelectorAll('[data-mic]').forEach(b => b.onclick = async () => {
    const k = +b.dataset.mic, out = document.getElementById('r' + k), target = BC.norm(LS.speak[k].w);
    out.textContent = L('Listening. Go ahead.', '듣고 있어요. 말해 보세요.'); out.className = 'result';
    try {
      const alts = await BC.listen();
      const hitAlt = alts.find(a => BC.norm(a).split(' ').join(' ').includes(target));
      out.className = 'result feedback ' + (hitAlt ? 'ok' : 'no');
      out.textContent = hitAlt ? L(`Heard you clearly: "${hitAlt}"`, `잘 들렸어요. "${hitAlt}"`) :
        (alts.length ? L(`That sounded like "${alts[0]}". Listen once more and try again.`, `"${alts[0]}"(으)로 들렸어요. 한 번 더 들어 보고 해 봐요.`)
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

/* 4. 빈칸 채우기 */
function fillStep() {
  let i = 0;
  const render = () => {
    const q = LS.fill[i]; let tried = false; let filled = [];
    const blanks = [...q.t].filter(c => c === '_').length;
    const answer = [...q.w].filter((c, k) => q.t[k] === '_');
    const draw = () => {
      let b = 0;
      document.getElementById('word').innerHTML = [...q.t].map(c => c === '_' ? `<span class="blank">${filled[b++] || '&nbsp;'}</span>` : c).join('');
    };
    frame(`<h2>${T(LS.fillTitle)} ${small(`${i + 1} / ${LS.fill.length}`)}</h2>
      <p>${L('Listen to the word, then tap the missing letters in order.', '낱말을 듣고 빈칸에 들어갈 글자를 차례로 눌러요.')}</p>
      ${playBtn(q.w, L('Listen again', '다시 듣기'))}
      <div class="fill es" id="word" aria-live="polite"></div>
      <div class="row">${LS.fillLetters.map(v => `<button class="choice" data-v="${v}">${v}</button>`).join('')}</div>
      <div class="row" style="margin-top:.8rem"><button class="btn small" id="clear">${L('Clear', '지우기')}</button><button class="btn small go" id="check">${L('Check', '확인')}</button></div>
      <div class="feedback" id="fb" aria-live="polite"></div><div id="why"></div>
      <div class="nav-bottom"><span></span><button class="btn go" id="next" hidden>${L('Next', '다음')}</button></div>`);
    draw(); setTimeout(() => BC.speak(q.w), 300);
    app.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { if (filled.length < blanks) { filled.push(b.dataset.v); draw(); } });
    document.getElementById('clear').onclick = () => { filled = []; draw(); };
    document.getElementById('check').onclick = () => {
      const fb = document.getElementById('fb');
      if (filled.length < blanks) { fb.className = 'feedback no'; fb.textContent = L(`There ${blanks > 1 ? 'are ' + blanks + ' blanks' : 'is 1 blank'}. Fill ${blanks > 1 ? 'them all' : 'it'}, then tap Check.`, `빈칸이 ${blanks}개예요. 모두 채운 다음 확인을 눌러요.`); return; }
      if (filled.join('') === answer.join('')) {
        if (!tried) score++;
        fb.className = 'feedback ok'; fb.textContent = L(`That is right: ${q.w}`, `맞았어요. ${q.w}`);
        app.querySelectorAll('[data-v],#clear,#check').forEach(b => b.disabled = true);
        document.getElementById('next').hidden = false;
      } else {
        tried = true; fb.className = 'feedback no'; fb.textContent = L('Listen again and try once more.', '다시 들어 보고 채워 봐요.');
        const at = filled.findIndex((v, k) => v !== answer[k]);
        const ord = ['first', 'second', 'third', 'fourth'][at] || (at + 1) + 'th';
        const tip = tipOf(answer[at]);
        document.getElementById('why').innerHTML = friend('ramon', q.why ? T(q.why)
          : L(`Listen to the ${ord} blank again. It is ${tip[0]}.`, `${at + 1}번째 빈칸을 다시 들어 봐요. ${tip[1]} 소리예요.`));
        filled = []; draw(); BC.speak(q.w, 0.6);
      }
    };
    document.getElementById('next').onclick = () => { i++; i < LS.fill.length ? render() : go(4); };
  };
  render();
}

/* 5. 도장 받기 */
function stampStep() {
  const stars = score >= TOTAL - 1 ? 3 : score >= TOTAL - 4 ? 2 : 1;
  BC.setStamp('1-' + info.n, stars);
  const nextInfo = TRAMO1.find(e => e.n === info.n + 1);
  const nextBtn = nextInfo && nextInfo.open && LESSONS[nextInfo.n]
    ? `<a class="btn go" href="?etapa=${nextInfo.n}">${L('Next lesson: ' + nextInfo.name, '다음 과: ' + nextInfo.name)}</a>`
    : `<a class="btn go" href="../#credencial">${L('See my credencial', '크레덴시알 보기')}</a>`;
  frame(`<h2>${L('Get your stamp', '도장 받기')}</h2>
    <div style="max-width:11rem;margin:.5rem auto 1rem">${BC.stampSVG(info.name, stars)}</div>
    <p style="text-align:center">${L(`You got ${score} of ${TOTAL} right on the first try and earned ${stars} of 3 steps.${stars < 3 ? ' Walk it again tomorrow to earn all three.' : ''}`,
      `${TOTAL}문제 중 ${score}문제를 한 번에 맞혀서 걸음 ${stars}개를 받았어요.${stars < 3 ? ' 내일 다시 걸으면 세 개를 받을 수 있어요.' : ''}`)}</p>
    ${friend('begona', T(LS.note))}
    <h3 style="font:600 1.15rem var(--serif);margin:1.2rem 0 0">${L('Words from today', '오늘 만난 말')}</h3>
    <ul class="words">${LS.today.map(k => LS.speak[k]).map(s => `<li><span class="es" style="font-size:1.2rem">${s.w}</span> ${T(s.m)} ${playBtn(s.w)}</li>`).join('')}</ul>
    <div class="nav-bottom"><button class="btn" id="again">${L('Start over', '처음부터 다시')}</button>${nextBtn}</div>`);
  document.getElementById('again').onclick = () => { score = 0; go(0); };
}

chrome();
BC.mountToggle(() => { chrome(); score = scoreAtStep; go(step); });
go(0);
})();
