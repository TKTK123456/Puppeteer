const { createCursor, installMouseHelper } = pkg;
import {
  atan2,
  chain,
  derivative,
  e,
  evaluate,
  log,
  pi,
  pow,
  round,
  sqrt,
} from "mathjs";
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

const math = {};
math.atan2 = atan2;
math.chain = chain;
math.derivative = derivative;
math.e = e;
math.evaluate = evaluate;
math.log = log;
math.pi = pi;
math.pow = pow;
math.round = round;
math.sqrt = sqrt;

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
      Prices.push(output);
    }
    return Prices;
  });
  return prices;
}
async function calcBuyingWorth(page, building, amount) {
  building =
    building.slice(0, 1).toUpperCase() + building.slice(1).toLowerCase();
  let worth = await page.evaluate(
    (building, Amount) => {
      let Worth = [];
      let baseBuilding = Game.Objects[building];
      let num = Amount;
      if (num < baseBuilding.amount) {
        num = baseBuilding.amount;
      }
      for (var i in Game.Objects) {
        var me = Game.Objects[i];
        let price = baseBuilding.basePrice * 1.15 ** num;
        let outputWorth =
          (price * me.cps(me)) /
          (baseBuilding.cps(baseBuilding) * me.basePrice);
        let output = {
          name: me.name,
          price: me.price,
          worth: outputWorth,
          cps: me.cps(me),
        };
        Worth.push(output);
      }
      return Worth;
    },
    building,
    amount,
  );
  return worth;
}
async function getBuildingsToBuy(page, building, amount) {
  let totalCookiesEarned = await page.evaluate(() => {
    return Game.cookiesEarned;
  });
  let worth = await calcBuyingWorth(page, building, amount);
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
    let output = math.log(me.worth, 1.15);
    let buildingAmountNeeded = math.round(output);
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
function removeAllFilesSync(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    fs.unlinkSync(filePath);
  }
}
async function keepVariables(name, input) {
  let json = await Promise.resolve(getFile("keepVariables.json")).then(
    (value) => {
      return JSON.parse(value);
    },
  );
  if (input.if) {
    json[name] = input.data;
    clearFile("keepVariables.json");
    writeFile("keepVariables.json", JSON.stringify(json, null, 2));
    return json[name];
  } else {
    try {
      if (json[name]) {
        return json[name];
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
async function waitForPageReady(page) {
  await page.evaluate(async () => {
    let counter = 0;
    while (!Game.ready) {
      counter++;
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }
    return counter;
  });
}
let AutoBuyAmount = 0;
async function autoBuyBuildings(page, building) {
  let amount = AutoBuyAmount;
  let need = await getBuildingsToBuy(page, building, amount);
  for (let i = 0; i < need.length; i++) {
    let me = need[i];
    let cookies = await getCookies(page);
    let price = await getPricesAsArray(page).then((prices) => {
      let price = prices.find((item) => item.name === me.name);
      return price.price;
    });
    for (let i2 = 0; i2 < me.amount; i2++) {
      if (cookies >= price) {
        await buyBuilding(page, me.name);
      }
    }
  }
  let numBuildingsTypesNeeded = 0;
  need = await getBuildingsToBuy(page, building, amount);
  for (let i = 0; i < need.length; i++) {
    let me = need[i];
    if (me.amount > 0) {
      numBuildingsTypesNeeded++;
    }
  }
  if (numBuildingsTypesNeeded === 0) {
    AutoBuyAmount++;
  }
}
async function startIntervals(page, building) {
  AutoBuyAmount = await keepVariables("AutoBuyAmount", { if: false, data: 0 });
  if (!AutoBuyAmount) {
    AutoBuyAmount = 0;
  }
  let start = Date.now();
  await autoBuyUpgrades(page)
  await autoBuyBuildings(page, building);
  await clickCookie(page, 1);
  let end = Date.now();
  let time = end - start;
  let intervals = [];
  intervals[1] = setInterval(async () => {
    await autoBuyUpgrades(page)
    await autoBuyBuildings(page, building);
    await clickCookie(page, 1);
  }, time);
  intervals[2] = setInterval(async () => {
    await save(page);
    await keepVariables("AutoBuyAmount", {
      if: true,
      data: AutoBuyAmount,
    });
  }, 60000);
  return intervals;
}
async function getUpgrades(page) {
  let upgrades = await page.evaluate(() => {
    let upgrades = [];
    for (var i in Game.Upgrades) {
      var me = Game.Upgrades[i];
      if (me.pool != "prestige"&&me.unlocked&&!me.bought) {
        var price = me.basePrice;
        if (Game.Has("Toy workshop")) price *= 0.95;
        if (Game.Has("Five-finger discount"))
          price *= Math.pow(0.99, Game.Objects["Cursor"].amount / 100);
        if (Game.Has("Santa's dominion")) price *= 0.98;
        if (Game.Has("Faberge egg")) price *= 0.99;
        if (Game.Has("Divine sales")) price *= 0.99;
        if (Game.Has("Fortune #100")) price *= 0.99;
        if (me.kitten && Game.Has("Kitten wages")) price *= 0.9;
        if (Game.hasBuff("Haggler's luck")) price *= 0.98;
        if (Game.hasBuff("Haggler's misery")) price *= 1.02;
        price *= 1 - Game.auraMult("Master of the Armory") * 0.02;
        price *= Game.eff("upgradeCost");
        if (me.pool == "cookie" && Game.Has("Divine bakeries")) price /= 5;
        let output = {
          name: me.name,
          id: me.id,
          cost: price,
          unlocked: me.unlocked,
          bought: me.bought,
        };
        upgrades.push(output);
      }
    }
    return upgrades;
  });
  return upgrades;
}
async function autoBuyUpgrades(page) {
  let upgrades = await getUpgrades(page);
  for (let i = 0; i < upgrades.length; i++) {
    let me = upgrades[i];
    let cookies = await getCookies(page);
    let price = me.cost;
    if (cookies >= price) {
      await page.click(`div[onclick="Game.UpgradesById[${me.id}].click(event);"]`);
    }
  }
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
  let screenshotNum = 0;
  removeAllFilesSync("screenshots");
  clearFile("copyCommands.txt");
  await sleep(5000);
  await waitForPageReady(page);
  await load(page);
  let intervals = await startIntervals(page, "Cursor");
  console.log("Ready for control");
  rl.on("line", async (input) => {
    if (input === "stop") {
      await save(page);
      await keepVariables("AutoBuyAmount", {
        if: true,
        data: AutoBuyAmount,
      });
      for (let i = 0; i < intervals.length; i++) {
        clearInterval(intervals[i]);
      }
      rl.close();
      await recorder.stop();
      await browser.close();
      await client.destroy();
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
      let screenshotPath = `screenshots/${screenshotNum}.png`;
      await page.screenshot({
        type: "png",
        path: screenshotPath,
        fullPage: true,
      });
      screenshotNum++;
      const screenshot = fs.readFileSync(screenshotPath);
      await interaction.editReply({
        content: "Screenshotted!",
        files: [screenshot],
      });
    }
  });
}

main();
