'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronIcon } from '@/app/components/ui/icons';
import { ExerciceMedia } from './ExerciceMedia';
import type { Exercice } from '@/app/types';

type Props = {
  exercice: Exercice;
  isExpanded: boolean;
  onLightboxOpen: (index: number) => void;
};

export function ExerciceCardExpandable({
  exercice,
  isExpanded,
  onLightboxOpen,
}: Props) {
  // Séries / répétitions / durée are shown on the card header, always visible.
  const hasExpandableContent =
    exercice.description.text || exercice.description.comment || exercice.media || exercice.sharedBy;

  if (!hasExpandableContent) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{
              opacity: 1,
              height: "auto",
              marginTop: 16
            }}
            exit={{
              opacity: 0,
              height: 0,
              marginTop: 0
            }}
            transition={{
              duration: 0.15,
              ease: "easeOut"
            }}
            className="overflow-hidden space-y-3"
          >
            {/* 1. Images */}
            {exercice.media && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
              >
                <ExerciceMedia 
                  media={exercice.media} 
                  maxPhotos={3}
                  onLightboxOpen={onLightboxOpen}
                  showLightbox={false}
                />
              </motion.div>
            )}
            
            {/* 2. Description */}
            {exercice.description.text && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.1
                }}
                className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap"
              >
                {exercice.description.text}
              </motion.p>
            )}
            
            {/* 4. Conseil */}
            {exercice.description.comment && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.1
                }}
                className="p-3 bg-slate-50 border-l-2 border-slate-300 text-slate-700 text-sm rounded-r"
              >
                <span className="font-semibold">Conseil : </span>
                {exercice.description.comment}
              </motion.div>
            )}

            {/* 5. Partagé par */}
            {exercice.sharedBy && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
                className="text-xs text-gray-400"
              >
                Partagé par <span className="font-medium text-gray-500">{exercice.sharedBy.name}</span>
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center mt-2">
        <ChevronIcon
          className={`w-4 h-4 text-gray-400 transition-transform duration-200`}
          direction={isExpanded ? 'up' : 'down'}
        />
      </div>
    </>
  );
}

