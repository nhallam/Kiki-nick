/**
 * Builds the version-gallery page: a launcher that opens any prototype
 * version in an isolated iframe, with a persistent "All versions" bar to
 * return to the start.
 *
 * Each version's single-file build is read from its git branch (they're
 * committed), base64-embedded, and decoded into iframe srcdoc at runtime —
 * so one page carries every version with zero cross-contamination.
 *
 * Usage: node gallery/build.mjs
 * Output: gallery/index.html (standalone) and gallery/artifact.html
 * (body-only fragment for publishing as a Claude artifact).
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const VERSIONS = [
	{
		id: 'round2',
		label: 'Round 2 — Working version',
		section: 'Round 2',
		blurb:
			'Moving forward with Option 3 after client review. All Round 2 changes land here.',
		branch: 'round2',
	},
	{
		id: 'current',
		label: 'Current flow',
		section: 'Round 1',
		blurb: 'Faithful rebuild of the live app — 4 steps, exactly as shipped.',
		branch: 'claude/kiki-booking-flow-redesign-e0rhj6',
	},
	{
		id: 'option1',
		label: 'Option 1',
		section: 'Round 1',
		blurb:
			'Best-practice polish: live price preview, "Select all" tip, character counter, pre-send recap, leave guard.',
		branch: 'booking-flow-edits',
	},
	{
		id: 'option2',
		label: 'Option 2',
		section: 'Round 1',
		blurb:
			'Restructured: dates & payments merged into one step (3-step flow), availability chip, intro prompt chips, 45+ day split payments.',
		branch: 'booking-flow-bigger-ideas',
	},
	{
		id: 'option3',
		label: 'Option 3',
		section: 'Round 1',
		blurb:
			'Review-centric (Airbnb-style): one "Review and request" hub with Change buttons opening dates/guests editor sheets, price details expander, trust line — no wizard. Chosen by the client as the Round 2 direction.',
		branch: 'booking-flow-airbnb-style',
	},
];

const SECTIONS = [
	{
		title: 'Round 1',
		note: 'The exploration that led to the decision, kept for reference.',
	},
	{
		title: 'Round 2',
		note: 'The active direction — client feedback gets applied here.',
		default: true,
	},
];

const readBranchDist = (branch) =>
	execSync(`git show ${branch}:dist/index.html`, {
		cwd: root,
		maxBuffer: 64 * 1024 * 1024,
	}).toString('utf8');

const payload = {};
for (const v of VERSIONS) {
	if (!v.branch) continue;
	const html = readBranchDist(v.branch);
	payload[v.id] = Buffer.from(html, 'utf8').toString('base64');
	console.log(`${v.id}: ${v.branch} (${(html.length / 1024).toFixed(0)} kB)`);
}

const cardFor = (v) =>
	v.branch
		? `<button class="card" data-version="${v.id}">
				<span class="card-head"><span class="card-label">${v.label}</span><span class="card-go">Open →</span></span>
				<span class="card-blurb">${v.blurb}</span>
				<span class="card-branch">${v.branch}</span>
			</button>`
		: `<div class="card placeholder">
				<span class="card-head"><span class="card-label">${v.label}</span><span class="card-soon">Coming soon</span></span>
				<span class="card-blurb">${v.blurb}</span>
			</div>`;

// One block per round; the round dropdown toggles which block is visible.
const cards = SECTIONS.map(
	(s) => `<div class="section-block" data-section="${s.title}"${s.default ? '' : ' hidden'}>
			<div class="section-note">${s.note}</div>
${VERSIONS.filter((v) => v.section === s.title)
	.map(cardFor)
	.join('\n')}
		</div>`,
).join('\n');

const roundTabs = SECTIONS.map(
	(s) =>
		`<button class="round-tab${s.default ? ' active' : ''}" data-round="${s.title}">${s.title}</button>`,
).join('\n');

const chips = VERSIONS.filter((v) => v.branch)
	.map(
		(v) =>
			`<button class="bar-chip" data-version="${v.id}">${
				v.id === 'round2' ? 'Round 2' : v.label
			}</button>`,
	)
	.join('');

const labels = JSON.stringify(
	Object.fromEntries(VERSIONS.map((v) => [v.id, v.label])),
);

const body = `
<style>
:root {
	--primary: #20a598;
	--primary-dark: #157a70;
	--tint: #e1fbf8;
	--ink: #1f2937;
	--muted: #6e7675;
	--line: #e3e6e4;
	--card: #ffffff;
	--ground: #f2f5f4;
}
@media (prefers-color-scheme: dark) {
	:root {
		--tint: rgba(32, 165, 152, 0.16);
		--ink: #edf1ef;
		--muted: #9aa5a1;
		--line: #313634;
		--card: #222624;
		--ground: #181b1a;
	}
}
:root[data-theme='dark'] {
	--tint: rgba(32, 165, 152, 0.16);
	--ink: #edf1ef;
	--muted: #9aa5a1;
	--line: #313634;
	--card: #222624;
	--ground: #181b1a;
}
:root[data-theme='light'] {
	--tint: #e1fbf8;
	--ink: #1f2937;
	--muted: #6e7675;
	--line: #e3e6e4;
	--card: #ffffff;
	--ground: #f2f5f4;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; }
body {
	font-family: 'Inter', -apple-system, 'Segoe UI', 'Helvetica Neue', sans-serif;
	background: var(--ground);
	color: var(--ink);
	-webkit-font-smoothing: antialiased;
}
#gallery-root { height: 100vh; height: 100dvh; display: flex; flex-direction: column; }

/* launcher */
.launcher {
	flex: 1; display: flex; flex-direction: column;
	align-items: center; justify-content: flex-start;
	padding: 48px 20px 32px; gap: 0;
	overflow-y: auto;
}
.brand {
	display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
}
.brand-dot {
	width: 34px; height: 34px; border-radius: 50%;
	background: var(--primary); color: #fff;
	display: flex; align-items: center; justify-content: center;
	font-weight: 800; font-size: 17px;
}
.brand h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.01em; }
.launcher .sub {
	font-size: 15px; color: var(--muted); margin-bottom: 28px; text-align: center;
	max-width: 420px; line-height: 22px;
}
.round-tabs {
	display: inline-flex;
	background: var(--card);
	border: 1.5px solid var(--line);
	border-radius: 24px;
	padding: 4px;
	gap: 4px;
	margin-bottom: 20px;
}
.round-tab {
	font-family: inherit; font-size: 14.5px; font-weight: 700;
	color: var(--muted); background: none; border: none;
	border-radius: 19px; padding: 9px 20px; cursor: pointer;
	transition: background 0.15s, color 0.15s;
}
.round-tab:hover { color: var(--ink); }
.round-tab.active { background: var(--primary); color: #fff; }
.round-tab:focus { outline: none; }
.round-tab:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; }
.cards { display: flex; flex-direction: column; gap: 26px; width: min(440px, 100%); }
.section-block { display: flex; flex-direction: column; gap: 12px; }
.section-block[hidden] { display: none; }
.section-note { font-size: 13px; color: var(--muted); margin: -2px 0 2px; }
.card {
	display: flex; flex-direction: column; gap: 6px; text-align: left;
	background: var(--card); border: 1px solid var(--line); border-radius: 14px;
	padding: 16px 18px; cursor: pointer; font-family: inherit; color: inherit;
	transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
}
button.card:hover {
	border-color: var(--primary); transform: translateY(-1px);
	box-shadow: 0 6px 18px rgba(32, 165, 152, 0.12);
}
button.card:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.card-head { display: flex; align-items: center; justify-content: space-between; }
.card-label { font-size: 17px; font-weight: 700; }
.card-go { color: var(--primary); font-size: 14px; font-weight: 700; }
.card-soon {
	font-size: 12px; font-weight: 700; color: var(--muted);
	background: var(--ground); border-radius: 10px; padding: 4px 10px;
	text-transform: uppercase; letter-spacing: 0.04em;
}
.card-blurb { font-size: 13.5px; color: var(--muted); line-height: 20px; }
.card-branch { font-size: 11.5px; color: var(--muted); font-family: ui-monospace, monospace; opacity: 0.75; }
.card.placeholder { opacity: 0.65; }
.launcher .hint { margin-top: 24px; font-size: 13px; color: var(--muted); text-align: center; }

/* viewer */
.viewer { flex: 1; display: none; flex-direction: column; min-height: 0; }
.viewer.active { display: flex; }
.launcher.hidden { display: none; }
.bar {
	display: flex; align-items: center; gap: 10px;
	padding: 9px 14px; background: var(--card);
	border-bottom: 1px solid var(--line); flex-shrink: 0; flex-wrap: wrap;
}
.bar-back {
	display: flex; align-items: center; gap: 6px;
	font-family: inherit; font-size: 14px; font-weight: 700;
	color: var(--primary); background: var(--tint);
	border: none; border-radius: 18px; padding: 8px 14px; cursor: pointer;
}
.bar-title { font-size: 14px; font-weight: 600; flex: 1; }
.bar-chips { display: flex; gap: 6px; }
.bar-chip {
	font-family: inherit; font-size: 12.5px; font-weight: 600;
	color: var(--muted); background: none;
	border: 1px solid var(--line); border-radius: 14px;
	padding: 6px 11px; cursor: pointer;
}
.bar-chip.active { color: #fff; background: var(--primary); border-color: var(--primary); }
/* Keep the prototype at phone proportions on wide screens. */
.frame-wrap {
	flex: 1; min-height: 0;
	display: flex; justify-content: center;
	background: #b3b6ba;
}
.frame-wrap iframe {
	width: 100%; max-width: 470px; height: 100%;
	border: none; display: block; background: #e7e9ec;
}
@media (prefers-color-scheme: dark) { .frame-wrap { background: #101211; } }
:root[data-theme='dark'] .frame-wrap { background: #101211; }
:root[data-theme='light'] .frame-wrap { background: #b3b6ba; }
</style>

<div id="gallery-root">
	<div class="launcher" id="launcher">
		<div class="brand"><span class="brand-dot">K</span><h1>Kiki booking flow</h1></div>
		<p class="sub">Prototype versions of the booking request flow. Pick one to walk through it — everything is clickable.</p>
		<div class="round-tabs" role="tablist" aria-label="Round">
${roundTabs}
		</div>
		<div class="cards">
${cards}
		</div>
		<p class="hint">Use "All versions" at the top of any prototype to come back here.</p>
	</div>
	<div class="viewer" id="viewer">
		<div class="bar">
			<button class="bar-back" id="backBtn">← All versions</button>
			<span class="bar-title" id="barTitle"></span>
			<span class="bar-chips">${chips}</span>
		</div>
		<div class="frame-wrap"><iframe id="frame" title="Prototype"></iframe></div>
	</div>
</div>

<script id="v-data" type="application/json">${JSON.stringify(payload)}</script>
<script>
(function () {
	var data = JSON.parse(document.getElementById('v-data').textContent);
	var labels = ${labels};
	var launcher = document.getElementById('launcher');
	var viewer = document.getElementById('viewer');
	var frame = document.getElementById('frame');
	var barTitle = document.getElementById('barTitle');

	function decode(b64) {
		var bytes = Uint8Array.from(atob(b64), function (c) { return c.charCodeAt(0); });
		return new TextDecoder().decode(bytes);
	}

	document.querySelectorAll('.round-tab').forEach(function (tab) {
		tab.addEventListener('click', function () {
			tab.blur();
			document.querySelectorAll('.round-tab').forEach(function (t) {
				t.classList.toggle('active', t === tab);
			});
			document.querySelectorAll('.section-block').forEach(function (block) {
				block.hidden = block.dataset.section !== tab.dataset.round;
			});
		});
	});

	function open(id) {
		if (!data[id]) return;
		frame.srcdoc = decode(data[id]); // fresh document each open — flow restarts
		barTitle.textContent = labels[id];
		launcher.classList.add('hidden');
		viewer.classList.add('active');
		document.querySelectorAll('.bar-chip').forEach(function (c) {
			c.classList.toggle('active', c.dataset.version === id);
		});
	}

	function close() {
		frame.srcdoc = '';
		viewer.classList.remove('active');
		launcher.classList.remove('hidden');
	}

	document.querySelectorAll('[data-version]').forEach(function (el) {
		el.addEventListener('click', function () { open(el.dataset.version); });
	});
	document.getElementById('backBtn').addEventListener('click', close);
})();
</script>
`;

writeFileSync(
	join(root, 'gallery/artifact.html'),
	'<title>Kiki — Booking Flow Versions</title>\n' + body,
);
writeFileSync(
	join(root, 'gallery/index.html'),
	'<!doctype html>\n<html lang="en">\n<head>\n<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n<title>Kiki — Booking Flow Versions</title>\n</head>\n<body>' +
		body +
		'</body>\n</html>\n',
);
console.log('gallery/index.html + gallery/artifact.html written');
