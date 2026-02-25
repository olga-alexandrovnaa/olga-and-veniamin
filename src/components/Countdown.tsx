import { useState, useEffect } from 'react';

/** Дата свадьбы — измените под своё событие */
const TARGET_DATE = new Date('2026-05-23T11:00:00');

function pad(n: number) {
  return n < 10 ? '0' + n : String(n);
}

export default function Countdown() {
  const [diff, setDiff] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const d = TARGET_DATE.getTime() - now.getTime();
      if (d <= 0) {
        setDiff({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setDiff({
        days: Math.floor(d / (1000 * 60 * 60 * 24)),
        hours: Math.floor((d % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((d % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((d % (1000 * 60)) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (diff === null) return <div className="chapter-hero__countdown">Загрузка...</div>;

  return (
    <div className="chapter-hero__countdown countdown">
      <div className="countdown__grid">
        <span className="countdown__value">{pad(diff.days)}</span>
        <span className="countdown__value">{pad(diff.hours)}</span>
        <span className="countdown__value">{pad(diff.minutes)}</span>
        <span className="countdown__value">{pad(diff.seconds)}</span>
      </div>
      <div className="countdown__labels">
        <span>дней</span>
        <span>часов</span>
        <span>мин</span>
        <span>сек</span>
      </div>
    </div>
  );
}
