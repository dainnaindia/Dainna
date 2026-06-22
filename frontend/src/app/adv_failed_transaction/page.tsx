"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AdvocatePayoutsList from '@/components/AdvocatePayoutsList';

export default function AdvFailedTransactionPage() {
  return (
    <DashboardLayout role="advocate">
      <AdvocatePayoutsList
        role="advocate"
        statusFilter={2}
        title="Failed Transaction"
        subtitle="Review failed payout transactions and unresolved cases."
      />
    </DashboardLayout>
  );
}
