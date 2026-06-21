import React from 'react';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
}

export default function DashboardCards({ summary }) {
  const items = [
    { label: 'Wallet Balance', value: summary.walletBalance },
    { label: "Today's ROI", value: summary.todayRoi },
    { label: 'Total ROI Earned', value: summary.totalRoiEarned },
    { label: 'Total Level Income', value: summary.totalLevelIncomeEarned },
    { label: 'Total Invested', value: summary.totalInvested },
    { label: 'Direct Referrals', value: summary.directReferrals, raw: true },
  ];

  return (
    <div className="cards-grid">
      {items.map((item) => (
        <div className="card" key={item.label}>
          <h3>{item.label}</h3>
          <div className="value">{item.raw ? item.value ?? 0 : formatCurrency(item.value)}</div>
        </div>
      ))}
    </div>
  );
}
