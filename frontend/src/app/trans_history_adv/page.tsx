"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AdvocatePayoutsList from '@/components/AdvocatePayoutsList';

export default function TransHistoryAdvPage() {
  return (
    <DashboardLayout role="admin">
      <AdvocatePayoutsList
        role="admin"
        title="Advocate Payout History"
        subtitle="View history and details of all advocate payout transactions registered in the system."
      />
    </DashboardLayout>
  );
}
