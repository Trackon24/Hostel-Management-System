import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const initials = (user.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navItems = [
    { label: "Dashboard", icon: "📊", path: "/dashboard", roles: ["admin", "warden", "student"] },
    { label: "Rooms", icon: "🏠", path: "/rooms", roles: ["admin", "warden", "student"] },
    { label: "Complaints", icon: "📋", path: "/complaints", roles: ["admin", "warden", "student"] },
    { label: "Fees", icon: "💰", path: "/fees", roles: ["admin", "student"] },
    { label: "Announcements", icon: "📢", path: "/announcements", roles: ["admin", "warden", "student"] },
  ];

  const adminItems = [
    { label: "Students", icon: "👥", path: "/students", roles: ["admin", "warden"] },
    { label: "Allocations", icon: "🛏️", path: "/allocations", roles: ["admin", "warden"] },
    { label: "DB Reports", icon: "📈", path: "/reports", roles: ["admin", "warden"] },
    { label: "Download", icon: "📥", path: "/download", roles: ["admin", "warden"] },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(user.role));
  const filteredAdmin = adminItems.filter((item) => item.roles.includes(user.role));

  const itemVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05, duration: 0.25 }
    }),
  };

  return (
    <aside className="sidebar">
      <motion.div
        className="sidebar-logo"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <motion.div
          className="sidebar-logo-icon"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          🏨
        </motion.div>
        <div className="sidebar-logo-text">
          HostelMS
          <span>Management System</span>
        </div>
      </motion.div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Menu</div>

        {filteredNav.map((item, index) => (
          <motion.div
            key={item.path}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={itemVariants}
          >
            <NavLink
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          </motion.div>
        ))}

        {filteredAdmin.length > 0 && (
          <>
            <div className="sidebar-section-label">Administration</div>
            {filteredAdmin.map((item, index) => (
              <motion.div
                key={item.path}
                custom={index + filteredNav.length}
                initial="hidden"
                animate="visible"
                variants={itemVariants}
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </motion.div>
            ))}
          </>
        )}

        <div className="sidebar-section-label">Account</div>
        <motion.div
          custom={filteredNav.length + filteredAdmin.length + 1}
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          <NavLink
            to="/profile"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <span className="sidebar-link-icon">👤</span>
            <span>Profile</span>
          </NavLink>
        </motion.div>
      </nav>

      <motion.div
        className="sidebar-user"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
      >
        <div className="sidebar-user-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user.name}</div>
          <div className="sidebar-user-role">{user.role}</div>
        </div>
        <button className="sidebar-logout" onClick={logout} title="Logout">
          🚪
        </button>
      </motion.div>
    </aside>
  );
}