// 공통 함수: 접근 코드 확인 + Gemini API 호출 + JSON 정리
// 환경변수: GEMINI_API_KEY (필수), ACCESS_CODE (필수), GEMINI_MODEL (선택)

// 접근 코드 확인 기능 없음: 항상 통과
function checkAccess(req, res) {
  return true;
}

function parseJson(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const s = cleaned.indexOf('{');
  const e = cleaned.lastIndexOf('}');
  if (s === -1 || e === -1) throw new Error('AI 답변을 해석하지 못했어요. 다시 시도해 주세요.');
  return JSON.parse(cleaned.slice(s, e + 1));
}

// 무료 구간에서 쓸 수 있는 모델을 순서대로 시도해요. 앞 모델이 한도/오류면 다음 모델로 넘어가요.
function modelList() {
  const list = [process.env.GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-3.5-flash-lite'].filter(Boolean);
  return [...new Set(list)];
}

async function callAI({ system, messages, max_tokens = 3000 }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('서버에 GEMINI_API_KEY가 설정되지 않았어요.');

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  let lastStatus = 0;
  let lastMsg = 'AI 오류가 났어요.';
  for (const model of modelList()) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: max_tokens, temperature: 0.4 },
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) {
      const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
      if (text) return parseJson(text);
      lastMsg = 'AI가 빈 답변을 보냈어요. 다시 시도해 주세요.';
      continue;
    }
    lastStatus = r.status;
    lastMsg = data?.error?.message || lastMsg;
    // 한도 초과(429), 서버 문제(5xx), 모델 없음(404)이면 다음 모델로, 그 외(키 오류 등)는 바로 멈춰요.
    if (r.status === 429 || r.status >= 500 || r.status === 404) continue;
    break;
  }
  if (lastStatus === 429) throw new Error('무료 사용량을 다 썼어요. 잠시 뒤(또는 내일) 다시 해보세요.');
  if (lastStatus === 400 || lastStatus === 403) throw new Error('Gemini 키가 올바르지 않은 것 같아요. Vercel 환경변수 GEMINI_API_KEY를 확인해 주세요.');
  throw new Error(lastMsg);
}

module.exports = { checkAccess, callAI };
