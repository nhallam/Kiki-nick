/**
 * Shared comment store for the prototype gallery (/api/comments).
 *
 * Backed by a Redis-compatible KV over REST. Provision one from the Vercel
 * dashboard (Storage → Create Database → Upstash for Redis) and connect it
 * to this project — the env vars below are injected automatically. Until
 * then this returns 503 and the gallery falls back to per-browser storage.
 */
const KEY = 'kiki-flow-comments';

function kvConfig() {
	const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
	const token =
		process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
	return url && token ? { url, token } : null;
}

async function redis(cmd) {
	const kv = kvConfig();
	const r = await fetch(kv.url, {
		method: 'POST',
		headers: {
			Authorization: 'Bearer ' + kv.token,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(cmd),
	});
	if (!r.ok) throw new Error('kv ' + r.status);
	return (await r.json()).result;
}

const load = async () => JSON.parse((await redis(['GET', KEY])) || '[]');
const save = (list) => redis(['SET', KEY, JSON.stringify(list)]);

module.exports = async (req, res) => {
	if (!kvConfig()) {
		res.status(503).json({ error: 'store-not-configured' });
		return;
	}
	try {
		if (req.method === 'GET') {
			res.status(200).json(await load());
			return;
		}
		if (req.method === 'POST') {
			const c = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
			if (
				!c ||
				typeof c.text !== 'string' ||
				!c.text.trim() ||
				typeof c.version !== 'string'
			) {
				res.status(400).json({ error: 'bad-comment' });
				return;
			}
			const clean = {
				id: String(c.id || 'c' + Date.now()).slice(0, 40),
				version: String(c.version).slice(0, 40),
				screen: String(c.screen || 'General').slice(0, 80),
				text: String(c.text).slice(0, 2000),
				author: String(c.author || '').slice(0, 60),
				ts: Number(c.ts) || Date.now(),
			};
			if (typeof c.x === 'number' && typeof c.y === 'number') {
				clean.x = Math.min(100, Math.max(0, c.x));
				clean.y = Math.min(100, Math.max(0, c.y));
			}
			const all = await load();
			all.push(clean);
			await save(all);
			res.status(200).json({ ok: true });
			return;
		}
		if (req.method === 'DELETE') {
			const id = (req.query && req.query.id) || '';
			await save((await load()).filter((c) => c.id !== id));
			res.status(200).json({ ok: true });
			return;
		}
		res.status(405).json({ error: 'method-not-allowed' });
	} catch (e) {
		res.status(500).json({ error: 'kv-error' });
	}
};
