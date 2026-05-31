import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/api"

function DailyLogo() {
  return (
    <div className="flex items-center gap-1 text-2xl font-bold tracking-tight">
      <span className="text-foreground">daily</span>
      <span className="text-primary">.</span>
      <span className="text-foreground">dev</span>
    </div>
  )
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;

  const validateIdentifier = (value: string) => {
    if (!value) {
      return "Email is required";
    }
    if (value.includes("@") && !emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      return "Password is required";
    }
    return null;
  };

  async function handleSubmit(e: FormEvent) {
    const identifierValidation = validateIdentifier(identifier);
    const passwordValidation = validatePassword(password);

    setIdentifierError(identifierValidation);
    setPasswordError(passwordValidation);

    if (identifierValidation || passwordValidation) {
      return; // Prevent submission if there are validation errors
    }

    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(identifier.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_srgb,var(--primary)_25%,transparent),transparent)]"
      />

      <div className="relative z-10 flex w-full max-w-[26rem] flex-col items-center gap-8">
        <DailyLogo />

        <div className="w-full rounded-2xl border border-pepper-40 bg-pepper-70/80 p-8 shadow-[0_8px_32px_color-mix(in_srgb,var(--color-pepper-90)_60%,transparent)] backdrop-blur-sm">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-bold text-foreground">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Log in to continue to your feed
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="identifier" className="text-muted-foreground">
                Name, ID, or email
              </Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                placeholder="Enter your name, ID, or email"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setIdentifierError(validateIdentifier(e.target.value));
                }}
                required
                className="h-11 rounded-xl border-pepper-40 bg-pepper-80/50 px-4 text-foreground placeholder:text-pepper-10/60 focus-visible:border-cabbage-50 focus-visible:ring-cabbage-50/30"
              />
              {identifierError && <p className="text-red-500 text-sm mt-1">{identifierError}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(validatePassword(e.target.value));
                }}
                required
                className="h-11 rounded-xl border-pepper-40 bg-pepper-80/50 px-4 text-foreground placeholder:text-pepper-10/60 focus-visible:border-cabbage-50 focus-visible:ring-cabbage-50/30"
              />
              {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
            </div>

            {error && (
              <p className="rounded-lg bg-ketchup-60/15 px-3 py-2 text-sm text-ketchup-30">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || !identifier || !password || identifierError !== null || passwordError !== null}
              className="mt-1 h-11 w-full rounded-xl bg-primary text-base font-bold hover:bg-cabbage-50 disabled:opacity-60"
            >
              {loading ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-water-30 transition-colors hover:text-water-20"
            >
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-pepper-10/70">
          Where developers grow together
        </p>
      </div>
    </div>
  )
}
