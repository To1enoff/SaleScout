const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const { request } = require('undici');
const { analyzeKaspiProduct } = require('./src/analyzeKaspiProduct');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(express.json({ limit: '1mb' }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function buildFallbackGrowth(base) {
  const seed = Number(String(base?.productId || '0').slice(-4)) || 137;
  const salesLift = 24 + (seed % 18);
  const conversion = 1.4 + (seed % 6) / 10;
  const trafficOrganic = 18 + (seed % 22);
  const trafficAds = 28 + (seed % 24);
  const trend = [12, 15, 19, 24, 29, 33, 38].map((v) => v + (seed % 5));
  const conversionSeries = [32, 46, 61, 78].map((v) => v + (seed % 5));

  return {
    source: 'fallback',
    salesLiftPercent: salesLift,
    conversionPercent: Number(conversion.toFixed(1)),
    trafficOrganicPercent: trafficOrganic,
    trafficAdsPercent: trafficAds,
    salesTrend: trend,
    conversionSeries,
    captions: {
      sales: `+${salesLift}% ������ �� 30 ���� ����� ����������� ���� � �������`,
      conversion: `CR �� ${conversion.toFixed(1)}% �� ���� ����� ���������������� ������`,
      traffic: '���� �������� � ������� ����� ������ � ���?3',
    },
  };
}

async function generateGrowthWithGemini(base) {
  if (!GEMINI_API_KEY) {
    return buildFallbackGrowth(base);
  }

  const prompt = `
�� �������� e-commerce. ����� ������ JSON ��� ���������.
����� ������������� ������ ��� �������� ����� ����� ����� SaleScout.
������� ������:
productId: ${base?.productId || 'unknown'}
leaderPrice: ${base?.leaderPrice ?? 'unknown'}
myShopPrice: ${base?.myShopPrice ?? 'unknown'}
myShopPosition: ${base?.myShopPosition ?? 'unknown'}
priceToTop1: ${base?.priceToTop1 ?? 'unknown'}

������ JSON:
{
  "salesLiftPercent": number,          // 15-60
  "conversionPercent": number,         // 1.0-3.5
  "trafficOrganicPercent": number,     // 10-50
  "trafficAdsPercent": number,         // 15-60
  "salesTrend": [7 �����],             // ���� �� �������, 7 �����, 10-60
  "conversionSeries": [4 �����],       // 4 ����, 20-90
  "captions": {
    "sales": "������",
    "conversion": "������",
    "traffic": "������"
  }
}

������ �������� JSON.`.trim();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const { statusCode, body } = await request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 512,
      },
    }),
  });

  const text = await body.text();
  if (statusCode < 200 || statusCode >= 300) {
    return buildFallbackGrowth(base);
  }

  let raw = text;
  try {
    const parsed = JSON.parse(text);
    const content = parsed?.candidates?.[0]?.content?.parts?.map((p) => p.text).join(' ');
    if (content) raw = content;
  } catch (err) {
    // ignore, attempt to parse raw text
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return buildFallbackGrowth(base);
  }

  try {
    const data = JSON.parse(jsonMatch[0]);
    return { source: 'gemini', ...data };
  } catch (err) {
    return buildFallbackGrowth(base);
  }
}

app.post('/api/analyze', async (req, res) => {
  const { productUrl, myShopName, options } = req.body || {};

  if (!productUrl || !myShopName) {
    return res.status(400).json({ error: 'productUrl � myShopName �����������.' });
  }

  try {
    const result = await analyzeKaspiProduct(productUrl, myShopName, options || {});
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message || '������ �������.' });
  }
});

app.post('/api/growth', async (req, res) => {
  try {
    const data = await generateGrowthWithGemini(req.body || {});
    return res.json(data);
  } catch (err) {
    return res.status(200).json(buildFallbackGrowth(req.body || {}));
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
