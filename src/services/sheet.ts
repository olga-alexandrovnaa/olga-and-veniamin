/**
 * Работа с Google Таблицей:
 * - чтение гостя по коду — через открытый API (таблица должна быть «доступна по ссылке»);
 * - запись (подтверждение, опрос) — через Apps Script, если указан APP_SCRIPT_URL в config.
 */

import { SHEET_CONFIG } from '../config/survey';

const { SPREADSHEET_ID, SHEET_NAME, APP_SCRIPT_URL } = SHEET_CONFIG;

export interface GuestData {
  name: string;
  code: string;
  rowIndex: number;
  /** Уже подтвердил участие (в таблице заполнена колонка «Подтвердили») */
  confirmed: boolean;
}

const FETCH_ATTEMPTS = 3;
const FETCH_RETRY_DELAY_MS = 1500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Несколько попыток: повтор при неуспешном результате (null / пустой массив). */
async function withRetry<T>(
  fn: () => Promise<T>,
  isFailure: (result: T) => boolean
): Promise<T> {
  let last: T = await fn();
  for (let attempt = 1; attempt < FETCH_ATTEMPTS && isFailure(last); attempt++) {
    await delay(FETCH_RETRY_DELAY_MS);
    last = await fn();
  }
  return last;
}

/** Несколько попыток: повтор при ошибке (reject / throw). */
async function withRetryOnError<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < FETCH_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt < FETCH_ATTEMPTS - 1) await delay(FETCH_RETRY_DELAY_MS);
    }
  }
  throw lastError;
}

/** Нормализация кода для сравнения (trim + lowercase для UUID-подобных). */
function normalizeCode(s: string): string {
  return s.trim().toLowerCase();
}

/** Одна попытка загрузки гостя по коду. */
async function fetchGuestByCodeOnce(code: string): Promise<GuestData | null> {
  const c = code.trim();
  if (!c) return null;

  const url = `https://opensheet.elk.sh/${SPREADSHEET_ID}/${encodeURIComponent(SHEET_NAME)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const rows = (await res.json()) as Record<string, string>[];
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const codeNorm = normalizeCode(c);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowCodeRaw = (row['КОД'] ?? row['Код'] ?? row['код'] ?? row['CODE'] ?? '').toString();
      const rowCode = rowCodeRaw.trim();
      const match = rowCode === c || normalizeCode(rowCode) === codeNorm;
      if (match) {
        const name = (row['ФИО'] ?? row['ФИО гостей'] ?? row['фіо'] ?? '').toString().trim();
        if (name) {
          const confirmedCell = (row['Подтвердили'] ?? row['Подтвердили '] ?? '').toString().trim();
          const confirmed = /^да$/i.test(confirmedCell);
          return {
            name,
            code: c,
            rowIndex: i + 2,
            confirmed,
          };
        }
        return null;
      }
    }
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
  return null;
}

/** Чтение данных гостя по коду из таблицы (до 3 попыток при сбое). */
export async function fetchGuestByCode(code: string): Promise<GuestData | null> {
  return withRetry(
    () => fetchGuestByCodeOnce(code),
    (result) => result === null
  );
}

export interface GuestRow {
  name: string;
  code: string;
}

/** Одна попытка загрузки всех гостей (при ошибке сети — throw). */
async function fetchAllGuestsOnce(): Promise<GuestRow[]> {
  const url = `https://opensheet.elk.sh/${SPREADSHEET_ID}/${encodeURIComponent(SHEET_NAME)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const rows = (await res.json()) as Record<string, string>[];
  if (!Array.isArray(rows)) return [];
  const out: GuestRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = (row['ФИО'] ?? row['ФИО гостей'] ?? '').toString().trim();
    const code = (row['КОД'] ?? row['Код'] ?? row['код'] ?? '').toString().trim();
    if (name && code) out.push({ name, code });
  }
  return out;
}

/** Все гости из таблицы (до 3 попыток при ошибке сети). */
export async function fetchAllGuests(): Promise<GuestRow[]> {
  try {
    return await withRetryOnError(fetchAllGuestsOnce);
  } catch {
    return [];
  }
}

export type SubmitResult = { ok: true } | { ok: false; error?: string };

export async function submitConfirm(code: string, message?: string): Promise<SubmitResult> {
  if (!APP_SCRIPT_URL?.trim()) return { ok: false, error: 'Не настроен URL скрипта (APP_SCRIPT_URL)' };
  try {
    const res = await fetch(APP_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'confirm',
        code: code.trim(),
        message: message?.trim() ?? '',
      }),
    });
    const text = await res.text();
    let data: { ok?: boolean; error?: string } = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || `Ошибка ${res.status}` };
    }
    if (res.ok && data.ok !== false) return { ok: true };
    return { ok: false, error: data.error || `Ошибка ${res.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

export interface SurveyAnswers {
  [questionId: string]: string;
}

export async function submitSurvey(
  code: string,
  answers: SurveyAnswers
): Promise<SubmitResult> {
  if (!APP_SCRIPT_URL?.trim()) return { ok: false, error: 'Не настроен URL скрипта (APP_SCRIPT_URL)' };
  try {
    const res = await fetch(APP_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'survey',
        code: code.trim(),
        answers,
      }),
    });
    const text = await res.text();
    let data: { ok?: boolean; error?: string } = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || `Ошибка ${res.status}` };
    }
    if (res.ok && data.ok !== false) return { ok: true };
    return { ok: false, error: data.error || `Ошибка ${res.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}
