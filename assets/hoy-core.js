// 오늘의 걸음: 마친 과의 낱말을 하루 다섯 개씩 듣고 쓰기. 틀린 말은 다음 날, 맞힌 말은 점점 간격을 늘려 다시 나온다.
const HOY = (() => {
  const KEY = 'buencamino:hoy:v1';
  const GAPS = [2, 4, 8, 16, 32, 60];
  const PER_DAY = 5;
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} };
  const pad = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (key, n) => { const [y, m, d] = key.split('-').map(Number); return dayKey(new Date(y, m - 1, d + n)); };

  // 낱말 모음: 도장을 받은 과의 따라 말하기 낱말
  function pool() {
    const out = [];
    const sets = [[1, typeof TRAMO1 !== 'undefined' && TRAMO1, typeof LESSONS !== 'undefined' && LESSONS],
                  [2, typeof TRAMO2 !== 'undefined' && TRAMO2, typeof LESSONS2 !== 'undefined' && LESSONS2],
                  [3, typeof TRAMO3 !== 'undefined' && TRAMO3, typeof LESSONS3 !== 'undefined' && LESSONS3]];
    sets.forEach(([t, list, lx]) => {
      if (!list || !lx) return;
      list.forEach(e => {
        if (!BC.getStamp(t + '-' + e.n) || !lx[e.n]) return;
        lx[e.n].speak.forEach(s => { if (!out.some(o => o.w === s.w)) out.push({ w: s.w, m: s.m, n: s.n, lesson: e.n, tramo: t }); });
      });
    });
    return out;
  }

  function state() {
    const d = load();
    d.cards = d.cards || {};
    return d;
  }

  // 오늘 목록을 만들거나 이어서 쓴다
  function today() {
    const d = state(), t = dayKey(), words = pool();
    if (d.session && d.session.date === t) return { d, s: d.session, words };
    const byW = Object.fromEntries(words.map(x => [x.w, x]));
    const due = words.filter(x => d.cards[x.w] && d.cards[x.w].due <= t).sort((a, b) => d.cards[a.w].due.localeCompare(d.cards[b.w].due));
    const fresh = words.filter(x => !d.cards[x.w]);
    const later = words.filter(x => d.cards[x.w] && d.cards[x.w].due > t).sort((a, b) => d.cards[a.w].due.localeCompare(d.cards[b.w].due));
    const pick = [...due, ...fresh];
    // 오늘 할 말이 다섯 개보다 적으면, 공부할 말이 아예 없을 때만 곧 돌아올 말로 채운다
    const list = (pick.length ? pick : later).slice(0, PER_DAY).map(x => x.w).filter(w => byW[w]);
    d.session = { date: t, list, idx: 0, results: [] };
    save(d);
    return { d, s: d.session, words };
  }

  function record(word, ok) {
    const d = state(), t = dayKey();
    const c = d.cards[word] || { box: 0 };
    c.box = ok ? Math.min(c.box + 1, GAPS.length - 1) : 0;
    c.due = addDays(t, ok ? GAPS[c.box - 1 < 0 ? 0 : c.box - 1] : 1);
    c.last = t;
    d.cards[word] = c;
    d.session.results.push({ w: word, ok });
    d.session.idx++;
    if (d.session.idx >= d.session.list.length) {
      // 연속 걷기 일수
      if (d.lastDone !== t) { d.streak = d.lastDone === addDays(t, -1) ? (d.streak || 0) + 1 : 1; d.lastDone = t; }
    }
    save(d);
  }

  // 첫 화면 카드에 보여 줄 상태
  function status() {
    const words = pool();
    if (!words.length) return { kind: 'locked' };
    const d = state(), t = dayKey();
    if (d.session && d.session.date === t) {
      const left = d.session.list.length - d.session.idx;
      return left > 0 ? { kind: 'todo', left, streak: d.streak || 0 } : { kind: 'done', streak: d.streak || 0 };
    }
    const due = words.filter(x => !d.cards[x.w] || d.cards[x.w].due <= t).length;
    return { kind: due ? 'todo' : 'rest', left: Math.min(due, PER_DAY), streak: d.lastDone === addDays(t, -1) || d.lastDone === t ? (d.streak || 0) : 0 };
  }

  function practiceMore() {
    const d = state();
    if (d.session) { d.session.date = 'used'; save(d); }
  }

  return { today, record, status, pool, practiceMore, dayKey };
})();
