const { checkAccess, callClaude } = require('./_lib');
const { SEARCH_PROMPT } = require('./_prompts');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!checkAccess(req, res)) return;
  try {
    const q = String(req.body?.query || '').trim().slice(0, 200);
    if (!q) return res.status(400).json({ error: '검색어가 비었어요' });
    const card = await callClaude({
      system: SEARCH_PROMPT,
      messages: [{ role: 'user', content: q }],
    });
    res.status(200).json(card);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
