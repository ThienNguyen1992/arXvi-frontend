import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { register } from "@/lib/api"
import { toast } from "@/store/useToastStore"
import { AppBrand } from "@/components/AppBrand"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function SignUpPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return "Email is required"
    }
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address"
    }
    return null
  }

  const validatePassword = (value: string) => {
    if (!value) {
      return "Password is required"
    }
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const emailValidation = validateEmail(email)
    const passwordValidation = validatePassword(password)

    setEmailError(emailValidation)
    setPasswordError(passwordValidation)

    if (emailValidation || passwordValidation) {
      return
    }

    setError(null)
    setLoading(true)

    try {
      const data = await register(email.trim(), password)

      if (data?.access_token) {
        localStorage.setItem("access_token", data.access_token)
      }
      if (data?.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token)
      }

      toast.success("Registration successful!")

      if (data?.access_token) {
        if (data?.user?.isFirstLogged) {
          navigate("/tour")
        } else {
          navigate("/home")
        }
      } else {
        navigate("/login")
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

        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-card glass-card">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-bold text-foreground">Create an account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign up to start exploring papers
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
                  setEmail(e.target.value)
                  setEmailError(validateEmail(e.target.value))
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
                autoComplete="new-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError(validatePassword(e.target.value))
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
              Sign up
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              Log in
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
