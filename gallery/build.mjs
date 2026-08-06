/**
 * Builds the version-gallery page: the prototype opens directly (Round 2 by
 * default) with a version dropdown in the top bar, grouped by round.
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
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const VERSIONS = [
	{
		id: 'round2',
		label: 'Round 2 — Working version',
		section: 'Round 2',
		branch: 'round2',
	},
	{
		id: 'current',
		label: 'Current flow',
		section: 'Round One',
		branch: 'claude/kiki-booking-flow-redesign-e0rhj6',
	},
	{
		id: 'option1',
		label: 'Option 1 — UX polish',
		section: 'Round One',
		branch: 'booking-flow-edits',
	},
	{
		id: 'option2',
		label: 'Option 2 — Restructured',
		section: 'Round One',
		branch: 'booking-flow-bigger-ideas',
	},
	{
		id: 'option3',
		label: 'Option 3 — Review-centric',
		section: 'Round One',
		branch: 'booking-flow-airbnb-style',
	},
];

const SECTIONS = ['Round 2', 'Round One'];
const DEFAULT_VERSION = 'round2';

const readBranchDist = (branch) =>
	execSync(`git show ${branch}:dist/index.html`, {
		cwd: root,
		maxBuffer: 64 * 1024 * 1024,
	}).toString('utf8');

const payload = {};
for (const v of VERSIONS) {
	const html = readBranchDist(v.branch);
	payload[v.id] = Buffer.from(html, 'utf8').toString('base64');
	console.log(`${v.id}: ${v.branch} (${(html.length / 1024).toFixed(0)} kB)`);
}

const options = SECTIONS.map(
	(s) => `<optgroup label="${s}">
${VERSIONS.filter((v) => v.section === s)
	.map(
		(v) =>
			`<option value="${v.id}"${v.id === DEFAULT_VERSION ? ' selected' : ''}>${v.label}</option>`,
	)
	.join('\n')}
</optgroup>`,
).join('\n');

const body = `
<style>
:root {
	--primary: #20a598;
	--primary-dark: #157a70;
	--ink: #1f2937;
	--muted: #6e7675;
	--line: #e3e6e4;
	--card: #ffffff;
	--ground: #f2f5f4;
	--frame: #b3b6ba;
}
@media (prefers-color-scheme: dark) {
	:root {
		--ink: #edf1ef;
		--muted: #9aa5a1;
		--line: #313634;
		--card: #222624;
		--ground: #181b1a;
		--frame: #101211;
	}
}
:root[data-theme='dark'] {
	--ink: #edf1ef;
	--muted: #9aa5a1;
	--line: #313634;
	--card: #222624;
	--ground: #181b1a;
	--frame: #101211;
}
:root[data-theme='light'] {
	--ink: #1f2937;
	--muted: #6e7675;
	--line: #e3e6e4;
	--card: #ffffff;
	--ground: #f2f5f4;
	--frame: #b3b6ba;
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

.bar {
	display: flex; align-items: center; gap: 12px;
	padding: 10px 16px; background: var(--card);
	border-bottom: 1px solid var(--line); flex-shrink: 0; flex-wrap: wrap;
}
.brand { display: flex; align-items: center; gap: 9px; }
.brand-dot {
	width: 28px; height: 28px; border-radius: 50%;
	background: var(--primary); color: #fff;
	display: flex; align-items: center; justify-content: center;
	font-weight: 800; font-size: 14px;
}
.brand-name { font-size: 15px; font-weight: 700; white-space: nowrap; }
.version-select {
	margin-left: auto;
	font-family: inherit; font-size: 14px; font-weight: 600;
	color: var(--ink); background: var(--card);
	border: 1.5px solid var(--line); border-radius: 10px;
	padding: 8px 12px; cursor: pointer;
	max-width: min(320px, 60vw);
}
.version-select:hover { border-color: var(--primary); }
.version-select:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }

.frame-wrap {
	flex: 1; min-height: 0;
	display: flex; justify-content: center;
	background: var(--frame);
}
.frame-wrap iframe {
	width: 100%; max-width: 470px; height: 100%;
	border: none; display: block; background: #e7e9ec;
}
</style>

<div id="gallery-root">
	<div class="bar">
		<span class="brand"><span class="brand-dot">K</span><span class="brand-name">Kiki booking flow</span></span>
		<select class="version-select" id="versionSelect" aria-label="Prototype version">
${options}
		</select>
	</div>
	<div class="frame-wrap"><iframe id="frame" title="Prototype"></iframe></div>
</div>

<script id="v-data" type="application/json">${JSON.stringify(payload)}</script>
<script>
(function () {
	var data = JSON.parse(document.getElementById('v-data').textContent);
	var frame = document.getElementById('frame');
	var select = document.getElementById('versionSelect');

	function decode(b64) {
		var bytes = Uint8Array.from(atob(b64), function (c) { return c.charCodeAt(0); });
		return new TextDecoder().decode(bytes);
	}

	function open(id) {
		if (!data[id]) return;
		frame.srcdoc = decode(data[id]); // fresh document each switch — flow restarts
	}

	select.addEventListener('change', function () { open(select.value); });
	open(select.value);
})();
</script>
`;

writeFileSync(
	join(root, 'gallery/artifact.html'),
	'<title>Kiki — Booking Flow Prototypes</title>\n' + body,
);
writeFileSync(
	join(root, 'gallery/index.html'),
	'<!doctype html>\n<html lang="en">\n<head>\n<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n<title>Kiki — Booking Flow Prototypes</title>\n</head>\n<body>' +
		body +
		'</body>\n</html>\n',
);
console.log('gallery/index.html + gallery/artifact.html written');
