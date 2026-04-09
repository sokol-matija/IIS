import { useReducer, useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { useAuthStore } from "../store/authStore"
import { getSettings, updateSettings } from "../api/settings"
import { fetchUsersApi, revokeUserApi } from "../api/auth"
import { GradientCard } from "@msokol/gradient-card-component"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

function useUserSessions() {
  const { accessToken, role } = useAuthStore()
  const [users, setUsers] = useState<{ id: number; email: string; role: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [revoking, setRevoking] = useState<number | null>(null)

  const isAdmin = role === "full-access"

  const loadUsers = useCallback(async () => {
    if (!accessToken || !isAdmin) return
    setLoading(true)
    try {
      setUsers(await fetchUsersApi(accessToken))
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [accessToken, isAdmin])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const revokeUser = async (userId: number) => {
    if (!accessToken) return
    setRevoking(userId)
    try {
      await revokeUserApi(accessToken, userId)
      toast.success("All sessions revoked for user")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Revoke failed")
    } finally {
      setRevoking(null)
    }
  }

  return { users, loading, revoking, isAdmin, revokeUser }
}

interface SettingsState {
  useCustomApi: boolean
  loading: boolean
  saving: boolean
}

type SettingsAction =
  | { type: "loaded"; useCustomApi: boolean }
  | { type: "saving" }
  | { type: "saved"; useCustomApi: boolean }
  | { type: "error" }

function reducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case "loaded":
      return { ...state, loading: false, useCustomApi: action.useCustomApi }
    case "saving":
      return { ...state, saving: true }
    case "saved":
      return { ...state, saving: false, useCustomApi: action.useCustomApi }
    case "error":
      return { ...state, loading: false, saving: false }
  }
}

function useSettings() {
  const [state, dispatch] = useReducer(reducer, {
    useCustomApi: true,
    loading: true,
    saving: false,
  })

  useEffect(() => {
    const controller = new AbortController()
    getSettings(controller.signal)
      .then((data) => dispatch({ type: "loaded", useCustomApi: data.useCustomApi }))
      .catch((err) => {
        if (err.name !== "AbortError") dispatch({ type: "error" })
      })
    return () => controller.abort()
  }, [])

  const toggle = async (current: boolean) => {
    dispatch({ type: "saving" })
    try {
      const data = await updateSettings({ useCustomApi: !current })
      dispatch({ type: "saved", useCustomApi: data.useCustomApi })
    } catch {
      dispatch({ type: "error" })
    }
  }

  return { ...state, toggle }
}

export default function SettingsPage() {
  const { role } = useAuthStore()
  const isReadOnly = role === "read-only"
  const { useCustomApi, loading, saving, toggle } = useSettings()
  const sessions = useUserSessions()

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Toggle between Custom API (local database) and Strapi proxy.
          </p>
        </div>
      </div>

      {/* API Source Card */}
      <GradientCard
        variant="original"
        title="API Source Configuration"
        description="Switch between local SQLite database and Strapi proxy"
      >
        <div className="mt-4">
          {/* Toggle row */}
          <div className="flex items-center justify-between border-t border-b border-white/10 py-4">
            <div>
              <p className="text-foreground mb-1 text-sm font-semibold">Use Custom API</p>
              <p className="text-muted-foreground text-sm">
                {useCustomApi
                  ? "Serving categories from local SQLite database via Prisma"
                  : "Proxying GET /api/categories to Strapi at localhost:1337"}
              </p>
            </div>

            {/* Toggle switch */}
            <label
              aria-label="Toggle API source"
              className="relative ml-6 inline-flex cursor-pointer items-center"
            >
              <input
                type="checkbox"
                className="peer sr-only"
                checked={useCustomApi}
                onChange={() => toggle(useCustomApi)}
                disabled={saving || isReadOnly}
              />
              <div className="bg-muted peer peer-checked:bg-primary h-6 w-11 rounded-full transition-colors peer-disabled:cursor-not-allowed peer-disabled:opacity-50 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-5" />
            </label>
          </div>

          {/* Status */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-muted-foreground text-sm">Current mode:</span>
            <Badge variant={useCustomApi ? "success" : "warning"}>
              {useCustomApi ? "Custom API" : "Strapi Proxy"}
            </Badge>
            {saving && <span className="text-muted-foreground text-xs">Saving...</span>}
          </div>
        </div>
      </GradientCard>

      {/* Info Card */}
      <GradientCard
        variant="ghost"
        title="About API Modes"
        description="Details on each configuration option"
      >
        <div className="mt-4 flex flex-col gap-3">
          <div className="rounded border-l-[3px] border-emerald-500 bg-white/5 p-3.5">
            <p className="text-foreground mb-1 text-sm font-semibold">
              USE_CUSTOM_API=true (default)
            </p>
            <p className="text-muted-foreground text-sm">
              All CRUD operations work with the local SQLite database via Prisma.
            </p>
          </div>
          <div className="rounded border-l-[3px] border-amber-500 bg-white/5 p-3.5">
            <p className="text-foreground mb-1 text-sm font-semibold">USE_CUSTOM_API=false</p>
            <p className="text-muted-foreground text-sm">
              GET /api/categories proxies to Strapi REST API at the configured STRAPI_URL. Write
              operations still use the custom API.
            </p>
          </div>
        </div>
      </GradientCard>

      {/* User Sessions — admin only */}
      {sessions.isAdmin && (
        <GradientCard
          variant="original"
          title="User Sessions"
          description="Revoke all active sessions for any user"
        >
          <div className="mt-4">
            {sessions.loading ? (
              <p className="text-muted-foreground text-sm">Loading users...</p>
            ) : (
              <div className="flex flex-col gap-2">
                {sessions.users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-foreground text-sm font-medium">{u.email}</span>
                      <Badge variant={u.role === "full-access" ? "success" : "warning"}>
                        {u.role}
                      </Badge>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={sessions.revoking === u.id}
                      onClick={() => sessions.revokeUser(u.id)}
                    >
                      {sessions.revoking === u.id ? "Revoking..." : "Revoke Sessions"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GradientCard>
      )}
    </div>
  )
}
