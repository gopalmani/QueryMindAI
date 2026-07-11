import AppLayout from '../components/AppLayout';
import SqlEditorContent from './components/SqlEditorContent';

export default function Page() {
  return (
    <AppLayout activeRoute="/sql-editor-and-ai-assistant">
      <SqlEditorContent />
    </AppLayout>
  );
}