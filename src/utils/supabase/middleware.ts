import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/editor/login') ||
    pathname.startsWith('/editor/register') ||
    pathname.startsWith('/kpi') ||
    pathname.startsWith('/manual') ||
    pathname.startsWith('/print-book')

  if (pathname.startsWith('/editor')) {
    // 1. Not logged in → redirect to login
    if (!user && !isPublicPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/editor/login'
      return NextResponse.redirect(url)
    }

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, approval_status')
        .eq('id', user.id)
        .single()

      if (profile) {
        // 2. Pending approval → redirect to waiting page
        if (
          profile.approval_status !== 'approved' &&
          !pathname.startsWith('/editor/pending-approval') &&
          !isPublicPath
        ) {
          const url = request.nextUrl.clone()
          url.pathname = '/editor/pending-approval'
          return NextResponse.redirect(url)
        }

        const isSuperAdmin =
          profile.role === 'province_super_admin' ||
          profile.role === 'district_super_admin'

        // 3. Regular users cannot access super-admin-only pages
        const superAdminOnlyPaths = [
          '/editor/core-data',
          '/editor/dashboard',
          '/editor/admin',
          '/editor/users',
        ]

        if (!isSuperAdmin) {
          const isRestricted = superAdminOnlyPaths.some(p => pathname.startsWith(p))
          if (isRestricted) {
            // Redirect to Workshop (first allowed page for regular users)
            const url = request.nextUrl.clone()
            url.pathname = '/editor/workshop'
            return NextResponse.redirect(url)
          }
        }

        // 4. Only province_super_admin can access Backup
        if (
          pathname.startsWith('/editor/admin') &&
          profile.role !== 'province_super_admin'
        ) {
          const url = request.nextUrl.clone()
          url.pathname = '/editor/workshop'
          return NextResponse.redirect(url)
        }
      }
    }
  }

  return supabaseResponse
}
