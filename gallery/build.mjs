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
		label: '2.0',
		section: 'br-round2',
		blurb:
			'The first Round 2 build. 1.3 evolved through client feedback into a 3-page flow with a window stepper, centred guests and a host preview.',
		branch: 'round2',
	},
	{
		id: 'round2b',
		label: '2.1',
		section: 'br-round2',
		blurb:
			'Trimmed review card, compact window stepper, paired guest actions, simplified sent screen and the live Trips tabs.',
		branch: 'round2-option2',
	},
	{
		id: 'round2c',
		label: '2.2',
		section: 'br-round2',
		blurb:
			"Adds Nina's Flat: three date windows in a two-month span, one already requested. Plus the Staying/Hosting Trips split, an accessibility pass, and a calendar that fills the chosen window in.",
		branch: 'round2-v22',
	},
	{
		id: 'round2d',
		label: '2.3',
		section: 'br-round2',
		blurb:
			'Actions from the product review: amber pending state throughout, confirm page cut to the host preview, calendar legend.',
		branch: 'round2-v23',
	},
	{
		id: 'round2e',
		label: '2.4',
		section: 'br-round2',
		blurb:
			'The live working version, carrying on from 2.3. New changes land here.',
		branch: 'round2-v24',
	},
	{
		id: 'current',
		label: '1.0',
		section: 'br-round1',
		blurb: 'Faithful rebuild of the live app: 4 steps, exactly as shipped.',
		branch: 'claude/kiki-booking-flow-redesign-e0rhj6',
	},
	{
		id: 'option1',
		label: '1.1',
		section: 'br-round1',
		blurb:
			'Best-practice polish: live price preview, "Select all" tip, character counter, pre-send recap, leave guard.',
		branch: 'booking-flow-edits',
	},
	{
		id: 'option2',
		label: '1.2',
		section: 'br-round1',
		blurb:
			'Restructured: dates & payments merged into one step (3-step flow), availability chip, intro prompt chips, 45+ day split payments.',
		branch: 'booking-flow-bigger-ideas',
	},
	{
		id: 'match30',
		label: '3.0',
		section: 'mf-round3',
		blurb:
			'Guest and host side by side: Melissa books, Ryan hosts. Both phones are live and independent.',
		branch: 'matching-v30-base',
		wide: true,
	},
	{
		id: 'match31',
		label: '3.1',
		section: 'mf-round3',
		blurb:
			'Adds the Match screen: stay timeline with condition photos, host instructions, contacts — plus real profile photos.',
		branch: 'matching-v31',
		wide: true,
	},
	{
		id: 'option3',
		label: '1.3',
		section: 'br-round1',
		blurb:
			'Review-centric (Airbnb-style): one "Review and request" hub with Change buttons opening dates/guests editor sheets, price details expander and trust line, no wizard. Chosen by the client as the Round 2 direction.',
		branch: 'booking-flow-airbnb-style',
	},
];

const FEATURES = [
	{ key: 'booking', title: 'Booking Request Flow' },
	{ key: 'matches', title: 'Matches flow' },
	{ key: 'notifications', title: 'Notifications' },
	{ key: 'appnav', title: 'App Navigation and IA' },
	{ key: 'listingflow', title: 'Listing flow (and profile tab)' },
	{ key: 'explore', title: 'Explore Tab & Map' },
	{ key: 'ratings', title: 'Ratings and reviews' },
	{ key: 'messaging', title: 'Messaging' },
	{ key: 'listingdetail', title: 'Listing Detail Page' },
];

const SECTIONS = [
	{
		key: 'br-round1',
		feature: 'booking',
		title: 'Round 1',
		note: 'The exploration that led to the decision, kept for reference.',
	},
	{
		key: 'br-round2',
		feature: 'booking',
		title: 'Round 2',
		note: 'The active direction. Client feedback gets applied here.',
		default: true,
	},
	{
		key: 'mf-round3',
		feature: 'matches',
		title: 'Round 3',
		note: 'Version numbers run on from the booking-request rounds, so this round is 3.',
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
	if (!v.branch || v.alias) continue; // aliases reuse another id's payload
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

// Home screen: one row per feature, stacked vertically.
const versionCount = (f) =>
	VERSIONS.filter(
		(v) =>
			v.branch && SECTIONS.some((s) => s.key === v.section && s.feature === f.key),
	).length;

const featureRows = FEATURES.map((f) => {
	const n = versionCount(f);
	const meta = n
		? `<span class="row-count">${n} ${n === 1 ? 'prototype' : 'prototypes'}</span>`
		: `<span class="row-soon">Soon</span>`;
	return `<button class="feature-row" data-feature="${f.key}">
		<span class="row-title">${f.title}</span>
		${meta}
		<span class="row-chev">\u203a</span>
	</button>`;
}).join('\n');

// One page per feature: round tabs (when there are 2+ rounds), then the
// version cards for the active round. Empty features get a placeholder.
const featurePages = FEATURES.map((f) => {
	const secs = SECTIONS.filter((s) => s.feature === f.key);
	let inner;
	if (secs.length === 0) {
		inner = `<div class="empty-note">No prototypes yet. Work on this area lands here.</div>`;
	} else {
		const tabs =
			secs.length > 1
				? `<div class="round-tabs" role="tablist" aria-label="${f.title} rounds">\n${secs
						.map(
							(sec) =>
								`<button class="round-tab${sec.default ? ' active' : ''}" data-round="${sec.key}">${sec.title}</button>`,
						)
						.join('\n')}\n</div>`
				: '';
		const blocks = secs
			.map(
				(sec) => `<div class="section-block" data-section="${sec.key}"${sec.default ? '' : ' hidden'}>
			<div class="section-note">${sec.note}</div>
${VERSIONS.filter((v) => v.section === sec.key)
	.map(cardFor)
	.join('\n')}
		</div>`,
			)
			.join('\n');
		inner = `${tabs}\n<div class="cards">\n${blocks}\n</div>`;
	}
	return `<div class="feature-page" data-feature="${f.key}" hidden>
		<button class="feature-back">\u2190 All features</button>
		<h2 class="feature-title">${f.title}</h2>
${inner}
	</div>`;
}).join('\n');

const featuresById = JSON.stringify(
	Object.fromEntries(
		VERSIONS.map((v) => {
			const sec = SECTIONS.find((s) => s.key === v.section);
			return [v.id, FEATURES.find((f) => f.key === sec.feature).title];
		}),
	),
);

const aliases = JSON.stringify(
	Object.fromEntries(VERSIONS.filter((v) => v.alias).map((v) => [v.id, v.alias])),
);

// version id → feature key, for hash routes like #booking/round2e
const featureKeysById = JSON.stringify(
	Object.fromEntries(
		VERSIONS.map((v) => [
			v.id,
			SECTIONS.find((s) => s.key === v.section).feature,
		]),
	),
);

const wides = JSON.stringify(
	Object.fromEntries(VERSIONS.filter((v) => v.wide).map((v) => [v.id, 1])),
);

const chips = VERSIONS.filter((v) => v.branch)
	.map(
		(v) =>
			`<button class="bar-chip" data-version="${v.id}" data-section="${v.section}">${v.label}</button>`,
	)
	.join('');

const sectionsById = JSON.stringify(
	Object.fromEntries(VERSIONS.map((v) => [v.id, v.section])),
);

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
.home { display: flex; flex-direction: column; align-items: center; width: 100%; }
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
/* home: stacked feature list */
.feature-list { display: flex; flex-direction: column; gap: 10px; width: min(440px, 100%); }
.feature-row {
	display: flex; align-items: center; gap: 10px; text-align: left;
	background: var(--card); border: 1px solid var(--line); border-radius: 14px;
	padding: 16px 18px; cursor: pointer; font-family: inherit; color: inherit;
	transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
}
.feature-row:hover {
	border-color: var(--primary); transform: translateY(-1px);
	box-shadow: 0 6px 18px rgba(32, 165, 152, 0.12);
}
.feature-row:focus { outline: none; }
.feature-row:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.row-title { flex: 1; font-size: 15.5px; font-weight: 700; min-width: 0; }
.row-count { font-size: 12.5px; font-weight: 700; color: var(--primary-dark); background: var(--tint); border-radius: 11px; padding: 4px 10px; white-space: nowrap; }
.row-soon { font-size: 11.5px; font-weight: 700; color: var(--muted); background: var(--ground); border: 1px solid var(--line); border-radius: 11px; padding: 4px 10px; text-transform: uppercase; letter-spacing: 0.04em; }
.row-chev { color: var(--muted); font-size: 20px; line-height: 1; }

/* feature pages */
.feature-page { display: flex; flex-direction: column; width: min(440px, 100%); }
.feature-page[hidden] { display: none; }
.feature-back {
	align-self: flex-start;
	font-family: inherit; font-size: 13.5px; font-weight: 700;
	color: var(--primary-dark); background: var(--tint);
	border: none; border-radius: 16px; padding: 8px 14px; cursor: pointer;
	margin-bottom: 16px;
}
.feature-title { font-size: 21px; font-weight: 800; letter-spacing: -0.01em; margin-bottom: 12px; }
.empty-note {
	background: var(--card); border: 1px dashed var(--line); border-radius: 14px;
	padding: 22px 18px; font-size: 13.5px; color: var(--muted); text-align: center;
}
.home[hidden] { display: none; }
.round-tabs {
	display: inline-flex;
	gap: 2px;
	margin-bottom: 14px;
}
.round-tabs[hidden] { display: none; }
.round-tab {
	font-family: inherit; font-size: 13.5px; font-weight: 700;
	color: var(--muted); background: none; border: none;
	border-radius: 15px; padding: 7px 15px; cursor: pointer;
	transition: background 0.15s, color 0.15s;
}
.round-tab:hover { color: var(--ink); }
.round-tab.active { background: var(--tint); color: var(--primary-dark); }
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
.viewer-main {
	flex: 1; min-height: 0;
	display: flex;
	background: var(--ground);
}
.frame-col { flex: 1; min-width: 0; display: flex; justify-content: center; }
.phone-stage { position: relative; width: 100%; max-width: 470px; height: 100%; }
.phone-stage.wide { max-width: 1040px; }
.phone-stage iframe {
	width: 100%; height: 100%;
	border: none; display: block; background: #e7e9ec;
}


</style>

<div id="gallery-root">
	<div class="launcher" id="launcher">
		<div class="home" id="home">
			<div class="brand"><span class="brand-dot">K</span><h1>Kiki prototypes</h1></div>
			<p class="sub">Pick a feature area, then a prototype version to walk through. Everything is clickable.</p>
			<div class="feature-list">
${featureRows}
			</div>
		</div>
${featurePages}
		<p class="hint">Use "Back" at the top of any prototype to come back here.</p>
	</div>
	<div class="viewer" id="viewer">
		<div class="bar">
		<button class="bar-back" id="backBtn">← Back</button>
			<span class="bar-title" id="barTitle"></span>
			<span class="bar-chips">${chips}</span>
		</div>
		<div class="viewer-main">
			<div class="frame-col">
				<div class="phone-stage">
					<iframe id="frame" title="Prototype"></iframe>
				</div>
			</div>
		</div>
	</div>
</div>

<script id="v-data" type="application/json">${JSON.stringify(payload)}</script>
<script>
(function () {
	var data = JSON.parse(document.getElementById('v-data').textContent);
	var labels = ${labels};
	var sections = ${sectionsById};
	var features = ${featuresById};
	var featureKeys = ${featureKeysById};
	var aliases = ${aliases};
	var wides = ${wides};
	var launcher = document.getElementById('launcher');
	var viewer = document.getElementById('viewer');
	var frame = document.getElementById('frame');
	var barTitle = document.getElementById('barTitle');

	function decode(b64) {
		var bytes = Uint8Array.from(atob(b64), function (c) { return c.charCodeAt(0); });
		return new TextDecoder().decode(bytes);
	}

	function activateSection(key) {
		var tab = document.querySelector('.round-tab[data-round="' + key + '"]');
		var page = tab && tab.closest('.feature-page');
		if (!page) return;
		page.querySelectorAll('.round-tab').forEach(function (t) {
			t.classList.toggle('active', t.dataset.round === key);
		});
		page.querySelectorAll('.section-block').forEach(function (block) {
			block.hidden = block.dataset.section !== key;
		});
	}
	document.querySelectorAll('.round-tab').forEach(function (tab) {
		tab.addEventListener('click', function () {
			tab.blur();
			activateSection(tab.dataset.round);
		});
	});
	var home = document.getElementById('home');

	function showHome() {
		home.hidden = false;
		document.querySelectorAll('.feature-page').forEach(function (pg) {
			pg.hidden = true;
		});
	}
	function showFeature(key) {
		var found = false;
		document.querySelectorAll('.feature-page').forEach(function (pg) {
			var match = pg.dataset.feature === key;
			pg.hidden = !match;
			if (match) found = true;
		});
		home.hidden = found;
		return found;
	}

	function open(id) {
		var src = aliases[id] || id;
		if (!data[src]) return;
		frame.srcdoc = decode(data[src]); // fresh document each open — flow restarts
		document.querySelector('.phone-stage').classList.toggle('wide', !!wides[id]);
		barTitle.textContent = features[id] + ' \u00b7 ' + labels[id];
		launcher.classList.add('hidden');
		viewer.classList.add('active');
		// Only sibling versions from the same round belong in the bar; a
		// round with a single version needs no chips at all.
		var section = sections[id];
		var siblings = 0;
		document.querySelectorAll('.bar-chip').forEach(function (c) {
			var inSection = c.dataset.section === section;
			if (inSection) siblings++;
			c.hidden = !inSection;
			c.classList.toggle('active', c.dataset.version === id);
		});
		if (siblings < 2) {
			document.querySelectorAll('.bar-chip').forEach(function (c) {
				c.hidden = true;
			});
		}
	}

	function close() {
		frame.srcdoc = '';
		viewer.classList.remove('active');
		launcher.classList.remove('hidden');
	}

	// The URL hash is the source of truth: '' = home, '#feature' = a
	// feature page, '#feature/versionId' = a prototype. Refreshing (or
	// sharing the link) restores the same view, and browser back/forward
	// walk the history.
	var openId = null;
	function applyHash() {
		var parts = decodeURIComponent(location.hash.replace(/^#\\/?/, ''))
			.split('/')
			.filter(Boolean);
		var vid = parts[1];
		if (vid && featureKeys[vid] === parts[0] && data[aliases[vid] || vid]) {
			showFeature(parts[0]);
			if (sections[vid]) activateSection(sections[vid]);
			openId = vid;
			open(vid);
			return;
		}
		if (viewer.classList.contains('active')) close();
		openId = null;
		if (!parts[0] || !showFeature(parts[0])) showHome();
	}
	function go(h) {
		// Setting an identical hash fires no event, so render directly.
		if (location.hash.replace(/^#/, '') === h) applyHash();
		else location.hash = h;
	}

	document.querySelectorAll('.feature-row').forEach(function (row) {
		row.addEventListener('click', function () {
			row.blur();
			go(row.dataset.feature);
		});
	});
	document.querySelectorAll('.feature-back').forEach(function (btn) {
		btn.addEventListener('click', function () { go(''); });
	});
	document.querySelectorAll('[data-version]').forEach(function (el) {
		el.addEventListener('click', function () {
			go(featureKeys[el.dataset.version] + '/' + el.dataset.version);
		});
	});
	document.getElementById('backBtn').addEventListener('click', function () {
		go(openId ? featureKeys[openId] : '');
	});
	window.addEventListener('hashchange', applyHash);


	// Restore the view the URL points at.
	applyHash();
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
