"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault()
    router.push("/")
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden h-screen bg-[#050508]">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-md p-8 rounded-2xl bg-[#09090b]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <circle cx="12" cy="12" r="2" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white/90 tracking-tight">Welcome to Mycelia</h1>
            <p className="text-sm text-white/50 mt-2">Enter your credentials to access your graph</p>
          </div>
        </div>

        <form onSubmit={handleAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/70">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              required
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30 focus-visible:ring-primary/50" 
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-white/70">Password</Label>
              <Link href="#" className="text-[13px] text-primary/80 hover:text-primary transition-colors">
                Forgot password?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              required
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30 focus-visible:ring-primary/50" 
            />
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Button type="submit" className="w-full font-medium h-10 shadow-lg shadow-primary/20">
              Log in
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/")} className="w-full font-medium h-10 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-white/80">
              Sign up
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
