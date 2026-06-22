"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AdvocatePayoutsList from '@/components/AdvocatePayoutsList';

export default function AdvDailyTransactionPage() {
  return (
    <DashboardLayout role="advocate">
      <AdvocatePayoutsList
        role="advocate"
        statusFilter={4}
        title="Daily Transaction"
        subtitle="Review and verify payout transactions received from the administrator."
      />
    </DashboardLayout>
  );
}
