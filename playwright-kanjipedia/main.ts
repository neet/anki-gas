import { chromium } from 'playwright';

const readStdin = async (): Promise<string[]> => {
  let input = '';

  return new Promise((resolve) => {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => input += chunk);
    process.stdin.on('end', () => {
      const lines = input.trim().split('\n');
      resolve(lines);
    });
  });
}

const browser = await chromium.launch();
const page = await browser.newPage();
const words = await readStdin();

let buffer = "";

for (const word of words) {
  const url = new URL('/search', 'https://www.kanjipedia.jp')
  url.search = new URLSearchParams({
    k: word,
    wt: '1',
    sk: 'leftHand',
  }).toString();

  await page.goto(url.toString());
  await page.click("#resultKotobaList > li > a")
  await page.waitForLoadState('networkidle');
  const text = await page.$eval("#kotobaExplanationSection", el => el.textContent?.trim() ?? "");

  buffer += text + "\n";
}

await browser.close();

process.stdout.write(buffer.trim());
