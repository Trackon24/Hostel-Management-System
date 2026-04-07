export default function StatCard({ icon, label, value, gradient }) {
  const gradientMap = {
    primary: "var(--gradient-primary)",
    success: "var(--gradient-success)",
    warning: "var(--gradient-warning)",
    danger: "var(--gradient-danger)",
    accent: "var(--gradient-accent)",
    info: "var(--gradient-info)",
  };

  const bg = gradientMap[gradient] || gradientMap.primary;

  return (
    <div className="stat-card">
      <div className="stat-card-accent" style={{ background: bg }} />
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div
          className="stat-card-icon"
          style={{ background: `${bg}`, opacity: 0.9 }}
        >
          {icon}
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
    </div>
  );
}
