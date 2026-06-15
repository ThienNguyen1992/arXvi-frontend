import { useState, useEffect, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/api"
import { AppBrand } from "@/components/AppBrand"
import { ThemeToggle } from "@/components/ThemeToggle"
import { formatDocumentTitle } from "@/lib/document-title"

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/home"

  useEffect(() => {
    document.title = formatDocumentTitle("Log in");
  }, []);

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
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

  const validatePassword = (value: string) => {
    if (!value) {
      return "Password is required";
    }
    return null;
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);


    setEmailError(emailValidation);
    setPasswordError(passwordValidation);
    
    if (emailValidation || passwordValidation) {
      return; // Prevent submission if there are validation errors
    }

    setError(null)
    setLoading(true)

    try {
      const data = await login(email.trim(), password);
      
      if (data?.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      if (data?.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      
      if (data?.user?.isFirstLogged) {
        navigate("/tour")
      } else {
        navigate(from, { replace: true })
      }
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

        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-[0_8px_32px_color-mix(in_srgb,var(--background)_60%,transparent)] glass-card">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-bold text-foreground">Welcome back!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please log in to access your account.
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">
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
                className="h-11 rounded-xl px-4"
              />
              {passwordError && <p className="text-destructive text-sm mt-1">{passwordError}</p>}
              
              {error && (
                <p className="alert-error mt-1">
                  {error}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={!email || !password || emailError !== null || passwordError !== null}
              loading={loading}
              className="mt-1 h-11 !w-full rounded-xl text-base font-bold"
            >
              Log in
            </Button>
            

          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Where developers grow together
        </p>
      </div>
    </div>
  )
}
