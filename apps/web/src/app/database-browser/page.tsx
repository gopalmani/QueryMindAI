'use client';

import React from 'react';
import AppLayout from '../components/AppLayout';
import DatabaseBrowserContent from './components/DatabaseBrowserContent';

export default function DatabaseBrowserPage() {
  return (
    <AppLayout activeRoute="/database-browser">
      <DatabaseBrowserContent />
    </AppLayout>
  );
}
