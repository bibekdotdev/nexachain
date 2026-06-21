import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

/**
 * Builds a simple per-day series combining ROI and level income from the
 * raw history arrays so earnings trends can be visualized over time.
 */
export default function EarningsChart({ roiHistory, referralHistory }) {
  const data = useMemo(() => {
    const byDate = {};

    (roiHistory || []).forEach((row) => {
      const key = new Date(row.roiDate).toLocaleDateString();
      byDate[key] = byDate[key] || { date: key, roi: 0, referral: 0 };
      byDate[key].roi += row.amount;
    });

    (referralHistory || []).forEach((row) => {
      const key = new Date(row.date).toLocaleDateString();
      byDate[key] = byDate[key] || { date: key, roi: 0, referral: 0 };
      byDate[key].referral += row.amount;
    });

    return Object.values(byDate).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [roiHistory, referralHistory]);

  if (!data.length) {
    return <p className="spinner-text">Not enough data yet to chart earnings.</p>;
  }

  return (
    <div className="card" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="roi" name="ROI" stroke="#4f46e5" strokeWidth={2} />
          <Line type="monotone" dataKey="referral" name="Referral Income" stroke="#16a34a" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
