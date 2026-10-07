(() => {
const L = BC.L, T = p => L(p[0], p[1]);
const app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const friend = (who, html) => `<div class="say"><div class="avatar">${BC.charImg(who, '../')}</div><p>${html}</p></div>`;
const playBtn = (text, label) => `<button class="btn small play" data-say="${esc(text)}">${BC.playIcon}${label || L('Listen', '듣기')}</button>`;
app.addEventListener('click', e => {
  const b = e.target.closest('[data-say]');
  if (b && !BC.speak(b.dataset.say)) alert(L('This browser cannot play sound. Try Chrome or open the page on your phone.', '이 브라우저에서는 소리를 낼 수 없어요. 크롬이나 휴대전화로 열어 보세요.'));
});
const plain = s => s.toLowerCase().replace(/[¿?¡!.,;:]/g, '').replace(/\s+/g, ' ').trim();
const bare = s => plain(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const KEYS = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'];

function chrome() {
  document.getElementById('navT').textContent = L('First stretch', '첫째 구간');
  document.getElementById('navC').textContent = L('My credencial', '나의 크레덴시알');
  document.title = L("Today's steps", '오늘의 걸음') + ' - Buen Camino';
}
const head = () => `<p style="margin:1.2rem 0 0"><a href="../">${L('Home', '처음으로')}</a></p>
  <h2 class="es" style="margin:.2rem 0 0;font-size:2.4rem;color:var(--camino)">${L("Today's steps", '오늘의 걸음')}</h2>
  <p class="lead" style="margin:0 0 1.2rem">${L('Five words a day from the lessons you finished. Listen, then write.', '마친 과의 낱말을 하루 다섯 개씩. 듣고 써요.')}</p>`;

let view = 'run', state = null, wrongTry = false;

function render() {
  chrome();
  if (!HOY.pool().length) {
    app.innerHTML = head() + `<div class="panel">${friend('ramon', L('Your daily steps start once you have a stamp. Finish lesson 1 in Roncesvalles, and its words will be waiting here tomorrow, and today too.', '도장을 하나 받으면 오늘의 걸음이 시작돼요. 론세스바예스 1과를 마치면 그 과의 낱말이 여기서 기다리고 있을 거예요.'))}
      <div class="nav-bottom"><span></span><a class="btn go" href="../tramo-1/?etapa=1">${L('Go to lesson 1', '1과로 가기')}</a></div></div>`;
    return;
  }
  state = HOY.today();
  const { s, words } = state;
  if (!s.list.length) { summary(); return; }
  if (s.idx >= s.list.length) { summary(); return; }
  const w = words.find(x => x.w === s.list[s.idx]);
  if (!w) { HOY.record(s.list[s.idx], true); render(); return; }
  wrongTry = false;
  app.innerHTML = head() + `<div class="panel">
    <div class="row" style="justify-content:space-between"><strong>${L('Step', '걸음')} ${s.idx + 1} / ${s.list.length}</strong><span class="tag">${L('stretch ' + (w.tramo || 1) + ', lesson ' + w.lesson, (w.tramo || 1) + '구간 ' + w.lesson + '과')}</span></div>
    <div class="hoy-dots" aria-hidden="true">${s.list.map((x, i) => `<span class="${i < s.idx ? (s.results[i] && s.results[i].ok ? 'ok' : 'no') : i === s.idx ? 'now' : ''}"></span>`).join('')}</div>
    <div class="row" style="margin:1rem 0">${playBtn(w.w, L('Listen', '듣기'))}<button class="btn small" data-say="${esc(w.w)}" data-slow="1">${L('Slower', '천천히')}</button><button class="btn small" id="hint">${L('Show meaning', '뜻 보기')}</button></div>
    <p id="meaning" class="lead" hidden>${esc(T(w.m))}</p>
    <label for="ans" class="sr">${L('Write what you heard', '들은 말을 써요')}</label>
    <input id="ans" class="hoy-input es" lang="es" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${L('Write what you hear', '들은 말을 써요')}">
    <div class="row keys">${KEYS.map(k => `<button class="choice key" data-k="${k}" aria-label="${L('insert', '넣기')} ${k}">${k}</button>`).join('')}</div>
    <div class="row" style="margin-top:.8rem"><button class="btn small go" id="check">${L('Check', '확인')}</button><button class="btn small" id="skip">${L("I don't know", '모르겠어요')}</button></div>
    <div class="feedback" id="fb" aria-live="polite"></div><div id="why"></div>
    <div class="nav-bottom"><span></span><button class="btn go" id="next" hidden>${L('Next', '다음')}</button></div></div>`;
  const input = document.getElementById('ans');
  setTimeout(() => { BC.speak(w.w); input.focus(); }, 300);
  app.querySelector('[data-slow]').onclick = e => { e.stopPropagation(); BC.speak(w.w, 0.55); };
  document.getElementById('hint').onclick = () => { document.getElementById('meaning').hidden = false; };
  app.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
    const k = b.dataset.k, a = input.selectionStart ?? input.value.length, z = input.selectionEnd ?? a;
    input.value = input.value.slice(0, a) + k + input.value.slice(z); input.focus(); input.setSelectionRange(a + 1, a + 1);
  });
  let done = false;
  const finish = ok => {
    done = true; HOY.record(w.w, ok);
    input.disabled = true; app.querySelectorAll('#check,#skip,[data-k]').forEach(b => b.disabled = true);
    document.getElementById('meaning').hidden = false;
    const n = document.getElementById('next'); n.hidden = false; n.focus();
  };
  const check = () => {
    if (done) return;
    const v = input.value, fb = document.getElementById('fb'), why = document.getElementById('why');
    if (!v.trim()) { fb.className = 'feedback no'; fb.textContent = L('Write what you heard first.', '먼저 들은 말을 써 봐요.'); return; }
    if (plain(v) === plain(w.w)) {
      fb.className = 'feedback ok'; fb.innerHTML = `${wrongTry ? L('Got it on the second try.', '두 번째에 맞혔어요.') : L('That is right.', '맞았어요.')} <span class="es">${esc(w.w)}</span>`;
      if (wrongTry) why.innerHTML = friend('ramon', L('Since it took two tries, this one will come back tomorrow.', '두 번 만에 맞혔으니 이 말은 내일 다시 나와요.'));
      finish(!wrongTry);
    } else if (bare(v) === bare(w.w) && !wrongTry) {
      fb.className = 'feedback no'; fb.textContent = L('Almost. Check the accent marks and the ñ.', '거의 맞았어요. 악센트 부호와 ñ을 확인해 봐요.');
      why.innerHTML = friend('lucia', L('The letters are right; only a mark is missing or extra. Listen for where the stress falls.', '글자는 맞고 부호만 빠지거나 더 붙었어요. 어디에 힘이 들어가는지 들어 봐요.'));
      wrongTry = true;
    } else if (!wrongTry) {
      fb.className = 'feedback no'; fb.textContent = L('Not quite. Listen once more and try again.', '조금 달라요. 한 번 더 듣고 다시 써 봐요.');
      wrongTry = true; BC.speak(w.w, 0.7);
    } else {
      fb.className = 'feedback no'; fb.innerHTML = `${L('The answer is', '정답은')} <span class="es" style="font-size:1.3rem">${esc(w.w)}</span> ${playBtn(w.w)}`;
      why.innerHTML = friend('ramon', `${esc(T(w.n))} ${L('It will come back tomorrow.', '이 말은 내일 다시 나와요.')}`);
      finish(false);
    }
  };
  document.getElementById('check').onclick = check;
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); done ? document.getElementById('next').click() : check(); } });
  document.getElementById('skip').onclick = () => {
    const fb = document.getElementById('fb');
    fb.className = 'feedback no'; fb.innerHTML = `${L('The answer is', '정답은')} <span class="es" style="font-size:1.3rem">${esc(w.w)}</span> ${playBtn(w.w)}`;
    document.getElementById('why').innerHTML = friend('ramon', `${esc(T(w.n))} ${L('It will come back tomorrow.', '이 말은 내일 다시 나와요.')}`);
    finish(false);
  };
  document.getElementById('next').onclick = () => render();
}

function summary() {
  const { s, d } = state;
  const res = s.results;
  const right = res.filter(r => r.ok).length;
  const nothing = !s.list.length;
  app.innerHTML = head() + `<div class="panel">
    <h2>${nothing ? L('Nothing due today', '오늘은 쉬어 가는 날') : L("Today's steps are done", '오늘의 걸음 완료')}</h2>
    ${nothing ? friend('begona', L('Every word you know is resting until its next review. Walk a new lesson, or come back tomorrow.', '아는 말이 모두 다음 복습 날까지 쉬고 있어요. 새 과를 걷거나 내일 다시 와요.'))
    : `<p>${L(`${right} of ${res.length} on the first try.`, `${res.length}개 중 ${right}개를 한 번에 맞혔어요.`)} ${d.streak > 1 ? L(`You have walked ${d.streak} days in a row.`, `${d.streak}일 연속으로 걸었어요.`) : ''}</p>
      <ul class="words">${res.map(r => `<li><span class="hoy-mark ${r.ok ? 'ok' : 'no'}">${r.ok ? L('right', '맞음') : L('tomorrow', '내일 다시')}</span> <span class="es" style="font-size:1.2rem">${esc(r.w)}</span> ${playBtn(r.w)}</li>`).join('')}</ul>
      ${friend('ramon', right === res.length ? L('All clean. These words will rest a little longer before they come back.', '모두 맞혔어요. 이 말들은 조금 더 쉬었다가 다시 나와요.') : L('The ones marked tomorrow will be waiting for you. That is how they stick.', '"내일 다시" 표시된 말은 내일 다시 만나요. 그렇게 해야 오래 기억에 남아요.'))}`}
    <div class="nav-bottom"><button class="btn" id="more">${L('Practice five more', '다섯 개 더 연습하기')}</button><a class="btn go" href="../">${L('Back home', '처음으로')}</a></div></div>`;
  document.getElementById('more').onclick = () => { HOY.practiceMore(); render(); };
}

BC.mountToggle(render);
render();
})();
