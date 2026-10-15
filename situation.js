const { checkAccess, callClaude } = require('./_lib');
const { SITUATION_PROMPT } = require('./_prompts');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!checkAccess(req, res)) return;
  try {
    const { situation, level = '초급', style = '존댓말' } = req.body || {};
    const s = String(situation || '').trim().slice(0, 100);
    if (!s) return res.status(400).json({ error: '상황이 비었어요' });

    const system = SITUATION_PROMPT
      .replace('{level}', level === '중급' ? '중급' : '초급')
      .replace('{style}', style === '반말' ? '반말' : '존댓말');

    const data = await callClaude({
      system,
      messages: [{ role: 'user', content: s }],
      max_tokens: 3000,
    });
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
