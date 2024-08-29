const { createCursor, installMouseHelper } = pkg;
import pkg from "ghost-cursor";
import puppeteer from "puppeteer-core";
import { exec } from "node:child_process";
import util from "node:util";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";
import fs from "node:fs";
import path from "node:path";
import stream from "node:stream";
import readline from "node:readline";

const __dirname = path.resolve();

function PassThrough() {
  const s = new fs.createWriteStream("stream.mp4");
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
  const oldData = fs.readFileSync(file, "utf8");
  const newData = oldData + data;
  fs.writeFileSync(file, newData);
}
async function clearFile(file) {
  fs.writeFileSync(file, "");
}
async function getFile(file) {
  return fs.readFileSync(file, "utf8");
}
async function clickCookie(page, times) {
  for (let i = 0; i < times; i++) {
    await page.click("#bigCookie");
  }
}
async function getCookies(page) {
  const cookies = await page.evaluate(() => {
    return Game.cookies;
  });
  return cookies;
}
async function getPrices(page) {
  const prices = await page.evaluate(() => {
    let Prices = '';
    for (var i in Game.Objects) {
      var me=Game.Objects[i];
      let output = `${me.name}: ${me.price}\n`
      Prices += output;
    }
    return Prices;
  });
  return prices;
}
async function buyBuilding(page, name) {
  const buildingId = await page.evaluate((name) => {
    if (Game.Objects[name]) {
      return Game.Objects[name].id;
    } else {
      return -1;
    }
  }, name)
  if (buildingId>-1) {await page.click(`#productName${buildingId}`)} else {
    console.log("invalid building name")
  };
}
async function save(page) {
  clearFile('save.txt');
  const save = await page.evaluate(() => {
    return Game.WriteSave(1);
  })
  writeFile('save.txt', save);
}
async function load(page) {
  const save = await getFile('save.txt');
  await page.evaluate((save) => {
    Game.ImportSaveCode(save);
  }, save);
}

async function main() {
  const { stdout: chromiumPath } = await util.promisify(exec)("which chromium");

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: chromiumPath.trim(),
  });
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(
    "https://orteil.dashnet.org/cookieclicker/",
    ["clipboard-read"],
  );
  const page = await browser.newPage();
  const recorder = new PuppeteerScreenRecorder(page);
  const pipeStream = new PassThrough();
  await recorder.startStream(pipeStream);
  await page.goto("https://orteil.dashnet.org/cookieclicker/");
  await page.setViewport({ width: 1080, height: 1024 });
  await page.click(`a[data-cc-event="click:dismiss"]`);
  await page.mouse.click(540, 400);
  await sleep(12000);
  clearFile("copyCommands.txt");
  load(page)
  console.log("Ready for control");
  rl.on("line", async (input) => {
    if (input === "stop") {
      await save(page)
      await recorder.stop();
      await browser.close();
      rl.close();
    }
    if (input.toLowerCase() === "runcommand") {
      rl.question(`What command? `, async (command) => {
        if (command.toLowerCase() === "clickcookie") {
          rl.question(`How many times? `, async (times) => {
            await clickCookie(page, times);
            writeFile(
              "copyCommands.txt",
              `await clickCookie(page, ${times})\n`,
            );
            console.log("Done");
          });
        } else if (command.toLowerCase() === "getcookies") {
          const cookies = await getCookies(page);
          writeFile(
            "copyCommands.txt",
            `let cookies = await getCookies(page)\n`,
          );
          console.log(cookies);
        } else if (command.toLowerCase() === "getprices") {
          const prices = await getPrices(page);
          writeFile(
            "copyCommands.txt",
            `let prices = await getPrices(page)\n`,
          );
          console.log(prices);
        } else if (command.toLowerCase() === "buybuilding") {
          rl.question(`What building? `, async (name) => {
            await buyBuilding(page, name);
            writeFile(
              "copyCommands.txt",
              `await buyBuilding(page, ${name})\n`,
            );
            console.log("Done");
          });
        }
      });
    }
  });
}

main();
