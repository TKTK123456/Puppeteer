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
import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  Activity,
  SlashCommandBuilder,
  Partials,
  PermissionsBitField,
  RoleFlagsBitField,
  RoleManager,
  ChannelType,
} from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User],
});
client.login(process.env.token);
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
client.on("ready", () => {
  const commands = [
    new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Replies with pong!"),
    new SlashCommandBuilder()
      .setName("screenshot")
      .setDescription("sends a screenshot of the current page"),
    new SlashCommandBuilder()
      .setName("record")
      .setDescription("record a screen")
      .addChannelOption((option) => {
        return option
          .setName("channel")
          .setDescription("The channel to record to")
          .setRequired(true);
      }),
  ];
  client.application.commands.set(commands);
});

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
    return Game.cookiesd;
  });
  return cookies;
}
async function getPrices(page) {
  const prices = await page.evaluate(() => {
    let Prices = "";
    for (var i in Game.Objects) {
      var me = Game.Objects[i];
      let output = `${me.name}: ${me.price}\n`;
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
  }, name);
  if (buildingId > -1) {
    await page.click(`#productName${buildingId}`);
  } else {
    console.log("invalid building name");
  }
}
async function save(page) {
  clearFile("save.txt");
  const save = await page.evaluate(() => {
    return Game.WriteSave(1);
  });
  writeFile("save.txt", save);
}
async function load(page) {
  const save = await getFile("save.txt");
  await page.evaluate((save) => {
    Game.ImportSaveCode(save);
  }, save);
}
async function getCps(page) {
  const cps = await page.evaluate(() => {
    return Game.cookiesPs;
  });
  return cps;
}
async function getPricesAsArray(page) {
  const prices = await page.evaluate(() => {
    let Prices = [];
    for (var i in Game.Objects) {
      var me = Game.Objects[i];
      let output = { name: me.name, price: me.price };
      Prices += output;
    }
    return Prices;
  });
  return prices;
}
async function calcBuyingWorth(page) {
  let worth = await page.evaluate(() => {
    let Worth = [];
    let baseBuilding = Game.Objects["Cursor"];
    for (var i in Game.Objects) {
      var me = Game.Objects[i];
      let price = baseBuilding.basePrice * 1.15 ** (baseBuilding.amount + 1);
      let outputWorth =
        (price * me.cps(me)) / (baseBuilding.cps(baseBuilding) * me.basePrice);
      let output = {
        name: me.name,
        price: me.price,
        worth: outputWorth,
        cps: me.cps(me),
      };
      Worth.push(output);
    }
    return Worth;
  });
  return worth;
}
async function getBuildingsToBuy(page) {
  let totalCookiesEarned = await page.evaluate(() => {
    return Game.cookiesEarned;
  });
  let worth = await calcBuyingWorth(page);
  let worth2 = [];
  for (let i = 0; i < worth.length; i++) {
    let me = worth[i];
    if (me.price < totalCookiesEarned) {
      worth2.push(me);
    }
  }
  worth = worth2;
  let need = [];
  for (let i = 0; i < worth.length; i++) {
    let me = worth[i];
    let output = round(Math.log(me.worth) / Math.log(1.15));
    let buildingAmountNeeded = Math.floor(output);
    let buildingAmount = await page.evaluate((name) => {
      if (Game.Objects[name]) {
        return Game.Objects[name].amount;
      } else {
        return -1;
      }
    }, me.name);
    if (buildingAmountNeeded - buildingAmount > 0) {
      need.push({
        name: me.name,
        amount: buildingAmountNeeded - buildingAmount,
      });
    }
  }
  return need;
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
  await page.waitForNavigation();
  await sleep(12000);
  clearFile("copyCommands.txt");
  await load(page);
  console.log("Ready for control");
  rl.on("line", async (input) => {
    if (input === "stop") {
      await save(page);
      await recorder.stop();
      await browser.close();
      await client.destroy();
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
          writeFile("copyCommands.txt", `let prices = await getPrices(page)\n`);
          console.log(prices);
        } else if (command.toLowerCase() === "buybuilding") {
          rl.question(`What building? `, async (name) => {
            await buyBuilding(page, name);
            writeFile("copyCommands.txt", `await buyBuilding(page, ${name})\n`);
            console.log("Done");
          });
        } else if (command.toLowerCase() === "getcps") {
          const cps = await getCps(page);
          writeFile("copyCommands.txt", `let cps = await getCps(page)\n`);
          console.log(cps);
        }
      });
    }
  });
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === "ping") {
      await interaction.reply("Pong! " + client.ws.ping);
    } else if (interaction.commandName === "screenshot") {
      await interaction.reply("Screenshotting...");
      await page.screenshot({
        type: "png",
        path: "screenshot.png",
        fullPage: true,
      });
      const screenshot = fs.readFileSync("screenshot.png");
      await interaction.editReply({
        content: "Screenshotted!",
        files: [screenshot],
      });
    } else if (interaction.commandName === "record") {
      await interaction.reply("Recording...");
      const channel = interaction.options.getChannel("channel");
    }
  });
}

main();
