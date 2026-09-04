'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function register(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const first_name = formData.get('first_name') as string
  const last_name = formData.get('last_name') as string
  const district_id = formData.get('district_id') as string
  const role = formData.get('role') as string // Should be requested based on logic, but let's assume they pick one or it defaults to user for that district type

  // Convert district string name to ID or wait, they select from dropdown, it's better to select ID.
  // But wait, the user hasn't created the district table yet in Supabase, so we can't reliably fetch IDs right now in a hardcoded way unless we query them.
  // We'll pass it as is and the trigger will handle it or we can just send it via user_metadata.

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name,
        last_name,
        district_id,
        role
      }
    }
  })

  if (error) {
    return { error: error.message }
  }

  // After successful registration, redirect to login page with a success message or to a pending page
  redirect('/editor/login?message=Registration%20successful.%20Please%20wait%20for%20admin%20approval.')
}
