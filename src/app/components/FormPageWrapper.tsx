'use client';

import { usePageFocus } from '@/app/hooks/usePageFocus';
import { BackButton } from '@/app/components/ui/BackButton';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  title?: string;
  backHref?: string;
  backLabel?: string;
};

export function FormPageWrapper({ children, title, backHref, backLabel }: Props) {
  // Placer le focus sur le premier élément focusable de la page (excluant le menu fermé)
  // Priorité aux inputs et textareas pour les pages de formulaire
  usePageFocus({
    selector: 'input:not([disabled]):not([type="hidden"]), textarea:not([disabled])',
    excludeMenu: true,
  });

  return (
    <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto pt-2 md:pt-4 pb-6 md:pb-8 px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Bouton retour */}
      <BackButton backHref={backHref} backLabel={backLabel} className="mb-4" />

      <div className="bg-gray-50 rounded-lg sm:p-6 md:p-8">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 sm:p-6 md:p-8">
            {title && (
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">{title}</h1>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

