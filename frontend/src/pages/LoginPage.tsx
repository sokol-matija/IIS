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
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-[0_8px_32px_rgba(124,58,237,0.5)] ring-1 ring-white/10">
            <Layers size={28} className="text-white" strokeWidth={1.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">IIS</span>
        </div>

        <GradientCard
          variant="aurora"
          title="Welcome back!"
          description="Log in to your IIS account"
        >
          <form onSubmit={handleSubmit} className="mt-2">
            <div className="mb-5">
              <Label htmlFor="email" className="mb-1.5">
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
              <Label htmlFor="password" className="mb-1.5">
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
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive mt-4">
                {error}
              </div>
            )}
          </form>
        </GradientCard>

        <p className="text-center mt-5 text-muted-foreground text-xs">
          admin@iis.hr / admin123 &bull; reader@iis.hr / reader123
        </p>
      </div>
    </div>
  );
}
