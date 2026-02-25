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

/** Чтение данных гостя по коду из таблицы (без настройки переменных). */
export async function fetchGuestByCode(code: string): Promise<GuestData | null> {
  const c = code.trim();
  if (!c) return null;

  const url = `https://opensheet.elk.sh/${SPREADSHEET_ID}/${encodeURIComponent(SHEET_NAME)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const rows = (await res.json()) as Record<string, string>[];
    if (!Array.isArray(rows) || rows.length === 0) return null;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowCode = (row['КОД'] ?? row['Код'] ?? '').toString().trim();
      if (rowCode === c) {
        const name = (row['ФИО'] ?? row['ФИО гостей'] ?? '').toString().trim();
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
    return null;
  }
  return null;
}

export interface GuestRow {
  name: string;
  code: string;
}

/** Все гости из таблицы (строки с заполненными ФИО и КОД). */
export async function fetchAllGuests(): Promise<GuestRow[]> {
  const url = `https://opensheet.elk.sh/${SPREADSHEET_ID}/${encodeURIComponent(SHEET_NAME)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const rows = (await res.json()) as Record<string, string>[];
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const out: GuestRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = (row['ФИО'] ?? row['ФИО гостей'] ?? '').toString().trim();
      const code = (row['КОД'] ?? row['Код'] ?? '').toString().trim();
      if (name && code) out.push({ name, code });
    }
    return out;
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
