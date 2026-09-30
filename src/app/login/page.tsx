"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

type AuthMode = "login" | "verify_signup" | "forgot" | "verify_recovery" | "reset_password"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const clearMessages = () => {
    setError(null)
    setMessage(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    clearMessages()
    
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    
    if (authError) {
      if (authError.message.includes("Email not confirmed")) {
        setMode("verify_signup")
        setMessage("Please check your email for the OTP to verify your account.")
      } else {
        setError(authError.message)
      }
      setLoading(false)
    } else {
      router.push("/")
    }
  }

  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Email and password required")
      return
    }
    setLoading(true)
    clearMessages()
    
    const { error: authError } = await supabase.auth.signUp({ email, password })
    
    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      setMode("verify_signup")
      setMessage("Signup successful. Check your email for the 6-digit OTP.")
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent, type: "signup" | "recovery") => {
    e.preventDefault()
    if (!otp) {
      setError("OTP required")
      return
    }
    setLoading(true)
    clearMessages()

    const { error: authError } = await supabase.auth.verifyOtp({ email, token: otp, type })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      if (type === "recovery") {
        setMode("reset_password")
        setPassword("") // clear password for them to enter a new one
        setMessage("Verification successful. Please enter a new password.")
      } else {
        router.push("/")
      }
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Email required")
      return
    }
    setLoading(true)
    clearMessages()

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email)

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      setMode("verify_recovery")
      setMessage("Password reset email sent. Enter the 6-digit OTP here.")
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError("New password required")
      return
    }
    setLoading(true)
    clearMessages()

    const { error: authError } = await supabase.auth.updateUser({ password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push("/")
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden h-screen bg-[#050508] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f1115] to-[#050508]">
      <div className="absolute top-[30%] left-[40%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[30%] translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-[420px] p-10 rounded-[32px] bg-white/[0.03] backdrop-blur-3xl border border-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]">
        
        <div className="flex flex-col items-center gap-5 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.1)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/90">
              <circle cx="12" cy="12" r="2" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-medium text-white/90 tracking-wide">Mycelia</h1>
            <p className="text-[13px] text-white/40 tracking-wide">
              {mode === "login" && "Your personal relationship network"}
              {mode === "verify_signup" && "Verify your account"}
              {mode === "forgot" && "Reset your password"}
              {mode === "verify_recovery" && "Verify password reset"}
              {mode === "reset_password" && "Enter your new password"}
            </p>
          </div>
        </div>

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-[13px] text-white/50 pl-1 uppercase tracking-wider">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com" 
                required
                className="h-11 px-4 rounded-xl bg-white/[0.02] border-white/[0.06] text-white/90 placeholder:text-white/20 hover:bg-white/[0.04] transition-colors focus-visible:bg-white/[0.06] focus-visible:border-primary/40 focus-visible:ring-primary/20" 
              />
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pl-1 pr-1">
                <Label htmlFor="password" className="text-[13px] text-white/50 uppercase tracking-wider">Password</Label>
                <button type="button" onClick={() => setMode("forgot")} className="text-[12px] text-primary/60 hover:text-primary transition-colors tracking-wide">
                  Reset
                </button>
              </div>
              <Input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required
                className="h-11 px-4 rounded-xl bg-white/[0.02] border-white/[0.06] text-white/90 placeholder:text-white/20 hover:bg-white/[0.04] transition-colors focus-visible:bg-white/[0.06] focus-visible:border-primary/40 focus-visible:ring-primary/20" 
              />
            </div>

            {error && <div className="text-[13px] text-destructive text-center font-medium bg-destructive/10 py-2 rounded-lg border border-destructive/20">{error}</div>}
            {message && <div className="text-[13px] text-primary/90 text-center font-medium bg-primary/10 py-2 rounded-lg border border-primary/20">{message}</div>}

            <div className="pt-4 flex flex-col gap-3">
              <Button disabled={loading} type="submit" className="w-full font-medium h-11 rounded-xl bg-primary/90 text-primary-foreground hover:bg-primary transition-colors shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                {loading ? "Authenticating..." : "Enter Graph"}
              </Button>
              <Button disabled={loading} type="button" variant="outline" onClick={handleSignUp} className="w-full font-medium h-11 rounded-xl border-white/[0.06] bg-transparent hover:bg-white/[0.04] text-white/60 hover:text-white/90 transition-colors">
                Create Account
              </Button>
            </div>
          </form>
        )}

        {(mode === "verify_signup" || mode === "verify_recovery") && (
          <form onSubmit={(e) => handleVerifyOtp(e, mode === "verify_signup" ? "signup" : "recovery")} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="otp" className="text-[13px] text-white/50 pl-1 uppercase tracking-wider">6-Digit Code</Label>
              <Input 
                id="otp" 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456" 
                required
                className="h-11 px-4 rounded-xl bg-white/[0.02] border-white/[0.06] text-white/90 placeholder:text-white/20 hover:bg-white/[0.04] transition-colors focus-visible:bg-white/[0.06] focus-visible:border-primary/40 focus-visible:ring-primary/20" 
              />
            </div>

            {error && <div className="text-[13px] text-destructive text-center font-medium bg-destructive/10 py-2 rounded-lg border border-destructive/20">{error}</div>}
            {message && <div className="text-[13px] text-primary/90 text-center font-medium bg-primary/10 py-2 rounded-lg border border-primary/20">{message}</div>}

            <div className="pt-4 flex flex-col gap-3">
              <Button disabled={loading} type="submit" className="w-full font-medium h-11 rounded-xl bg-primary/90 text-primary-foreground hover:bg-primary transition-colors shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
              <Button disabled={loading} type="button" variant="ghost" onClick={() => { setMode("login"); clearMessages() }} className="w-full font-medium h-11 rounded-xl text-white/60 hover:text-white/90 transition-colors">
                Back to Login
              </Button>
            </div>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="email_reset" className="text-[13px] text-white/50 pl-1 uppercase tracking-wider">Account Email</Label>
              <Input 
                id="email_reset" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com" 
                required
                className="h-11 px-4 rounded-xl bg-white/[0.02] border-white/[0.06] text-white/90 placeholder:text-white/20 hover:bg-white/[0.04] transition-colors focus-visible:bg-white/[0.06] focus-visible:border-primary/40 focus-visible:ring-primary/20" 
              />
            </div>

            {error && <div className="text-[13px] text-destructive text-center font-medium bg-destructive/10 py-2 rounded-lg border border-destructive/20">{error}</div>}
            {message && <div className="text-[13px] text-primary/90 text-center font-medium bg-primary/10 py-2 rounded-lg border border-primary/20">{message}</div>}

            <div className="pt-4 flex flex-col gap-3">
              <Button disabled={loading} type="submit" className="w-full font-medium h-11 rounded-xl bg-primary/90 text-primary-foreground hover:bg-primary transition-colors shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                {loading ? "Sending..." : "Send Reset Code"}
              </Button>
              <Button disabled={loading} type="button" variant="ghost" onClick={() => { setMode("login"); clearMessages() }} className="w-full font-medium h-11 rounded-xl text-white/60 hover:text-white/90 transition-colors">
                Cancel
              </Button>
            </div>
          </form>
        )}

        {mode === "reset_password" && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="new_password" className="text-[13px] text-white/50 pl-1 uppercase tracking-wider">New Password</Label>
              <Input 
                id="new_password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required
                className="h-11 px-4 rounded-xl bg-white/[0.02] border-white/[0.06] text-white/90 placeholder:text-white/20 hover:bg-white/[0.04] transition-colors focus-visible:bg-white/[0.06] focus-visible:border-primary/40 focus-visible:ring-primary/20" 
              />
            </div>

            {error && <div className="text-[13px] text-destructive text-center font-medium bg-destructive/10 py-2 rounded-lg border border-destructive/20">{error}</div>}
            {message && <div className="text-[13px] text-primary/90 text-center font-medium bg-primary/10 py-2 rounded-lg border border-primary/20">{message}</div>}

            <div className="pt-4 flex flex-col gap-3">
              <Button disabled={loading} type="submit" className="w-full font-medium h-11 rounded-xl bg-primary/90 text-primary-foreground hover:bg-primary transition-colors shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
