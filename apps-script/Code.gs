/**
 * Google Apps Script для сайта приглашений на свадьбу.
 *
 * Инструкция:
 * 1. Откройте таблицу: https://docs.google.com/spreadsheets/d/1mJdYqErMeOfenW0Ik_HBgP5t9baUbw4Y8rYUKNkt3JU/edit
 * 2. Расширения → Apps Script. Вставьте этот код.
 * 3. Сохраните проект. Выполните один раз doGet или любой тест (Run), разрешите доступ к таблице.
 * 4. Развернуть → Новое развёртывание → Тип: Веб-приложение.
 *    - Выполнять от имени: меня; У кого есть доступ: все пользователи.
 * 5. Скопируйте URL развёртывания и укажите его в .env как VITE_APP_SCRIPT_URL.
 *
 * Колонки таблицы (первая строка — заголовки):
 * A: ФИО, B: КОД, C: Подтвердили, D: Сообщение молодым, E: С парой, F: Алкоголь, G: Во сколько, H: Трансфер, I: Имя пары, J: Ограничения по еде
 */

const SPREADSHEET_ID = '1mJdYqErMeOfenW0Ik_HBgP5t9baUbw4Y8rYUKNkt3JU';
const SHEET_NAME = 'Лист1';

const COL_GUEST = 1;   // A — ФИО
const COL_CODE = 2;    // B — КОД
const COL_CONFIRMED = 3;
const COL_CONFIRM_MESSAGE = 4;  // D — Сообщение молодым

// Номера колонок для ответов опроса (должны совпадать с src/config/survey.ts)
const SURVEY_COLUMNS = {
  withPartner: 5,   // E — С парой
  alcohol: 6,       // F — Предпочтения по алкоголю
  arrivalTime: 7,   // G — Во сколько придут
  transfer: 8,      // H — Трансфер
  pair: 9,          // I — Имя пары
  food: 10          // J — Ограничения по еде
};

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

/**
 * GET ?action=guest&code=XXX — вернуть ФИО гостя по коду
 */
function doGet(e) {
  const params = e?.parameter || {};
  const action = params.action;
  const result = { ok: false };

  if (action === 'guest') {
    const code = (params.code || '').toString().trim();
    if (code) {
      const data = findGuestByCode(code);
      if (data) {
        result.ok = true;
        result.name = data.name;
        result.code = data.code;
        result.rowIndex = data.rowIndex;
      }
    }
  }

  return createJsonResponse(result);
}

/**
 * POST body: { action: 'confirm' | 'survey', code, answers? }
 */
function doPost(e) {
  let result = { ok: false };
  try {
    const body = e?.postData?.contents ? JSON.parse(e.postData.contents) : {};
    const action = body.action;
    const code = (body.code || '').toString().trim();

    if (!code) return createJsonResponse(result);

    if (action === 'confirm') {
      result.ok = setConfirmed(code, (body.message || '').toString().trim());
    } else if (action === 'survey' && body.answers) {
      result.ok = setSurveyAnswers(code, body.answers);
    }
  } catch (err) {
    result.error = err.toString();
  }
  return createJsonResponse(result);
}

function createJsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function findGuestByCode(code) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowCode = (data[i][COL_CODE - 1] || '').toString().trim();
    if (rowCode === code) {
      const name = (data[i][COL_GUEST - 1] || '').toString().trim();
      if (name) return { name: name, code: code, rowIndex: i + 1 };
      return null;
    }
  }
  return null;
}

function setConfirmed(code, message) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowCode = (data[i][COL_CODE - 1] || '').toString().trim();
    if (rowCode === code) {
      sheet.getRange(i + 1, COL_CONFIRMED).setValue('Да');
      if (message) sheet.getRange(i + 1, COL_CONFIRM_MESSAGE).setValue(message);
      return true;
    }
  }
  return false;
}

function setSurveyAnswers(code, answers) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowCode = (data[i][COL_CODE - 1] || '').toString().trim();
    if (rowCode === code) {
      const row = i + 1;
      for (const [questionId, value] of Object.entries(answers)) {
        const col = SURVEY_COLUMNS[questionId];
        if (col && value != null && value !== '') {
          sheet.getRange(row, col).setValue(String(value));
        }
      }
      return true;
    }
  }
  return false;
}
