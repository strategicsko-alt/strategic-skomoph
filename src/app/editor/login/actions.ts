'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseAdmin } from '@/utils/supabase/admin'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const rawEmail = formData.get('email') as string
  const rawPassword = formData.get('password') as string

  const email = rawEmail ? rawEmail.trim().toLowerCase() : ''
  const password = rawPassword ? rawPassword.trim() : ''

  if (!email || !password) {
    return { error: 'กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน' }
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error for', email, error.message)
    if (error.message.includes('Invalid login credentials')) {
      return { 
        error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง (กรุณาตรวจสอบการสะกด ตัวพิมพ์เล็ก-ใหญ่ หรือช่องว่างหัวท้าย)' 
      }
    }
    if (error.message.includes('Email not confirmed')) {
      return { 
        error: 'อีเมลนี้ยังไม่ได้ยืนยันตัวตน กรุณาติดต่อผู้ดูแลระบบ' 
      }
    }
    return { error: error.message }
  }

  // Pre-check approval status from profiles
  if (authData?.user?.id) {
    try {
      const admin = getSupabaseAdmin()
      const { data: profile } = await admin
        .from('profiles')
        .select('approval_status, role, first_name, last_name')
        .eq('id', authData.user.id)
        .single()

      if (profile) {
        if (profile.approval_status === 'pending') {
          // Log out so pending session doesn't linger
          await supabase.auth.signOut()
          return { 
            error: 'บัญชีของท่าน (' + (profile.first_name || '') + ') อยู่ระหว่างรอการอนุมัติสิทธิ์จากผู้ดูแลระบบ กรุณาแจ้ง Admin เพื่อกดอนุมัติการใช้งาน' 
          }
        }
        if (profile.approval_status === 'rejected') {
          await supabase.auth.signOut()
          return { 
            error: 'บัญชีของท่านไม่ได้รับการอนุมัติการเข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบ' 
          }
        }
      }
    } catch (profileErr) {
      console.warn('Profile check warning during login:', profileErr)
    }
  }

  revalidatePath('/editor', 'layout')
  return { success: true }
}
