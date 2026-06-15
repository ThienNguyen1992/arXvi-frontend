import { useState, useEffect, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPassword } from "@/lib/api"
import { AppBrand } from "@/components/AppBrand"
import { ThemeToggle } from "@/components/ThemeToggle"
import { formatDocumentTitle } from "@/lib/document-title"

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = formatDocumentTitle("Reset Password");
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
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-gradient-auth px-4 py-12">
      <ThemeToggle className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6" />

      <div className="relative z-10 flex w-full max-w-[26rem] flex-col items-center gap-8">
        <AppBrand size="lg" />

        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-card glass-card">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-bold text-foreground">Reset Password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">
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
                className="h-11 rounded-xl px-4"
              />
              {passwordError && <p className="text-destructive text-sm mt-1">{passwordError}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">
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
                className="h-11 rounded-xl px-4"
              />
              {confirmPasswordError && <p className="text-destructive text-sm mt-1">{confirmPasswordError}</p>}
            </div>

            {error && (
              <p className="alert-error">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={!password || !confirmPassword || passwordError !== null || confirmPasswordError !== null}
              loading={loading}
              className="mt-1 h-11 !w-full rounded-xl text-base font-bold"
            >
              Reset Password
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link
              to="/login"
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
