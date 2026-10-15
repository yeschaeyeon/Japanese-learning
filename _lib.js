// 공통 함수: 접근 코드 확인 + Claude API 호출 + JSON 정리

function checkAccess(req, res) {
  const code = process.env.ACCESS_CODE;
  if (!code || req.headers['x-access-code'] !== code) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}

function parseJson(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const s = cleaned.indexOf('{');
  const e = cleaned.lastIndexOf('}');
  if (s === -1 || e === -1) throw new Error('JSON을 찾지 못했어요');
  return JSON.parse(cleaned.slice(s, e + 1));
}

async function callClaude({ system, messages, max_tokens = 1800 }) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || 'claude-haiku-5-5',
      max_tokens,
      system,
      messages,
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || 'Claude API 오류');
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  return parseJson(text);
}

module.exports = { checkAccess, callClaude };
