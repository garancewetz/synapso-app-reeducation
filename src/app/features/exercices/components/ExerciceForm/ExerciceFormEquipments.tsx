import { useState } from 'react';
import { CheckIcon } from '@/app/components/ui/icons';
import { Loader } from '@/app/components';
import clsx from 'clsx';

type Props = {
  selectedEquipments: string[];
  allEquipments: string[];
  equipmentIconsMap: Record<string, string>;
  loadingEquipments: boolean;
  onToggleEquipment: (equipment: string) => void;
  onAddEquipment: (equipment: string) => void;
};

/** Equipment as quick choices; « + Autre » opens a field only when needed. */
export function ExerciceFormEquipments({
  selectedEquipments,
  allEquipments,
  equipmentIconsMap,
  loadingEquipments,
  onToggleEquipment,
  onAddEquipment,
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [newEquipment, setNewEquipment] = useState('');
  // Show custom ones already picked even if they are not in the user's list yet.
  const choices = [...allEquipments, ...selectedEquipments.filter((eq) => !allEquipments.includes(eq))];

  const addNew = () => {
    const name = newEquipment.trim();
    if (name && !selectedEquipments.includes(name)) onAddEquipment(name);
    setNewEquipment('');
    setIsAdding(false);
  };

  const chip = (selected: boolean) =>
    clsx(
      'min-h-[44px] px-3.5 rounded-full text-base font-medium border flex items-center gap-1.5 active:scale-95 transition-colors',
      selected ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'
    );

  return (
    <div>
      <span className="block text-base font-medium text-gray-800 mb-2">Matériel</span>
      {loadingEquipments ? (
        <Loader size="md" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {choices.map((name) => {
            const isSelected = selectedEquipments.includes(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => onToggleEquipment(name)}
                aria-pressed={isSelected}
                aria-label={`${isSelected ? 'Désélectionner' : 'Sélectionner'} ${name}`}
                className={chip(isSelected)}
              >
                {equipmentIconsMap[name] && <span aria-hidden="true">{equipmentIconsMap[name]}</span>}
                {name}
                {isSelected && <CheckIcon className="w-4 h-4" strokeWidth={2.5} />}
              </button>
            );
          })}
          {!isAdding && (
            <button type="button" onClick={() => setIsAdding(true)} className={chip(false)}>
              + Autre
            </button>
          )}
        </div>
      )}
      {isAdding && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            autoFocus
            placeholder="Ex : élastique, haltère…"
            value={newEquipment}
            onChange={(e) => setNewEquipment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addNew();
              }
            }}
            aria-label="Nom du nouveau matériel"
            className="flex-1 h-12 px-4 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <button
            type="button"
            onClick={addNew}
            disabled={!newEquipment.trim()}
            className="h-12 px-4 rounded-xl bg-gray-900 text-white font-semibold disabled:opacity-40"
          >
            Ajouter
          </button>
        </div>
      )}
    </div>
  );
}
