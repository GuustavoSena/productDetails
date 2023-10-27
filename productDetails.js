const axios = require("axios");
const cheerio = require("cheerio");

function findTagBySelector(
  $,
  selectorType,
  selectorValue,
  attributeName = null
) {
  let selector;

  if (selectorType === "id") {
    selector = `#${selectorValue}`;
  } else if (selectorType === "class") {
    selector = `.${selectorValue}`;
  } else if (selectorType === "attr" && attributeName) {
    selector = `[${attributeName}="${selectorValue}"]`;
  } else if (selectorType === "tag-text") {
    const [tag, text] = selectorValue.split("|");
    return $(tag).filter((_, el) => $(el).text().includes(text));
  }

  return $(selector);
}

async function fetchProductDetails(url, selectors) {
  try {
    console.log("Fetching URL:", url);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    let results = {};

    for (const selector of selectors) {
      console.log("Processing selector:", selector);
      const { name, type, value, attributeName } = selector;

      const element = findTagBySelector($, type, value, attributeName);

      if (element && element.length) {
        results[name] = element.text().trim();
      } else {
        results[name] = "Not found";
      }
    }

    console.log("Final results:", results);
    return {
      status: "success",
      results,
    };
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    return {
      status: "error",
      message: `An error occurred: ${error.message}`,
    };
  }
}

module.exports = {
  fetchProductDetails,
};
