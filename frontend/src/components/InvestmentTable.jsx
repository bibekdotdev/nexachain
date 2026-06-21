import React from 'react';

export default function InvestmentTable({ investments }) {
  if (!investments?.length) {
    return <p className="spinner-text">No investments yet.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Plan</th>
          <th>Amount</th>
          <th>Daily ROI %</th>
          <th>Start</th>
          <th>End</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {investments.map((inv) => (
          <tr key={inv._id}>
            <td>{inv.planName}</td>
            <td>₹{inv.amount.toLocaleString('en-IN')}</td>
            <td>{inv.dailyRoiPercent}%</td>
            <td>{new Date(inv.startDate).toLocaleDateString()}</td>
            <td>{new Date(inv.endDate).toLocaleDateString()}</td>
            <td>
              <span className={`badge ${inv.status}`}>{inv.status}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
