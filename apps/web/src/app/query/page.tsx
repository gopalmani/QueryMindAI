import AppLayout from '@/app/components/AppLayout';
import QueryWorkspace from '@/features/query/QueryWorkspace';

export default function QueryRoute() {
  return (
    <AppLayout activeRoute="/query">
      <QueryWorkspace />
    </AppLayout>
  );
}
