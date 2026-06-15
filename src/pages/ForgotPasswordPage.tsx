import { useState, useEffect, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgotPassword } from "@/lib/api"
import { AppBrand } from "@/components/AppBrand"
import { ThemeToggle } from "@/components/ThemeToggle"
import { formatDocumentTitle } from "@/lib/document-title"

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = formatDocumentTitle("Forgot Password");
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
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-gradient-auth px-4 py-12">
      <ThemeToggle className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6" />

      <div className="relative z-10 flex w-full max-w-[26rem] flex-col items-center gap-8">
        <AppBrand size="lg" />

        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-card glass-card">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-bold text-foreground">Forgot Password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email to reset your password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">
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
                className="h-11 rounded-xl px-4"
              />
              {emailError && <p className="text-destructive text-sm mt-1">{emailError}</p>}
            </div>

            {error && (
              <p className="alert-error">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={!email || emailError !== null}
              loading={loading}
              className="mt-1 h-11 !w-full rounded-xl text-base font-bold"
            >
              Continue
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
