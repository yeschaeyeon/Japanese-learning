# 일본어 회화 노트

- 고정 데이터(무료, 서버 불필요): 상황별 회화 12개, 문법 29개, 단어 70여 개, 가타카나, 발음 듣기, 저장
- AI(Gemini 무료 구간): 대화 교정, 데이터에 없는 검색, ✨ 상황별 회화

## Vercel 환경변수
- GEMINI_API_KEY : aistudio.google.com/apikey 에서 발급한 키
- ACCESS_CODE    : 나만 아는 접근 코드 (AI 기능을 처음 쓸 때 입력)
- GEMINI_MODEL   : (선택) 기본값 gemini-3.8-flash, 한도 초과 시 gemini-3.5-flash-lite로 자동 전환

## 파일 구조
index.html, fonts.css, kana.js, data-*.js, *.woff2 는 저장소 맨 위에,
_lib.js, _prompts.js, chat.js, search.js, situation.js 는 api 폴더 안에 둬요.
