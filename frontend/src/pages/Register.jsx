import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "student",
    cgpa: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("Name, email, and password are required");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.role === "student" && !form.cgpa) {
      setError("CGPA is required for students");
      return;
    }

    setLoading(true);
    try {
      await API.post("/auth/register", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
        cgpa: form.role === "student" ? form.cgpa : null,
      });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container auth-premium">
      <div className="auth-bg-orb auth-bg-1"></div>
      <div className="auth-bg-orb auth-bg-2"></div>

      <motion.div
        className="auth-visual"
        initial={{ opacity: 0, x: -35 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55 }}
      >
        <div className="auth-visual-content">
          <motion.span
            className="auth-visual-icon"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.2, repeat: Infinity }}
          >
            🎓
          </motion.span>
          <h1>Join HostelMS</h1>
          <p>
            Create your account and start managing your hostel experience efficiently.
            Quick registration, smoother living.
          </p>
        </div>
      </motion.div>

      <motion.div
        className="auth-form-side"
        initial={{ opacity: 0, x: 35 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55 }}
      >
        <motion.div
          className="auth-form-box"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <h2>Create Account</h2>
          <p className="subtitle">Fill in your details to get started</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+91 9876543210"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
              >
                <option value="student">Student</option>
                <option value="warden">Warden</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {form.role === "student" && (
              <div className="form-group">
                <label className="form-label">CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  className="form-input"
                  placeholder="Enter your CGPA"
                  value={form.cgpa}
                  onChange={(e) => update("cgpa", e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="auth-link">
            Already have an account? <Link to="/">Sign in</Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}