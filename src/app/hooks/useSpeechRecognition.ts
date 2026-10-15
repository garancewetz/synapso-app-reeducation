import { useState, useEffect, useRef, useCallback } from 'react';

type UseSpeechRecognitionOptions = {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  lang?: string;
};

type UseSpeechRecognitionReturn = {
  isListening: boolean;
  isSupported: boolean;
  /** Texte en cours de reconnaissance (temps réel) */
  interimTranscript: string;
  /** Message à afficher quand la dictée échoue (micro refusé, rien entendu…) */
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
};

/** Plain French messages for the errors a user can act on; null = stay silent. */
function getErrorMessage(error: string): string | null {
  switch (error) {
    case 'not-allowed':
      return 'Le micro n’est pas autorisé. Autorise-le pour ce site dans les réglages du navigateur.';
    case 'service-not-allowed':
      return 'La dictée est désactivée sur cet appareil (Réglages › Général › Clavier › Dictée).';
    case 'no-speech':
      return 'Je n’ai rien entendu. Réessaie en parlant près du téléphone.';
    case 'audio-capture':
      return 'Aucun micro détecté.';
    case 'network':
      return 'La dictée a besoin d’une connexion internet.';
    default:
      return null; // 'aborted' (stop button) and others: nothing to report
  }
}

/**
 * Hook pour la reconnaissance vocale (dictée)
 * Affiche le texte en temps réel pendant la parole
 * Détecte automatiquement la locale de l'appareil pour la reconnaissance vocale
 */
export function useSpeechRecognition({
  onResult,
  onError,
  lang,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  // The app is French-only: dictate in French even on a phone set to another
  // language (an English iPhone transcribed « pont fessier » as English words).
  const detectedLang = lang || 'fr-FR';
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Latest callbacks: the recognition keeps the handlers it was started with.
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  onResultRef.current = onResult;
  onErrorRef.current = onError;
  // Results already delivered in this session (Safari re-sends earlier finals).
  const finalizedCountRef = useRef(0);

  // Vérifier le support au montage
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = detectedLang;
    recognition.continuous = true;      // Continuer d'écouter
    recognition.interimResults = true;  // Résultats en temps réel

    finalizedCountRef.current = 0;
    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      // Walk every result but deliver each final one only once: Safari keeps
      // resultIndex at 0 and re-sends earlier finals, which duplicated words.
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          if (i >= finalizedCountRef.current) {
            final += transcript;
            finalizedCountRef.current = i + 1;
          }
        } else if (i >= finalizedCountRef.current) {
          interim += transcript;
        }
      }

      setInterimTranscript(interim.trim());
      const text = final.replace(/\s+/g, ' ').trim();
      if (text) onResultRef.current?.(text);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      setInterimTranscript('');
      const message = getErrorMessage(event.error);
      if (message) {
        setError(message);
        onErrorRef.current?.(message);
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError(getErrorMessage('not-allowed'));
    }
  }, [detectedLang]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
}
