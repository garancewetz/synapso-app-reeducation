'use client';

import { useState } from 'react';
import {
  Button,
  Badge,
  Card,
  BaseCard,
  Input,
  Textarea,
  Loader,
  Accordion,
  SegmentedControl,
  ToggleButtonGroup,
  PeriodNavigation,
  BackButton,
  ViewAllLink,
  BorderedIconList,
  FilterBadge,
  StatusFilterBadge,
  EquipmentFilterBadge,
  StatusFilterSection,
  AddButton,
  CompleteButton,
  ProgressButton,
  CardActionButton,
  CardActionsPanel,
  InlineSpinner,
  SpeechButton,
} from '@/app/components/ui';
import {
  CalendarIcon,
  CheckIcon,
  EditIcon,
  PlusIcon,
  SettingsIcon,
  ShareIcon,
  CloseIcon,
  WarningIcon,
  SparklesIcon,
} from '@/app/components/ui/icons';
import { EmptyState } from '@/app/components/EmptyState';
import { ErrorMessage } from '@/app/components/ErrorMessage';
import type { ExerciceCategory, ExerciceStatusFilter } from '@/app/types';

// ============================================================================
// Section wrapper
// ============================================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">{title}</h2>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function StyleguidePage() {
  // State pour les démos interactives
  const [segmentValue, setSegmentValue] = useState<'tab1' | 'tab2' | 'tab3'>('tab1');
  const [toggleValue, setToggleValue] = useState<'a' | 'b'>('a');
  const [statusFilter, setStatusFilter] = useState<ExerciceStatusFilter>('all');
  const [activeCategory, setActiveCategory] = useState<ExerciceCategory | null>(null);
  const [activeEquipment, setActiveEquipment] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Styleguide</h1>
        <p className="text-gray-500 mt-1">Composants UI réutilisables de Synapso</p>
      </header>

      {/* ================================================================ */}
      {/* BUTTONS */}
      {/* ================================================================ */}
      <Section title="Buttons">
        <SubSection title="Variantes">
          <div className="flex flex-wrap gap-3">
            <Button variant="action">Action</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success">Success</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="danger-outline">Danger Outline</Button>
          </div>
        </SubSection>

        <SubSection title="Tailles">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </SubSection>

        <SubSection title="Avec icônes">
          <div className="flex flex-wrap gap-3">
            <Button icon={<PlusIcon className="w-5 h-5" />}>Ajouter</Button>
            <Button icon={<EditIcon className="w-5 h-5" />} iconPosition="right">Modifier</Button>
            <Button icon={<ShareIcon className="w-5 h-5" />} variant="secondary">Partager</Button>
          </div>
        </SubSection>

        <SubSection title="Icon Only">
          <div className="flex flex-wrap gap-3">
            <Button iconOnly aria-label="Paramètres"><SettingsIcon className="w-5 h-5" /></Button>
            <Button iconOnly aria-label="Fermer"><CloseIcon className="w-5 h-5" /></Button>
            <Button iconOnly isActive aria-label="Actif"><CheckIcon className="w-5 h-5" /></Button>
          </div>
        </SubSection>

        <SubSection title="Disabled">
          <div className="flex flex-wrap gap-3">
            <Button disabled>Désactivé</Button>
            <Button variant="secondary" disabled>Secondary</Button>
            <Button variant="danger" disabled>Danger</Button>
          </div>
        </SubSection>

        <SubSection title="Rounded">
          <div className="flex flex-wrap gap-3">
            <Button rounded="md">Rounded MD</Button>
            <Button rounded="lg">Rounded LG</Button>
          </div>
        </SubSection>

        <SubSection title="Avec href (lien)">
          <p className="text-xs text-gray-500 mb-2">Passer <code>href</code> rend un <code>&lt;a&gt;</code> (TouchLink) au lieu d&apos;un <code>&lt;button&gt;</code>. Même API, même style.</p>
          <div className="flex flex-wrap gap-3">
            <Button href="/exercices" variant="secondary">Voir les exercices</Button>
            <Button href="/historique" variant="action" icon={<CalendarIcon className="w-5 h-5" />}>Historique</Button>
            <Button href="/settings" variant="secondary" iconOnly aria-label="Paramètres"><SettingsIcon className="w-5 h-5" /></Button>
          </div>
        </SubSection>

        <SubSection title="Boutons spécialisés">
          <div className="flex flex-wrap items-center gap-3">
            <AddButton onClick={() => {}} label="Ajouter" layout="inline" />
            <ProgressButton onClick={() => {}} label="Progrès" />
            <CompleteButton isCompleted={false} />
            <CompleteButton isCompleted isCompletedToday />
          </div>
        </SubSection>

        <SubSection title="CardActionButton (grilles d'actions)">
          <p className="text-xs text-gray-500 mb-2">Boutons verticaux (icône + label) pour les panneaux d&apos;actions des cartes.</p>
          <div className="grid grid-cols-2 border border-gray-200 rounded-lg overflow-hidden max-w-xs">
            <CardActionButton
              icon={<EditIcon className="w-5 h-5" />}
              label="Modifier"
              onClick={() => {}}
              className="border-r border-b border-gray-200"
            />
            <CardActionButton
              icon={<ShareIcon className="w-5 h-5" />}
              label="Partager"
              onClick={() => {}}
              className="border-b border-gray-200"
            />
            <CardActionButton
              icon={<PlusIcon className="w-5 h-5" />}
              label="Épingler"
              onClick={() => {}}
              className="border-r border-gray-200"
            />
            <CardActionButton
              icon={<CloseIcon className="w-5 h-5" />}
              label="Archiver"
              onClick={() => {}}
            />
          </div>
          <div className="grid grid-cols-3 border border-amber-200 rounded-lg overflow-hidden max-w-sm mt-3">
            <CardActionButton icon={<EditIcon className="w-5 h-5" />} label="Modifier" onClick={() => {}} color="amber" className="border-r border-amber-200" />
            <CardActionButton icon={<ShareIcon className="w-5 h-5" />} label="Partager" onClick={() => {}} color="amber" className="border-r border-amber-200" />
            <CardActionButton icon={<PlusIcon className="w-5 h-5" />} label="Épingler" onClick={() => {}} color="amber" />
          </div>
        </SubSection>

        <SubSection title="CardActionsPanel (panneau d'actions rétractable)">
          <p className="text-xs text-gray-500 mb-2">Wrapper animé (CSS grid) pour les grilles d&apos;actions des cartes. 3 palettes : gray, neutral, amber.</p>
          <div className="space-y-3 max-w-sm">
            <CardActionsPanel isOpen color="gray">
              <CardActionButton icon={<EditIcon className="w-5 h-5" />} label="Modifier" onClick={() => {}} className="border-r border-b border-gray-200" />
              <CardActionButton icon={<ShareIcon className="w-5 h-5" />} label="Partager" onClick={() => {}} className="border-b border-gray-200" />
              <CardActionButton icon={<PlusIcon className="w-5 h-5" />} label="Épingler" onClick={() => {}} className="border-r border-gray-200" />
              <CardActionButton icon={<CloseIcon className="w-5 h-5" />} label="Archiver" onClick={() => {}} />
            </CardActionsPanel>
            <CardActionsPanel isOpen color="neutral">
              <CardActionButton icon={<EditIcon className="w-5 h-5" />} label="Image" onClick={() => {}} color="neutral" className="border-r border-b border-neutral-200" />
              <CardActionButton icon={<CheckIcon className="w-5 h-5" />} label="Exercices" onClick={() => {}} color="neutral" className="border-b border-neutral-200" />
              <CardActionButton icon={<ShareIcon className="w-5 h-5" />} label="Partager" onClick={() => {}} color="neutral" className="border-r border-neutral-200" />
              <CardActionButton icon={<CloseIcon className="w-5 h-5" />} label="Supprimer" onClick={() => {}} color="neutral" />
            </CardActionsPanel>
            <CardActionsPanel isOpen color="amber" columns={3}>
              <CardActionButton icon={<EditIcon className="w-5 h-5" />} label="Modifier" onClick={() => {}} color="amber" className="border-r border-amber-200" />
              <CardActionButton icon={<PlusIcon className="w-5 h-5" />} label="Épingler" onClick={() => {}} color="amber" className="border-r border-amber-200" />
              <CardActionButton icon={<ShareIcon className="w-5 h-5" />} label="Partager" onClick={() => {}} color="amber" />
            </CardActionsPanel>
          </div>
        </SubSection>

        <SubSection title="InlineSpinner (spinner dans un bouton)">
          <p className="text-xs text-gray-500 mb-2">Remplace une icône pendant un état de chargement. 4 couleurs, 4 tailles (sm/md pour boutons, lg/xl pour pages).</p>
          <div className="flex flex-wrap items-end gap-6 mb-3">
            {(['gray', 'neutral', 'amber', 'emerald'] as const).map((color) => (
              <div key={color} className="flex flex-col items-center gap-1">
                <InlineSpinner color={color} />
                <span className="text-[10px] text-gray-500">{color}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-6 mb-3">
            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <div key={size} className="flex flex-col items-center gap-1">
                <InlineSpinner size={size} />
                <span className="text-[10px] text-gray-500">{size}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" disabled icon={<InlineSpinner color="gray" size="sm" />}>Chargement…</Button>
            <Button variant="success" disabled icon={<InlineSpinner color="emerald" size="sm" />}>Validation…</Button>
          </div>
        </SubSection>
      </Section>

      {/* ================================================================ */}
      {/* BADGES */}
      {/* ================================================================ */}
      <Section title="Badges">
        <SubSection title="Variantes">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="workout">Workout</Badge>
            <Badge variant="equipment">Equipment</Badge>
            <Badge variant="completed">Completed</Badge>
            <Badge variant="mastered">Mastered</Badge>
          </div>
        </SubSection>

        <SubSection title="Avec icônes">
          <div className="flex flex-wrap gap-2">
            <Badge icon="💪">Force</Badge>
            <Badge icon="🧘" variant="workout">Étirements</Badge>
            <Badge icon={<CalendarIcon className="w-3.5 h-3.5" />}>Planifié</Badge>
            <Badge icon="✅" variant="completed">Terminé</Badge>
          </div>
        </SubSection>

        <SubSection title="Filter Badges">
          <div className="flex flex-wrap gap-2">
            <FilterBadge
              label="Haut du corps"
              icon="💪"
              count={3}
              isActive={activeCategory === 'UPPER_BODY'}
              category="UPPER_BODY"
              onClick={() => setActiveCategory(activeCategory === 'UPPER_BODY' ? null : 'UPPER_BODY')}
            />
            <FilterBadge
              label="Jambes"
              icon="🦵"
              count={5}
              isActive={activeCategory === 'LOWER_BODY'}
              category="LOWER_BODY"
              onClick={() => setActiveCategory(activeCategory === 'LOWER_BODY' ? null : 'LOWER_BODY')}
            />
            <EquipmentFilterBadge
              label="Haltères"
              icon="🏋️"
              count={2}
              isActive={activeEquipment}
              onClick={() => setActiveEquipment(!activeEquipment)}
            />
          </div>
        </SubSection>

        <SubSection title="Status Filter Badges">
          <div className="flex flex-wrap gap-2">
            <StatusFilterBadge value="all" label="Tous" count={10} isActive={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
            <StatusFilterBadge value="completed" label="Faits" count={6} isActive={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')} />
            <StatusFilterBadge value="notCompleted" label="À faire" count={4} isActive={statusFilter === 'notCompleted'} onClick={() => setStatusFilter('notCompleted')} />
          </div>
        </SubSection>

        <SubSection title="Status Filter Section (composant complet)">
          <StatusFilterSection filter={statusFilter} onFilterChange={setStatusFilter} />
        </SubSection>
      </Section>

      {/* ================================================================ */}
      {/* INPUTS */}
      {/* ================================================================ */}
      <Section title="Inputs">
        <SubSection title="Input basique">
          <div className="max-w-md space-y-3">
            <Input label="Nom" placeholder="Entrez votre nom" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
            <Input label="Email" type="email" placeholder="votre@email.com" required />
            <Input placeholder="Sans label" />
            <Input label="Désactivé" disabled value="Non modifiable" />
          </div>
        </SubSection>

        <SubSection title="Input avec dictée vocale (speech)">
          <p className="text-xs text-gray-500 mb-2">Passer <code>speech</code> active la dictée. Requiert <code>value</code> + <code>onValueChange</code>.</p>
          <div className="max-w-md space-y-3">
            <Input speech label="Nom de l&apos;exercice" placeholder="Dictez ou tapez…" value={inputValue} onValueChange={setInputValue} />
            <Textarea speech label="Description" placeholder="Dictez ou tapez…" value={textareaValue} onValueChange={setTextareaValue} />
          </div>
        </SubSection>

        <SubSection title="SpeechButton (bouton dictée autonome)">
          <p className="text-xs text-gray-500 mb-2">Bouton dictée utilisable seul. Positions : <code>input</code> (centré) ou <code>textarea</code> (en haut).</p>
          <div className="flex gap-4 items-center">
            <div className="relative w-10 h-10">
              <SpeechButton isListening={false} onClick={() => {}} position="input" />
            </div>
            <div className="relative w-10 h-10">
              <SpeechButton isListening onClick={() => {}} position="input" />
            </div>
          </div>
        </SubSection>

        <SubSection title="Textarea">
          <div className="max-w-md space-y-3">
            <Textarea label="Description" placeholder="Décrivez votre exercice..." value={textareaValue} onChange={(e) => setTextareaValue(e.target.value)} />
            <Textarea label="Notes" placeholder="Avec label obligatoire" required value="" />
          </div>
        </SubSection>
      </Section>

      {/* ================================================================ */}
      {/* CARDS */}
      {/* ================================================================ */}
      <Section title="Cards">
        <SubSection title="Card (statique)">
          <div className="space-y-3">
            <Card>
              <p className="text-gray-700">Card par défaut avec padding medium</p>
            </Card>
            <Card variant="outlined" padding="lg">
              <p className="text-gray-700">Card outlined avec padding large</p>
            </Card>
            <Card variant="subtle" padding="sm">
              <p className="text-gray-700">Card subtle avec padding small</p>
            </Card>
          </div>
        </SubSection>

        <SubSection title="BaseCard (interactive, compound)">
          <div className="space-y-3">
            <BaseCard onClick={() => {}}>
              <BaseCard.Accent color="bg-teal-500" />
              <BaseCard.Content className="p-4">
                <p className="font-medium">Carte avec accent teal</p>
                <p className="text-sm text-gray-500">Cliquable avec hover effect</p>
              </BaseCard.Content>
            </BaseCard>

            <BaseCard onClick={() => {}}>
              <BaseCard.Accent color="bg-purple-500" />
              <BaseCard.Content className="p-4">
                <p className="font-medium">Carte avec accent violet</p>
                <p className="text-sm text-gray-500">Et un footer d&apos;actions</p>
              </BaseCard.Content>
              <BaseCard.Footer>
                <Button size="sm" variant="secondary" icon={<EditIcon className="w-4 h-4" />}>Modifier</Button>
              </BaseCard.Footer>
            </BaseCard>

            <BaseCard isGolden onClick={() => {}}>
              <BaseCard.Accent />
              <BaseCard.Content className="p-4">
                <p className="font-medium">Carte dorée (victoire)</p>
                <p className="text-sm">Style de célébration</p>
              </BaseCard.Content>
              <BaseCard.Footer>
                <SparklesIcon className="w-5 h-5" />
              </BaseCard.Footer>
            </BaseCard>
          </div>
        </SubSection>
      </Section>

      {/* ================================================================ */}
      {/* SELECTION CONTROLS */}
      {/* ================================================================ */}
      <Section title="Contrôles de sélection">
        <SubSection title="SegmentedControl">
          <div className="space-y-4">
            <SegmentedControl
              options={[
                { value: 'tab1' as const, label: 'Onglet 1' },
                { value: 'tab2' as const, label: 'Onglet 2' },
                { value: 'tab3' as const, label: 'Onglet 3' },
              ]}
              value={segmentValue}
              onChange={setSegmentValue}
              fullWidth
              variant="navigation"
              size="md"
            />
            <p className="text-sm text-gray-500">Sélectionné : {segmentValue}</p>
          </div>
        </SubSection>

        <SubSection title="SegmentedControl (filter, avec icônes)">
          <SegmentedControl
            options={[
              { value: 'tab1' as const, label: '💪 Force', count: 5 },
              { value: 'tab2' as const, label: '🧘 Souplesse', count: 3 },
              { value: 'tab3' as const, label: '🏃 Cardio', count: 2 },
            ]}
            value={segmentValue}
            onChange={setSegmentValue}
            fullWidth
            variant="filter"
          />
        </SubSection>

        <SubSection title="ToggleButtonGroup">
          <div className="max-w-xs space-y-4">
            <ToggleButtonGroup
              options={[
                { value: 'a' as const, label: 'Option A', icon: '🅰️' },
                { value: 'b' as const, label: 'Option B', icon: '🅱️' },
              ]}
              value={toggleValue}
              onChange={setToggleValue}
            />
            <ToggleButtonGroup
              options={[
                { value: 'a' as const, label: 'Gaucher' },
                { value: 'b' as const, label: 'Droitier' },
              ]}
              value={toggleValue}
              onChange={setToggleValue}
              activeColor="purple"
            />
          </div>
        </SubSection>
      </Section>

      {/* ================================================================ */}
      {/* NAVIGATION */}
      {/* ================================================================ */}
      <Section title="Navigation">
        <SubSection title="BackButton">
          <BackButton backHref="/" backLabel="Accueil" />
        </SubSection>

        <SubSection title="PeriodNavigation">
          <PeriodNavigation
            label="Semaine du 10 mars"
            onPrevious={() => {}}
            onNext={() => {}}
            canGoBack
            canGoForward
          />
        </SubSection>

        <SubSection title="ViewAllLink">
          <ViewAllLink href="/exercices" label="Voir tous les exercices" emoji="📋" />
        </SubSection>
      </Section>

      {/* ================================================================ */}
      {/* ACCORDION */}
      {/* ================================================================ */}
      <Section title="Accordion">
        <Accordion defaultValue="item-1">
          <Accordion.Item value="item-1">
            <Accordion.Trigger icon="📋">
              <span className="font-medium">Premier élément</span>
            </Accordion.Trigger>
            <Accordion.Content>
              <p className="text-gray-600">Contenu du premier élément de l&apos;accordéon. Peut contenir n&apos;importe quel composant.</p>
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="item-2">
            <Accordion.Trigger icon="⚙️">
              <span className="font-medium">Second élément</span>
            </Accordion.Trigger>
            <Accordion.Content>
              <p className="text-gray-600">Contenu du second élément.</p>
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="item-3">
            <Accordion.Trigger>
              <span className="font-medium">Sans icône</span>
            </Accordion.Trigger>
            <Accordion.Content>
              <p className="text-gray-600">Cet élément n&apos;a pas d&apos;icône.</p>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </Section>

      {/* ================================================================ */}
      {/* BORDERED ICON LIST */}
      {/* ================================================================ */}
      <Section title="BorderedIconList">
        <BorderedIconList
          title="Exercices liés"
          ariaLabel="Liste des exercices liés"
          items={[
            { key: '1', label: 'Extension du poignet', icon: '🤚', borderClass: 'border-l-teal-400', completed: true },
            { key: '2', label: 'Flexion du coude', icon: '💪', borderClass: 'border-l-blue-400', href: '#' },
            { key: '3', label: 'Rotation épaule', icon: '🔄', borderClass: 'border-l-purple-400', secondaryLabel: '3x12' },
          ]}
        />
      </Section>

      {/* ================================================================ */}
      {/* LOADER */}
      {/* ================================================================ */}
      <Section title="Loader">
        <p className="text-xs text-gray-500 mb-3">Mêmes tailles que InlineSpinner. Défaut : <code>lg</code>.</p>
        <div className="flex items-end gap-8">
          {([
            { size: 'sm' as const, label: 'sm (16px)' },
            { size: 'md' as const, label: 'md (20px)' },
            { size: 'lg' as const, label: 'lg — défaut' },
            { size: 'xl' as const, label: 'xl (48px)' },
          ]).map(({ size, label }) => (
            <div key={size} className="text-center">
              <Loader size={size} />
              <p className="text-xs text-gray-500 mt-2">{label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ================================================================ */}
      {/* FEEDBACK */}
      {/* ================================================================ */}
      <Section title="Feedback & États">
        <SubSection title="ErrorMessage">
          <ErrorMessage message="Une erreur est survenue lors de la sauvegarde." />
        </SubSection>

        <SubSection title="EmptyState">
          <EmptyState
            icon="📭"
            title="Aucun exercice"
            message="Commencez par ajouter votre premier exercice."
            subMessage="Vos exercices apparaîtront ici."
          />
        </SubSection>
      </Section>

      {/* ================================================================ */}
      {/* ICONS */}
      {/* ================================================================ */}
      <Section title="Icônes">
        <div className="flex flex-wrap gap-4">
          {[
            { Icon: CalendarIcon, name: 'Calendar' },
            { Icon: CheckIcon, name: 'Check' },
            { Icon: CloseIcon, name: 'Close' },
            { Icon: EditIcon, name: 'Edit' },
            { Icon: PlusIcon, name: 'Plus' },
            { Icon: SettingsIcon, name: 'Settings' },
            { Icon: ShareIcon, name: 'Share' },
            { Icon: SparklesIcon, name: 'Sparkles' },
            { Icon: WarningIcon, name: 'Warning' },
          ].map(({ Icon, name }) => (
            <div key={name} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-50 min-w-[72px]">
              <Icon className="w-6 h-6 text-gray-700" />
              <span className="text-[10px] text-gray-500">{name}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Toutes les icônes : ArrowLeft, ArrowRight, Bell, Book, Bookmark, Calendar, Camera, Chat, Check, Chevron, Clock, Close, Dots, Edit, Eye, Map, Menu, Minus, Pin, Plus, Rocket, Settings, Share, Sparkles, User, Warning
        </p>
      </Section>

      {/* ================================================================ */}
      {/* EMOJIS */}
      {/* ================================================================ */}
      <Section title="Emojis">
        <p className="text-sm text-gray-500 mb-2">Tous les emojis utilisés dans l&apos;application, regroupés par catégorie.</p>

        <SubSection title="Navigation & Interface">
          <div className="flex flex-wrap gap-3">
            {[
              { emoji: '🏠', label: 'Home' },
              { emoji: '🚀', label: 'Progression' },
              { emoji: '🗺️', label: 'Carte / Stats' },
              { emoji: '📍', label: 'Jour courant' },
              { emoji: '📌', label: 'Épinglé' },
              { emoji: '⏳', label: 'Sablier / Time Machine' },
              { emoji: '🌱', label: 'Section fermée' },
              { emoji: '🌳', label: 'Section ouverte' },
              { emoji: '🌾', label: 'Liste' },
              { emoji: '📔', label: 'Journal' },
              { emoji: '📋', label: 'Voir tout' },
              { emoji: '📋', label: 'Voir tout (défaut)' },
              { emoji: '🔍', label: 'Recherche' },
            ].map(({ emoji, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-50 min-w-[72px]">
                <span className="text-2xl">{emoji}</span>
                <span className="text-[10px] text-gray-500 text-center">{label}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Catégories d'exercices">
          <div className="flex flex-wrap gap-3">
            {[
              { emoji: '💪', label: 'Haut du corps' },
              { emoji: '🧍', label: 'Tronc' },
              { emoji: '🦵', label: 'Jambes' },
              { emoji: '🧘‍♀️', label: 'Étirements' },
              { emoji: '🙂', label: 'Visage' },
              { emoji: '💬', label: 'Orthophonie' },
              { emoji: '🏋️', label: 'Physique' },
            ].map(({ emoji, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-50 min-w-[72px]">
                <span className="text-2xl">{emoji}</span>
                <span className="text-[10px] text-gray-500 text-center">{label}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Parties du corps">
          <div className="flex flex-wrap gap-3">
            {[
              { emoji: '💪', label: 'Bras' },
              { emoji: '🖐️', label: 'Mains' },
              { emoji: '🏋️', label: 'Épaules' },
              { emoji: '🦒', label: 'Cou / Nuque' },
              { emoji: '👄', label: 'Mâchoire' },
              { emoji: '🦴', label: 'Dos' },
              { emoji: '🩲', label: 'Bassin' },
              { emoji: '🎯', label: 'Ventre' },
              { emoji: '🦵', label: 'Jambes' },
              { emoji: '🍑', label: 'Fessier' },
              { emoji: '🦶', label: 'Pied' },
              { emoji: '🧍', label: 'Corps entier' },
            ].map(({ emoji, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-50 min-w-[72px]">
                <span className="text-2xl">{emoji}</span>
                <span className="text-[10px] text-gray-500 text-center">{label}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Équipements">
          <div className="flex flex-wrap gap-3">
            {[
              { emoji: '🏋️', label: 'Défaut' },
              { emoji: '🛏️', label: 'Lit / Tapis' },
              { emoji: '➖', label: 'Rambarde' },
              { emoji: '🪢', label: 'Sangle' },
              { emoji: '🪑', label: 'Chaise' },
              { emoji: '🦯', label: 'Bâton' },
              { emoji: '🚪', label: 'Porte' },
              { emoji: '🪜', label: 'Escaliers' },
              { emoji: '🦵', label: 'Stepper' },
            ].map(({ emoji, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-50 min-w-[72px]">
                <span className="text-2xl">{emoji}</span>
                <span className="text-[10px] text-gray-500 text-center">{label}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Progrès & Tags">
          <div className="flex flex-wrap gap-3">
            {[
              { emoji: '💪', label: 'Force' },
              { emoji: '🤸', label: 'Souplesse' },
              { emoji: '⚖️', label: 'Équilibre' },
              { emoji: '✨', label: 'Confort / Autre' },
              { emoji: '🎯', label: 'Orthophonie' },
            ].map(({ emoji, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-50 min-w-[72px]">
                <span className="text-2xl">{emoji}</span>
                <span className="text-[10px] text-gray-500 text-center">{label}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Célébrations & Récompenses">
          <div className="flex flex-wrap gap-3">
            {[
              { emoji: '⭐', label: 'Étoile' },
              { emoji: '🌟', label: 'Étoile brillante' },
              { emoji: '🏆', label: 'Trophée' },
              { emoji: '👍', label: 'Pouce' },
              { emoji: '🎉', label: 'Fête' },
              { emoji: '🎊', label: 'Confetti' },
              { emoji: '💫', label: 'Vertige' },
              { emoji: '👑', label: 'Couronne' },
              { emoji: '🥇', label: 'Médaille or' },
              { emoji: '💛', label: 'Cœur doré' },
            ].map(({ emoji, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-50 min-w-[72px]">
                <span className="text-2xl">{emoji}</span>
                <span className="text-[10px] text-gray-500 text-center">{label}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Actions & UI">
          <div className="flex flex-wrap gap-3">
            {[
              { emoji: '✋', label: 'Main droite' },
              { emoji: '🤚', label: 'Main gauche' },
              { emoji: '👁️', label: 'Voir mdp' },
              { emoji: '🙈', label: 'Cacher mdp' },
              { emoji: '🎤', label: 'Micro' },
              { emoji: '⏹️', label: 'Stop' },
              { emoji: '🔴', label: 'Écoute active' },
              { emoji: '📤', label: 'Désarchiver' },
              { emoji: '📦', label: 'Archiver / Table' },
              { emoji: '🧹', label: 'Supprimer' },
              { emoji: '✏️', label: 'Modifier' },
              { emoji: '🧑', label: 'Utilisateur' },
              { emoji: '👑', label: 'Admin' },
            ].map(({ emoji, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-50 min-w-[72px]">
                <span className="text-2xl">{emoji}</span>
                <span className="text-[10px] text-gray-500 text-center">{label}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Statuts & Indicateurs">
          <div className="flex flex-wrap gap-3">
            {[
              { emoji: '✅', label: 'Complété' },
              { emoji: '✓', label: 'Check (texte)' },
              { emoji: '⚠️', label: 'Attention' },
              { emoji: '❌', label: 'Erreur' },
              { emoji: '🔄', label: 'Rotation' },
              { emoji: '·', label: 'Jour vide' },
            ].map(({ emoji, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-50 min-w-[72px]">
                <span className="text-2xl">{emoji}</span>
                <span className="text-[10px] text-gray-500 text-center">{label}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <p className="text-xs text-gray-400 mt-4">
          54 emojis uniques — définis dans : emoji.constants.ts, exercice.constants.ts, equipment.constants.ts, progress.constants.ts, historique.constants.ts
        </p>
      </Section>
    </div>
  );
}
