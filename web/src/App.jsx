import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import phoneFrame from '../assets/Phone mockup.png';

const DEFAULT_URL = 'https://kaspi.kz/shop/p/apple-iphone-17-pro-max-256gb-oranzhevyi-145468241/?c=750000000';
const TRANSITION_MS = 260;

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

const COMPETITORS = [
  'Original',
  'GADGET-R',
  'MANISSA',
  'HOMME',
  'iPoint.KZ',
  'MobileX',
  'Market One',
  'ELITE MOBILE',
];

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const number = Number(value);
  return `${number.toLocaleString('ru-KZ')} ₸`;
}

function formatDelta(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const number = Math.abs(Number(value));
  return `- ${number.toLocaleString('ru-KZ')} ₸`;
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

function MetricCard({ title, value, tone, sub, icon }) {
  return (
    <div className={`metric-card ${tone || ''}`}>
      <div className="metric-title">
        {icon ? <span className="metric-icon">{icon}</span> : null}
        {title}
      </div>
      <div className="metric-value">{value}</div>
      {sub ? <div className="metric-sub">{sub}</div> : null}
    </div>
  );
}

function WizardProgress({ step, loading }) {
  const steps = [1, 2, 3, 4, 5];
  const percent = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <div className={`wizard-progress ${loading ? 'loading' : ''}`}>
      <div className="wizard-track">
        <div className="wizard-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="wizard-steps">
        {steps.map((item) => (
          <div key={item} className={`wizard-step ${item <= step ? 'active' : ''}`}>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WizardLayout({ step, loading, summary, stageClass, children, toast, containerRef }) {
  return (
    <div className="wizard">
      <WizardProgress step={step} loading={loading} />
      {toast ? <div className="toast">{toast}</div> : null}
      <div className="wizard-shell" ref={containerRef}>
        <div className={`wizard-stage ${stageClass}`}>{children}</div>
      </div>
    </div>
  );
}

function StepHeader({ title, onBack, backDisabled, onNext, nextLabel, nextDisabled, nextLoading }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      <div className="nav-actions">
        {onBack ? (
          <button className="ghost" type="button" onClick={onBack} disabled={backDisabled}>
            Назад
          </button>
        ) : null}
        {onNext ? (
          <button className="button" type="button" onClick={onNext} disabled={nextDisabled}>
            {nextLoading ? (
              <span className="button-loading">
                <span className="spinner" />
                Считаем…
              </span>
            ) : (
              nextLabel
            )}
          </button>
        ) : null}
      </div>
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

function GrowthCharts({
  salesNow,
  salesProjected,
  growth,
  trafficGrowth,
  conversionGrowth,
  profitNow,
  profitProjected,
  showDetails,
}) {
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
      <div className="chart-card">
        <div className="chart-title">Продажи в день: сейчас vs после</div>
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
        <div className="chart-caption">После выхода в TOP‑1 продажи вырастут примерно на 150%.</div>
      </div>

      {showDetails ? (
        <>
          <div className="chart-card chart-card--footer" style={{ height: 350 }}>
            <div className="chart-title">Подробнее: рост продаж и прибыли</div>
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
                <div className="bar-value">{formatCurrency(profitValue)}</div>
              </div>
            </div>
            <div className="chart-footer">
              <div className="chart-caption">
                Наведи на колонну — высота увеличится на процент разницы до/после.
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-title">Подробнее: вклад каналов</div>
            <div className="donuts">
              <Donut percent={growth} label="Продажи" />
              <Donut percent={trafficGrowth} label="Трафик" />
              <Donut percent={conversionGrowth} label="Конверсия" />
            </div>
            <div className="chart-caption">Реалистичное распределение влияния на рост.</div>
          </div>
        </>
      ) : null}
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

function StarIcon({ filled }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="star-icon"
    >
      <path
        d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.6 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5z"
        fill={filled ? '#16a34a' : '#d1d5db'}
      />
    </svg>
  );
}

function RatingStars({ rating }) {
  const full = Math.floor(rating);
  const stars = Array.from({ length: 5 }, (_, index) => index < full);
  return (
    <div className="stars">
      {stars.map((filled, index) => (
        <StarIcon key={index} filled={filled} />
      ))}
      <span className="rating-value">{rating}</span>
    </div>
  );
}

function OfferRow({ offer, isMoving }) {
  const meta = buildOfferMeta(offer);

  return (
    <div className={`offer-row kaspi ${offer.highlight ? 'highlight' : ''} ${isMoving ? 'moving' : ''}`}>
      <div className="offer-left">
        <div className="offer-shop">
          {offer.name}
          {offer.highlight ? <span className="badge">Ваш магазин</span> : null}
        </div>
        <div className="offer-rating">
          <RatingStars rating={Number(meta.rating)} />
          <span className="reviews">({meta.reviews} отзывов)</span>
        </div>
        <div className="offer-shipping">
          {meta.shippingLines.slice(0, 2).map((line, lineIndex) => (
            <div key={lineIndex} className="shipping-line">
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className="offer-right">
        <div className="offer-price">{formatCurrency(offer.price)}</div>
        <div className="offer-monthly">{formatCurrency(meta.monthly)}</div>
        <button className="offer-button" type="button">
          Выбрать
        </button>
      </div>
    </div>
  );
}

function buildAnimatedOffers({ leaderShop, leaderPrice, myShopName, myShopPrice, myShopPosition }) {
  const base = Number(leaderPrice || 700000);
  const deltas = [0, 180, 320, 480, 650, 820];
  const names = [leaderShop || 'Leader', ...COMPETITORS].slice(0, deltas.length);

  const offers = names.map((name, index) => ({
    id: `${name}-${index}`,
    name,
    price: base + deltas[index],
    highlight: false,
  }));

  const targetIndex = myShopPosition && myShopPosition > 0 && myShopPosition <= offers.length
    ? myShopPosition - 1
    : offers.length - 1;

  offers[targetIndex] = {
    ...offers[targetIndex],
    id: `my-shop-${targetIndex}`,
    name: myShopName || 'Ваш магазин',
    price: myShopPrice || base + deltas[targetIndex],
    highlight: true,
  };

  return offers;
}

export default function App() {
  const [productUrl, setProductUrl] = useState(DEFAULT_URL);
  const [shopName, setShopName] = useState('GadgetPro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1);
  const [displayStep, setDisplayStep] = useState(1);
  const [transitionStage, setTransitionStage] = useState('entered');
  const [transitionDir, setTransitionDir] = useState('forward');
  const [toast, setToast] = useState('');
  const [growthData, setGrowthData] = useState(DEFAULT_GROWTH);
  const [growthLoading, setGrowthLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [costPrice, setCostPrice] = useState('');
  const [minMarginPct, setMinMarginPct] = useState('10');
  const [currentSales, setCurrentSales] = useState('50');
  const [customPrice, setCustomPrice] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [animatedOffers, setAnimatedOffers] = useState([]);
  const [movingId, setMovingId] = useState(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const phoneScreenRef = useRef(null);
  const animationMetaRef = useRef({ initialIndex: 0, startPrice: 0, targetPrice: 0 });
  const intervalRef = useRef(null);
  const containerRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

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

  const effectivePrice = useMemo(() => {
    const parsed = Number(customPrice);
    if (!customPrice || Number.isNaN(parsed)) return recommendedPrice;
    if (!minAllowedPrice) return parsed;
    return Math.max(parsed, minAllowedPrice);
  }, [customPrice, recommendedPrice, minAllowedPrice]);

  const profitProjectedCustom = useMemo(() => {
    if (!effectivePrice || !costPrice || !projectedSales) return null;
    const perUnit = Number(effectivePrice) - Number(costPrice);
    return Math.round(perUnit * projectedSales);
  }, [effectivePrice, costPrice, projectedSales]);

  const profitDelta = useMemo(() => {
    if (!profitNow || !profitProjectedCustom) return null;
    return profitProjectedCustom - profitNow;
  }, [profitNow, profitProjectedCustom]);

  const profitDeltaPct = useMemo(() => {
    if (!profitNow || !profitProjectedCustom) return null;
    return Math.round(((profitProjectedCustom - profitNow) / profitNow) * 100);
  }, [profitNow, profitProjectedCustom]);

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

  const canProceedStep2 = Boolean(result && result.myShopPosition && result.myShopPrice && result.leaderPrice);
  const canProceedStep3 = Boolean(Number(costPrice) > 0 && Number(minMarginPct) > 0);
  const canProceedStep5 = Boolean(leadName.trim() && leadPhone.trim());
  const isTransitioning = transitionStage !== 'entered';

  useEffect(() => {
    if (!result) return;

    const initial = buildAnimatedOffers({
      leaderShop: result.leaderShop,
      leaderPrice: result.leaderPrice,
      myShopName: shopName,
      myShopPrice: result.myShopPrice,
      myShopPosition: result.myShopPosition,
    });

    setAnimatedOffers(initial);
    setMovingId(initial.find((offer) => offer.highlight)?.id ?? null);
  }, [result, shopName]);

  useEffect(() => {
    if (!result || animationKey === 0) return;

    const initial = buildAnimatedOffers({
      leaderShop: result.leaderShop,
      leaderPrice: result.leaderPrice,
      myShopName: shopName,
      myShopPrice: result.myShopPrice,
      myShopPosition: result.myShopPosition,
    });

    const initialIndex = initial.findIndex((offer) => offer.highlight);
    const startPrice = initial[initialIndex]?.price ?? result.myShopPrice ?? result.leaderPrice ?? 0;
    const targetPrice = recommendedPrice ?? (result.leaderPrice ? result.leaderPrice - 1 : startPrice);

    animationMetaRef.current = { initialIndex, startPrice, targetPrice };
    setAnimatedOffers(initial);
    setMovingId(initial[initialIndex]?.id ?? null);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setAnimatedOffers((prev) => {
        const index = prev.findIndex((offer) => offer.highlight);
        if (index <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return prev;
        }

        const next = [...prev];
        const highlighted = next[index];
        const swapTarget = next[index - 1];
        next[index - 1] = { ...highlighted };
        next[index] = { ...swapTarget };

        const { initialIndex: startIndex, startPrice: origin, targetPrice: target } = animationMetaRef.current;
        const progress = startIndex > 0 ? (startIndex - (index - 1)) / startIndex : 1;
        const newPrice = Math.round(origin - (origin - target) * progress);
        next[index - 1] = { ...next[index - 1], price: newPrice };
        return next;
      });
    }, 650);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [animationKey, result, shopName, recommendedPrice]);

  useEffect(() => {
    if (!phoneScreenRef.current) return;
    const container = phoneScreenRef.current;
    const element = container.querySelector('.offer-row.highlight');
    if (!element) return;
    const top = element.offsetTop - container.clientHeight / 2 + element.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, [animatedOffers]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const startTransition = (nextStep) => {
    if (nextStep === displayStep) return;
    setTransitionDir(nextStep > displayStep ? 'forward' : 'back');
    setTransitionStage('exiting');

    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);

    transitionTimerRef.current = setTimeout(() => {
      setDisplayStep(nextStep);
      setStep(nextStep);
      setTransitionStage('entering');

      requestAnimationFrame(() => {
        setTransitionStage('entered');
      });

      if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      setToast(`Готово: шаг ${nextStep}`);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToast(''), 2000);
    }, TRANSITION_MS);
  };

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
      startTransition(2);
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

  const handleNextFromStep2 = () => {
    if (!canProceedStep2 || isTransitioning) return;
    startTransition(3);
  };

  const handleNextFromStep3 = async () => {
    if (!canProceedStep3 || isTransitioning) return;
    setNextLoading(true);
    await loadGrowth();
    setNextLoading(false);
    startTransition(4);
  };

  const stageClass = `${transitionStage} ${transitionDir}`;
  const progressLoading = loading || nextLoading || isTransitioning;

  const stepContent = (
    <>
      {displayStep === 1 && (
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
            <span className="helper">Название, как указано в Kaspi (например: ELITE MOBILE)</span>
          </label>

          <button className="button" type="submit" disabled={!canSubmit || loading || isTransitioning}>
            {loading ? (
              <span className="button-loading">
                <span className="spinner" />
                Считаем…
              </span>
            ) : (
              'Показать моё место и сколько я теряю'
            )}
          </button>
          <div className="micro">Займёт ~10 секунд • Без регистрации</div>

          {error ? <div className="error">{error}</div> : null}
        </form>
      )}

      {displayStep === 2 && (
        <section className="results">
          <StepHeader
            title="Результаты"
            onBack={() => startTransition(1)}
            backDisabled={isTransitioning}
            onNext={handleNextFromStep2}
            nextLabel="Дальше"
            nextDisabled={!canProceedStep2 || isTransitioning}
          />
          {result ? (
            <>
              <div className="metric-grid">
                <MetricCard
                  title="Позиция"
                  value={result.myShopPosition ?? '—'}
                  tone="warn"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M6 3h12v3h3v4c0 3.3-2 6.2-4.9 7.3L15 21H9l-1.1-3.7C5 16.2 3 13.3 3 10V6h3V3zm-1 5v2c0 2.2 1.4 4.2 3.4 4.9l.8.3L10 18h4l.8-2.8.8-.3C17.6 14.2 19 12.2 19 10V8H5z"
                        fill="#d97706"
                      />
                    </svg>
                  }
                />
                <MetricCard
                  title="Ваша цена"
                  value={formatCurrency(result.myShopPrice)}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 7a2 2 0 0 1 2-2h7l9 9-7 7-9-9V7z" fill="#0ea5e9" />
                      <circle cx="8.5" cy="8.5" r="1.5" fill="#fff" />
                    </svg>
                  }
                />
                <MetricCard
                  title="Top‑1 цена"
                  value={formatCurrency(result.leaderPrice)}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2l3 6 6 .9-4.3 4.2 1 6-5.7-3-5.7 3 1-6L3 8.9 9 8l3-6z" fill="#ef4444" />
                    </svg>
                  }
                />
                <MetricCard
                  title="До Top‑1"
                  value={formatDelta(result.priceToTop1)}
                  tone="danger"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 20l-7-8h4V4h6v8h4l-7 8z" fill="#ef4444" />
                    </svg>
                  }
                />
              </div>
              <div className="leader">Лидер сейчас: {result.leaderShop || '—'}</div>
              <div className="insight">
                <span className="insight-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 2a7 7 0 0 0-4 12.8V18a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-3.2A7 7 0 0 0 12 2zm-2 18v-1h4v1h-4zm4.5-7.5-1.5.9V16h-2v-2.6l-1.5-.9a4 4 0 1 1 5 0z"
                      fill="#1e40af"
                    />
                  </svg>
                </span>
                Инсайт: Вы на {result.myShopPosition ?? '—'} месте. Снижение цены на{' '}
                {formatDelta(result.priceToTop1)} может вывести вас в TOP‑1 и увеличить продажи.
              </div>
            </>
          ) : (
            <div className="empty">Нет данных. Вернитесь и запустите анализ.</div>
          )}

          <div className="info-card">
            <div
              className="offer-block phone-single"
              onMouseEnter={() => setAnimationKey((value) => value + 1)}
            >
              <div className="phone-mock">
                <img className="phone-frame" src={phoneFrame} alt="Phone" />
                <div className="phone-screen" ref={phoneScreenRef}>
                  <div className="kaspi-header">
                    <span className="kaspi-time">17:48</span>
                    <div className="kaspi-icons">
                      <span className="kaspi-signal" />
                      <span className="kaspi-wifi" />
                      <span className="kaspi-battery">64</span>
                    </div>
                  </div>
                  <div className="kaspi-search">
                    <span className="kaspi-back">‹</span>
                    <div className="kaspi-search-input">
                      <span className="kaspi-search-icon" />
                      Поиск в Магазине
                    </div>
                    <span className="kaspi-close">×</span>
                  </div>
                  <div className="kaspi-tabs">
                    <div className="tab">Обзор</div>
                    <div className="tab active">Продавцы</div>
                    <div className="tab">О товаре</div>
                    <div className="tab">Отзывы</div>
                  </div>
                  <div className="kaspi-banner">Бонусы при оплате Kaspi Gold. Доставка завтра.</div>
                  <div className="kaspi-pills">
                    <span>3 мес</span>
                    <span>6 мес</span>
                    <span className="active">12 мес</span>
                    <span>24 мес</span>
                  </div>
                  <div className="kaspi-subtitle">Как вас видят покупатели сейчас → после</div>
                  <div className="offer-list kaspi-list">
                    {animatedOffers.map((offer) => (
                      <OfferRow key={offer.id} offer={offer} isMoving={offer.id === movingId} />
                    ))}
                  </div>
                  <div className="kaspi-spacer" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {displayStep === 3 && (
        <section className="results">
          <StepHeader
            title="Симулятор прибыли"
            onBack={() => startTransition(2)}
            backDisabled={isTransitioning || nextLoading}
            onNext={handleNextFromStep3}
            nextLabel="Дальше"
            nextDisabled={!canProceedStep3 || isTransitioning || nextLoading}
            nextLoading={nextLoading}
          />

          <div className="info-card">
            <div className="big-profit">
              Прибыль после оптимизации
              <div className="big-profit-value">+{formatCurrency(profitProjectedCustom)}</div>
              {profitDelta !== null ? (
                <div className="profit-diff">
                  Было: {formatCurrency(profitNow)} → Стало: {formatCurrency(profitProjectedCustom)}
                  {profitDeltaPct !== null ? ` • ↑ +${profitDeltaPct}%` : ''}
                </div>
              ) : null}
            </div>

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
                <span>Продаж в месяц</span>
                <input
                  type="number"
                  min="0"
                  value={currentSales}
                  onChange={(event) => setCurrentSales(event.target.value)}
                  placeholder="50"
                />
              </label>
            </div>

            <div className="slider-block">
              <div className="slider-header">
                <span>Цена (не ниже минимальной)</span>
                <strong>{formatCurrency(effectivePrice)}</strong>
              </div>
              <input
                className="price-slider"
                type="range"
                min={minAllowedPrice ?? 0}
                max={result?.leaderPrice ? result.leaderPrice - 1 : recommendedPrice ?? minAllowedPrice ?? 0}
                value={effectivePrice ?? 0}
                onChange={(event) => setCustomPrice(event.target.value)}
              />
              <div className="slider-range">
                <span>Мин: {formatCurrency(minAllowedPrice)}</span>
                <span>Текущая: {formatCurrency(result?.myShopPrice)}</span>
              </div>
            </div>

            <div className="sim-results">
              <ResultRow label="Мин. допустимая цена" value={minAllowedPrice} isPrice />
              <ResultRow label="Цена для расчёта" value={effectivePrice} isPrice />
              <ResultRow label="Ожидаемый рост продаж" value={`+${salesLift}%`} />
            </div>
          </div>
        </section>
      )}

      {displayStep === 4 && (
        <section className="results">
          <StepHeader
            title="Итог при выходе в TOP-1"
            onBack={() => startTransition(3)}
            backDisabled={isTransitioning}
          />
          <div className="final-summary">
            <div className="final-hero">
              {profitProjectedCustom !== null && profitNow !== null
                ? `+${formatCurrency(profitProjectedCustom - profitNow)} / месяц`
                : '+ — / месяц'}
            </div>
            <div className="final-sales">
              {currentSales || '—'} → {projectedSales ?? '—'} продаж
            </div>

            <div className="final-line">
              <span>Сейчас</span>
              <strong>{formatCurrency(profitNow)}</strong>
            </div>
            <div className="final-line">
              <span>После</span>
              <strong>{formatCurrency(profitProjectedCustom ?? profitProjected)}</strong>
            </div>

            <div className="final-price">
              Цена для TOP‑1: {formatCurrency(recommendedPrice)}
            </div>

            <div className="final-protect">
              <div className="final-protect-title">Защита</div>
              <ul>
                <li>мин. цена {formatCurrency(minAllowedPrice)}</li>
                <li>ниже не опускаемся</li>
              </ul>
            </div>

            <div className="final-reco">
              Рекомендация: выйти в TOP‑1 автоматически
            </div>
          </div>

          <button className="cta-button receipt-cta" type="button" onClick={() => startTransition(5)}>
            Хочу такой результат
          </button>
        </section>
      )}

      {displayStep === 5 && (
        <section className="results">
          <StepHeader
            title="Заявка"
            onBack={() => startTransition(4)}
            backDisabled={isTransitioning}
          />
          <div className="info-card">
            <div className="lead-card">
              <label className="field">
                <span>Имя</span>
                <input
                  type="text"
                  value={leadName}
                  onChange={(event) => setLeadName(event.target.value)}
                  placeholder="Например, Айдар"
                />
              </label>
              <label className="field">
                <span>Контактный номер</span>
                <input
                  type="tel"
                  value={leadPhone}
                  onChange={(event) => setLeadPhone(event.target.value)}
                  placeholder="+7 777 123 45 67"
                />
              </label>
              <button className="button" type="button" disabled={!canProceedStep5 || isTransitioning}>
                Оставить заявку
              </button>
              <div className="micro">Менеджер свяжется с вами в ближайшее время.</div>
            </div>
          </div>
        </section>
      )}
    </>
  );

  return (
    <div className="page">
      <header className="header">
        <img className="logo" src={logo} alt="SaleScout" />
      </header>

      <WizardLayout
        step={displayStep}
        loading={progressLoading}
        stageClass={stageClass}
        toast={toast}
        containerRef={containerRef}
      >
        {stepContent}
      </WizardLayout>
    </div>
  );
}
