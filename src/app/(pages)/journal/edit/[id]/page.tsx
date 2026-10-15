'use client';

import { useRouter, useParams } from 'next/navigation';
import { JournalNoteForm } from '@/app/features/journal';
import { FormPageWrapper } from '@/app/components/FormPageWrapper';
import { usePreserveDateParam } from '@/app/features/time-machine/hooks/usePreserveDateParam';

export default function JournalNoteEditPage() {
  const router = useRouter();
  const params = useParams();
  const noteId = parseInt(params.id as string);
  const preserveDate = usePreserveDateParam();

  const handleSuccess = () => {
    router.push(preserveDate('/journal'));
  };

  const handleCancel = () => {
    router.push(preserveDate('/journal'));
  };

  return (
    <FormPageWrapper title="Modifier la note" backHref={preserveDate('/journal')}>
      <JournalNoteForm noteId={noteId} onSuccess={handleSuccess} onCancel={handleCancel} />
    </FormPageWrapper>
  );
}
