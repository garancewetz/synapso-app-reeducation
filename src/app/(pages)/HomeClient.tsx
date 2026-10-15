'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { WelcomeHeaderWrapper } from '@/app/features/home';
import { SegmentedControl } from '@/app/components/ui';
import { UserIcon } from '@/app/components/ui/icons';
import { BookmarkIcon } from '@/app/components/ui/icons';
import { useUser } from '@/app/contexts/UserContext';
import { useExercices, useExerciceHandlers } from '@/app/features/exercices';
import { useProgressModal, useProgress } from '@/app/features/progress';
import { useJournalNotes } from '@/app/features/journal';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/lib/api-queries';
import { useHomeTabs, HomePinnedTab } from '@/app/features/home';
import { HomeExercicesView } from './HomeExercicesView';
import { SeanceStartCard } from '@/app/features/seance';

const MotionDiv = motion.div;

const ProgressBottomSheet = dynamic(
  () => import('@/app/features/progress').then(mod => ({ default: mod.ProgressBottomSheet })),
  { ssr: false }
);

type HomeClientProps = {
  exercicesSlot?: ReactNode;
  welcomeHeaderSlot?: ReactNode;
};

export function HomeClient({ exercicesSlot, welcomeHeaderSlot }: HomeClientProps = {}) {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl === 'pinned' ? 'pinned' : null;

  const { effectiveUser, loading: userLoading } = useUser();
  const progressModal = useProgressModal();
  const queryClient = useQueryClient();

  const { exercices, updateExercice } = useExercices({ includeArchived: true });
  const { progressList } = useProgress();
  const { notes: journalNotes, refetch: refetchNotes } = useJournalNotes();
  const pinnedExercices = useMemo(() => exercices.filter(e => !e.archived && e.pinned), [exercices]);
  const pinnedProgress = useMemo(() => progressList.filter(p => p.pinned), [progressList]);
  const pinnedNotes = useMemo(() => journalNotes.filter(n => n.pinned), [journalNotes]);
  const completedExerciceIds = useMemo(() => {
    const ids = new Set<number>();
    for (const ex of exercices) {
      if (ex.completed) ids.add(ex.id);
    }
    return ids;
  }, [exercices]);
  const { activeTab, setActiveTab, tabOptionsData } = useHomeTabs(
    pinnedExercices.length + pinnedProgress.length + pinnedNotes.length,
    initialTab
  );

  const { handleEditClick: handlePinnedEdit, handleCompleted: handlePinnedUpdate } = useExerciceHandlers({
    updateExercice,
    fromPath: '/',
  });

  const tabOptions = useMemo(() => {
    const getIcon = (iconName: 'UserIcon' | 'BookmarkIcon') =>
      iconName === 'UserIcon' ? <UserIcon className="w-5 h-5" /> : <BookmarkIcon className="w-5 h-5" />;

    return tabOptionsData.map(opt => ({
      value: opt.value,
      label: opt.label,
      icon: getIcon(opt.iconName),
    }));
  }, [tabOptionsData]);


  // No-op stable pour afficher le bouton Partager (la logique est dans useShareProgress du ProgressCard)
  const handleShareProgress = useCallback(() => {}, []);

  const handleProgressSuccess = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.progress.all,
      refetchType: 'active',
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.categoryStats.all,
      refetchType: 'active',
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.exercices.all,
      refetchType: 'active',
    });
  }, [queryClient]);

  return (
    <section>
      <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto">
        {/* The one thing to do when opening the app: start the session. */}
        {effectiveUser && (
          <div className="px-3 md:px-6 lg:px-8 pt-4">
            <SeanceStartCard />
          </div>
        )}

        {/* Welcome Header - uniquement sur la page d'accueil */}
        {welcomeHeaderSlot ?? <WelcomeHeaderWrapper />}

        {/* Contenu principal */}
        <div
          className="px-3 md:px-6 lg:px-8 pb-12 md:pb-8"
          aria-live="polite"
          aria-busy={userLoading}
          aria-atomic="true"
        >
          {!userLoading && !effectiveUser && (
            <p className="sr-only" role="status">Impossible de charger votre profil. Utilisez le bouton Réessayer.</p>
          )}
          {/* ⚡ FAST FIRST PAINT: pas de loader plein écran. Avec initialData SSR,
              le contenu rend immédiatement ; les Suspense internes (welcome/exercices)
              affichent leurs skeletons individuels si la donnée n'est pas prête. */}
          <AnimatePresence mode="wait">
            {!userLoading && !effectiveUser ? (
              <MotionDiv
                key="no-user"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 gap-3"
              >
                <div className="text-gray-500">Impossible de charger votre profil.</div>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-blue-600 underline"
                >
                  Réessayer
                </button>
              </MotionDiv>
            ) : (
              <MotionDiv
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-6 md:space-y-8"
              >
                {tabOptions.length > 0 && (
                  <div>
                    <SegmentedControl
                      options={tabOptions}
                      value={activeTab}
                      onChange={setActiveTab}
                      fullWidth
                      size="md"
                      variant="navigation"
                    />
                  </div>
                )}

                {activeTab === 'exercices' && (exercicesSlot ?? <HomeExercicesView />)}

                {activeTab === 'pinned' && (
                  <HomePinnedTab
                    pinnedExercices={pinnedExercices}
                    pinnedProgress={pinnedProgress}
                    pinnedNotes={pinnedNotes}
                    completedExerciceIds={completedExerciceIds}
                    onEdit={handlePinnedEdit}
                    onEditProgress={progressModal.openForEdit}
                    onShareProgress={handleShareProgress}
                    onCompleted={handlePinnedUpdate}
                    onArchive={handlePinnedUpdate}
                    onNoteUpdated={refetchNotes}
                  />
                )}

              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal d'édition de progrès */}
      {effectiveUser && (
        <ProgressBottomSheet
          isOpen={progressModal.isOpen}
          onClose={progressModal.close}
          onSuccess={handleProgressSuccess}
          userId={effectiveUser.id}
          progressToEdit={progressModal.progressToEdit}
          initialContent={progressModal.initialContent}
          initialEmoji={progressModal.initialEmoji}
        />
      )}
    </section>
  );
}
