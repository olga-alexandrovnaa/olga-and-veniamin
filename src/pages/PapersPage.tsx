import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { fetchAllGuests, type GuestRow } from '../services/sheet';

/** Тексты для печати — должны совпадать с Invitation */
const INVITATION = {
  date: '23 мая 2026',
  time: 'суббота, 14.00',
  time1: '10.20',
  time2: '14.00',
};

function PaperQr({ link, guestCode }: { link: string; guestCode: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(link, { width: 200, margin: 1 })
      .then(setDataUrl)
      .catch(() => setFailed(true));
  }, [link]);

  if (failed) {
    return (
      <div className="paper-qr-fallback">
        <span className="paper-qr-label">Подробнее на сайте</span>
        {guestCode && <span className="paper-qr-code">Код приглашения: {guestCode}</span>}
        <a href={link} target="_blank" rel="noopener noreferrer" className="paper-qr-link">
          {link}
        </a>
      </div>
    );
  }

  if (!dataUrl) {
    return <span className="paper-qr-label">Подготовка QR…</span>;
  }

  return (
    <>
      <img
        src={dataUrl}
        alt=""
        width={120}
        height={120}
        className="paper-qr-img"
      />
      <span className="paper-qr-label">Подробнее на сайте</span>
    </>
  );
}

export default function PapersPage() {
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllGuests()
      .then((list) => {
        setGuests(list);
        if (list.length === 0) setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (guests.length === 0 || !printRef.current) return;
    const timer = setTimeout(() => {
      window.print();
    }, 800);
    return () => clearTimeout(timer);
  }, [guests.length]);

  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${import.meta.env.VITE_APP_BASE || ''}`
    : '';

  if (loading) {
    return (
      <div className="papers-loading">
        <p>Загрузка гостей и подготовка печати...</p>
      </div>
    );
  }

  if (error || guests.length === 0) {
    return (
      <div className="papers-error">
        <p>Не удалось загрузить список гостей или таблица пуста.</p>
      </div>
    );
  }

  return (
    <>
      <div className="papers-screen-only">
        <p>Готово к печати. В окне печати: «Сохранить как PDF», альбомная ориентация, отключите «Колонтитулы» и поставьте поля «По умолчанию» или «Нет».</p>
      </div>
      <div ref={printRef} className="papers-print-area">
        {guests.map((guest) => (
          <div key={guest.code} className="papers-guest-pages">
            {/* Страница 1: первый блок (герой без обратного отсчёта, с QR) */}
            <div className="paper-page paper-page--hero">
              <div className="paper-hero">
                <div className="paper-hero__green">
                  <p className="hero-small-caps">Ты — главное открытие моей жизни</p>
                  <br />
                  <br />
                  <h1 className="hero-names font-script">Вениамин</h1>
                  <h1 className="hero-names font-script">и</h1>
                  <h1 className="hero-names font-script">Ольга</h1>
                  <br />
                  <br />
                <p className="hero-small-caps">Приглашаем&nbsp;вас на&nbsp;нашу&nbsp;свадьбу</p>
                  <div className="hero-line" aria-hidden="true" />
                  <p className="hero-date font-script">{INVITATION.date}</p>
                  <p className="hero-small-caps hero-time">{INVITATION.time}</p>
                </div>
                <div className="paper-hero__flowers" aria-hidden="true" />
                <div className="paper-hero__qr-strip2">
                  <PaperQr link={`${baseUrl}/${guest.code}`} guestCode={guest.code} />
                </div>
              </div>
            </div>

            {/* Страница 2: второй блок (детали) */}
            <div className="paper-page paper-page--details">
              <section className="section chapter-light paper-details">
                <div className="section__inner">
                  <h2 className="margin font-script">
                    {guest.name.split(' ').length > 1 ? 'Дорогие гости,' : 'Дорогой гость,'}
                  </h2>
                  <h2 className="font-script">{guest.name},</h2>
                  <p>
                    Счастьем делиться хочется с самыми близкими!
                    Мы создаем семью! Наша свадьба состоится <b>{INVITATION.date}</b> года. Для нас это не просто дата, а начало новой главы. И мы очень хотим, чтобы вы стали частью этой истории.
                  </p>

                  <p>
                    Вас ждут два этапа нашего торжества: <br/>
                    <b>{INVITATION.time1}</b> — Официальная регистрация (ЗАГС). Разделите с нами трогательный момент, когда мы скажем друг другу «Да». <br/>
                    <b>{INVITATION.time2}</b> — Сбор гостей на банкетной части.
                  </p>

                  <p>Приходите в любое время, как вам удобно. Нам важно, чтобы вы были рядом, независимо от формата праздника. До встречи!</p>
                  <h2 className="font-script">Ждем Вас!</h2>
                </div>
              </section>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
