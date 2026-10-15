'use client';

import type { InputHTMLAttributes } from 'react';
import clsx from 'clsx';
import { useSpeechField } from '@/app/hooks/useSpeechField';
import { SpeechButton } from './SpeechButton';

type BaseProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  required?: boolean;
};

type WithSpeechProps = BaseProps & {
  speech: true;
  value: string;
  onValueChange: (value: string) => void;
  onSpeechError?: (error: string) => void;
};

type WithoutSpeechProps = BaseProps & {
  speech?: false;
  onValueChange?: never;
  onSpeechError?: never;
};

type Props = WithSpeechProps | WithoutSpeechProps;

function SpeechInput({
  label,
  required,
  className = '',
  value,
  onValueChange,
  onSpeechError,
  id,
  ...props
}: Omit<WithSpeechProps, 'speech'>) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const { isListening, isSupported, error: speechError, toggleListening, displayValue } =
    useSpeechField(value, onValueChange, onSpeechError);

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500" aria-label="requis">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          id={inputId}
          type="text"
          required={required}
          value={displayValue}
          onChange={(e) => onValueChange(e.target.value)}
          className={clsx(
            'w-full px-3 py-2 pr-12 border border-gray-300 rounded-md',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            'text-gray-800 placeholder:text-gray-400 transition-all',
            isListening ? 'border-red-400 bg-red-50' : '',
            className
          )}
        />
        {isSupported && (
          <SpeechButton isListening={isListening} onClick={toggleListening} position="input" />
        )}
      </div>
      {isListening && (
        <p className="text-xs text-red-500 font-medium mt-1 text-center">
          🔴 Je t’écoute… appuie sur ⏹️ quand tu as fini
        </p>
      )}
      {!isListening && speechError && (
        <p role="alert" className="text-sm text-red-600 mt-1">
          {speechError}
        </p>
      )}
    </div>
  );
}

export function Input(props: Props) {
  if (props.speech) {
    const { speech, ...rest } = props;
    void speech;
    return <SpeechInput {...rest} />;
  }

  const { label, required, className = '', id, speech, onValueChange, onSpeechError, ...inputProps } = props;
  void speech;
  void onValueChange;
  void onSpeechError;
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500" aria-label="requis">*</span>}
        </label>
      )}
      <input
        {...inputProps}
        id={inputId}
        required={required}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        aria-required={required}
      />
    </div>
  );
}
