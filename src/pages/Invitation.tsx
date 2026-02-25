import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchGuestByCode, submitConfirm } from '../services/sheet';
import Countdown from '../components/Countdown';
import SurveyForm from '../components/SurveyForm';

/** Тексты приглашения — настройте под себя */
const INVITATION = {
  date: '23 мая 2026',
  time: 'суббота, 14.00',
  time1: '10.20',
  time2: '14.00',
  place: 'Ресторан «Название», г. Москва, ул. Примерная, 1',
  timing: [
    '10:00 — Сбор гостей в ЗАГСе Петроградского района (Большая Монетная улица, 17)',
    '10:20 — Церемония',
    '11:00 — Прогулка',
    '14:00 — Праздничный банкет в ресторане Le Glamour (Вознесенский проспект, 44-46)',
  ],
  dressCode: 'Мы знаем, что вы прекрасны в любом наряде! Но особенно приятно нам будет, если вы поддержите цветовую гамму торжества.',
  blocks: [
    { title: 'Меню', text: `Меню разнообразно, поэтому сообщите нам заранее, если у вас есть какие-либо предпочтения 
    или диетические ограничения. После подтверждения вы сможете пройти опрос о своих вкусовых предпочтениях и напитках.` },
    { title: 'Парковка', text: `Парковка платная у ЗАГСа и у ресторана (280 руб/ч). 
    Для вашего удобства мы организуем трансфер от ЗАГСа до ресторана и места прогулки.` },
    { title: 'Пожелания по подаркам', text: `Ваше присутствие в день нашей свадьбы - самый значимый подарок для нас! 
    Мы понимаем, что дарить цветы на свадьбу - это традиция, но мы не сможем насладиться их красотой в полной мере... 
    Если хотите сделать нам ценный и нужный подарок, мы будем признательны за вклад в бюджет нашей молодой семьи.` },
    { title: 'Подтверждение', text: `Пожалуйста подтвердите ниже свое присутствие.` },
    

  ],
};

export default function Invitation() {
  const { code } = useParams<{ code: string }>();
  const [guestName, setGuestName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');

  useEffect(() => {
    const c = (code ?? '').trim();
    if (!c) {
      setError(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchGuestByCode(c)
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setGuestName(data.name);
          setConfirmed(data.confirmed);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [code]);

  const handleConfirm = async () => {
    if (!code || confirming) return;
    setConfirming(true);
    try {
      const result = await submitConfirm(code, confirmMessage);
      if (result.ok) setConfirmed(true);
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="guest-loading">
        <p>Загрузка...</p>
      </div>
    );
  }

  if (error || !guestName) {
    return (
      <div className="guest-error">
        <h2>Приглашение не найдено</h2>
        <p>Проверьте ссылку или обратитесь к организаторам.</p>
      </div>
    );
  }

  return (
    <>
      {/* Глава 1: зелёный блок 2/3 слева, рисунок по правому краю, обратный отсчёт */}
      <section className="chapter-hero" aria-label="Приглашение">
        <div className="chapter-hero__wrap">
          <div className="chapter-hero__content">
            <div className="chapter-hero__green">
              <p className="hero-small-caps">Вместе и навсегда</p>
              <br/>              
              <br/>
              <br/>
              <h1 className="hero-names font-script">Вениамин</h1>
              <h1 className="hero-names font-script">и</h1>
              <h1 className="hero-names font-script">Ольга</h1>
              <br/>
              <br/>
              <br/>
              <p className="hero-small-caps">Приглашаем&nbsp;вас на&nbsp;нашу&nbsp;свадьбу</p>
              <div className="hero-line" aria-hidden="true" />
              <p className="hero-date font-script">{INVITATION.date}</p>
              <p className="hero-small-caps hero-time">{INVITATION.time}</p>
            </div>
          </div>
          <div className="chapter-hero__flowers" aria-hidden="true" />
        </div>
        <div className="chapter-hero__countdown-strip">
          <Countdown />
        </div>
      </section>

      {/* Глава 2: дата, время, место, тайминг */}
      <section className="section chapter-light" aria-label="Детали">
        <div className="section__inner">
          <h2 className="margin font-script">{guestName.split(' ').length > 1 ? 'Дорогие гости,' : 'Дорогой гость'}</h2>
          <h2 className="font-script">{guestName},</h2>

          <p>Мы рады сообщить Вам, что&nbsp;<b>{INVITATION.date}</b> состоится самое главное торжество в&nbsp;нашей жизни - день нашей свадьбы!
Приглашаем Вас разделить с нами радость этого незабываемого дня.</p>

          <p>Торжественная регистрация в ЗАГСе начнется в&nbsp;<b>{INVITATION.time1}</b>. 
          Мы&nbsp;будем рады видеть всех, кто захочет поддержать нас в&nbsp;этот волнительный момент и&nbsp;разделить с&nbsp;нами первую радость создания семьи.</p>

          <p>Основное празднование (свадебный банкет) состоится позже — сбор гостей в <b>{INVITATION.time2}</b>. Мы понимаем, что у всех разные планы, поэтому вы можете присоединиться к нам на любом этапе. Главное, чтобы этот день мы разделили с самыми близкими!</p>

          <h2 className="font-script">Ждем Вас!</h2>

        </div>
      </section>

      <section className="section chapter-light" aria-label="Детали">
        <div className="section__inner">
          <div className="info-blocks">
            <div key={'Свадебное расписание'} className="info-block">
              <h3>{'Свадебное расписание'}</h3>
              <ul className="list">
                {INVITATION.timing.map((t) => (
                  <li key={t} style={{ marginBottom: '2rem' }}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="info-block">
              <h3>Дресс-код</h3>
              <p>{INVITATION.dressCode}</p>
              <div className="dressCode" aria-hidden="true">
                <img src="/4.JPG" alt="" />
              </div>
            </div>
            {INVITATION.blocks.map((b) => (
              <div key={b.title} className="info-block">
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </div>
            ))}
          </div>
          {confirmed ? (
            <p style={{ marginTop: '1.5rem', color: 'var(--green-dark)' }}>
              ✓ Вы подтвердили участие
            </p>
          ) : (
            <div className="confirm-row">
              <input
                type="text"
                className="confirm-message-input"
                placeholder="Сообщение молодым (по желанию)"
                value={confirmMessage}
                onChange={(e) => setConfirmMessage(e.target.value)}
                disabled={confirming}
                maxLength={500}
                aria-label="Сообщение молодым"
              />
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleConfirm}
                disabled={confirming}
              >
                {confirming ? 'Отправка...' : 'Подтвердить участие'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Глава 4: опрос */}
      <section className="section chapter-survey" aria-label="Опрос">
        <div className="section__inner">
          <h2>Несколько вопросов</h2>
          <p style={{ opacity: 0.9, marginBottom: '1.5rem' }}>
            Заполните, пожалуйста, чтобы нам было удобнее организовать праздник.
          </p>
          <SurveyForm code={code!} />
        </div>
      </section>
    </>
  );
}
