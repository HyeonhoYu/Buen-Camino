// 첫째 구간 수업 내용. 과를 추가할 때는 LESSONS에 번호를 키로 넣고 tramo-1-data.js에서 open: true로 바꾼다.
// 문장마다 [영어, 한국어] 순서.
const LESSONS = {
1: {
  units: [
    { l: 'a', say: 'a', s: ['ah', '아'], ex: 'mapa', tip: ['an open "ah", as in father', '입을 크게 벌린 "아"'] },
    { l: 'e', say: 'e', s: ['eh', '에'], ex: 'mesa', tip: ['a short "eh", as in bet, never "ay"', '한국어 "에"와 거의 같은'] },
    { l: 'i', say: 'i', s: ['ee', '이'], ex: 'piso', tip: ['a crisp "ee", as in see', '입꼬리를 옆으로 당긴 "이"'] },
    { l: 'o', say: 'o', s: ['oh', '오'], ex: 'oso', tip: ['a pure "oh" with rounded lips, no "oo" glide at the end', '입술을 동그랗게, "오우"로 미끄러지지 않는 "오"'] },
    { l: 'u', say: 'u', s: ['oo', '우'], ex: 'uva', tip: ['an "oo" as in moon, lips pushed forward', '입술을 앞으로 내민 "우"'] }
  ],
  intro: ['Welcome, pilgrim. Spanish has only five vowel sounds, and each letter always makes the same one. Tap a letter to hear it, and tap a word to hear it inside a word.',
          '어서 와요, 순례자님. 스페인어 모음은 다섯 개뿐이고, 한국어 아, 에, 이, 오, 우와 거의 같아요. 글자를 눌러 소리를 들어 보세요. 낱말을 누르면 그 모음이 들어간 말이 나와요.'],
  tip: ['One thing to remember: English likes to slide vowels, turning "oh" into "oh-oo" and "eh" into "ay". Spanish vowels stay put. Start and finish with the same mouth shape, and keep them short.',
        '한 가지만 기억해요. 영어처럼 "오우", "에이"로 미끄러지지 않고, 처음 입 모양 그대로 짧게 끝내요.'],
  choose: [
    { say: 'a', opts: ['a', 'e', 'o'], why: ['That was the open "ah" sound.', '입을 크게 벌린 "아" 소리였어요.'] },
    { say: 'u', opts: ['o', 'u', 'i'], why: ['That was "oo", lips pushed forward. The letter o says "oh".', '입술을 앞으로 내민 "우" 소리였어요. o는 "오"예요.'] },
    { say: 'e', opts: ['i', 'a', 'e'], why: ['That was "eh". The letter i says "ee", not "eye".', '"에" 소리였어요. i는 "이"예요.'] },
    { say: 'i', opts: ['e', 'i', 'u'], why: ['That was "ee". In Spanish, i always says "ee".', '"이" 소리였어요.'] },
    { say: 'o', opts: ['u', 'a', 'o'], why: ['That was "oh". Hold the same lip shape to the end.', '"오" 소리였어요. 끝까지 같은 입 모양을 유지해요.'] },
    { say: 'mesa', opts: ['misa', 'mesa', 'musa'], why: ['The middle vowel was e. Mesa is a table, misa is Mass at church, musa is a muse. One vowel changes the meaning.', '가운데 모음이 e였어요. mesa는 탁자, misa는 성당 미사, musa는 뮤즈예요. 모음 하나로 뜻이 바뀌어요.'] },
    { say: 'paso', opts: ['piso', 'peso', 'paso'], why: ['It was a. Paso means step; on the Camino you will hear paso a paso, step by step. Piso is a floor or flat, peso is weight.', 'a였어요. paso는 걸음이에요. 순례길에서는 paso a paso(한 걸음씩)라는 말을 자주 들어요. piso는 층, peso는 무게예요.'] },
    { say: 'oso', opts: ['uso', 'oso', 'osa'], why: ['Both vowels were o. Oso is a bear, osa a female bear, uso means use.', '앞뒤 모두 o였어요. oso는 곰, osa는 암곰, uso는 사용이에요.'] },
    { say: 'mapa', opts: ['mopa', 'mapa'], why: ['Both vowels were a. Mapa is a map, mopa is a mop.', '두 모음 모두 a였어요. mapa는 지도, mopa는 대걸레예요.'] }
  ],
  speak: [
    { w: 'Hola', m: ['hello', '안녕하세요'], n: ['The h is silent: "OH-lah". You will meet it again in lesson 6.', 'h는 소리가 나지 않아요. "올라"처럼 말해요. 6과에서 다시 만나요.'] },
    { w: 'Buen Camino', m: ['have a good Camino', '좋은 순례 되세요'], n: ['The greeting pilgrims share on the trail.', '순례자끼리 길에서 나누는 인사예요.'] },
    { w: 'oso', m: ['bear', '곰'], n: ['"OH-so". Keep both o sounds short and pure.', '"오소". 두 o 모두 짧고 또렷하게.'] },
    { w: 'mesa', m: ['table', '탁자'], n: ['"MEH-sah". Stress the first syllable.', '"메사". 첫 음절에 힘을 줘요.'] },
    { w: 'uva', m: ['grape', '포도'], n: ['"OO-bah". Lips forward for the u.', '"우바". 입술을 앞으로.'] }
  ],
  fillTitle: ['Fill the vowels', '모음 채우기'],
  fillLetters: ['a', 'e', 'i', 'o', 'u'],
  fill: [{ w: 'mesa', t: 'm_s_' }, { w: 'uva', t: '_v_' }, { w: 'mapa', t: 'm_p_' }, { w: 'paso', t: 'p_s_' }, { w: 'oso', t: '_s_' }],
  note: ['In Basque, Roncesvalles is called Orreaga. In northern Navarra, road signs show both the Spanish and the Basque names. For many pilgrims, this is where they first hear someone say Buen Camino.',
         '론세스바예스는 바스크어로 오레아가(Orreaga)라고 해요. 나바라 북부에서는 표지판에 스페인어와 바스크어 이름이 함께 적혀 있어요. 많은 순례자가 이곳에서 처음으로 Buen Camino라는 인사를 듣는답니다.'],
  today: [0, 1]
},
2: {
  units: [
    { l: 'm', say: 'ma', s: ['m', 'ㅁ'], ex: 'mano', tip: ['an m, just like English', '한국어 ㅁ과 같은'] },
    { l: 'n', say: 'na', s: ['n', 'ㄴ'], ex: 'luna', tip: ['an n, just like English', '한국어 ㄴ과 같은'] },
    { l: 'l', say: 'la', s: ['clear l', 'ㄹ'], ex: 'sal', tip: ['a clear l, as in leaf, even at the end of a word', '혀끝을 윗니 뒤에 대는 ㄹ'] },
    { l: 's', say: 'sa', s: ['s, not z', 'ㅅ'], ex: 'sopa', tip: ['always s as in see, never a z sound', '탁해지지 않는 ㅅ'] },
    { l: 't', say: 'ta', s: ['soft t', 'ㄸ에 가까움'], ex: 'tapa', tip: ['a t with the tongue on the back of the top teeth and no puff of air', '바람을 세게 내지 않는, ㄸ에 가까운'] },
    { l: 'p', say: 'pa', s: ['soft p', 'ㅃ에 가까움'], ex: 'pan', tip: ['a p with no puff of air', '바람을 세게 내지 않는, ㅃ에 가까운'] },
    { l: 'f', say: 'fa', s: ['f', '윗니와 입술'], ex: 'foto', tip: ['an f, top teeth on the lower lip', '윗니를 아랫입술에 대고 내는'] },
    { l: 'b', say: 'ba', s: ['b', 'ㅂ'], ex: 'beso', tip: ['a b, with voice from the start', '목이 울리는 ㅂ'] },
    { l: 'v', say: 'va', s: ['same as b', 'b와 같은 ㅂ'], ex: 'vino', tip: ['the same sound as b', 'b와 똑같은'] }
  ],
  intro: ['Good news: most of these consonants work just like English. Tap a letter to hear it with a vowel, then tap the word under it.',
          '이번 과의 자음은 대부분 한국어 자음과 비슷해요. 글자를 누르면 모음과 함께 소리가 나고, 아래 낱말을 누르면 그 자음이 들어간 말이 나와요.'],
  tip: ['Two habits to drop. English p and t come with a little puff of air; Spanish ones do not. Hold your hand in front of your mouth and say pan and tapa: you should feel almost nothing. And in Spanish, b and v are the same sound, so vino starts exactly like a b.',
        '두 가지를 기억해요. p와 t는 ㅍ, ㅌ처럼 바람을 세게 내지 않고 ㅃ, ㄸ에 가깝게 내요. 손바닥을 입 앞에 대고 pan, tapa를 말해 보면 바람이 거의 느껴지지 않아야 해요. f는 한국어에 없는 소리라 윗니를 아랫입술에 살짝 대고 바람을 내보내요. 그리고 b와 v는 스페인어에서 같은 소리예요.'],
  choose: [
    { say: 'beso', opts: ['peso', 'beso'], why: ['It was b, with voice from the start. Beso is a kiss, peso is weight.', 'b였어요. 목이 울리는 소리예요. beso는 입맞춤, peso는 무게예요.'] },
    { say: 'vino', opts: ['fino', 'vino'], why: ['It was v, which sounds like b. Vino is wine; fino is a dry sherry from Andalusia.', 'v였어요. b처럼 들리는 소리예요. vino는 포도주, fino는 안달루시아의 드라이 셰리 와인이에요.'] },
    { say: 'pata', opts: ['bata', 'pata'], why: ['It was p, with no voice at the start. Pata is an animal\'s leg or paw; bata is a robe.', 'p였어요. 목이 울리지 않는 소리예요. pata는 동물의 다리나 발, bata는 가운이에요.'] },
    { say: 'nata', opts: ['mata', 'lata', 'nata'], why: ['It was n. In Spain nata is cream; lata is a tin can, mata is a bush.', 'n이었어요. 스페인에서 nata는 생크림, lata는 깡통, mata는 덤불이에요.'] },
    { say: 'fila', opts: ['fila', 'pila'], why: ['It was f, top teeth on the lower lip. Fila is a row or queue; pila is a battery.', 'f였어요. 윗니를 아랫입술에 대는 소리예요. fila는 줄, pila는 건전지예요.'] },
    { say: 'tapa', opts: ['pata', 'tapa'], why: ['Tapa: t first, then p. A tapa is a small dish served with a drink.', 't가 먼저, p가 나중이에요. tapa는 음료와 함께 나오는 작은 요리예요.'] },
    { say: 'vale', opts: ['sale', 'vale'], why: ['It was vale. In Spain you will hear vale all day; it means OK. Sale means goes out.', 'vale였어요. 스페인에서 하루 종일 듣게 될 말로 "좋아요, 알겠어요"라는 뜻이에요. sale는 "나가요"예요.'] },
    { say: 'mano', opts: ['mono', 'mano'], why: ['The first vowel was a. Mano is hand; mono is monkey, and in Spain it also means cute.', '첫 모음이 a였어요. mano는 손, mono는 원숭이예요. 스페인에서는 "귀엽다"는 뜻으로도 써요.'] }
  ],
  speak: [
    { w: 'Vale', m: ['OK', '좋아요, 알겠어요'], n: ['"BAH-leh". The v sounds like b. You will hear it everywhere in Spain.', '"발레". v는 b처럼 내요. 스페인 어디서나 들리는 말이에요.'] },
    { w: 'pan', m: ['bread', '빵'], n: ['One clean syllable, no puff on the p.', 'p를 세게 내지 않고 한 음절로.'] },
    { w: 'vino', m: ['wine', '포도주'], n: ['"BEE-no".', '"비노".'] },
    { w: 'tapa', m: ['a small dish', '작은 안주 한 접시'], n: ['"TAH-pah". Soft t, soft p.', '"따빠"에 가깝게.'] },
    { w: 'patata', m: ['potato', '감자'], n: ['Spain says patata. Stress the middle: pa-TA-ta.', '스페인에서는 patata라고 해요. 가운데 음절에 힘을 줘요.'] }
  ],
  fillTitle: ['Fill the consonants', '자음 채우기'],
  fillLetters: ['m', 'n', 'l', 's', 't', 'p', 'f', 'b', 'v'],
  fill: [
    { w: 'pan', t: 'pa_' }, { w: 'sopa', t: 'so_a' }, { w: 'foto', t: '_o_o' }, { w: 'patata', t: 'pa_a_a' },
    { w: 'vino', t: '_ino', why: ['b and v sound the same, so your ear cannot decide this one. You simply remember it: vino is spelled with v.', 'b와 v는 소리가 같아서 귀로는 구별할 수 없어요. vino는 v로 쓴다고 기억해요.'] }
  ],
  note: ['Burguete is called Auritz in Basque. Ernest Hemingway came here in the 1920s to fish for trout, and the village appears in his novel The Sun Also Rises.',
         '부르게테는 바스크어로 아우리츠(Auritz)라고 해요. 1920년대에 헤밍웨이가 송어 낚시를 하러 머물렀고, 소설 「해는 또다시 떠오른다」에도 이 마을이 나와요.'],
  today: [0, 1, 2]
}
};
