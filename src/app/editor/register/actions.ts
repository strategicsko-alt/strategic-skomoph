'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseAdmin } from '@/utils/supabase/admin'

export async function register(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const first_name = (formData.get('first_name') as string)?.trim()
  const last_name = (formData.get('last_name') as string)?.trim()
  const district_id = formData.get('district_id') as string
  const role = formData.get('role') as string
  const work_group = (formData.get('work_group') as string)?.trim() || null

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name,
        last_name,
        district_id,
        role,
        work_group
      }
    }
  })

  if (error) {
    return { error: error.message }
  }

  if (signUpData?.user?.id) {
    try {
      const admin = getSupabaseAdmin()
      await admin.from('profiles').upsert({
        id: signUpData.user.id,
        first_name,
        last_name,
        district_id,
        role,
        work_group: role?.includes('province') ? work_group : null,
        approval_status: 'pending',
        updated_at: new Date().toISOString()
      })
    } catch (e) {
      console.warn('Admin upsert profile note:', e)
    }
  }

  // After successful registration, redirect to login page with a success message or to a pending page
  redirect('/editor/login?message=Registration%20successful.%20Please%20wait%20for%20admin%20approval.')
}
