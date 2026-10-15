'use client';

import { useMemo } from 'react';
import { ChevronIcon } from '@/app/components/ui/icons';
import { Button } from '@/app/components/ui/Button';
import { getCurrentPageName, getPageEmoji } from '@/app/utils/navigation.utils';
import clsx from 'clsx';

type Props = {
  backHref?: string;
  backLabel?: string;
  className?: string;
  buttonClassName?: string;
};

export function BackButton({ 
  backHref, 
  backLabel, 
  className,
  buttonClassName,
}: Props) {
  // Calculer le label à afficher
  const label = useMemo(() => {
    if (backLabel) {
      return backLabel;
    }
    
    if (!backHref || backHref === '/') {
      return null; // Ne pas afficher si c'est l'accueil
    }
    
    const pageName = getCurrentPageName(backHref);
    // Page name alone after the chevron (« ‹ Notes »): « Retour à journal » read badly.
    return pageName;
  }, [backHref, backLabel]);

  // Obtenir l'emoji de la page de retour
  const pageEmoji = useMemo(() => {
    if (!backHref || backHref === '/') {
      return null;
    }
    return getPageEmoji(backHref);
  }, [backHref]);

  // Ne pas afficher le bouton si pas de label ou si c'est l'accueil
  if (!label || !backHref || backHref === '/') {
    return null;
  }

  const wrapperClasses = clsx('px-3 sm:px-6', className);
  
  const buttonStyles = clsx(
    'back-button gap-3',
    'bg-white border-2 border-gray-200',
    'text-base font-semibold text-gray-800',
    'hover:border-gray-300 hover:bg-gray-50',
    'active:scale-[0.98]',
    buttonClassName
  );

  return (
    <div className={wrapperClasses}>
      <Button
        href={backHref}
        variant="secondary"
        size="md"
        rounded="lg"
        className={buttonStyles}
        aria-label={`Retour : ${label}`}
      >
        <ChevronIcon className="w-6 h-6 text-gray-700" direction="left" />
        {pageEmoji && <span>{pageEmoji}</span>}
        <span>{label}</span>
      </Button>
    </div>
  );
}
