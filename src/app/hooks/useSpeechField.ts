import { useRef } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';

/**
 * Dictation wired to a text field: each recognised phrase is appended to the
 * field's CURRENT value (not the value when dictation started — a second phrase
 * used to erase the first), with a single space between phrases.
 */
export function useSpeechField(value: string, onValueChange: (value: string) => void, onSpeechError?: (error: string) => void) {
  const valueRef = useRef(value);
  valueRef.current = value;

  const speech = useSpeechRecognition({
    onResult: (transcript) => {
      const current = valueRef.current.trimEnd();
      const next = current ? `${current} ${transcript}` : transcript;
      valueRef.current = next; // another phrase may arrive before the re-render
      onValueChange(next);
    },
    onError: onSpeechError,
  });

  const displayValue = speech.isListening && speech.interimTranscript
    ? (value.trim() ? `${value.trimEnd()} ${speech.interimTranscript}` : speech.interimTranscript)
    : value;

  return { ...speech, displayValue };
}
