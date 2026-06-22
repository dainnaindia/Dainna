"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AdvocatePayoutsList from '@/components/AdvocatePayoutsList';

export default function SendToAdvDraftPage() {
  return (
    <DashboardLayout role="admin">
      <AdvocatePayoutsList
        role="admin"
        statusFilter={4}
        title="Sent to Advocate Payments"
        subtitle="View payouts that have been submitted to advocates and are awaiting approval."
      />
    </DashboardLayout>
  );
}
