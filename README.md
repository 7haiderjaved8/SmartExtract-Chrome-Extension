# SmartExtract - Web Product & Data Scraper (Chrome MV3)

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-14B8A6.svg?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Permissions](https://img.shields.io/badge/Permissions-activeTab%20%7C%20scripting-00F2FE.svg?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/declare_permissions/)
[![Security](https://img.shields.io/badge/Privacy-100%25%20Client--Side-10B981.svg?style=flat-square)](#security--privacy-guarantee)

A high-performance, professional Chrome Manifest V3 extension built exclusively with vanilla JavaScript, HTML, and CSS. SmartExtract empowers users to extract product titles, prices, and product URLs from supported e-commerce pages and catalogs in real-time, preview records interactively, and export RFC 4180 compliant CSV files hardened against formula injection attacks.

---

## ✨ Key Features

- **Modern Dark Navy & Electric Teal Interface**: Ergonomic, sleek popup designed with glassmorphic depth, glowing accents, responsive tabs, and clear visual hierarchy.
- **Dual Extraction Strategies**:
  - **Catalog / List Mode**: Iterates product cards/containers in grids, search results, or category feeds.
  - **Single Product Mode**: Extracts the primary product title, price, and current URL from product detail pages.
- **Configurable CSS Selectors & Presets**:
  - Built-in presets for **Sample Catalog**, **Generic E-Commerce**, **Amazon Style**, **Shopify / WooCommerce**, and **Single Product Detail**.
  - Fully customizable container, title, price, and URL selectors.
  - Save custom profiles to local storage with one-click restore.
- **Real-Time Preview & Record Counter**:
  - Displays instant record counts (`Found X products`) and live table preview.
  - Instant search filter to isolate items inside the preview table.
  - Granular row deletion and link opening.
- **Hardened CSV Export & Clipboard Tools**:
  - **Formula Injection (DDE) Mitigation**: Automatically neutralizes cells beginning with `=`, `+`, `-`, `@`, `\t`, or `\r` by prefixing a single apostrophe (`'`).
  - **RFC 4180 Escaping**: Properly wraps text containing commas, newlines, or quotes, escaping internal quotes as `""`.
  - **Excel UTF-8 BOM**: Prepends `\uFEFF` so Microsoft Excel and Apple Numbers render international currency symbols (`$`, `€`, `£`, `¥`, `₹`) flawlessly.
  - One-click copy for formatted CSV or JSON array.
- **Intelligent Error Handling**:
  - Gracefully alerts when users are on restricted browser pages (`chrome://`, `chrome-extension://`, `chromewebstore.google.com`).
  - Catches invalid CSS selector syntax with human-readable error diagnostics.
- **Offline & Self-Contained**:
  - Includes a full offline mock e-commerce store (`sample-catalog/index.html`) with 8+ products, rating systems, and formula test items.
  - Includes an interactive single-page test harness (`test-mvp/index.html`) with an automated 5-point verification suite.

---

## 📁 Repository Structure

```
├── manifest.json              # Chrome Manifest V3 configuration (activeTab, scripting)
├── popup.html                 # Extension popup structure (Extract, Selectors, Guide tabs)
├── popup.css                  # Dark navy & vibrant teal design system (Vanilla CSS)
├── popup.js                   # Client-side extraction engine, selector logic, safe CSV generator
├── generate_icons.py          # Icon generation script (Pillow-based)
├── icons/
│   ├── icon16.png             # 16x16 extension toolbar icon
│   ├── icon32.png             # 32x32 extension toolbar icon
│   ├── icon48.png             # 48x48 extensions management icon
│   ├── icon128.png            # 128x128 Chrome Web Store icon
│   └── icon.svg               # Vector SVG source icon
├── sample-catalog/
│   ├── index.html             # "Aura Tech Store" offline test catalog with helper toolbar
│   └── product-detail.html    # Single product detail test page
├── test-mvp/
│   └── index.html             # Standalone Single-Page MVP harness with automated test runner
└── README.md                  # Complete documentation and setup manual
```

---

## 🚀 Installation Guide (Chrome / Edge / Brave / Chromium)

To install SmartExtract in developer mode:

1. **Clone or Download** this directory to your local machine:
   ```bash
   git clone <YOUR_REPOSITORY_URL>
   cd <YOUR_REPOSITORY_FOLDER>
   ```
2. Open Google Chrome (or any Chromium-based browser like Brave, Edge, Opera).
3. In the address bar, navigate to:
   ```
   chrome://extensions/
   ```
4. In the upper-right corner, toggle on **Developer mode**.
5. In the top-left menu, click **Load unpacked**.
6. Select the folder containing `manifest.json` (the downloaded project folder containing `manifest.json`).
7. SmartExtract will now appear in your extensions list. Click the **puzzle piece icon** in the browser toolbar and pin **SmartExtract** for quick access.

---

## 🧪 Testing SmartExtract

### Method 1: Local Sample Product Catalog
1. Start a local server in the project folder with `python -m http.server 8123`, then visit `http://localhost:8123/sample-catalog/`.
2. The catalog displays 8 tech products with pre-configured matching classes:
   - **Card Container**: `.product-card`
   - **Title**: `.product-title`
   - **Price**: `.product-price`
   - **Link**: `.product-link`
3. Click the SmartExtract extension popup icon.
4. Keep the default preset **Preset: Sample Catalog (Default)**.
5. Click **Extract from Active Tab**.
6. All 8 items are extracted with title, formatted price, and absolute link!
7. Click **Download CSV** to inspect the generated spreadsheet.

### Method 2: Single-Page MVP Interactive Test Suite
We have built an end-to-end single-page test runner inside `test-mvp/index.html`.

1. Open `http://localhost:8123/test-mvp/index.html` or double-click `test-mvp/index.html`.
2. Click **Run All 5 Automated MVP Tests** in the top navigation bar.
3. The suite tests and validates:
   - ✅ **Test 1: Catalog Extraction** (extracts 8 catalog products in list mode).
   - ✅ **Test 2: CSV Safe Escaping** (verifies formula injection mitigation for `=`, `+`, `-`, `@`, `\t` and RFC 4180 quotes escaping).
   - ✅ **Test 3: Single Product Mode** (switches to detail view and extracts single product data).
   - ✅ **Test 4: Search Filter** (verifies live filtering in preview table).
   - ✅ **Test 5: Error Handling** (verifies that invalid CSS selector syntax is caught gracefully without throwing exceptions).

---

## ⚙️ Custom Selectors & Preset Guide

You can extract data from any web store by navigating to the **Selectors & Presets** tab:

| Selector Field | List Mode | Single Product Mode | Purpose |
| :--- | :--- | :--- | :--- |
| **Container Selector** | `.product-card, article, .item` | *Hidden (uses body)* | Defines the outer boundary for each individual product on the page. |
| **Title Selector** | `h2, .title, [itemprop="name"]` | `h1, .product-title` | Finds the heading or label for the product. |
| **Price Selector** | `.price, .product-price, .amount` | `.price, [itemprop="price"]` | Finds the price text (automatically cleaned if toggle is active). |
| **URL Selector** | `a.product-link, h2 a, a` | *Auto-detected* | Locates the anchor tag and resolves relative paths to absolute URLs. |

### Built-in Presets:
- **Sample Catalog**: Tailored for the included offline test catalog.
- **Generic E-Commerce List**: Uses common heuristic selectors (`.product, .item, article`, `h2, h3`, `[class*="price"]`, `a`).
- **Single Product Detail Page**: Configured for individual product view (`h1`, `.price`, `location.href`).
- **Amazon Style**: Configured for Amazon search results (`[data-component-type="s-search-result"]`).
- **Shopify / WooCommerce**: Configured for standard themes (`.grid__item, .card`, `.card__heading`, `.price`).
- **Custom Configured**: Allows you to save your own selector combination to `localStorage`.

---

## 🛡️ CSV Security & Formula Injection (DDE) Prevention

Standard CSV generators can expose users to **CSV Injection** (also known as Formula Injection or Dynamic Data Exchange attacks). If an untrusted website includes a product title like `=CMD|' /C calc'!A0`, spreadsheet software like Microsoft Excel, LibreOffice Calc, or Google Sheets could attempt to execute it as an operating system command or trigger external webhooks.

SmartExtract eliminates this vulnerability:
1. **Formula Trigger Sanitization**: Any cell beginning with `=`, `+`, `-`, `@`, `\t`, or `\r` is automatically prepended with a single apostrophe (`'`). In spreadsheet software, the leading apostrophe forces the application to treat the entire field as raw text, completely disabling formula execution.
2. **RFC 4180 Quote Escaping**: Any field containing commas, double quotes (`"`), or newlines is enclosed in double quotes, and internal quotes are doubled (`""`).
3. **UTF-8 Byte Order Mark**: Prepends `\uFEFF` so international currency characters and unicode typography display cleanly in Microsoft Excel.

---

## 🔒 Security & Privacy Guarantee

- **Zero Remote Code**: Contains no `eval()`, external scripts, or remote endpoints.
- **Zero Telemetry or Network Calls**: Extracted data is held strictly in local memory and is never transmitted anywhere.
- **Scoped Permissions**: Uses only `activeTab` (access only to the tab user actively clicked) and `scripting` (injecting DOM parser upon request).

---

## 📄 License

MIT License. Free to use, adapt, and distribute.


## Portfolio and testing notes

This is an independent demonstration project, not commissioned client work. The bundled HTML test harness is not a substitute for testing the installed extension on real Chrome tabs. Built-in presets are starting points and may need updating when website layouts change. Only extract data from websites where you have permission to do so.

**License:** No open-source license has been granted by this repository. Add a license only if you intend to grant those permissions.
