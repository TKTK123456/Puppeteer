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
async function save(page, filename) {
  await page.click("#prefsButton");
  await page.click(`a[onclick="Game.ExportSave();PlaySound('snd/tick.mp3');"]`);
  await page.keyboard.down('Control')
  await page.keyboard.press('KeyC')
  await page.keyboard.up('Control')
  const content = await page.evaluate(() => navigator.clipboard.readText())
  fs.writeFileSync(filename, content);
}
async function load(page, filename) {
  await page.keyboard.down('Control')
  await page.keyboard.press('KeyO')
  await page.keyboard.up('Control')
  const Data = fs.readFileSync(filename, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    return data
  })
  await page.evaluate((Data) => {
    navigator.clipboard.writeText("Mi4wNTJ8fDE3MjQyMDEyNjgwMzU7MTcyNDIwMTI2ODAzNTsxNzI0MjAxMzE3MzE5O1ZvbiBQaXJhdGU7YWZyZng7MCwxLDAsMCwwLDAsMHwxMTExMTEwMTEwMDEwMTEwMDEwMTAxMTAwMDF8MTQ7MTQ7MTQ7MDsxNDswOzA7MDswOzA7MDswOzA7MDswOzA7MDswOzA7MDswOzA7OzA7MDswOzA7MDswOzA7LTE7LTE7LTE7LTE7LTE7MDswOzA7MDs3NTswOzA7LTE7LTE7MTcyNDIwMTI2ODAzNTswOzA7OzQxOzA7MDswOzUwOzA7MDt8MCwwLDAsMCwsMCwwOzAsMCwwLDAsLDAsMDswLDAsMCwwLCwwLDA7MCwwLDAsMCwsMCwwOzAsMCwwLDAsLDAsMDswLDAsMCwwLCwwLDA7MCwwLDAsMCwsMCwwOzAsMCwwLDAsLDAsMDswLDAsMCwwLCwwLDA7MCwwLDAsMCwsMCwwOzAsMCwwLDAsLDAsMDswLDAsMCwwLCwwLDA7MCwwLDAsMCwsMCwwOzAsMCwwLDAsLDAsMDswLDAsMCwwLCwwLDA7MCwwLDAsMCwsMCwwOzAsMCwwLDAsLDAsMDswLDAsMCwwLCwwLDA7MCwwLDAsMCwsMCwwOzAsMCwwLDAsLDAsMDt8MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMHwxMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwfHw%3D%21END%21");
  }, Data)
  await page.mouse.click(540, 512, { button: 'left' });
  await page.keyboard.down('Control')
  await page.keyboard.press('KeyV')
  await page.keyboard.up('Control')
  await page.keyboard.press('Enter');
}
async function clickTheCookie(page, repeat) {
  for (let i = 0; i < repeat; i++) {
  await page.click("#bigCookie");
  }
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
  const recorder = new PuppeteerScreenRecorder(page);
  const pipeStream = new PassThrough();
  await recorder.startStream(pipeStream);
  await page.goto('https://orteil.dashnet.org/cookieclicker/');
  await page.setViewport({width: 1080, height: 1024});
  await page.click(`a[data-cc-event="click:dismiss"]`);
  await page.mouse.click(540, 400, { button: 'left' });
  await sleep(12000);
  await load(page, 'save.txt');
  await clickTheCookie(page, 15);
  await save(page, 'save.txt');
  await recorder.stop();
  await browser.close();
}

main()