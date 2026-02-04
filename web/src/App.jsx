import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import logo from '../assets/salescout__logo.png';

const DEFAULT_URL = 'https://kaspi.kz/shop/p/apple-iphone-17-pro-max-256gb-oranzhevyi-145468241/?c=750000000';

const DEFAULT_GROWTH = {
  salesLiftPercent: 150,
  conversionPercent: 1.8,
  trafficOrganicPercent: 24,
  trafficAdsPercent: 41,
  salesTrend: [12, 16, 21, 27, 32, 36, 40],
  conversionSeries: [32, 46, 61, 78],
  captions: {
    sales: '+150% продаж за 30 дней после оптимизации цены и позиции',
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

function buildDailySeries(baseDaily, growthPercent) {
  const variance = [0, -2, 1, -1, 3, -2, 4, -1, 2, -3, 1, 0, 2, -2, 3, -1, 1, 0, 2, -2, 3, -1, 0, 2, -2, 1, 0, 2, -1, 3];
  const afterMultiplier = 1 + growthPercent / 100;

  return variance.map((v, index) => {
    const before = Math.max(1, Math.round(baseDaily + v));
    const after = Math.max(1, Math.round((baseDaily + v) * afterMultiplier));
    return {
      day: index + 1,
      before,
      after,
    };
  });
}

function Donut({ percent, label }) {
  const radius = 42;
  const stroke = 10;
  const normalized = Math.min(95, Math.max(10, percent));
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="donut-card">
      <svg width="120" height="120" viewBox="0 0 120 120" className="donut">
        <circle
          className="donut-bg"
          cx="60"
          cy="60"
          r={radius}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className="donut-fg"
          cx="60"
          cy="60"
          r={radius}
          strokeWidth={stroke}
          fill="none"
          style={{
            '--donut-circ': circumference,
            '--donut-offset': offset,
          }}
        />
      </svg>
      <div className="donut-value">{normalized}%</div>
      <div className="donut-label">{label}</div>
    </div>
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function GrowthCharts({ salesNow, salesProjected, growth, trafficGrowth, conversionGrowth, profitNow, profitProjected }) {
  const [hovered, setHovered] = useState(null);
  const dailyNow = Math.max(1, Math.round((salesNow || 30) / 30));
  const dailySeries = buildDailySeries(dailyNow, growth);

  const salesDiffPct = salesNow && salesProjected ? ((salesProjected - salesNow) / salesNow) * 100 : growth;
  const profitDiffPct = profitNow && profitProjected ? ((profitProjected - profitNow) / profitNow) * 100 : growth;

  const salesDiff = clamp(Math.round(salesDiffPct), 10, 200);
  const profitDiff = clamp(Math.round(profitDiffPct), 10, 200);

  const baseSalesHeight = 120;
  const baseProfitHeight = 120;

  const salesHeight = hovered === 'sales'
    ? clamp(baseSalesHeight * (1 + salesDiff / 100), 60, 200)
    : baseSalesHeight;
  const profitHeight = hovered === 'profit'
    ? clamp(baseProfitHeight * (1 + profitDiff / 100), 60, 200)
    : baseProfitHeight;

  const salesValue = hovered === 'sales' ? salesProjected ?? '—' : salesNow ?? '—';
  const profitValue = hovered === 'profit' ? profitProjected ?? '—' : profitNow ?? '—';

  return (
    <div className="charts">
      <div className="chart-card chart-card--tall">
        <div className="chart-title">Продажи в день: сейчас и после (30 дней)</div>
        <div className="chart-canvas">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailySeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${value} шт.`, 'Продажи']} />
              <Line
                type="monotone"
                dataKey="before"
                name="До"
                stroke="#cbd5f5"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="after"
                name="После"
                stroke="#0ea5e9"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-caption">Рост продаж составляет 150% после выхода в ТОП‑1.</div>
      </div>

      <div className="chart-card chart-card--footer" style={{height:350}}>
        <div className="chart-title">Рост: продажи и прибыль</div>
        <div className="bars two tall">
          <div
            className="bar-group"
            onMouseEnter={() => setHovered('sales')}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="bar-area">
              <div className="bar" style={{ height: `${salesHeight}px`, width: '100px' }} />
            </div>
            <div className="bar-label">Рост продаж</div>
            <div className="bar-value">{salesValue}</div>
          </div>
          <div
            className="bar-group"
            onMouseEnter={() => setHovered('profit')}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="bar-area">
              <div className="bar accent" style={{ height: `${profitHeight}px`, width: '100px' }} />
            </div>
            <div className="bar-label">Рост прибыли</div>
            <div className="bar-value">{profitValue + "₸"}</div>
          </div>
        </div>
        <div className="chart-footer">
          <div className="chart-caption">
            Наведи на колонну — высота увеличится на процент разницы до/после.
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Вклад каналов в рост</div>
        <div className="donuts">
          <Donut percent={growth} label="Продажи" />
          <Donut percent={trafficGrowth} label="Трафик" />
          <Donut percent={conversionGrowth} label="Конверсия" />
        </div>
        <div className="chart-caption">Реалистичное распределение влияния на рост.</div>
      </div>
    </div>
  );
}

function calcSalesLift(result) {
  if (!result?.leaderPrice || !result?.priceToTop1) return 150;
  const ratio = Math.min(1, Math.max(0, result.priceToTop1 / result.leaderPrice));
  return Math.max(150, Math.round(80 + ratio * 70));
}

function seedFromName(name) {
  const text = String(name || 'shop');
  return text.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
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

function buildOfferMeta(offer) {
  const seed = seedFromName(offer.name);
  const rating = 4 + (seed % 10) / 10;
  const reviews = 20 + (seed % 180);
  const monthly = Math.round(Number(offer.price) / 24);

  const shippingLines = [
    'Постамат, Пт, бесплатно',
    'Доставка, Пт, бесплатно',
    'Express, завтра до 14:00, 995 ₸',
  ];

  return {
    rating: rating.toFixed(1),
    reviews,
    monthly,
    shippingLines,
  };
}

function RatingStars({ rating }) {
  const full = Math.floor(rating);
  const stars = Array.from({ length: 5 }, (_, index) => index < full);
  return (
    <div className="stars">
      {stars.map((filled, index) => (
        <span key={index} className={filled ? 'star filled' : 'star'}>
          ★
        </span>
      ))}
      <span className="rating-value">{rating}</span>
    </div>
  );
}

function OfferRow({ offer }) {
  const meta = buildOfferMeta(offer);

  return (
    <div className={`offer-row kaspi ${offer.highlight ? 'highlight' : ''}`}>
      <div className="offer-left">
        <div className="offer-shop">
          {offer.name}
          {offer.highlight ? <span className="badge">Ваш магазин</span> : null}
        </div>
        <div className="offer-rating">
          <RatingStars rating={Number(meta.rating)} />
          <span className="reviews">({meta.reviews} отзывов)</span>
        </div>
      </div>

      <div className="offer-middle">
        {meta.shippingLines.map((line, lineIndex) => (
          <div key={lineIndex} className="shipping-line">
            {line}
          </div>
        ))}
      </div>

      <div className="offer-right">
        <div className="offer-price">{formatCurrency(offer.price)}</div>
        <div className="offer-monthly">{formatCurrency(meta.monthly)}</div>
      </div>

      <button className="offer-button" type="button">
        Выбрать
      </button>
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
    const lift = Math.max(150, Number(base.salesLiftPercent) || 150);
    const traffic = Math.max(35, Math.min(85, Math.round(lift * 0.5)));
    const conversion = Math.max(20, Math.min(65, Math.round(lift * 0.35)));
    return {
      ...base,
      salesLiftPercent: lift,
      trafficGrowth: traffic,
      conversionGrowth: conversion,
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
              <ResultRow label="Позиция" value={"#" + result.myShopPosition} />
              <ResultRow label="Цена до ТОП‑1" value={"-" + result.priceToTop1} isPrice />
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
                    <OfferRow key={`before-${offer.name}-${index}`} offer={offer} />
                  ))}
                </div>
              </div>
              <div>
                <div className="offer-title">После оптимизации</div>
                <div className="offer-list">
                  {top5.after.map((offer, index) => (
                    <OfferRow key={`after-${offer.name}-${index}`} offer={offer} />
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
            <h2>Прогноз роста</h2>
            <button className="ghost" type="button" onClick={() => setStep(1)}>
              Новый анализ
            </button>
          </div>
          <p className="section-subtitle">
            Графики построены по текущим данным: прибыль, продажи и вклад каналов.
          </p>
          {growthLoading ? (
            <div className="empty">Генерируем прогноз…</div>
          ) : (
            <GrowthCharts
              salesNow={Number(currentSales) || null}
              salesProjected={projectedSales}
              growth={normalizedGrowth.salesLiftPercent}
              trafficGrowth={normalizedGrowth.trafficGrowth}
              conversionGrowth={normalizedGrowth.conversionGrowth}
              profitNow={profitNow}
              profitProjected={profitProjected}
            />
          )}
        </section>
      )}
    </div>
  );
}
