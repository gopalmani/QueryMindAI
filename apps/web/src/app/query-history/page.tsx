'use client';

import React from 'react';
import AppLayout from '../components/AppLayout';
import QueryLibraryContent from './components/QueryLibraryContent';

export default function QueryHistoryPage() {
  return (
    <AppLayout activeRoute="/query-history">
      <QueryLibraryContent />
    </AppLayout>
  );
}
