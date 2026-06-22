"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AdvocatePayoutsList from '@/components/AdvocatePayoutsList';

export default function FailedTransactionAdvPage() {
  return (
    <DashboardLayout role="admin">
      <AdvocatePayoutsList
        role="admin"
        statusFilter={2}
        title="Failed Advocate Payouts"
        subtitle="View payout transfers that have failed or were rejected by advocates."
      />
    </DashboardLayout>
  );
}
