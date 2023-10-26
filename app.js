const express = require("express");
const { fetchProductDetails } = require("./productDetails");

const app = express();

app.use(express.json());

// Home route to describe the API usage
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Product Details Extractor API</title>
    </head>
    <body>
        <h1>Product Details Extractor API</h1>
        <p>To extract product details from a webpage, make a POST request to the following URL:</p>
        <code>/fetch-product-details</code>
        <p>Include a request body with the URL from which you want to extract product details, like so:</p>
        <code>{ "url": "https://www.example.com/product" }</code>
    </body>
    </html>
  `);
});

app.post("/fetch-product-details", async (req, res) => {
  const { url, selectors } = req.body;

  if (!url || !selectors) {
    return res.status(400).send({ error: "URL and selectors are required" });
  }

  const result = await fetchProductDetails(url, selectors);

  if (result.status === "success") {
    res.json(result.results);
  } else {
    res.status(500).send({ error: result.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});