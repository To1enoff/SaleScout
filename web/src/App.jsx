import React, { useMemo, useState } from 'react';
import logo from '../assets/salescout__logo.png';

const DEFAULT_URL = 'https://kaspi.kz/shop/p/apple-iphone-17-pro-max-256gb-oranzhevyi-145468241/?c=750000000';

const DEFAULT_GROWTH = {
  salesLiftPercent: 40,
  conversionPercent: 1.8,
  trafficOrganicPercent: 24,
  trafficAdsPercent: 41,
  salesTrend: [12, 16, 21, 27, 32, 36, 40],
  conversionSeries: [32, 46, 61, 78],
  captions: {
    sales: '+40% продаж за 30 дней после оптимизации цены и позиции',
    conversion: 'CR до 1.8% за счёт более привлекательного оффера',
    traffic: 'Рост органики и рекламы после вывода в ТОП‑3',
  },
};

const COMPETITORS = ['Original', 'GADGET-R', 'MANISSA', 'HOMME', 'iPoint.KZ', 'MobileX', 'Market One'];

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
      <div className={`step-line ${step >= 4 ? 'active' : ''}`} />
      <div className={`step ${step >= 4 ? 'active' : ''}`}>4</div>
    </div>
  );
}

function buildLinePath(values) {
  if (!Array.isArray(values) || values.length === 0) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = (360 - 20) / (values.length - 1 || 1);

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

function calcSalesLift(result) {
  if (!result?.leaderPrice || !result?.priceToTop1) return 40;
  const ratio = Math.min(1, Math.max(0, result.priceToTop1 / result.leaderPrice));
  return Math.max(40, Math.round(20 + ratio * 40));
}

function buildTop5({ leaderShop, leaderPrice, myShopName, myShopPrice, myShopPosition, recommendedPrice }) {
  if (!leaderPrice) return { before: [], after: [] };

  const base = Number(leaderPrice);
  const deltas = [0, 150, 230, 400, 650];
  const competitors = COMPETITORS.filter(
    (name) => name.toLowerCase() !== String(myShopName || '').toLowerCase() && name !== leaderShop,
  );
  const baseNames = [leaderShop || 'Leader', ...competitors].slice(0, 5);

  const before = baseNames.map((name, index) => ({
    name,
    price: base + deltas[index],
  }));

  if (myShopPosition && myShopPosition <= 5) {
    before[myShopPosition - 1] = {
      name: myShopName || 'Ваш магазин',
      price: myShopPrice || base + deltas[myShopPosition - 1],
      highlight: true,
    };
  }

  const after = [
    {
      name: myShopName || 'Ваш магазин',
      price: recommendedPrice || base - 1,
      highlight: true,
    },
    ...before
      .filter((item) => String(item.name).toLowerCase() !== String(myShopName || '').toLowerCase())
      .slice(0, 4),
  ];

  return { before, after };
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
  const [costPrice, setCostPrice] = useState('');
  const [minMarginPct, setMinMarginPct] = useState('10');
  const [currentSales, setCurrentSales] = useState('50');

  const canSubmit = useMemo(() => productUrl.trim() && shopName.trim(), [productUrl, shopName]);

  const minAllowedPrice = useMemo(() => {
    const cost = Number(costPrice);
    const margin = Number(minMarginPct) / 100;
    if (!cost || Number.isNaN(cost)) return null;
    return Math.round(cost * (1 + (Number.isNaN(margin) ? 0 : margin)));
  }, [costPrice, minMarginPct]);

  const recommendedPrice = useMemo(() => {
    if (!result?.leaderPrice) return null;
    const desired = result.leaderPrice - 1;
    if (!minAllowedPrice) return desired;
    return Math.max(desired, minAllowedPrice);
  }, [result, minAllowedPrice]);

  const salesLift = useMemo(() => calcSalesLift(result), [result]);

  const projectedSales = useMemo(() => {
    const base = Number(currentSales);
    if (!base || Number.isNaN(base)) return null;
    return Math.round(base * (1 + salesLift / 100));
  }, [currentSales, salesLift]);

  const profitNow = useMemo(() => {
    if (!result?.myShopPrice || !costPrice) return null;
    const units = Number(currentSales) || 0;
    const perUnit = Number(result.myShopPrice) - Number(costPrice);
    return Math.round(perUnit * units);
  }, [result, costPrice, currentSales]);

  const profitProjected = useMemo(() => {
    if (!recommendedPrice || !costPrice || !projectedSales) return null;
    const perUnit = Number(recommendedPrice) - Number(costPrice);
    return Math.round(perUnit * projectedSales);
  }, [recommendedPrice, costPrice, projectedSales]);

  const top5 = useMemo(
    () =>
      buildTop5({
        leaderShop: result?.leaderShop,
        leaderPrice: result?.leaderPrice,
        myShopName: shopName,
        myShopPrice: result?.myShopPrice,
        myShopPosition: result?.myShopPosition,
        recommendedPrice,
      }),
    [result, shopName, recommendedPrice],
  );

  const normalizedGrowth = useMemo(() => {
    const base = { ...DEFAULT_GROWTH, ...growthData };
    const lift = Math.max(40, Number(base.salesLiftPercent) || 40);
    return {
      ...base,
      salesLiftPercent: lift,
      captions: {
        ...base.captions,
        sales: `+${lift}% продаж за 30 дней после оптимизации цены и позиции`,
      },
    };
  }, [growthData]);

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
            <button className="ghost" type="button" onClick={() => setStep(3)}>
              Дальше
            </button>
          </div>
          {result ? (
            <div className="grid">
              <ResultRow label="Product ID" value={result.productId} />
              <ResultRow label="Лидер" value={result.leaderShop} />
              <ResultRow label="Лучшая цена" value={result.leaderPrice} isPrice />
              <ResultRow label="Цена магазина" value={result.myShopPrice} isPrice />
              <ResultRow label="ТОП‑N позиция" value={result.myShopPosition} />
              <ResultRow label="Цена до ТОП‑1" value={result.priceToTop1} isPrice />
            </div>
          ) : (
            <div className="empty">Нет данных. Вернитесь и запустите анализ.</div>
          )}

          <div className="info-card">
            <h3>Авто‑реакция на смену ТОП‑1</h3>
            <p>
              При смене лидера мы моментально пересчитываем цену, выводим ваш магазин в ТОП‑1 и не
              опускаем цену ниже допустимого минимума.
            </p>
            <div className="pill">Минимальная цена под контролем</div>

            <div className="offer-block">
              <div>
                <div className="offer-title">До оптимизации</div>
                <div className="offer-list">
                  {top5.before.map((offer, index) => (
                    <div key={`${offer.name}-${index}`} className={`offer-row ${offer.highlight ? 'highlight' : ''}`}>
                      <div className="offer-rank">{index + 1}</div>
                      <div className="offer-shop">{offer.name}</div>
                      <div className="offer-price">{formatCurrency(offer.price)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="offer-title">После оптимизации</div>
                <div className="offer-list">
                  {top5.after.map((offer, index) => (
                    <div key={`${offer.name}-${index}`} className={`offer-row ${offer.highlight ? 'highlight' : ''}`}>
                      <div className="offer-rank">{index + 1}</div>
                      <div className="offer-shop">{offer.name}</div>
                      <div className="offer-price">{formatCurrency(offer.price)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="results">
          <div className="section-header">
            <h2>Симулятор прибыли</h2>
            <button
              className="ghost"
              type="button"
              onClick={() => {
                setStep(4);
                loadGrowth();
              }}
            >
              Дальше
            </button>
          </div>

          <div className="info-card">
            <div className="sim-grid">
              <label className="field">
                <span>Себестоимость</span>
                <input
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={(event) => setCostPrice(event.target.value)}
                  placeholder="Напр. 620000"
                />
              </label>
              <label className="field">
                <span>Мин. маржа, %</span>
                <input
                  type="number"
                  min="0"
                  value={minMarginPct}
                  onChange={(event) => setMinMarginPct(event.target.value)}
                  placeholder="10"
                />
              </label>
              <label className="field">
                <span>Продаж в месяц сейчас</span>
                <input
                  type="number"
                  min="0"
                  value={currentSales}
                  onChange={(event) => setCurrentSales(event.target.value)}
                  placeholder="50"
                />
              </label>
            </div>

            <div className="sim-results">
              <ResultRow label="Мин. допустимая цена" value={minAllowedPrice} isPrice />
              <ResultRow label="Цена для ТОП‑1" value={recommendedPrice} isPrice />
              <ResultRow label="Ожидаемый рост продаж" value={`+${salesLift}%`} />
              <ResultRow label="Продаж после оптимизации" value={projectedSales} />
              <ResultRow label="Прибыль сейчас" value={profitNow} isPrice />
              <ResultRow label="Прибыль после оптимизации" value={profitProjected} isPrice />
            </div>

            <p className="note">
              Продать больше по чуть меньшей цене выгоднее, если маржа не опускается ниже допустимой.
            </p>
          </div>
        </section>
      )}

      {step === 4 && (
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
          {growthLoading ? (
            <div className="empty">Генерируем прогноз…</div>
          ) : (
            <GrowthCharts data={normalizedGrowth} />
          )}
        </section>
      )}
    </div>
  );
}
