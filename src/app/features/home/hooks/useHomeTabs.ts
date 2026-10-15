import { useState, useMemo, useEffect } from 'react';

// "Suivi" removed: it duplicated the bottom-bar "Progression" and the menu (Notes).
type TabValue = 'exercices' | 'pinned';

type TabOptionData = {
  value: TabValue;
  label: string;
  iconName: 'UserIcon' | 'BookmarkIcon';
};

export function useHomeTabs(pinnedCount: number, initialTabFromUrl?: TabValue | null) {
  const [activeTab, setActiveTab] = useState<TabValue>(initialTabFromUrl ?? 'exercices');

  useEffect(() => {
    if (initialTabFromUrl) {
      setActiveTab(initialTabFromUrl);
    }
  }, [initialTabFromUrl]);

  const tabOptionsData = useMemo<TabOptionData[]>(() => {
    const options: TabOptionData[] = [];

    options.push({
      value: 'exercices',
      label: 'Exercices',
      iconName: 'UserIcon',
    });

    options.push({
      value: 'pinned',
      label: pinnedCount > 0 ? `Épinglé (${pinnedCount})` : 'Épinglé',
      iconName: 'BookmarkIcon',
    });

    return options;
  }, [pinnedCount]);

  const currentActiveTab = useMemo(() => {
    const isTabAvailable = tabOptionsData.some(opt => opt.value === activeTab);
    return isTabAvailable ? activeTab : 'exercices';
  }, [activeTab, tabOptionsData]);

  return {
    activeTab: currentActiveTab,
    setActiveTab,
    tabOptionsData,
  };
}
