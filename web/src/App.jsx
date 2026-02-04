import React, { useMemo, useState } from 'react';
import logo from '../assets/salescout__logo.png';

const DEFAULT_URL = 'https://kaspi.kz/shop/p/apple-iphone-17-pro-max-256gb-oranzhevyi-145468241/?c=750000000';

const DEFAULT_GROWTH = {
  salesLiftPercent: 32,
  conversionPercent: 1.8,
  trafficOrganicPercent: 24,
  trafficAdsPercent: 41,
  salesTrend: [12, 16, 21, 27, 32, 36, 40],
  conversionSeries: [32, 46, 61, 78],
  captions: {
    sales: '+32% продаж за 30 дней после оптимизации цены и позиции',
    conversion: 'CR до 1.8% за счёт более привлекательного оффера',
    traffic: 'Рост органики и рекламы после вывода в ТОП‑3',
  },
};

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const number = Number(value);
  return `${number.toLocaleString('ru-KZ')} ₸`;
}

function ResultRow({ label, value, isPrice = false }) {
  const display = isPrice ? formatCurrency(value) : value ?? '—';
  return (
    <div className="row">
      <div className="label">{label}</div>
      <div className="value">{display}</div>
    </div>
  );
}

function StepHeader({ step }) {
  return (
    <div className="stepper">
      <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
      <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
      <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
      <div className={`step-line ${step >= 3 ? 'active' : ''}`} />
      <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
    </div>
  );
}

function buildLinePath(values) {
  if (!Array.isArray(values) || values.length === 0) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const width = 360;
  const height = 160;
  const step = (width - 20) / (values.length - 1 || 1);

  return values
    .map((value, index) => {
      const x = 10 + index * step;
      const y = 150 - ((value - min) / range) * 120;
      return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
    })
    .join(' ');
}

function GrowthCharts({ data }) {
  const linePath = buildLinePath(data.salesTrend);
  const areaPath = `${linePath} L350 150 L10 150 Z`;

  return (
    <div className="charts">
      <div className="chart-card">
        <div className="chart-title">ИИ‑прогноз роста продаж</div>
        <svg viewBox="0 0 360 160" className="chart">
          <path className="chart-line" d={linePath} />
          <path className="chart-area" d={areaPath} />
        </svg>
        <div className="chart-caption">{data.captions?.sales}</div>
      </div>

      <div className="chart-card">
        <div className="chart-title">ИИ‑оценка конверсии</div>
        <div className="bars">
          {data.conversionSeries.map((value, index) => (
            <div key={index} className="bar" style={{ '--h': `${value}%` }} />
          ))}
        </div>
        <div className="chart-caption">{data.captions?.conversion}</div>
      </div>

      <div className="chart-card">
        <div className="chart-title">ИИ‑распределение трафика</div>
        <div className="rings">
          <div className="ring">
            <span>+{data.trafficOrganicPercent}%</span>
          </div>
          <div className="ring">
            <span>+{data.trafficAdsPercent}%</span>
          </div>
        </div>
        <div className="chart-caption">{data.captions?.traffic}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [productUrl, setProductUrl] = useState(DEFAULT_URL);
  const [shopName, setShopName] = useState('GadgetPro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1);
  const [growthData, setGrowthData] = useState(DEFAULT_GROWTH);
  const [growthLoading, setGrowthLoading] = useState(false);

  const canSubmit = useMemo(() => productUrl.trim() && shopName.trim(), [productUrl, shopName]);

  async function handleAnalyze(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productUrl: productUrl.trim(),
          myShopName: shopName.trim(),
          options: {
            fallbackWithoutZone: true,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Ошибка запроса');
      }

      setResult(data);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Ошибка запроса');
    } finally {
      setLoading(false);
    }
  }

  async function loadGrowth() {
    setGrowthLoading(true);
    try {
      const response = await fetch('/api/growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result || {}),
      });
      const data = await response.json();
      setGrowthData({ ...DEFAULT_GROWTH, ...data });
    } catch (err) {
      setGrowthData(DEFAULT_GROWTH);
    } finally {
      setGrowthLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <img className="logo" src={logo} alt="SaleScout" />
      </header>

      <StepHeader step={step} />

      {step === 1 && (
        <form className="card" onSubmit={handleAnalyze}>
          <label className="field">
            <span>Ссылка на товар Kaspi</span>
            <input
              type="url"
              value={productUrl}
              onChange={(event) => setProductUrl(event.target.value)}
              placeholder="https://kaspi.kz/shop/p/...-145467625/"
            />
          </label>

          <label className="field">
            <span>Название вашего магазина</span>
            <input
              type="text"
              value={shopName}
              onChange={(event) => setShopName(event.target.value)}
              placeholder="GadgetPro"
            />
          </label>

          <button className="button" type="submit" disabled={!canSubmit || loading}>
            {loading ? 'Анализируем…' : 'Запустить анализ'}
          </button>

          {error ? <div className="error">{error}</div> : null}
        </form>
      )}

      {step === 2 && (
        <section className="results">
          <div className="section-header">
            <h2>Результаты</h2>
            <button
              className="ghost"
              type="button"
              onClick={() => {
                setStep(3);
                loadGrowth();
              }}
            >
              Дальше
            </button>
          </div>
          {result ? (
            <div className="grid">
              <ResultRow label="Product ID" value={result.productId} />
              <ResultRow label="Лидер" value={result.leaderShop} />
              <ResultRow label="Лучшая цена" value={result.leaderPrice} isPrice />
              <ResultRow label="Цена магазина" value={result.myShopPrice} isPrice />
              <ResultRow label="Позиция" value={"#" + result.myShopPosition} />
              <ResultRow label="Цена до ТОП‑1" value={result.priceToTop1} isPrice />
            </div>
          ) : (
            <div className="empty">Нет данных. Вернитесь и запустите анализ.</div>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="results">
          <div className="section-header">
            <h2>Прогноз роста с SaleScout</h2>
            <button className="ghost" type="button" onClick={() => setStep(1)}>
              Новый анализ
            </button>
          </div>
          <p className="section-subtitle">
            ИИ моделирует рост продаж на основе истории цен, конкурентов и текущей позиции.
          </p>
          {growthLoading ? <div className="empty">Генерируем прогноз…</div> : <GrowthCharts data={growthData} />}
        </section>
      )}
    </div>
  );
}
