const express = require("express");
const path = require("path");
const app = express();

// Set up EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());

// Home route to describe the API usage
app.get("/", (req, res) => {
  res.render("index");
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
