const { checkAccess, callClaude } = require('./_lib');
const { CHAT_PROMPT } = require('./_prompts');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!checkAccess(req, res)) return;
  try {
    const { text, history = [], level = '초급', style = '존댓말' } = req.body || {};
    const input = String(text || '').trim().slice(0, 500);
    if (!input) return res.status(400).json({ error: '내용이 비었어요' });

    const system = CHAT_PROMPT
      .replace('{level}', level === '중급' ? '중급' : '초급')
      .replace('{style}', style === '반말' ? '반말' : '존댓말');

    // 최근 10턴만 보냄. 사용자 말 + (교정문, 답장)만 요약해서 토큰 절약
    const messages = [];
    for (const h of history.slice(-10)) {
      if (!h?.u || !h?.a) continue;
      messages.push({ role: 'user', content: String(h.u).slice(0, 500) });
      messages.push({ role: 'assistant', content: JSON.stringify(h.a).slice(0, 1500) });
    }
    messages.push({ role: 'user', content: input });

    const turn = await callClaude({ system, messages, max_tokens: 2000 });
    res.status(200).json(turn);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
