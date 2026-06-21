import React, { useEffect, useState } from "react";
import { dashboardApi, investmentApi, referralApi } from "../api/api";
import { useAuth } from "../context/AuthContext";
import DashboardCards from "../components/DashboardCards";
import InvestmentTable from "../components/InvestmentTable";
import RoiTable from "../components/RoiTable";
import ReferralTable from "../components/ReferralTable";
import ReferralTree from "../components/ReferralTree";
import EarningsChart from "../components/EarningsChart";
import NewInvestmentForm from "../components/Newinvestmentform";

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [summary, setSummary] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [roiHistory, setRoiHistory] = useState([]);
  const [referralHistory, setReferralHistory] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, investmentsRes, roiRes, referralRes, treeRes] =
        await Promise.all([
          dashboardApi.summary(),
          investmentApi.list({ limit: 50 }),
          dashboardApi.roiHistory({ limit: 50 }),
          dashboardApi.referralIncomeHistory({ limit: 50 }),
          referralApi.tree(),
        ]);
      setSummary(summaryRes.data.data);
      setInvestments(investmentsRes.data.data);
      setRoiHistory(roiRes.data.data);
      setReferralHistory(referralRes.data.data);
      setTree(treeRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyReferralCode = async () => {
    if (!user?.referralCode) return;
    try {
      await navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unsupported, fail silently */
    }
  };

  const initials = (user?.fullName || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="dashboard-page">
      <div className="topbar">
        <div className="topbar-left">
          <div className="avatar-circle">{initials}</div>
          <div>
            <div className="brand-row">
              <strong className="brand-name">Nexachain</strong>
              <span className="welcome-text">
                Welcome back, {user?.fullName}
              </span>
            </div>
            <button
              type="button"
              className="referral-chip"
              onClick={copyReferralCode}
              title="Click to copy"
            >
              Referral code: <strong>{user?.referralCode}</strong>
              <span className="copy-indicator">
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>
          </div>
        </div>
        <button className="btn btn-outline" onClick={logout}>
          Log out
        </button>
      </div>

      <div className="container">
        {error && (
          <div className="error-banner">
            <span className="error-icon">!</span>
            <span>{error}</span>
            <button className="error-dismiss" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        {loading && (
          <div className="skeleton-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        )}

        {!loading && summary && (
          <>
            <NewInvestmentForm onCreated={loadAll} />
            <br />

            <DashboardCards summary={summary} />

            <section className="section-block">
              <EarningsChart
                roiHistory={roiHistory}
                referralHistory={referralHistory}
              />
            </section>

            <section className="section-block">
              <div className="section-header">
                <h3 className="section-title">Investment History</h3>
                <span className="section-count">
                  {investments.length} records
                </span>
              </div>
              <div className="card table-card">
                <InvestmentTable investments={investments} />
              </div>
            </section>

            <section className="section-block">
              <div className="section-header">
                <h3 className="section-title">ROI History</h3>
                <span className="section-count">
                  {roiHistory.length} records
                </span>
              </div>
              <div className="card table-card">
                <RoiTable history={roiHistory} />
              </div>
            </section>

            <section className="section-block">
              <div className="section-header">
                <h3 className="section-title">Referral Income History</h3>
                <span className="section-count">
                  {referralHistory.length} records
                </span>
              </div>
              <div className="card table-card">
                <ReferralTable history={referralHistory} />
              </div>
            </section>

            <section className="section-block">
              <div className="section-header">
                <h3 className="section-title">Referral Tree</h3>
              </div>
              <ReferralTree tree={tree} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
