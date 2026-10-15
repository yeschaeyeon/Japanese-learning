# 일본어 회화 노트

## 배포 (Vercel)
1. 이 폴더 전체를 GitHub 비공개(Private) 저장소에 올리기
2. vercel.com → Add New Project → 저장소 선택
3. Environment Variables에 추가
   - ANTHROPIC_API_KEY : console.anthropic.com에서 발급한 키
   - ACCESS_CODE : 나만 아는 접근 코드 (사이트 처음 열 때 입력)
   - CLAUDE_MODEL : (선택) 기본값은 claude-haiku-5-5
4. Deploy → 주소를 홈 화면에 추가
