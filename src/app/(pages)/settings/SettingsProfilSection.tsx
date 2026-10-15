'use client';

import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { ErrorMessage } from '@/app/components/ErrorMessage';
import { Loader } from '@/app/components/ui/Loader';
import { ToggleButtonGroup } from '@/app/components/ui/ToggleButtonGroup';
import { Card } from '@/app/components/ui/Card';

type ResetFrequency = 'DAILY' | 'WEEKLY';
type DominantHand = 'LEFT' | 'RIGHT';

type Props = {
  name: string;
  setName: (value: string) => void;
  resetFrequency: ResetFrequency;
  setResetFrequency: (value: ResetFrequency) => void;
  dominantHand: DominantHand;
  setDominantHand: (value: DominantHand) => void;
  hasUnsavedChanges: boolean;
  loading: boolean;
  error: string;
  success: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
};

export function SettingsProfilSection({
  name,
  setName,
  resetFrequency,
  setResetFrequency,
  dominantHand,
  setDominantHand,
  hasUnsavedChanges,
  loading,
  error,
  success,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <ErrorMessage message={error} />

      {hasUnsavedChanges && !success && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-700 text-sm font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>N&apos;oubliez pas d&apos;enregistrer vos changements</span>
          </p>
        </div>
      )}

      <Card variant="default" padding="md">
        <Input
          label="Nom de l'utilisateur"
          type="text"
          required
          placeholder="Ex: Calypso"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
      </Card>

      <Card variant="default" padding="md">
        <label className="block text-base font-semibold text-gray-800 mb-2">
          Préférence de main
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Les boutons principaux se placent du côté de ta main dominante.
        </p>
        <ToggleButtonGroup
          options={[
            { value: 'LEFT', label: 'Gauche', icon: '🤚' },
            { value: 'RIGHT', label: 'Droite', icon: '✋' },
          ]}
          value={dominantHand}
          onChange={(value) => setDominantHand(value as DominantHand)}
          activeColor="amber"
        />
      </Card>

      <Card variant="default" padding="md">
        <label className="block text-base font-semibold text-gray-800 mb-2">
          Mon rythme
        </label>
        <p className="text-sm text-gray-500 mb-4">
          À quelle fréquence veux-tu faire tous tes exercices ?
        </p>
        <ToggleButtonGroup
          options={[
            { value: 'DAILY', label: 'Tous les jours' },
            { value: 'WEEKLY', label: 'Sur la semaine' },
          ]}
          value={resetFrequency}
          onChange={(value) => setResetFrequency(value as ResetFrequency)}
          activeColor="amber"
        />
        <div className="mt-3 text-sm text-gray-500 space-y-1">
          {resetFrequency === 'DAILY' && (
            <p>Chaque jour, tes exercices sont à refaire. La séance du jour en propose 5.</p>
          )}
          {resetFrequency === 'WEEKLY' && (
            <p>Tu as la semaine pour tout faire (on recommence le lundi). La séance du jour en propose 5.</p>
          )}
        </div>
      </Card>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-emerald-700 text-sm font-medium">
            ✓ Profil enregistré avec succès
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          className={`flex-1 ${hasUnsavedChanges ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
        >
          {loading ? (
            <>
              <Loader size="md" />
              <span>Enregistrement...</span>
            </>
          ) : (
            'Enregistrer mon profil'
          )}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {hasUnsavedChanges ? 'Quitter' : 'Annuler'}
        </Button>
      </div>
    </form>
  );
}
