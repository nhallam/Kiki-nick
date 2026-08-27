import { chromium } from 'playwright-core';
import { pathToFileURL } from 'url';

const SCRATCH = '/tmp/claude-0/-home-user-Kiki-nick/0b5d5fde-88ac-5671-95e5-1ff0c77c3637/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto(pathToFileURL('gallery/index.html').href + '#matches/match32');
await page.waitForTimeout(1500);

const btns = await page.locator('button, [role=button]').allTextContents();
console.log('comment-ish buttons:', btns.filter(t => /comment/i.test(t)));
// find and open the comments UI
const trigger = page.locator('button', { hasText: /comment/i }).first();
if (await trigger.count()) {
	await trigger.click();
	await page.waitForTimeout(400);
	await page.screenshot({ path: `${SCRATCH}/comments-open.png` });
	// try leaving a comment if there's a form
	const nameInput = page.locator('input[placeholder*="name" i], #cp-name, input').first();
	console.log('panel visible, inputs:', await page.locator('input, textarea').count());
	console.log('badge text:', await page.locator('[class*=badge], [class*=mode]').allTextContents().then(a => a.filter(t => t.trim()).slice(0, 6)));
} else {
	console.log('NO comment trigger found');
	await page.screenshot({ path: `${SCRATCH}/comments-missing.png` });
}
await browser.close();
