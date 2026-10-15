'use client';

import { useRef, useEffect } from 'react';
import type { ReactNode, RefObject } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useBodyScrollLock } from '@/app/hooks/useBodyScrollLock';
import { Button } from './Button';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Classe CSS supplémentaire pour le contenu */
  className?: string;
  /** Afficher le bouton fermer en bas (mobile) */
  showFooterClose?: boolean;
  /** Label du bouton fermer */
  closeLabel?: string;
  /** Référence vers l'élément déclencheur (pour restaurer le focus à la fermeture) */
  triggerRef?: RefObject<HTMLElement | null>;
};

// Seuil de drag pour fermer (en pixels)
const DRAG_CLOSE_THRESHOLD = 100;

/**
 * Composant de base pour les bottom sheets (mobile) / modals (desktop)
 * Gère les animations, le backdrop, le drag-to-close et le body scroll lock
 */
export function BottomSheetModal({
  isOpen,
  onClose,
  children,
  className = '',
  showFooterClose = false,
  closeLabel = 'Fermer',
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const touchHandledRef = useRef(false);

  useBodyScrollLock(isOpen);

  // Fermeture avec Escape (remplace le focus trap qui interférait avec les inputs)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > DRAG_CLOSE_THRESHOLD || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-70 flex items-end md:items-center justify-center md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 md:bg-black/50"
            onClick={() => {
              // Si on a déjà géré un événement tactile, ignorer le click
              // pour éviter le double déclenchement sur mobile
              if (touchHandledRef.current) {
                touchHandledRef.current = false;
                return;
              }
              onClose();
            }}
            onTouchStart={(e) => {
              // Empêcher le double-tap zoom et le double déclenchement
              // On utilise preventDefault pour éviter que le click se déclenche aussi
              e.preventDefault();
              touchHandledRef.current = true;
              onClose();
              // Réinitialiser le flag après un court délai
              setTimeout(() => {
                touchHandledRef.current = false;
              }, 300);
            }}
            style={{ touchAction: 'manipulation' }}
          />

          {/* Bottom Sheet (mobile) / Modal (desktop) */}
          <motion.div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            className={`relative bg-white w-full max-w-lg md:max-w-xl lg:max-w-2xl rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden h-[90vh] md:max-h-[90vh] md:h-auto flex flex-col pb-24 md:pb-0 ${className}`}
            initial={{ y: '100%', scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: '100%', scale: 0.95 }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={handleDragEnd}
            style={{ touchAction: 'none' }}
          >
            {/* Poignée de glissement (mobile) */}
            <Button
              type="button"
              iconOnly
              onClick={onClose}
              className="w-full !p-0 !border-0 !bg-transparent !shadow-none flex justify-center pt-3 pb-2 hover:bg-gray-50 md:hidden shrink-0"
              aria-label="Fermer"
            >
              <div className="w-12 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors" />
            </Button>

            {/* Bouton fermer desktop */}
            <Button
              type="button"
              iconOnly
              onClick={onClose}
              className="hidden md:flex absolute top-3 right-3 w-11 h-11 !p-0 !border-0 rounded-full bg-gray-100 hover:bg-gray-200 z-50"
              aria-label="Fermer"
            >
              <span className="text-gray-500 text-lg">✕</span>
            </Button>

            {/* Contenu */}
            {children}

            {/* Footer avec bouton fermer (mobile, optionnel) */}
            {showFooterClose && (
              <div className="px-5 py-4 bg-white border-t border-gray-100 md:hidden shrink-0">
                <Button
                  onClick={onClose}
                  variant="secondary"
                  size="md"
                  rounded="lg"
                  className="w-full bg-gray-100 hover:bg-gray-200 active:scale-[0.98]"
                >
                  {closeLabel}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

