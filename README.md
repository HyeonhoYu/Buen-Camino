# Buen Camino

산티아고 순례길(프랑스 길)을 일곱 구간으로 나눠 걸으며 스페인 여행 스페인어를 배우는 사이트. 기본 언어는 영어, 오른쪽 위 버튼으로 한국어 전환(선택은 브라우저에 저장).

## 구조
- `index.html` 첫 화면 (일곱 구간, 연습실, 길동무, 크레덴시알, 배우는 방법)
- `tramo-1/` 첫째 구간 (`?etapa=1` 처럼 과 번호로 바로 연결)
- `assets/common.js` 진도 저장(localStorage), es-ES 음성, 음성 인식
- `assets/tramo-1-data.js` 첫째 구간 과 목록 (`open: true`로 바꾸면 과가 열림)
- `assets/tramo-1.js` 첫째 구간 수업 내용과 진행

## 녹음 파일 추가
`assets/audio/manifest.js`를 만들고 `window.BC_AUDIO = { "mesa": "../assets/audio/mesa.mp3" };` 형태로 적은 뒤, 각 HTML에서 common.js 앞에 불러오면 해당 낱말은 녹음 파일로 재생된다.

## GitHub Pages
저장소 루트에 이 폴더 내용을 올리고 Settings > Pages에서 main 브랜치를 선택.

## 캐릭터 그림 바꾸기
`assets/chars/`에 얼굴 그림(lucia.webp, ramon.webp, begona.webp, 원형 말풍선용), 전신 그림(*-full.webp, 첫 화면 길동무용), 세 친구 단체 그림(trio.webp, 첫 화면 맨 위)이 있다. 배경은 투명 처리되어 있다. 새 그림을 같은 이름으로 덮어쓰거나, 형식이 다르면(예: webp) `assets/common.js` 맨 위의 `CHARS` 목록에서 파일 이름만 바꾸면 첫 화면과 수업 화면에 모두 반영된다. 정사각형, 원형으로 잘려도 괜찮은 구도가 좋다.

## 파비콘
루트의 favicon.svg(기본), favicon-32.png, favicon.ico, apple-touch-icon.png. 순례길 표지처럼 파란 바탕에 노란 가리비.

## 첫째 구간 수업 (1과~8과)
1 Roncesvalles 모음 / 2 Burguete 자음, f, b=v / 3 Espinal c, z, d / 4 Viscarret g, j / 5 Zubiri r, rr / 6 Larrasoaña ñ, ll, y, ch, qu, h / 7 Villava 강세와 악센트 / 8 Pamplona 종합.
내용은 assets/tramo-1-lessons.js. 채우기 문제에서 rr, ll 같은 두 글자 답은 a: ['rr'] 처럼 직접 적는다.

## 오늘의 걸음 (hoy/)
도장을 받은 과의 따라 말하기 낱말로 하루 다섯 개씩 듣고 쓰기. assets/hoy-core.js가 복습 일정을 정한다: 틀리면 다음 날, 한 번에 맞히면 2일, 4일, 8일 ... 간격으로 다시 나온다. 기록은 브라우저 localStorage의 buencamino:hoy:v1.

## 둘째 구간 (tramo-2/)
팜플로나에서 로그로뇨까지: 1 Cizur Menor 인사 / 2 Alto del Perdón 이름 / 3 Puente la Reina 출신 / 4 Cirauqui 숫자 0~10 / 5 Estella 숫자 11~100 / 6 Irache 가격 / 7 Los Arcos 주문과 계산 / 8 Logroño 숙소 체크인.
내용은 assets/tramo-2-lessons.js (LESSONS2). 수업 엔진은 assets/lesson.js 하나로 모든 구간이 함께 쓰고, 각 구간 index.html의 TRAMO_CFG가 구간 정보를 넘긴다.
둘째 구간부터는 듣기 단계가 문장 목록(phrases), 고르기는 뜻 고르기, 네 번째 단계는 낱말을 순서대로 눌러 문장 만들기(build).

## 셋째 구간 (tramo-3/)
로그로뇨에서 부르고스까지: 1 Navarrete 색깔 / 2 Nájera 순례자 메뉴 / 3 Azofra 좋아하는 것 말하기(gustar) / 4 Santo Domingo de la Calzada 바에서 타파스와 핀초스 / 5 Grañón 아침 식사와 음료 / 6 Belorado 시장에서 / 7 San Juan de Ortega 먹을 수 있는 것과 없는 것 / 8 Burgos 종합: 순례자들과 저녁 식사.
내용은 assets/tramo-3-lessons.js (LESSONS3). 색깔 과는 units에 c(색상 코드), 레슨에 colors 목록을 두면 카드와 고르기 보기가 색 동그라미로 나온다.
숫자는 둘째 구간 4과(0~10), 5과(11~100), 6과(가격)에 있다.

## 넷째 구간 (tramo-4/)
메세타, 부르고스에서 레온까지: 1 Hornillos del Camino 길 묻기 / 2 Hontanas 거리와 걸리는 시간 / 3 Castrojeriz 시간 말하기 / 4 Boadilla del Camino 여는 시간과 닫는 시간 / 5 Frómista 날씨 / 6 Carrión de los Condes 몸 상태와 기분 / 7 Sahagún 약국에서 / 8 León 종합: 도시에 도착하기.
내용은 assets/tramo-4-lessons.js (LESSONS4).

## 다섯째 구간 (tramo-5/)
레온에서 폰페라다까지: 1 La Virgen del Camino 침대 예약 / 2 Hospital de Órbigo 샤워, 빨래, 와이파이 / 3 Astorga 문제 해결 / 4 Rabanal del Camino 잃어버린 물건 / 5 Foncebadón 오늘 한 일(he + ado/ido) / 6 Cruz de Ferro 왜 걷는지(por, para) / 7 Molinaseca 내일 계획(ir a) / 8 Ponferrada 종합.
내용은 assets/tramo-5-lessons.js (LESSONS5).
새 구간을 만들면 assets/hoy-core.js와 assets/record.js의 sets 목록에 한 줄, record/index.html·hoy/index.html·index.html에 스크립트 두 줄을 더한다.

## 여섯째 구간 (tramo-6/)
폰페라다에서 사리아까지: 1 Cacabelos 옷 사기 / 2 Villafranca del Bierzo 비교하기 / 3 Las Herrerías 선물 사기 / 4 O Cebreiro 갈리시아의 두 언어 / 5 Triacastela 길 고르기 / 6 Samos 감탄하기 / 7 Aguiada 계산하기 / 8 Sarria 종합.

## 일곱째 구간 (tramo-7/)
사리아에서 산티아고까지: 1 Portomarín 마음속 기분 / 2 Palas de Rei 바람과 요일 / 3 Melide 어제 한 일 / 4 Arzúa 친구 묘사하기 / 5 O Pedrouzo 이야기하기 / 6 Monte do Gozo 작별 / 7 Santiago 도착과 축하 / 8 Fisterra 종합: 나의 순례 이야기.

## 부록: 스페인 기차 여행 (tren/)
내용은 assets/tramo-8-data.js, tramo-8-lessons.js (TRAMO8, LESSONS8, 도장 번호 8). 도시마다 세 과: 1~3 Madrid, 4~6 Toledo, 7~9 Sevilla, 10~12 Granada, 13~15 Valencia.

## 녹음실 (record/)
만드는 사람용 도구. 사이트 메뉴에는 없고 주소로만 들어간다 (…/record/). 사이트의 모든 스페인어 소리(구간별 카드, 문장, 따라 말하기 등)를 순서대로 보여 주고, 마이크 녹음이나 Gemini TTS로 채운다.
녹음은 브라우저 IndexedDB(buencamino-rec)에 저장, API 키는 이 브라우저 localStorage에만 저장된다.
zip을 저장소 맨 위에 풀면 assets/audio/es/*.mp3 와 assets/audio/manifest.js 가 바뀌고, 사이트는 녹음이 있는 말은 녹음으로, 없는 말은 기기 음성으로 재생한다.
mp3 변환은 assets/vendor/lame.min.js(lamejs, LGPL), zip은 assets/vendor/jszip.min.js(MIT).
