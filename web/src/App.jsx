import React, { useEffect, useMemo, useRef, useState } from 'react';
import logo from '../assets/salescout__logo.png';
import phoneFrame from '../assets/Phone mockup.png';

const TRANSITION_MS = 260;

const INTRO_OFFERS = [
  { id: 'elite', name: 'ELITE MOBILE', price: 723500 },
  { id: 'original', name: 'Original', price: 724200 },
  { id: 'myshop', name: 'Ваш магазин', price: 725000 },
  { id: 'gadget', name: 'GADGET-R', price: 725600 },
];

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

function formatDeltaSigned(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const number = Number(value);
  const abs = Math.abs(number);
  const sign = number > 0 ? '-' : number < 0 ? '+' : '';
  return `${sign} ${abs.toLocaleString('ru-KZ')} ₸`;
}

function absNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.abs(num);
}

function isValidPhone(value) {
  if (!value) return false;
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 12) return false;
  return /^(\+?\d[\d\s()-]+)$/.test(String(value).trim());
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

function WizardProgress({ step, loading, completedSteps, onStepClick }) {
  const steps = [1, 2, 3, 4];
  const maxReached = Math.max(step, ...completedSteps, 1);
  const percent = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <div className={`wizard-progress ${loading ? 'loading' : ''}`}>
      <div className="wizard-track">
        <div className="wizard-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="wizard-steps">
        {steps.map((item) => {
          const isCompleted = completedSteps.includes(item);
          const isActive = item === step;
          const isDisabled = item > maxReached;
          return (
            <button
              key={item}
              type="button"
              className={`wizard-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => onStepClick(item)}
              disabled={isDisabled}
            >
              <span>{isCompleted && !isActive ? '✓' : item}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WizardLayout({ step, loading, stageClass, children, toast, containerRef, completedSteps, onStepClick }) {
  return (
    <div className="wizard">
      <WizardProgress step={step} loading={loading} completedSteps={completedSteps} onStepClick={onStepClick} />
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

function buildIntroOffers(step) {
  const base = INTRO_OFFERS.map((offer) => ({ ...offer, highlight: false, status: '' }));
  const myIndex = 2;

  if (step === 0) {
    base[myIndex] = { ...base[myIndex], highlight: true, status: '#3' };
    return base;
  }

  if (step === 1) {
    base[myIndex] = { ...base[myIndex], highlight: true, price: base[myIndex].price - 1, status: '−1 ₸' };
    return base;
  }

  if (step === 2) {
    const moved = [base[myIndex], ...base.slice(0, myIndex), ...base.slice(myIndex + 1)];
    moved[0] = { ...moved[0], highlight: true, status: '#1' };
    return moved;
  }

  return base;
}

function buildOfferMeta(offer) {
  const seed = String(offer.name || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const rating = 4 + (seed % 10) / 10;
  const reviews = 20 + (seed % 180);
  const monthly = Math.round(Number(offer.price) / 24);

  const shippingLines = [
    'Постамат, Пт, бесплатно',
    'Доставка, Пт, бесплатно',
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
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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

function OfferRow({ offer, variant }) {
  const meta = buildOfferMeta(offer);

  return (
    <div className={`offer-row kaspi ${offer.highlight ? 'highlight' : ''} ${variant || ''}`}>
      <div className="offer-left">
        <div className="offer-shop">
          {offer.name}
          {offer.highlight ? <span className="badge">Ваш магазин</span> : null}
          {offer.status ? <span className="mini-pill">{offer.status}</span> : null}
        </div>
        <div className="offer-rating">
          <RatingStars rating={Number(meta.rating)} />
          <span className="reviews">({meta.reviews} отзывов)</span>
        </div>
        <div className="offer-shipping">
          {meta.shippingLines.map((line, lineIndex) => (
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
  const [productUrl, setProductUrl] = useState('');
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1);
  const [displayStep, setDisplayStep] = useState(1);
  const [transitionStage, setTransitionStage] = useState('entered');
  const [transitionDir, setTransitionDir] = useState('forward');
  const [toast, setToast] = useState('');
  const [nextLoading, setNextLoading] = useState(false);
  const [costPrice, setCostPrice] = useState('');
  const [minMarginPct, setMinMarginPct] = useState('10');
  const [currentSales, setCurrentSales] = useState('50');
  const [customPrice, setCustomPrice] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadPhoneTouched, setLeadPhoneTouched] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [animatedOffers, setAnimatedOffers] = useState([]);
  const [movingId, setMovingId] = useState(null);
  const [introStep, setIntroStep] = useState(0);
  const [introOffers, setIntroOffers] = useState(buildIntroOffers(0));
  const [moneyKpi, setMoneyKpi] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [stepError, setStepError] = useState('');
  const containerRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const introTimerRef = useRef(null);
  const animationMetaRef = useRef({ initialIndex: 0, startPrice: 0, targetPrice: 0 });
  const intervalRef = useRef(null);
  const initialOffersRef = useRef([]);

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

  const salesLift = useMemo(() => {
    if (!result?.leaderPrice || !result?.priceToTop1) return 150;
    const ratio = Math.min(1, Math.max(0, result.priceToTop1 / result.leaderPrice));
    return Math.max(150, Math.round(80 + ratio * 70));
  }, [result]);

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

  const deltaToTop1 = useMemo(() => {
    if (!result?.myShopPrice || !result?.leaderPrice) return null;
    return result.myShopPrice - result.leaderPrice;
  }, [result]);

  const phoneValid = isValidPhone(leadPhone);
  const canProceedStep1 = Boolean(
    productUrl.trim() &&
      shopName.trim() &&
      /kaspi\.kz/i.test(productUrl.trim())
  );
  const canProceedStep2 = Boolean(result && result.myShopPosition && result.myShopPrice && result.leaderPrice);
  const canProceedStep3 = Boolean(
    result &&
      profitNow !== null &&
      profitProjectedCustom !== null &&
      currentSales &&
      projectedSales
  );
  const canProceedStep4 = Boolean(leadName.trim() && phoneValid);
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

    const initialIndex = initial.findIndex((offer) => offer.highlight);
    const startPrice = initial[initialIndex]?.price ?? result.myShopPrice ?? result.leaderPrice ?? 0;
    const targetPrice = recommendedPrice ?? (result.leaderPrice ? result.leaderPrice - 1 : startPrice);

    animationMetaRef.current = { initialIndex, startPrice, targetPrice };
    initialOffersRef.current = initial;
    setAnimatedOffers(initial);
    setMovingId(initial[initialIndex]?.id ?? null);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setAnimatedOffers((prev) => {
        const index = prev.findIndex((offer) => offer.highlight);
        if (index <= 0) {
          const reset = initialOffersRef.current.length > 0 ? initialOffersRef.current : prev;
          return reset.map((offer) => ({ ...offer }));
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
  }, [result, shopName, recommendedPrice]);

  useEffect(() => {
    if (!result) return;
    if (!costPrice) {
      const guess = result.myShopPrice ? Math.round(result.myShopPrice * 0.85) : '';
      if (guess) setCostPrice(String(guess));
    }
    if (!currentSales) setCurrentSales('50');
  }, [result, costPrice, currentSales]);

  useEffect(() => {
    if (displayStep !== 1) return;
    if (introTimerRef.current) clearInterval(introTimerRef.current);

    setIntroOffers(buildIntroOffers(0));
    setIntroStep(0);

    introTimerRef.current = setInterval(() => {
      setIntroStep((prev) => {
        const next = (prev + 1) % 3;
        setIntroOffers(buildIntroOffers(next));
        return next;
      });
    }, 1400);

    return () => {
      if (introTimerRef.current) clearInterval(introTimerRef.current);
    };
  }, [displayStep]);

  useEffect(() => {
    if (displayStep !== 3) return;
    if (profitProjectedCustom === null || profitNow === null) return;

    const target = profitProjectedCustom - profitNow;
    const duration = 600;
    const start = performance.now();

    const tick = (time) => {
      const progress = Math.min(1, (time - start) / duration);
      const value = Math.round(target * progress);
      setMoneyKpi(value);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [displayStep, profitProjectedCustom, profitNow]);

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

  const handleStepClick = (targetStep) => {
    if (isTransitioning || loading || leadSubmitting) return;
    const maxReached = Math.max(step, ...completedSteps, 1);
    if (targetStep > maxReached) return;
    startTransition(targetStep);
  };

  async function handleAnalyze(event) {
    event.preventDefault();
    if (!canProceedStep1) return;

    setLoading(true);
    setError('');
    setStepError('');
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

      const raw = await response.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch (parseErr) {
        // ignore
      }
      if (!response.ok) {
        throw new Error(data?.error || raw || 'Ошибка запроса');
      }
      if (!data) {
        throw new Error('Пустой ответ от сервера.');
      }

      setResult(data);
      setCompletedSteps((prev) => (prev.includes(1) ? prev : [...prev, 1]));
      startTransition(2);
    } catch (err) {
      const message = err.message || 'Ошибка запроса';
      setError(message);
      setStepError('Не удалось получить данные. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  }

  const handleNextFromStep2 = () => {
    if (!canProceedStep2 || isTransitioning || loading) return;
    setStepError('');
    setCompletedSteps((prev) => (prev.includes(2) ? prev : [...prev, 2]));
    startTransition(3);
  };

  const handleNextFromStep3 = () => {
    if (!canProceedStep3 || isTransitioning) return;
    setStepError('');
    setCompletedSteps((prev) => (prev.includes(3) ? prev : [...prev, 3]));
    startTransition(4);
  };

  const handleLeadSubmit = async () => {
    if (!canProceedStep4 || isTransitioning || leadSubmitting) return;
    setLeadSubmitting(true);
    setStepError('');
    await new Promise((resolve) => setTimeout(resolve, 600));
    setLeadSubmitted(true);
    setCompletedSteps((prev) => (prev.includes(4) ? prev : [...prev, 4]));
    setLeadSubmitting(false);
  };

  const stageClass = `${transitionStage} ${transitionDir}`;
  const progressLoading = loading || nextLoading || isTransitioning || leadSubmitting;

  const stepContent = (
    <>
      {displayStep === 1 && (
        <section className="intro">
          <div className="intro-layout">
            <div className="intro-copy">
              <div className="intro-title">
                SaleScout выводит ваш Kaspi-магазин в TOP-1 автоматически
              </div>
              <div className="intro-points">
                <div className="intro-point">
                  <span className="point-icon">⏱</span>
                  Проверяем цены каждые 3 минуты
                </div>
                <div className="intro-point">
                  <span className="point-icon">₸</span>
                  Снижаем на 1 ₸ от конкурента
                </div>
                <div className="intro-point">
                  <span className="point-icon">🛡</span>
                  Ниже минимальной цены не опускаемся
                </div>
              </div>
              {stepError ? <div className="error-banner">{stepError}</div> : null}
              <form className="intro-form" onSubmit={handleAnalyze}>
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
                  <span className="helper">Название, как указано в Kaspi</span>
                </label>

                <button className="button" type="submit" disabled={!canProceedStep1 || loading || isTransitioning}>
                  {loading ? (
                    <span className="button-loading">
                      <span className="spinner" />
                      Считаем…
                    </span>
                  ) : (
                    'Проверить мой товар'
                  )}
                </button>

                {error ? <div className="error">{error}</div> : null}
              </form>
            </div>

            <div className="intro-phone">
              <div className="phone-mock">
                <img className="phone-frame" src={phoneFrame} alt="Phone" />
                <div className="phone-screen demo">
                  <div className="demo-header">
                    <span>Продавцы</span>
                    <span className="demo-pill">Live</span>
                  </div>
                  <div className="offer-list kaspi-list">
                    {introOffers.map((offer) => (
                      <OfferRow key={offer.id} offer={offer} variant="compact" />
                    ))}
                  </div>
                  <div className="demo-footnote">Авто-реакция включена</div>
                </div>
              </div>
              <div className="intro-cta">
                <button
                  className="button"
                  type="button"
                  onClick={() => handleAnalyze({ preventDefault: () => {} })}
                  disabled={loading || isTransitioning || !canProceedStep1}
                >
                  Проверить мой товар
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {displayStep === 2 && (
        <section className="results">
          <StepHeader
            title="Результаты"
            onBack={() => startTransition(1)}
            backDisabled={isTransitioning || loading}
            onNext={handleNextFromStep2}
            nextLabel="Дальше"
            nextDisabled={!canProceedStep2 || isTransitioning}
          />
          {stepError ? <div className="error-banner">{stepError}</div> : null}
          <div className="results-layout">
            <div className="results-left">
              {result ? (
                <>
                  <div className="metric-grid">
                    <MetricCard
                      title="Позиция"
                      value={result.myShopPosition ? `#${result.myShopPosition}` : '—'}
                      tone="warn"
                      sub="место в выдаче"
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
                      sub="текущая цена"
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
                      sub="лучшая цена"
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 2l3 6 6 .9-4.3 4.2 1 6-5.7-3-5.7 3 1-6L3 8.9 9 8l3-6z" fill="#ef4444" />
                        </svg>
                      }
                    />
                    <MetricCard
                      title="До Top‑1"
                      value={formatDeltaSigned(deltaToTop1)}
                      tone={deltaToTop1 > 0 ? 'danger' : deltaToTop1 < 0 ? 'success' : 'neutral'}
                      sub="разница с лидером"
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 20l-7-8h4V4h6v8h4l-7 8z" fill="#ef4444" />
                        </svg>
                      }
                    />
                  </div>
                  <div className="leader">Лидер сейчас: {result.leaderShop || '—'}</div>

                  <div className="next-step">
                    <div className="next-step-text">
                      {deltaToTop1 !== null && deltaToTop1 === 0
                        ? 'Вы уже на лучшей цене. Включите авто‑реакцию, чтобы удерживать TOP‑1.'
                        : deltaToTop1 !== null && deltaToTop1 < 0
                          ? 'Вы уже дешевле TOP‑1. Можно поднять цену и сохранить позицию.'
                          : `Чтобы выйти в TOP‑1, снизьте цену на ${absNumber(deltaToTop1)?.toLocaleString('ru-KZ') ?? '—'} ₸ или включите авто‑реакцию.`}
                    </div>
                    <div className="next-step-actions">
                      <button className="button secondary" type="button">
                        Показать цену для TOP‑1
                      </button>
                      <button className="button" type="button">
                        Включить авто‑реакцию
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty">Нет данных. Вернитесь и запустите анализ.</div>
              )}
            </div>

            <div className="results-right">
              <div className="info-card">
                <div className="offer-block phone-single">
                  <div className="phone-mock">
                    <img className="phone-frame" src={phoneFrame} alt="Phone" />
                    <div className="phone-screen">
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
                          <OfferRow key={offer.id} offer={offer} />
                        ))}
                      </div>
                      <div className="kaspi-spacer" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {displayStep === 3 && (
        <section className="results">
          <StepHeader
            title="Итог при выходе в TOP-1"
            onBack={() => startTransition(2)}
            backDisabled={isTransitioning}
            onNext={handleNextFromStep3}
            nextLabel="Дальше"
            nextDisabled={!canProceedStep3 || isTransitioning}
          />
          {!canProceedStep3 ? (
            <div className="error-banner">Нет данных — вернитесь на шаг 2.</div>
          ) : null}
          <div className="final-summary">
            <div className="final-hero">
              +{formatCurrency(moneyKpi)} / месяц
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
              <strong>{formatCurrency(profitProjectedCustom)}</strong>
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

          <button className="cta-button receipt-cta" type="button" onClick={() => startTransition(4)}>
            Хочу такой результат
          </button>
        </section>
      )}

      {displayStep === 4 && (
        <section className="results">
          <StepHeader
            title="Почти готово 🚀"
            onBack={() => startTransition(3)}
            backDisabled={isTransitioning || leadSubmitting}
          />
          {stepError ? <div className="error-banner">{stepError}</div> : null}
          <div className="lead-wrapper">
            {!leadSubmitted ? (
              <div className="lead-card">
                <div className="lead-subtitle">
                  Оставьте контакты — мы подключим SaleScout и настроим за вас (≈10 минут)
                </div>
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
                  <span>Телефон</span>
                  <input
                    type="tel"
                    value={leadPhone}
                    onChange={(event) => setLeadPhone(event.target.value)}
                    onBlur={() => setLeadPhoneTouched(true)}
                    placeholder="+7 (777) 123-45-67"
                  />
                  {leadPhoneTouched && !phoneValid ? (
                    <span className="helper error-text">Введите корректный номер телефона.</span>
                  ) : null}
                </label>
                <button className="button" type="button" disabled={!canProceedStep4 || isTransitioning || leadSubmitting} onClick={handleLeadSubmit}>
                  {leadSubmitting ? (
                    <span className="button-loading">
                      <span className="spinner" />
                      Отправляем…
                    </span>
                  ) : (
                    'Запустить SaleScout'
                  )}
                </button>
                <div className="micro">Без спама. Менеджер свяжется в ближайшее время.</div>
              </div>
            ) : (
              <div className="lead-success">
                <div className="success-title">Заявка отправлена ✅</div>
                <div className="success-text">Мы напишем или позвоним в ближайшее время.</div>
                <button className="button" type="button" onClick={() => startTransition(1)}>
                  Новый анализ
                </button>
              </div>
            )}
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
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      >
        {stepContent}
      </WizardLayout>
    </div>
  );
}
