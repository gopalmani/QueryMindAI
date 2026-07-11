import AppLayout from '../components/AppLayout';
import DashboardContent from './components/DashboardContent';

export default function Page() {
  return (
    <AppLayout activeRoute="/dashboard-and-connection">
      <DashboardContent />
    </AppLayout>
  );
}