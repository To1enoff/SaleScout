const { request, ProxyAgent } = require('undici');

const KASPI_HOST = 'kaspi.kz';
const CITY_ID = '750000000';
const LIMIT = 5;
const ZONE_ID = ['Magnum_ZONE1'];
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 300;

function normalizeName(value) {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .replace(/["'«»„“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractProductId(productUrl) {
  const url = String(productUrl);
  const directMatch = url.match(/-(\d+)(?=\/|\?|$)/);
  if (directMatch) return directMatch[1];

  const pathMatch = url.match(/\/shop\/p\/[^/]*?(\d+)(?=\/|\?|$)/);
  if (pathMatch) return pathMatch[1];

  const lastNumberMatch = url.match(/(\d+)(?!.*\d)/);
  return lastNumberMatch ? lastNumberMatch[1] : null;
}

function isKaspiUrl(productUrl) {
  try {
    const url = new URL(productUrl);
    return url.hostname === KASPI_HOST || url.hostname.endsWith(`.${KASPI_HOST}`);
  } catch (err) {
    return false;
  }
}

function isValidProxyUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

function parseProxyUrls(options = {}) {
  const raw = [];

  if (Array.isArray(options.proxyUrls) && options.proxyUrls.length > 0) {
    raw.push(...options.proxyUrls);
  } else if (process.env.PROXY_URLS) {
    raw.push(...process.env.PROXY_URLS.split(','));
  }

  const proxies = [];
  for (const item of raw) {
    const value = String(item).trim();
    if (!value) continue;

    if (isValidProxyUrl(value)) {
      proxies.push(value);
      continue;
    }

    if (options.debug) {
      console.error('[kaspi] invalid proxy url ignored:', value);
    }
  }

  return proxies;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postOffers(productId, page, options = {}) {
  const { debug = false } = options;
  const proxyUrls = parseProxyUrls(options);
  const cityId = options.cityId || CITY_ID;
  const zoneId = Array.isArray(options.zoneId) ? options.zoneId : ZONE_ID;

  const url = `https://kaspi.kz/yml/offer-view/offers/${productId}`;
  const referer = `https://kaspi.kz/shop/p/${productId}/?c=${cityId}`;

  const payload = {
    cityId,
    id: String(productId),
    merchantUID: [],
    limit: LIMIT,
    page,
    sortOption: 'PRICE',
    zoneId,
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const proxyUrl = proxyUrls.length > 0 ? proxyUrls[attempt % proxyUrls.length] : null;
    const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

    try {
      const { statusCode, body } = await request(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Content-Type': 'application/json; charset=UTF-8',
          Origin: 'https://kaspi.kz',
          Referer: referer,
          'User-Agent': 'Mozilla/5.0',
          'X-Description-Enabled': 'true',
          'X-KS-City': cityId,
          Cookie: `kaspi.storefront.cookie.city=${cityId}`,
        },
        body: JSON.stringify(payload),
        dispatcher,
      });

      const text = await body.text();

      if (statusCode < 200 || statusCode >= 300) {
        if (debug) {
          console.error('[kaspi] status:', statusCode);
          console.error('[kaspi] response (first 500 chars):', text.slice(0, 500));
        }
        throw new Error(`Kaspi API error: ${statusCode}`);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        if (debug) {
          console.error('[kaspi] json parse failed. response (first 500 chars):', text.slice(0, 500));
        }
        throw err;
      }

      return data;
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) throw err;
      const backoff = RETRY_BASE_MS * Math.pow(2, attempt);
      await sleep(backoff);
    }
  }

  return null;
}

function debugEmptyOffers(label, data, options = {}) {
  if (!options.debug) return;
  if (!data || typeof data !== 'object') {
    console.error(`[kaspi] ${label}: response is not an object`);
    return;
  }

  const keys = Object.keys(data);
  console.error(`[kaspi] ${label}: offers empty`);
  console.error('[kaspi] keys:', keys.join(', '));
  const preview = JSON.stringify(data);
  console.error('[kaspi] response (first 800 chars):', preview.slice(0, 800));
}

async function analyzeKaspiProduct(productUrl, myShopName, options = {}) {
  if (!isKaspiUrl(productUrl)) {
    throw new Error('Платформа не поддерживается. Вставьте ссылку на товар Kaspi.');
  }

  const productId = extractProductId(productUrl);
  if (!productId) {
    throw new Error('Не удалось извлечь productId из ссылки Kaspi.');
  }

  const normalizedTarget = normalizeName(myShopName);

  let firstPage = await postOffers(productId, 0, options);
  let firstOffers = Array.isArray(firstPage?.offers) ? firstPage.offers : [];

  if (firstOffers.length === 0) {
    debugEmptyOffers('page 0', firstPage, options);

    if (options.fallbackWithoutZone) {
      const retryOptions = { ...options, zoneId: [] };
      firstPage = await postOffers(productId, 0, retryOptions);
      firstOffers = Array.isArray(firstPage?.offers) ? firstPage.offers : [];

      if (firstOffers.length === 0) {
        debugEmptyOffers('page 0 without zoneId', firstPage, options);
      }
    }
  }

  if (firstOffers.length === 0) {
    return {
      productId: String(productId),
      leaderShop: null,
      leaderPrice: null,
      myShopFound: false,
      myShopPrice: null,
      myShopPosition: null,
      priceToTop1: null,
    };
  }

  const leader = firstOffers[0];
  const leaderPrice = leader.price;
  const leaderShop = leader.merchantName || leader.shopName || '';

  let myShopFound = false;
  let myShopPrice = null;
  let myShopPosition = null;

  let page = 0;
  while (true) {
    const data = page === 0 ? firstPage : await postOffers(productId, page, options);
    const offers = Array.isArray(data?.offers) ? data.offers : [];

    if (offers.length === 0) {
      debugEmptyOffers(`page ${page}`, data, options);
      break;
    }

    for (let index = 0; index < offers.length; index += 1) {
      const offer = offers[index];
      const name = normalizeName(offer?.merchantName || offer?.shopName);
      if (name && name === normalizedTarget) {
        myShopFound = true;
        myShopPrice = offer.price;
        myShopPosition = page * LIMIT + index + 1;
        break;
      }
    }

    if (myShopFound) break;
    page += 1;
  }

  const priceToTop1 = myShopFound ? myShopPrice - leaderPrice : null;

  return {
    productId: String(productId),
    leaderShop,
    leaderPrice,
    myShopFound,
    myShopPrice,
    myShopPosition,
    priceToTop1,
  };
}

module.exports = {
  analyzeKaspiProduct,
};
