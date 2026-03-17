import React, { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useAuthStore } from "../store/authStore"
import { useNavigate } from "react-router-dom"
import { GradientCard } from "@msokol/gradient-card-component"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Layers, LogIn, Loader2 } from "lucide-react"
import { getMutationError } from "@/lib/utils"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: () => navigate("/task1"),
  })

  const handleSubmit = (e: React.BaseSyntheticEvent) => {
    e.preventDefault()
    loginMutation.mutate()
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-[400px]">
        {/* Logo — glowing frosted badge */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(162,155,254,0.85) 0%, rgba(223,186,244,0.80) 100%)",
              boxShadow:
                "0 0 40px rgba(162,155,254,0.50), 0 0 16px rgba(223,186,244,0.30), inset 0 1px 0 rgba(255,255,255,0.25)",
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
          variant="lavender"
          title="Welcome back!"
          description="Log in to your IIS account"
        >
          <form onSubmit={handleSubmit} className="mt-2">
            <div className="mb-5">
              <Label
                htmlFor="email"
                className="mb-1.5 text-xs font-medium tracking-wider text-white/70 uppercase"
              >
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
              <Label
                htmlFor="password"
                className="mb-1.5 text-xs font-medium tracking-wider text-white/70 uppercase"
              >
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
              disabled={loginMutation.isPending}
              className="h-11 w-full justify-center gap-2 text-sm"
            >
              {loginMutation.isPending ? (
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

            {loginMutation.error && (
              <div
                className="mt-4 rounded-xl p-4 text-sm"
                style={{
                  background: "rgba(239,68,68,0.10)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "rgba(252,165,165,0.95)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {getMutationError(loginMutation.error, "Login failed")}
              </div>
            )}
          </form>
        </GradientCard>

        <p className="mt-5 text-center text-xs text-white/30">
          admin@iis.hr / admin123 &bull; reader@iis.hr / reader123
        </p>
      </div>
    </div>
  )
}
