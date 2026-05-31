const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

export async function login(identifier: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => "Login failed")
    throw new Error(message || "Login failed")
  }

  return response.json()
}
