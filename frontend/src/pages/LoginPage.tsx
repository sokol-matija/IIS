import React from "react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GradientCard } from "@msokol/gradient-card-component";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Layers, LogIn, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
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
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-[400px]">
        {/* Logo — glowing frosted badge */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.85) 0%, rgba(6,182,212,0.80) 100%)",
              boxShadow: "0 0 40px rgba(139,92,246,0.50), 0 0 16px rgba(6,182,212,0.30), inset 0 1px 0 rgba(255,255,255,0.25)",
              border: "1px solid rgba(255,255,255,0.20)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Layers size={30} className="text-white" strokeWidth={1.5} />
          </div>
          <span
            className="text-2xl font-bold tracking-tight text-white/90"
            style={{ letterSpacing: "-0.02em" }}
          >
            IIS
          </span>
        </div>

        <GradientCard
          variant="aurora"
          title="Welcome back!"
          description="Log in to your IIS account"
        >
          <form onSubmit={handleSubmit} className="mt-2">
            <div className="mb-5">
              <Label htmlFor="email" className="mb-1.5 text-white/70 text-xs font-medium uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@iis.hr"
                autoComplete="email"
              />
            </div>

            <div className="mb-7">
              <Label htmlFor="password" className="mb-1.5 text-white/70 text-xs font-medium uppercase tracking-wider">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <LogIn size={15} />
                </>
              )}
            </Button>

            {error && (
              <div
                className="rounded-xl p-4 mt-4 text-sm"
                style={{
                  background: "rgba(239,68,68,0.10)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "rgba(252,165,165,0.95)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {error}
              </div>
            )}
          </form>
        </GradientCard>

        <p className="text-center mt-5 text-white/30 text-xs">
          admin@iis.hr / admin123 &bull; reader@iis.hr / reader123
        </p>
      </div>
    </div>
  );
}
