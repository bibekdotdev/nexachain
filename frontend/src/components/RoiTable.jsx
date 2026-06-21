import React from 'react';

export default function RoiTable({ history }) {
  if (!history?.length) {
    return <p className="spinner-text">No ROI history yet.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Plan</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {history.map((row) => (
          <tr key={row._id}>
            <td>{new Date(row.roiDate).toLocaleDateString()}</td>
            <td>{row.investment?.planName || '—'}</td>
            <td>₹{row.amount.toLocaleString('en-IN')}</td>
            <td>
              <span className={`badge ${row.status === 'Credited' ? 'Active' : 'Cancelled'}`}>
                {row.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
