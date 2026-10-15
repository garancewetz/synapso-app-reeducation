'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ExerciceForm } from '@/app/features/exercices';
import { FormPageWrapper } from '@/app/components/FormPageWrapper';
import { ExerciceCategory } from '@/app/types/exercice';
import { CATEGORY_ORDER } from '@/app/constants/exercice.constants';

function AddPageContent({ onNavigateBack, initialCategory, duplicateFromId }: { onNavigateBack: () => void; initialCategory?: ExerciceCategory; duplicateFromId?: number }) {
  return (
    <ExerciceForm
      onSuccess={onNavigateBack}
      onCancel={onNavigateBack}
      initialCategory={initialCategory}
      duplicateFromId={duplicateFromId}
    />
  );
}

function AddPageContentWithParams({ onNavigateBack }: { onNavigateBack: () => void }) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  // Convertir le paramètre de catégorie en ExerciceCategory
  const getCategoryFromParam = (param: string | null): ExerciceCategory | undefined => {
    if (!param) return undefined;
    // Convertir "upper_body" ou "upper-body" en "UPPER_BODY"
    const normalized = param.toUpperCase().replace(/-/g, '_');
    if (CATEGORY_ORDER.includes(normalized as ExerciceCategory)) {
      return normalized as ExerciceCategory;
    }
    return undefined;
  };

  const initialCategory = getCategoryFromParam(categoryParam);
  // ?duplicate=<id> : « Dupliquer » from an exercise's ⋯ menu
  const duplicateParam = Number(searchParams.get('duplicate'));
  const duplicateFromId = Number.isInteger(duplicateParam) && duplicateParam > 0 ? duplicateParam : undefined;

  return (
    <AddPageContent
      key={duplicateFromId ?? 'new'}
      onNavigateBack={onNavigateBack}
      initialCategory={initialCategory}
      duplicateFromId={duplicateFromId}
    />
  );
}

function AddPageWrapperWithParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from');
  
  const backHref = fromParam || '/';

  const navigateBack = () => {
    router.push(backHref);
  };

  return (
    <FormPageWrapper backHref={backHref} title="Ajouter un exercice">
      <AddPageContentWithParams onNavigateBack={navigateBack} />
    </FormPageWrapper>
  );
}

export function AddPageClient() {
  return <AddPageWrapperWithParams />;
}
