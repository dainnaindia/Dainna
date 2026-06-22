"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AdvocatePayoutsList from '@/components/AdvocatePayoutsList';

export default function AdvTransHistoryPage() {
  return (
    <DashboardLayout role="advocate">
      <AdvocatePayoutsList
        role="advocate"
        title="My Payout Transactions"
        subtitle="Review, approve, and track payouts processed to your account."
      />
    </DashboardLayout>
  );
}
