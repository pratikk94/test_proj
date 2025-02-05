const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Scrape Blinkit
const scrapeBlinkit = async (searchQuery, cityName) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Step 1: Hit the search URL
    const searchUrl = `https://blinkit.com/s/?q=${encodeURIComponent(searchQuery)}`;
    await page.goto(searchUrl, { waitUntil: "networkidle2" });

    // Step 2: Scrape the raw HTML content of the search results page
    const searchPageHTML = await page.content();

    // Step 3: Extract products and their details (IDs, names, etc.) from the search results
    const productRegex = /<a[^>]*href="\/product\/(\d+)"[^>]*>(.*?)<\/a>/gs;
    const products = [];
    let match;

    while ((match = productRegex.exec(searchPageHTML)) !== null) {
      const productId = match[1];
      const productBlock = match[2];

      // Extract name, locality, and other details from the product block
      const nameMatch = productBlock.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
      const name = nameMatch ? nameMatch[1].trim() : "N/A";

      const localityMatch = productBlock.match(/locality:\s*(.*?)</i);
      const locality = localityMatch ? localityMatch[1].trim() : "N/A";

      if (locality.toLowerCase().includes(cityName.toLowerCase())) {
        products.push({ productId, name, locality });
      }
    }

    // Step 4: Visit each product page and scrape details
    const productDetails = [];
    for (const product of products) {
      const productUrl = `https://blinkit.com/product/${product.productId}`;
      await page.goto(productUrl, { waitUntil: "networkidle2" });

      const productPageHTML = await page.content();

      // Use regex to extract product details from the product page
      const priceMatch = productPageHTML.match(/₹\s*(\d+)/);
      const price = priceMatch ? priceMatch[1] : "N/A";

      const quantityMatch = productPageHTML.match(/<span[^>]*class="quantity"[^>]*>(.*?)<\/span>/i);
      const quantity = quantityMatch ? quantityMatch[1].trim() : "N/A";

      const discountMatch = productPageHTML.match(/(\d+%)\s*off/i);
      const discount = discountMatch ? discountMatch[1] : "N/A";

      const imageMatch = productPageHTML.match(/<img[^>]*src="(.*?)"/i);
      const image = imageMatch ? imageMatch[1] : "N/A";

      productDetails.push({
        productId: product.productId,
        name: product.name,
        locality: product.locality,
        price,
        quantity,
        discount,
        image,
      });
    }

    await browser.close();
    return productDetails;
  } catch (error) {
    console.error("Error scraping Blinkit:", error.message);
    await browser.close();
    return [];
  }
};

// API Endpoint for Blinkit
app.get("/api/blinkit", async (req, res) => {
  const { product, cityname } = req.query;

  if (!product || !cityname) {
    return res.status(400).json({ error: "Product and cityname are required." });
  }

  const data = await scrapeBlinkit(product, cityname);
  res.json(data);
});

// Start the server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
