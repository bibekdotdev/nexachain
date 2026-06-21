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

  return (
    <div>
      <div className="topbar">
        <div>
          <strong>Nexachain</strong> — Welcome, {user?.fullName}
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Referral code: <strong>{user?.referralCode}</strong>
          </div>
        </div>
        <button className="btn" onClick={logout}>
          Log out
        </button>
      </div>

      <div className="container">
        {error && <div className="error-text">{error}</div>}

        {loading && <p className="spinner-text">Loading dashboard...</p>}

        {!loading && summary && (
          <>
            <NewInvestmentForm onCreated={loadAll} />

            <DashboardCards summary={summary} />

            <EarningsChart
              roiHistory={roiHistory}
              referralHistory={referralHistory}
            />

            <h3 className="section-title">Investment History</h3>
            <div className="card">
              <InvestmentTable investments={investments} />
            </div>

            <h3 className="section-title">ROI History</h3>
            <div className="card">
              <RoiTable history={roiHistory} />
            </div>

            <h3 className="section-title">Referral Income History</h3>
            <div className="card">
              <ReferralTable history={referralHistory} />
            </div>

            <h3 className="section-title">Referral Tree</h3>
            <ReferralTree tree={tree} />
          </>
        )}
      </div>
    </div>
  );
}
