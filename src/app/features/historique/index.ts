// Components
export { ActivityHeatmap } from './components/ActivityHeatmap';
export { ActivityHeatmapCell } from './components/ActivityHeatmapCell';
export { ActivityHeatmapSkeleton } from './components/ActivityHeatmapSkeleton';
export { ActivityLineChart } from './components/ActivityLineChart';
export { BodypartsBarChart } from './components/BodypartsBarChart';
export { ActivityLineChartSkeleton } from './components/ActivityLineChartSkeleton';
export { DayDetailModal } from './components/DayDetailModal';
export { DayDetailModalWrapper } from './components/DayDetailModalWrapper';
export { LazyDonutChart } from './components/LazyDonutChart';
export { LazyProgressStatsChart } from './components/LazyProgressStatsChart';
export { ProgressCard } from './components/ProgressCard';
export { ProgressCardCompact } from './components/ProgressCardCompact';
export { ProgressSlideshow } from './components/ProgressSlideshow';
export { ProgressStatsByTags } from './components/ProgressStatsByTags';
export { ProgressTimeline } from './components/ProgressTimeline';
export { ProgressTimelineEmpty } from './components/ProgressTimelineEmpty';
export { StatsCard } from './components/StatsCard';
export { WeekAccordionList } from './components/WeekAccordionNew';
export { WeekCalendar } from './components/WeekCalendar';
export { WeekHeatmap } from './components/WeekHeatmap';
export { HistoriqueStatistiquesSection } from './components/HistoriqueStatistiquesSection';
export { HistoriqueProgresSection } from './components/HistoriqueProgresSection';

// Hooks
export { useHistory } from './hooks/useHistory';
export { useDayData } from './hooks/useDayData';
export { useDayStats } from './hooks/useDayStats';
export { useHeatmapNavigation, getRequiredDaysForOffset } from './hooks/useHeatmapNavigation';
export { usePeriodNavigation, getRequiredDaysForMonthOffset } from './hooks/usePeriodNavigation';

// Utils
export * from './utils/historique.utils';
