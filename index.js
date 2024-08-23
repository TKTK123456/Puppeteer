const { createCursor, installMouseHelper } = pkg;
import pkg from "ghost-cursor"
import puppeteer from "puppeteer-core";
import { exec } from "node:child_process";
import util from "node:util";
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import fs from "node:fs";
import path from "node:path";
import stream from "node:stream";
import readline from 'node:readline';

const __dirname = path.resolve();

function PassThrough() {
  const s = new fs.createWriteStream('stream.mp4')
  return s;
}
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
async function writeFile(file, data) {
  const oldData = fs.readFileSync(file, 'utf8');
  const newData = oldData + data;
  fs.writeFileSync(file, newData);
}

async function main() {

  const { stdout: chromiumPath } = await util.promisify(exec)("which chromium")

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: chromiumPath.trim()
  });
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://orteil.dashnet.org/cookieclicker/', ['clipboard-read']);
  const page = await browser.newPage();
  const cursor = createCursor(page)
  const recorder = new PuppeteerScreenRecorder(page);
  const pipeStream = new PassThrough();
  await recorder.startStream(pipeStream);
  await page.goto('https://orteil.dashnet.org/cookieclicker/');
  await page.setViewport({width: 1080, height: 1024});
  await cursor.click(`a[data-cc-event="click:dismiss"]`)
  await cursor.moveTo({x:540, y:400})
  await cursor.click();
  await sleep(12000);
  console.log("Ready for control")
  rl.on('line', async (input) => {
    if (input === 'stop') {
      await recorder.stop();
      await browser.close();
      rl.close()
    }
    if (input.toLowerCase() === "runcommand") {
      rl.question(`What command? `, async (command) => {
        if (command === 'clickcookie') {
          rl.question(`How many times? `, async (times) => {
            for (let i = 0; i < times; i++) {
              await cursor.click(`#bigCookie`)
            }
            console.log('Done')
          })
        }
      })
    }
  })
}

main()