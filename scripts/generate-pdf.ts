import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const mdPath = path.resolve(__dirname, "../docs/deliverable-sprint-1.md");
  const pdfPath = path.resolve(__dirname, "../docs/deliverable-sprint-1.pdf");
  let mdContent = fs.readFileSync(mdPath, "utf-8");

  // Replace relative screenshot paths with base64 data URIs for 100% reliable PDF rendering
  const screenshotsDir = path.resolve(__dirname, "../docs/evidence/screenshots");
  mdContent = mdContent.replace(/\.\/evidence\/screenshots\/([a-zA-Z0-9_\-]+\.png)/g, (match, filename) => {
    const fullPath = path.join(screenshotsDir, filename);
    if (fs.existsSync(fullPath)) {
      const b64 = fs.readFileSync(fullPath).toString("base64");
      return `data:image/png;base64,${b64}`;
    }
    return match;
  });

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sprint 1 Deliverable</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css/github-markdown.min.css">
  <style>
    @page {
      margin: 20mm 15mm 20mm 15mm;
      size: A4;
    }
    body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    }
    .markdown-body {
      font-size: 13.5px;
      line-height: 1.6;
    }
    table {
      font-size: 12px;
      width: 100%;
    }
    pre, code {
      font-size: 11.5px;
    }
    img {
      max-width: 100%;
      border-radius: 6px;
      border: 1px solid #d0d7de;
      margin: 12px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    h1 { border-bottom: 2px solid #eaecef; padding-bottom: 0.3em; margin-top: 1.8em; page-break-before: auto; }
    h2 { border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; margin-top: 1.5em; page-break-before: auto; }
  </style>
</head>
<body class="markdown-body">
  <div id="content"></div>
  <script>
    const markdown = ${JSON.stringify(mdContent)};
    document.getElementById('content').innerHTML = marked.parse(markdown);
  </script>
</body>
</html>`;

  console.log("Launching headless browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle" });
  console.log("Rendering PDF with embedded screenshots...");
  await page.pdf({
    path: pdfPath,
    format: "A4",
    margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    printBackground: true,
  });
  await browser.close();
  console.log("PDF generated successfully at:", pdfPath);
}

main().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
