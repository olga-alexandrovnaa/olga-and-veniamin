/**
 * Соответствие вопросов опроса и колонок Google Таблицы.
 * Колонка A = 1, B = 2, C = 3, D = 4, E = 5, F = 6 и т.д.
 * Первая строка таблицы — заголовки (ФИО, КОД, Подтвердили, ...).
 *
 * Чтение гостей: таблица должна быть доступна «Просматривать могут все, у кого есть ссылка».
 * Запись (подтверждение и опрос): разверните Apps Script из папки apps-script и вставьте URL сюда (ниже).
 */

export const SHEET_CONFIG = {
  /** ID таблицы из ссылки (между /d/ и /edit) */
  SPREADSHEET_ID: '1mJdYqErMeOfenW0Ik_HBgP5t9baUbw4Y8rYUKNkt3JU',
  /** Название листа — как у вкладки в таблице (Лист1, guests и т.д.) */
  SHEET_NAME: 'Лист1',
  /** Номер колонки с ФИО (A = 1) */
  COLUMN_GUEST_NAME: 1,
  /** Номер колонки с уникальным кодом (B = 2) */
  COLUMN_CODE: 2,
  /** Номер колонки "Подтвердили" (C = 3) */
  COLUMN_CONFIRMED: 3,
  /** Номер колонки "Сообщение молодым" (D = 4) */
  COLUMN_CONFIRM_MESSAGE: 4,
  /**
   * URL развёрнутого Apps Script (Веб-приложение).
   * Оставьте пустым, если пока не разворачивали — тогда кнопки «Подтвердить» и «Отправить» опрос не будут сохранять в таблицу.
   * После развёртывания скрипта вставьте сюда ссылку вида: https://script.google.com/macros/s/.../exec
   */
  APP_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxw0ysAMAVqtFu77zyxBf_zyCQ7kIzC_TLJNUchum9mxP1LSSpxVHV7z2FdbiRMZTW0/exec',
} as const;

export interface SurveyQuestion {
  id: string;
  label: string;
  /** Номер колонки в таблице (1-based: A=1, B=2, ...) */
  column: number;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
}

/**
 * Вопросы опроса и привязка к колонкам.
 * Колонки: D=Сообщение молодым(4), E=С парой(5), F=Алкоголь(6), G=Во сколько(7), H=Трансфер(8), I=Имя пары(9), J=Ограничения по еде(10).
 * Добавляйте новые вопросы здесь и соответствующую колонку в таблице и в apps-script/Code.gs (SURVEY_COLUMNS).
 */
export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'withPartner',
    label: 'Будете с парой?',
    column: 5, // E — "С парой"
    type: 'select',
    options: ['Да', 'Нет'],
  },
  {
    id: 'alcohol',
    label: 'Предпочтения по алкоголю',
    column: 6, // F — "Предпочтения по алкоголю"
    type: 'textarea',
    placeholder: 'Ваш ответ...',
  },
  {
    id: 'arrivalTime',
    label: 'Во сколько планируете приехать?',
    column: 7, // G — "Во сколько придут"
    type: 'text',
    placeholder: 'Например: к 10:00',
  },
  {
    id: 'transfer',
    label: 'Потребуется ли вам трансфер?',
    column: 8, // H — "Трансфер"
    type: 'select',
    options: ['Да', 'Нет'],
  },
  {
    id: 'pair',
    label: 'Имя вашей пары (при наличии)',
    column: 9, // I — "Имя пары"
    type: 'textarea',
    placeholder: 'Ваш ответ...',
  },
  {
    id: 'food',
    label: 'Есть ли у вас ограничения по еде?',
    column: 10, // J — "Ограничения по еде"
    type: 'textarea',
    placeholder: 'Ваш ответ...',
  },
];
