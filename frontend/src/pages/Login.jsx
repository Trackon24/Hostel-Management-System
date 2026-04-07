import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
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
            🏨
          </motion.span>
          <h1>Hostel Management System</h1>
          <p>
            Streamline your hostel operations with our comprehensive management
            platform. Track rooms, manage complaints, and handle fees all in one place.
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
          <h2>Welcome Back</h2>
          <p className="subtitle">Sign in to your account to continue</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-1">
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="auth-link">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}