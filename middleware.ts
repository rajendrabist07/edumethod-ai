import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/upload(.*)',
  '/doubt-solver(.*)',
  '/dashboard(.*)',
  '/pricing(.*)',
  '/api/(.*)'
])

const isTeacherRoute = createRouteMatcher([
  '/cohorts(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const authObject = await auth()
    
    // 1. Basic auth protection
    if (!authObject.userId) {
      await auth.protect()
    }

    // 2. RBAC check for teacher routes
    if (isTeacherRoute(req) && authObject.userId) {
      // Query Supabase directly via Edge-compatible fetch to avoid heavy client bundling
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.SUPABASE_SECRET_KEY!
        
        const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${authObject.userId}&select=role`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`
          }
        })
        const data = await res.json()
        const role = data?.[0]?.role || 'student'
        
        if (role !== 'teacher' && role !== 'admin') {
          return new Response("Forbidden: Teacher access required", { status: 403 })
        }
      } catch (err) {
        console.error("Middleware RBAC error:", err)
      }
    }
  }
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}