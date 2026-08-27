import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public paths that don't require authentication
  const isPublicPath = pathname === '/' || pathname.startsWith('/editor/login') || pathname.startsWith('/editor/register')

  if (pathname.startsWith('/editor')) {
    if (!user && !isPublicPath) {
      // no user, potentially respond by redirecting the user to the login page
      const url = request.nextUrl.clone()
      url.pathname = '/editor/login'
      return NextResponse.redirect(url)
    }

    if (user) {
      // If user is logged in, check their profile status
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, approval_status')
        .eq('id', user.id)
        .single()

      if (profile) {
        // Handle pending approval
        if (profile.approval_status === 'pending' && !pathname.startsWith('/editor/pending-approval')) {
          const url = request.nextUrl.clone()
          url.pathname = '/editor/pending-approval'
          return NextResponse.redirect(url)
        }
        
        // Prevent pending users from accessing authenticated areas
        if (profile.approval_status === 'pending' && pathname !== '/editor/pending-approval') {
          const url = request.nextUrl.clone()
          url.pathname = '/editor/pending-approval'
          return NextResponse.redirect(url)
        }

        // Example Role-based protection:
        // Protect /editor/admin for province_super_admin only
        if (pathname.startsWith('/editor/admin') && profile.role !== 'province_super_admin') {
           const url = request.nextUrl.clone()
           url.pathname = '/editor/dashboard'
           return NextResponse.redirect(url)
        }
      }
    }
  }

  return supabaseResponse
}
