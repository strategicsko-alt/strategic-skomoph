import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's profile to check permissions
    const { data: myProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, district_id')
      .eq('id', user.id)
      .single();

    if (!myProfile || (myProfile.role !== 'province_super_admin' && myProfile.role !== 'district_super_admin')) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { userId, status } = await request.json(); // status = 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
       return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }

    // Check target user's profile to make sure they are allowed to approve them
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, district_id')
      .eq('id', userId)
      .single();

    if (!targetProfile) {
       return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    let canApprove = false;
    if (myProfile.role === 'province_super_admin') {
      // Province Super Admin can approve Province Users and District Super Admins
      // (Or let's just let them approve anyone to prevent deadlocks)
      canApprove = true;
    } else if (myProfile.role === 'district_super_admin') {
      // District Super Admin can only approve users in their own district
      if (targetProfile.district_id === myProfile.district_id) {
         canApprove = true;
      }
    }

    if (!canApprove) {
       return NextResponse.json({ success: false, message: 'Permission denied to approve this user' }, { status: 403 });
    }

    // Update the profile status
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ approval_status: status, updated_at: new Date().toISOString() })
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
