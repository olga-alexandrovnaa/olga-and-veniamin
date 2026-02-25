import { useState } from 'react';
import { SURVEY_QUESTIONS } from '../config/survey';
import type { SurveyQuestion } from '../config/survey';
import { submitSurvey, type SurveyAnswers } from '../services/sheet';

interface SurveyFormProps {
  code: string;
  onSuccess?: () => void;
}

export default function SurveyForm({ code, onSuccess }: SurveyFormProps) {
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const ok = await submitSurvey(code, answers);
      if (ok) {
        setSent(true);
        onSuccess?.();
      } else {
        setError('Не удалось отправить. Проверьте ссылку и попробуйте позже.');
      }
    } catch {
      setError('Ошибка отправки. Попробуйте позже.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="survey-done">
        <p className="font-script" style={{ fontSize: '1.5rem' }}>
          Спасибо! Ваши ответы сохранены.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="survey-form">
      {SURVEY_QUESTIONS.map((q) => (
        <FormField
          key={q.id}
          question={q}
          value={answers[q.id] ?? ''}
          onChange={(v) => handleChange(q.id, v)}
        />
      ))}
      {error && <p className="survey-error">{error}</p>}
      <button type="submit" className="btn btn--light" disabled={sending}>
        {sending ? 'Отправка...' : 'Отправить'}
      </button>
    </form>
  );
}

function FormField({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  const { id, label, type, placeholder, options } = question;

  if (type === 'select') {
    return (
      <div className="form-group">
        <label htmlFor={id}>{label}</label>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— Выберите —</option>
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="form-group">
        <label htmlFor={id}>{label}</label>
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
