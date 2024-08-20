import puppeteer from "puppeteer-core";
import { exec } from "node:child_process";
import util from "node:util";
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import fs from "node:fs";
import path from "node:path";
import stream from "node:stream";

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

async function main() {

  const { stdout: chromiumPath } = await util.promisify(exec)("which chromium")

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: chromiumPath.trim()
  });

const page = await browser.newPage();
  const recorder = new PuppeteerScreenRecorder(page);
  const pipeStream = new PassThrough();
  await recorder.startStream(pipeStream);
  await page.goto('https://orteil.dashnet.org/cookieclicker/');
  await page.setViewport({width: 1080, height: 1024});
  await page.click(`a[data-cc-event="click:dismiss"]`)
  await page.mouse.click(540, 450, { button: 'left' })
  await sleep(3000)
  await recorder.stop();
  await browser.close();
}

main()