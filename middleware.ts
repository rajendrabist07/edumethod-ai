import { NextRequest, NextResponse } from "next/server";
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

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const authObject = await auth()
    
    // 1. Basic auth protection
    if (!authObject.userId) {
      await auth.protect()
    }

    // 2. RBAC check for teacher routes
    if (isTeacherRoute(req) && authObject.userId) {
      // 1. Try Clerk session claims first (instant, edge-compatible)
      const role = (authObject.sessionClaims?.metadata as any)?.role || (authObject.sessionClaims?.publicMetadata as any)?.role;
      
      if (role === 'teacher' || role === 'admin') {
        return; // Allowed
      }

      // 2. Query Supabase directly via Edge-compatible fetch as fallback
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SECRET_KEY;
        
        if (supabaseUrl && supabaseKey) {
          const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${authObject.userId}&select=role`, {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`
            }
          });
          const data = await res.json();
          const dbRole = data?.[0]?.role || 'student';
          
          if (dbRole === 'teacher' || dbRole === 'admin') {
            return; // Allowed
          }
        }
      } catch (err) {
        console.error("Middleware RBAC error:", err);
      }
    }
  }
})

export default async function middleware(req: NextRequest, event: any) {
  if (process.env.ENABLE_E2E_MOCK === "true" && req.headers.get("x-mock-user-id")) {
    return NextResponse.next();
  }
  return clerkHandler(req, event);
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}