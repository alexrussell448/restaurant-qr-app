const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const readline = require("readline");
const { chromium } = require("playwright");

const PAGE_URL =
  "https://deliveroo.co.uk/menu/manchester/bury/fratelli-at-the-met-bry?srsltid=AfmBOorRm8j-GVubWMlO_9w0NTlT6d6KI0ZqSNs-jm-3YGouS1w7DBDn";

const OUTPUT_DIR = path.join(__dirname, "deliveroo_images");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeFileName(name) {
  return String(name || "image")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

function getExtensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname);
    if (ext) return ext;
  } catch {}
  return ".jpg";
}

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;

    lib
      .get(url, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          return resolve(downloadFile(res.headers.location, filePath));
        }

        if (res.statusCode !== 200) {
          return reject(
            new Error(`Failed to download ${url}. Status: ${res.statusCode}`)
          );
        }

        const fileStream = fs.createWriteStream(filePath);
        res.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close(resolve);
        });

        fileStream.on("error", reject);
      })
      .on("error", reject);
  });
}

function waitForEnter(promptText) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(promptText, () => {
      rl.close();
      resolve();
    });
  });
}

async function autoScroll(page) {
  console.log("Scrolling page to trigger lazy loading...");

  let previousHeight = 0;

  for (let i = 0; i < 30; i++) {
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    await page.mouse.wheel(0, 2500);
    await page.waitForTimeout(1200);

    if (currentHeight === previousHeight) {
      break;
    }

    previousHeight = currentHeight;
  }

  await page.waitForTimeout(3000);
}

(async () => {
  console.log("SCRIPT STARTED");
  ensureDir(OUTPUT_DIR);

  const browser = await chromium.launch({
    headless: false,
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 2200 },
  });

  const capturedUrls = new Set();

  page.on("response", async (response) => {
    try {
      const url = response.url();
      const contentType = response.headers()["content-type"] || "";

      const looksLikeImage =
        contentType.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(url);

      if (!looksLikeImage) return;

      if (/deliveroo|logo|onetrust|cookie|favicon|google|avatar/i.test(url)) {
        return;
      }

      capturedUrls.add(url);
    } catch {}
  });

  console.log(`Opening ${PAGE_URL}`);
  await page.goto(PAGE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });

  console.log("Page opened.");
  console.log("Now manually do these in the opened browser:");
  console.log("1. Accept or dismiss cookies");
  console.log("2. Close the address/location popup");
  console.log("3. Make sure the actual menu is visible");
  console.log("Then come back to terminal and press Enter.");

  await waitForEnter("Press Enter here once the menu is fully visible... ");

  await page.waitForTimeout(2000);
  await autoScroll(page);

  console.log("Collecting img tags too...");

  const domImages = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("img"))
      .map((img) => img.currentSrc || img.src || "")
      .filter((src) => src.startsWith("http"));
  });

  for (const url of domImages) {
    if (!/deliveroo|logo|onetrust|cookie|favicon|google|avatar/i.test(url)) {
      capturedUrls.add(url);
    }
  }

  const urls = Array.from(capturedUrls);

  console.log(`Found ${urls.length} image URLs`);

  const manifest = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const ext = getExtensionFromUrl(url);
    const fileName = `${String(i + 1).padStart(3, "0")}_${sanitizeFileName(
      `image_${i + 1}`
    )}${ext}`;
    const filePath = path.join(OUTPUT_DIR, fileName);

    try {
      console.log(`Downloading ${i + 1}/${urls.length}: ${fileName}`);
      await downloadFile(url, filePath);

      manifest.push({
        url,
        fileName,
      });
    } catch (err) {
      console.error(`Failed: ${url}`);
      console.error(err.message);
    }
  }

  const manifestPath = path.join(OUTPUT_DIR, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  console.log(`Saved ${manifest.length} images`);
  console.log(`Manifest saved to ${manifestPath}`);

  await browser.close();
})();