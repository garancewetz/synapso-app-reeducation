'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { JournalNotesList, JournalNoteForm } from '@/app/features/journal';
import { BackButton } from '@/app/components/ui/BackButton';
import { AddButton } from '@/app/components/ui/AddButton';
import { JOURNAL_EMOJI } from '@/app/constants/emoji.constants';
import { useLayoutContext } from '@/app/contexts/LayoutContext';
import { useHandPreference } from '@/app/hooks/useHandPreference';

export default function JournalPage() {
  useLayoutContext();
  const { isLeftHanded } = useHandPreference();
  const [showInlineForm, setShowInlineForm] = useState(false);

  const handleAddClick = () => {
    setShowInlineForm(true);
  };

  const handleInlineSuccess = () => {
    setShowInlineForm(false);
  };

  const handleInlineCancel = () => {
    setShowInlineForm(false);
  };

  return (
    <>
      <div className="max-w-2xl mx-auto pt-2 md:pt-4 pb-6 md:pb-8 px-4 md:px-6">
        <BackButton className="mb-6" buttonClassName="py-3" />

        <div
          className={clsx(
            'flex flex-col gap-2 mb-8 md:flex-row md:items-center md:justify-between md:gap-4',
            isLeftHanded && 'md:flex-row-reverse'
          )}
        >
          <h1 className="text-xl font-semibold text-neutral-800">
            {JOURNAL_EMOJI} Notes
          </h1>
          <AddButton
            label="Ajouter une note"
            className="shrink-0 w-full h-10! px-3! text-sm! md:w-auto md:h-11! md:px-5! md:text-base!"
            onClick={handleAddClick}
          />
        </div>

        {showInlineForm && (
          <JournalNoteForm onSuccess={handleInlineSuccess} onCancel={handleInlineCancel} />
        )}

        <JournalNotesList />
      </div>
    </>
  );
}
