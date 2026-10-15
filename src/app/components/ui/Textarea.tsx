'use client';

import { useRef, useEffect } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';
import { useSpeechField } from '@/app/hooks/useSpeechField';
import { SpeechButton } from './SpeechButton';

type BaseProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
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

/** Version avec dictée vocale — rendu uniquement quand speech=true */
function SpeechTextarea({
  label,
  required,
  className = '',
  value,
  onValueChange,
  onSpeechError,
  ...props
}: Omit<WithSpeechProps, 'speech'>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isListening, isSupported, error: speechError, toggleListening, displayValue } =
    useSpeechField(value, onValueChange, onSpeechError);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [displayValue]);

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && '*'}
        </label>
      )}
      <div className="relative">
        <textarea
          {...props}
          ref={textareaRef}
          required={required}
          value={displayValue}
          onChange={(e) => onValueChange(e.target.value)}
          className={clsx(
            'w-full px-3 py-2 pr-12 border border-gray-300 rounded-md',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            'overflow-hidden resize-none text-gray-800 placeholder:text-gray-400 transition-all',
            isListening ? 'border-red-400 bg-red-50' : '',
            className
          )}
        />
        {isSupported && (
          <SpeechButton isListening={isListening} onClick={toggleListening} position="textarea" />
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

export function Textarea(props: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const plainValue = !props.speech ? props.value : undefined;

  useEffect(() => {
    if (props.speech) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [plainValue, props.speech]);

  if (props.speech) {
    const { speech, ...rest } = props;
    void speech;
    return <SpeechTextarea {...rest} />;
  }

  const { label, required, className = '', value, ...textareaProps } = props;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && '*'}
        </label>
      )}
      <textarea
        {...textareaProps}
        ref={textareaRef}
        required={required}
        value={value}
        className={clsx(
          'w-full px-3 py-2 border border-gray-300 rounded-md',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          'overflow-hidden resize-none',
          className
        )}
      />
    </div>
  );
}
