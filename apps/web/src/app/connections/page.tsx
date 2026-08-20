import AppLayout from '@/app/components/AppLayout';
import ConnectionsPage from '@/features/connections/ConnectionsPage';

export default function ConnectionsRoute() {
  return (
    <AppLayout activeRoute="/connections">
      <ConnectionsPage />
    </AppLayout>
  );
}
