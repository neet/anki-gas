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

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
const words = await readStdin();

let buffer = "";

for (const word of words) {
  const url = new URL('/search', 'https://www.kanjipedia.jp')
  url.search = new URLSearchParams({
    k: word,
    wt: '1',
    sk: 'perfect',
  }).toString();

  await page.goto(url.toString());

  const links = await page.$$("#resultKotobaList > li > a");
  if (links.length === 0) {
    buffer += "(0)\n";
    continue;
  }
  if (links.length > 1) {
    buffer += `(2+) ${url}\n`;
    continue;
  }

  const link = links[0];
  await link.click();
  await page.waitForLoadState('networkidle');
  const text = await page.$eval("#kotobaExplanationSection", el => el.textContent?.trim() ?? "");

  buffer += text + "\n";
}

await browser.close();

process.stdout.write(buffer.trim());
