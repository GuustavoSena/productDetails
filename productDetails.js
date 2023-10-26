const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const readline = require("readline");
puppeteer.use(StealthPlugin());
const { exec } = require("child_process");

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
  "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:54.0) Gecko/20100101 Firefox/54.0",
  "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko",
  "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/601.7.7 (KHTML, like Gecko) Version/9.1.2 Safari/601.7.7",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:47.0) Gecko/20100101 Firefox/47.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1",
];

async function findTagBySelector(
  page,
  selectorType,
  selectorValue,
  attributeName = null
) {
  let selector;
  let elementHandles;

  if (selectorType === "id") {
    selector = `#${selectorValue}`;
  } else if (selectorType === "class") {
    selector = `.${selectorValue}`;
  } else if (selectorType === "attr" && attributeName) {
    selector = `[${attributeName}="${selectorValue}"]`;
  } else if (selectorType === "xpath") {
    try {
      elementHandles = await page.$x(selectorValue);
      return elementHandles[0];
    } catch (error) {
      console.error(
        `Error finding element with XPath ${selectorValue}: ${error.message}`
      );
      return null;
    }
  } 

  try {
    if (!elementHandles) {
      await page.waitForSelector(selector, { timeout: 5000 });
      return await page.$(selector);
    }
  } catch (error) {
    console.error(`Error finding selector ${selector}: ${error.message}`);
    return null;
  }
}

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

async function fetchProductDetails(url, selectors) {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "new",
    });

    const page = await browser.newPage();
    await page.setUserAgent(getRandomUserAgent());

    // Handling requests
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (
        req.resourceType() === "image" ||
        req.resourceType() === "stylesheet" ||
        req.resourceType() === "font"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    const delay = 3000 + Math.random() * 2000;
    await page.waitForTimeout(delay);

    let results = {};

    for (const selector of selectors) {
      const { name, type, value, attributeName } = selector;
      const tag = await findTagBySelector(page, type, value, attributeName);
      if (tag) {
        if (Array.isArray(tag)) {
          const texts = await Promise.all(
            tag.map((el) => page.evaluate((el) => el.textContent.trim(), el))
          );
          results[name] = texts.join(" ");
        } else {
          results[name] = await page.evaluate(
            (el) => el.textContent.trim(),
            tag
          );
        }
      } else {
        results[name] = "Not found";
      }
    }

    await browser.close();
    return {
      status: "success",
      results,
    };
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    if (browser) await browser.close();
    return {
      status: "error",
      message: `An error occurred: ${error.message}`,
    };
  }
}

function question(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  try {
    const url = await question("Enter the URL: ");

    let selectors = [];
    let finished = false;

    while (!finished) {
      const selectionName = await question("What will you select now? : ");
      const selectorType = await question(
        "Put the selector you want to use (id/class/attr/tag-text/xpath): "
      );
      let selectorValue, attributeName;

      if (selectorType === "attr") {
        attributeName = await question("Enter the attribute name: ");
        selectorValue = await question("Enter the selector value: ");
      } else {
        selectorValue = await question("Enter the selector value: ");
      }

      selectors.push({
        name: selectionName,
        type: selectorType,
        value: selectorValue,
        attributeName,
      });

      const finishInput = await question("Finish our scraping?(Y/N): ");
      finished = finishInput.toLowerCase() === "y";
    }

    const result = await fetchProductDetails(url, selectors);
    console.log(result);
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
}

main();