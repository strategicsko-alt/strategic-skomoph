import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

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

    const { userId, status, role } = await request.json();

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

    let updatePayload: any = { updated_at: new Date().toISOString() };
    if (status) {
      if (!['approved', 'rejected', 'pending'].includes(status)) {
         return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
      }
      updatePayload.approval_status = status;
    }
    if (role) {
      updatePayload.role = role;
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
