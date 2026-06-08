import { useState, useEffect, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgotPassword } from "@/lib/api"

function DailyLogo() {
  return (
    <div className="flex items-center gap-1 text-2xl font-bold tracking-tight">
      <span className="text-foreground">daily</span>
      <span className="text-primary">.</span>
      <span className="text-foreground">dev</span>
    </div>
  )
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = "Forgot Password | arXvi";
  }, []);

  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;

  const validateEmail = (value: string) => {
    if (!value) {
      return "Email is required";
    }
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return null;
  };

  async function handleSubmit(e: FormEvent) {
    const emailValidation = validateEmail(email);
    setEmailError(emailValidation);

    if (emailValidation) {
      return; 
    }

    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await forgotPassword(email.trim());
      navigate("/reset-password");
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
            <h1 className="text-xl font-bold text-foreground">Forgot Password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email to reset your password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(validateEmail(e.target.value));
                }}
                required
                className="h-11 rounded-xl border-pepper-40 bg-pepper-80/50 px-4 text-foreground placeholder:text-pepper-10/60 focus-visible:border-cabbage-50 focus-visible:ring-cabbage-50/30"
              />
              {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
            </div>

            {error && (
              <p className="rounded-lg bg-ketchup-60/15 px-3 py-2 text-sm text-ketchup-30">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={!email || emailError !== null}
              loading={loading}
              className="mt-1 h-11 w-full rounded-xl bg-primary text-base font-bold hover:bg-cabbage-50 disabled:opacity-60"
            >
              Continue
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
