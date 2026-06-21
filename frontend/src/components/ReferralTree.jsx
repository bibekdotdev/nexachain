import React, { useState } from 'react';

function TreeNode({ node }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children?.length > 0;

  return (
    <div className="tree-node">
      <div className="tree-node-label">
        {hasChildren && (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', marginRight: 6 }}
          >
            {expanded ? '▾' : '▸'}
          </button>
        )}
        <span className="name">{node.fullName}</span>{' '}
        <span className={`badge ${node.status}`}>{node.status}</span>{' '}
        <span style={{ color: '#6b7280', fontSize: 12 }}>
          Level {node.level} · ₹{node.walletBalance?.toLocaleString('en-IN') || 0} wallet
        </span>
      </div>
      {expanded &&
        node.children?.map((child) => <TreeNode key={child._id} node={child} />)}
    </div>
  );
}

export default function ReferralTree({ tree }) {
  if (!tree?.length) {
    return <p className="spinner-text">No referrals yet. Share your referral code to grow your network.</p>;
  }

  return (
    <div className="card">
      {tree.map((node) => (
        <TreeNode key={node._id} node={node} />
      ))}
    </div>
  );
}
