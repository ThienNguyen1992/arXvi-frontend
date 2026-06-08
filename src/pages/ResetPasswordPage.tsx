import { useState, useEffect, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPassword } from "@/lib/api"

function DailyLogo() {
  return (
    <div className="flex items-center gap-1 text-2xl font-bold tracking-tight">
      <span className="text-foreground">daily</span>
      <span className="text-primary">.</span>
      <span className="text-foreground">dev</span>
    </div>
  )
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Reset Password | arXvi";
  }, []);

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const validatePassword = (value: string) => {
    if (!value) {
      return "Password is required";
    }
    if (value.length < 6) {
      return "Password must be at least 6 characters";
    }
    return null;
  };

  const validateConfirmPassword = (value: string, matchPassword: string) => {
    if (!value) {
      return "Please confirm your password";
    }
    if (value !== matchPassword) {
      return "Passwords do not match";
    }
    return null;
  };

  async function handleSubmit(e: FormEvent) {
    const passValidation = validatePassword(password);
    const confirmPassValidation = validateConfirmPassword(confirmPassword, password);

    setPasswordError(passValidation);
    setConfirmPasswordError(confirmPassValidation);

    if (passValidation || confirmPassValidation) {
      return; 
    }

    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await resetPassword(password);
      navigate("/login");
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
            <h1 className="text-xl font-bold text-foreground">Reset Password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-muted-foreground">
                New Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(validatePassword(e.target.value));
                  if (confirmPassword) {
                    setConfirmPasswordError(validateConfirmPassword(confirmPassword, e.target.value));
                  }
                }}
                required
                className="h-11 rounded-xl border-pepper-40 bg-pepper-80/50 px-4 text-foreground placeholder:text-pepper-10/60 focus-visible:border-cabbage-50 focus-visible:ring-cabbage-50/30"
              />
              {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword" className="text-muted-foreground">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmPasswordError(validateConfirmPassword(e.target.value, password));
                }}
                required
                className="h-11 rounded-xl border-pepper-40 bg-pepper-80/50 px-4 text-foreground placeholder:text-pepper-10/60 focus-visible:border-cabbage-50 focus-visible:ring-cabbage-50/30"
              />
              {confirmPasswordError && <p className="text-red-500 text-sm mt-1">{confirmPasswordError}</p>}
            </div>

            {error && (
              <p className="rounded-lg bg-ketchup-60/15 px-3 py-2 text-sm text-ketchup-30">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={!password || !confirmPassword || passwordError !== null || confirmPasswordError !== null}
              loading={loading}
              className="mt-1 h-11 w-full rounded-xl bg-primary text-base font-bold hover:bg-cabbage-50 disabled:opacity-60"
            >
              Reset Password
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link
              to="/login"
              className="font-medium text-water-30 transition-colors hover:text-water-20"
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
