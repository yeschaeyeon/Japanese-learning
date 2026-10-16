// 기기 간 동기화: 저장한 카드 / 대화 기록 / 설정을 무료 Redis(Upstash)에 보관해요.
// 환경변수(Vercel에서 Upstash Redis를 프로젝트에 연결하면 자동으로 생겨요):
//   KV_REST_API_URL, KV_REST_API_TOKEN  (또는 UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)

const { checkAccess } = require('./_lib');

const KEY = 'jpnote:v1';
const MAX_BYTES = 900000;

function conf() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redis(cmd) {
  const c = conf();
  const r = await fetch(c.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${c.token}`, 'content-type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || '저장소 오류');
  return j.result;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!checkAccess(req, res)) return;
  if (!conf()) return res.status(501).json({ error: 'not_configured' });
  try {
    const { action, data } = req.body || {};
    if (action === 'get') {
      const v = await redis(['GET', KEY]);
      return res.status(200).json({ data: v ? JSON.parse(v) : null });
    }
    if (action === 'put') {
      const s = JSON.stringify(data || {});
      if (s.length > MAX_BYTES) return res.status(413).json({ error: 'too_large' });
      await redis(['SET', KEY, s]);
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'bad action' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
