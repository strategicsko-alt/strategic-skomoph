import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's profile
    const { data: myProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, district_id')
      .eq('id', user.id)
      .single();

    if (!myProfile || (myProfile.role !== 'province_super_admin' && myProfile.role !== 'district_super_admin')) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Query profiles with districts
    let profilesQuery = supabaseAdmin
      .from('profiles')
      .select(`id, first_name, last_name, role, work_group, approval_status, district_id, created_at, districts ( name )`)
      .order('created_at', { ascending: false });

    // If district_super_admin, filter only their district
    if (myProfile.role === 'district_super_admin' && myProfile.district_id) {
      profilesQuery = profilesQuery.eq('district_id', myProfile.district_id);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;
    if (profilesError) {
      return NextResponse.json({ success: false, message: profilesError.message }, { status: 500 });
    }

    // Fetch auth users to map emails
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const authMap = new Map((authData?.users || []).map(u => [u.id, u]));

    const enrichedUsers = (profiles || []).map(p => {
      const authUser = authMap.get(p.id);
      return {
        ...p,
        email: authUser?.email || '',
        last_sign_in_at: authUser?.last_sign_in_at || null,
      };
    });

    return NextResponse.json({ success: true, users: enrichedUsers, myProfile });
  } catch (error: any) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's profile
    const { data: myProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, district_id')
      .eq('id', user.id)
      .single();

    if (!myProfile || (myProfile.role !== 'province_super_admin' && myProfile.role !== 'district_super_admin')) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { userId, status, role, workGroup, firstName, lastName, newPassword } = await request.json();

    // Check target user's profile
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, district_id')
      .eq('id', userId)
      .single();

    if (!targetProfile) {
       return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    let canManage = false;
    if (myProfile.role === 'province_super_admin') {
      // Province Super Admin can manage ANY user and assign ANY role
      canManage = true;
    } else if (myProfile.role === 'district_super_admin') {
      // District Super Admin can only manage users in their own district
      // And can ONLY assign/manage 'district_user'
      if (targetProfile.district_id === myProfile.district_id) {
         if ((targetProfile.role === 'district_user' || !targetProfile.role) && role === 'district_user') {
           canManage = true;
         }
      }
    }

    if (!canManage) {
       return NextResponse.json({ success: false, message: 'Permission denied to manage this user or assign this role' }, { status: 403 });
    }

    // Update password if provided
    if (newPassword !== undefined && newPassword.trim() !== '') {
      if (newPassword.trim().length < 6) {
        return NextResponse.json({ success: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
      }
      const { error: pwdError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword.trim()
      });
      if (pwdError) {
        console.error('Failed to update password:', pwdError);
        return NextResponse.json({ success: false, message: 'ไม่สามารถเปลี่ยนรหัสผ่านได้: ' + pwdError.message }, { status: 400 });
      }
    }

    let updatePayload: any = { updated_at: new Date().toISOString() };
    if (status) {
      if (!['approved', 'rejected', 'pending'].includes(status)) {
         return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
      }
      updatePayload.approval_status = status;
    }
    if (workGroup !== undefined) updatePayload.work_group = workGroup;
    if (role) {
      updatePayload.role = role;
    }
    if (firstName !== undefined && firstName.trim() !== '') {
      updatePayload.first_name = firstName.trim();
    }
    if (lastName !== undefined && lastName.trim() !== '') {
      updatePayload.last_name = lastName.trim();
    }

    // Update the profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Bad request' }, { status: 400 });
  }
}
