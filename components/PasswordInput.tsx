'use client';

import { useId, useState } from 'react';

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
};

export default function PasswordInput({ label, className = '', id: idProp, ...inputProps }: PasswordInputProps) {
  const generatedId = useId();
  const inputId = idProp || generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <label htmlFor={inputId} className="block text-sm font-medium text-ink">
      {label}
      <div className="relative mt-2">
        <input
          {...inputProps}
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={`w-full rounded-lg border border-soft bg-slate-50 py-3 pl-4 pr-12 text-sm text-ink outline-none transition focus:border-ink ${className}`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-soft transition hover:text-ink"
        >
          {visible ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M3 3l18 18" />
              <path d="M10.58 10.58a2 2 0 002.84 2.84" />
              <path d="M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7.5a11.2 11.2 0 01-2.16 3.52" />
              <path d="M6.11 6.11A11.18 11.18 0 003 12.5C4.73 16.39 9 19.5 14 19.5a10.9 10.9 0 004.12-.8" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M2 12.5C3.73 8.11 8 5 13 5s9.27 3.11 11 7.5-3.27 7.5-11 7.5S3.73 16.89 2 12.5z" />
              <circle cx="13" cy="12.5" r="3" />
            </svg>
          )}
        </button>
      </div>
    </label>
  );
}
