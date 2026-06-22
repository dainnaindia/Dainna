"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AdvocatePayoutsList from '@/components/AdvocatePayoutsList';

export default function SuccessTransactionAdvPage() {
  return (
    <DashboardLayout role="admin">
      <AdvocatePayoutsList
        role="admin"
        statusFilter={1}
        title="Successful Advocate Payouts"
        subtitle="View payout transfers that have been successfully approved by advocates."
      />
    </DashboardLayout>
  );
}
