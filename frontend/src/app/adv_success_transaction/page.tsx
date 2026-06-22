"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AdvocatePayoutsList from '@/components/AdvocatePayoutsList';

export default function AdvSuccessTransactionPage() {
  return (
    <DashboardLayout role="advocate">
      <AdvocatePayoutsList
        role="advocate"
        statusFilter={1}
        title="Success Transaction"
        subtitle="Review verified drafted commissions and case reviews completed."
      />
    </DashboardLayout>
  );
}
