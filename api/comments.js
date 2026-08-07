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
	const bodyText = await r.text();
	if (!r.ok) throw new Error('kv HTTP ' + r.status + ': ' + bodyText.slice(0, 180));
	return JSON.parse(bodyText).result;
}

const load = async () => JSON.parse((await redis(['GET', KEY])) || '[]');
const save = (list) => redis(['SET', KEY, JSON.stringify(list)]);

module.exports = async (req, res) => {
	if (!kvConfig()) {
		res.status(503).json({ error: 'store-not-configured' });
		return;
	}
	// GET /api/comments?debug=1 — reports which env vars are present, the
	// store host, and the result of a PING, so misconfig is visible without
	// dashboard access. No secrets in the output.
	if (req.method === 'GET' && req.query && req.query.debug) {
		const info = {
			env: {
				KV_REST_API_URL: !!process.env.KV_REST_API_URL,
				KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
				UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
				UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
			},
			host: (() => {
				try { return new URL(kvConfig().url).host; } catch (e) { return 'unparseable: ' + kvConfig().url.slice(0, 30); }
			})(),
		};
		try {
			info.ping = await redis(['PING']);
		} catch (e) {
			info.pingError = String(e.message).slice(0, 250);
		}
		res.status(200).json(info);
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
		res.status(500).json({ error: 'kv-error', detail: String(e.message).slice(0, 250) });
	}
};
