# SaleScout — Shop Analyzer

Full‑stack demo for analyzing Kaspi offers, showing price position, and visual growth projections for merchants.

Live demo: https://to1enoff.github.io/SaleScout/

## Features
- Kaspi URL validation and product ID extraction
- Internal Kaspi offers API fetch with pagination
- Leader price and shop lookup across all pages
- Proxy support via `PROXY_URLS`
- 4‑step UI flow: input → results → profit simulator → forecast
- Kaspi‑style mobile mockups for “before/after” Top‑1 auto‑reaction
- Recharts line chart with hover tooltips
- Profit simulator with price slider

## Tech
- Node.js + Express
- Undici (HTTP)
- React + Vite
- Recharts

## Setup
1. Install root deps:
   ```bash
   npm install
   ```
2. Install web deps:
   ```bash
   npm --prefix web install
   ```
3. Create `.env` (see `.env.example`).

## Run
- Server only:
  ```bash
  npm run dev:server
  ```
- Frontend only:
  ```bash
  npm run dev:web
  ```
- Both:
  ```bash
  npm run dev
  ```

## Environment
```
PORT=3001
PROXY_URLS=http://user:pass@host:port,http://user:pass@host:port
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash
```

## API
- `POST /api/analyze`
  ```json
  {
    "productUrl": "https://kaspi.kz/shop/p/...-145467625/",
    "myShopName": "MyShop",
    "options": {
      "fallbackWithoutZone": true
    }
  }
  ```

- `POST /api/growth`
  Body: result from `/api/analyze` (used for growth charts)

## Notes
- Kaspi API access may require valid proxy and headers.
- The app uses only the Kaspi internal offers API (no HTML parsing, no browser automation).

## Folder structure
```
/ (root)
  server.js
  src/
    analyzeKaspiProduct.js
  web/
    src/
      App.jsx
      styles.css
```
