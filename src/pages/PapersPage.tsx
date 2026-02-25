import { useState, useEffect, useRef } from 'react';
import { fetchAllGuests, type GuestRow } from '../services/sheet';

/** Тексты для печати — должны совпадать с Invitation */
const INVITATION = {
  date: '23 мая 2026',
  time: 'суббота, 14.00',
  time1: '10.20',
  time2: '14.00',
};

function getQrUrl(link: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
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

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

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
                  <p className="hero-small-caps">Вместе и навсегда</p>
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
                  <img
                    src={getQrUrl(`${baseUrl}/${guest.code}`)}
                    alt=""
                    width={120}
                    height={120}
                    className="paper-qr-img"
                  />
                  <span className="paper-qr-label">Подробнее на сайте</span>
                </div>
              </div>
            </div>

            {/* Страница 2: второй блок (детали) */}
            <div className="paper-page paper-page--details">
              <section className="section chapter-light paper-details">
                <div className="section__inner">
                  <h2 className="margin font-script">
                    {guest.name.split(' ').length > 1 ? 'Дорогие гости,' : 'Дорогой гость'}
                  </h2>
                  <h2 className="font-script">{guest.name},</h2>
                  <p>
                    Мы рады сообщить Вам, что <b>{INVITATION.date}</b> состоится самое главное торжество в&nbsp;нашей&nbsp;жизни&nbsp;—&nbsp;день нашей свадьбы!
                    Приглашаем Вас разделить с нами радость этого&nbsp;незабываемого дня.
                  </p>
                  <p>
                    Торжественная регистрация в ЗАГСе начнется в <b>{INVITATION.time1}</b>.
                    Мы будем рады видеть всех, кто&nbsp;захочет поддержать нас в этот волнительный момент и разделить с нами первую&nbsp;радость&nbsp;создания&nbsp;семьи.
                  </p>
                  <p>
                    Основное празднование (свадебный банкет) состоится позже — сбор гостей в <b>{INVITATION.time2}</b>. Мы&nbsp;понимаем, что у всех разные планы, поэтому вы можете присоединиться к&nbsp;нам&nbsp;на&nbsp;любом&nbsp;этапе. Главное, чтобы этот день мы разделили с самыми близкими!
                  </p>
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
