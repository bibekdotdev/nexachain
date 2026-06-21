import React, { useState } from "react";
import { investmentApi } from "../api/api";

const PLAN_PRESETS = [
  { name: "Starter Plan", durationDays: 30, dailyRoiPercent: 1 },
  { name: "Growth Plan", durationDays: 90, dailyRoiPercent: 1.5 },
  { name: "Premium Plan", durationDays: 180, dailyRoiPercent: 2 },
];

export default function NewInvestmentForm({ onCreated }) {
  const [planIndex, setPlanIndex] = useState(0);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedPlan = PLAN_PRESETS[planIndex];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a valid investment amount");
      return;
    }

    setSubmitting(true);
    try {
      await investmentApi.create({
        amount: numericAmount,
        planName: selectedPlan.name,
        planDurationDays: selectedPlan.durationDays,
        dailyRoiPercent: selectedPlan.dailyRoiPercent,
      });
      setSuccess("Investment created successfully!");
      setAmount("");
      onCreated?.(); // tell the parent (Dashboard) to refresh its data
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create investment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="card"
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <h3 style={{ margin: 0 }}>New Investment</h3>
      {error && <div className="error-text">{error}</div>}
      {success && (
        <div style={{ color: "#166534", fontSize: 13 }}>{success}</div>
      )}

      <div>
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            display: "block",
            marginBottom: 6,
          }}
        >
          Plan
        </label>
        <select
          value={planIndex}
          onChange={(e) => setPlanIndex(Number(e.target.value))}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
        >
          {PLAN_PRESETS.map((plan, idx) => (
            <option key={plan.name} value={idx}>
              {plan.name} — {plan.dailyRoiPercent}% daily for{" "}
              {plan.durationDays} days
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            display: "block",
            marginBottom: 6,
          }}
        >
          Amount (₹)
        </label>
        <input
          type="number"
          min="1"
          step="1"
          placeholder="e.g. 1000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
          required
        />
      </div>

      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? "Investing..." : "Invest Now"}
      </button>
    </form>
  );
}
