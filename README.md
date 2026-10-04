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
