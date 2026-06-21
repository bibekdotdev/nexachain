import React from 'react';

export default function ReferralTable({ history }) {
  if (!history?.length) {
    return <p className="spinner-text">No referral income yet.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>From</th>
          <th>Level</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {history.map((row) => (
          <tr key={row._id}>
            <td>{new Date(row.date).toLocaleDateString()}</td>
            <td>{row.generator?.fullName || '—'}</td>
            <td>L{row.level}</td>
            <td>₹{row.amount.toLocaleString('en-IN')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
