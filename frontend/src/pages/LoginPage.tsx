import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/task1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      <div style={{ width: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              background: "var(--accent)",
              borderRadius: 10,
              color: "#fff",
              fontWeight: 800,
              fontSize: 20,
              marginBottom: 16,
              letterSpacing: "-0.5px",
            }}
          >
            IIS
          </div>
        </div>

        <div
          className="card"
          style={{ padding: 48 }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 6,
              textAlign: "center",
            }}
          >
            Welcome back!
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 14,
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            Log in to your IIS account
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="admin@iis.hr"
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: "100%", height: 40, fontSize: 14, justifyContent: "center" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            {error && (
              <div className="alert-error" style={{ marginTop: 16 }}>
                {error}
              </div>
            )}
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            color: "var(--text-muted)",
            fontSize: 12,
          }}
        >
          admin@iis.hr / admin123 &bull; reader@iis.hr / reader123
        </p>
      </div>
    </div>
  );
}
