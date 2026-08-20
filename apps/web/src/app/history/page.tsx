import AppLayout from '@/app/components/AppLayout';
import QueryHistoryPage from '@/features/history/QueryHistoryPage';

export default function HistoryRoute() {
  return (
    <AppLayout activeRoute="/history">
      <QueryHistoryPage />
    </AppLayout>
  );
}
