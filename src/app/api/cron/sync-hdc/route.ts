import { NextResponse } from 'next/server';
import { syncAllHdcKpis } from '@/lib/hdc-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for fetching external APIs

export async function GET(req: Request) {
  try {
    // Check authorization if CRON_SECRET is configured
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // If Vercel Cron header is present, allow
      const vercelCronHeader = req.headers.get('x-vercel-cron');
      if (!vercelCronHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'Q4';

    const result = await syncAllHdcKpis(period);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error running HDC sync cron:', error);
    return NextResponse.json(
      { error: error.message || 'HDC sync cron failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const period = body.period || 'Q4';

    const result = await syncAllHdcKpis(period);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error running manual HDC sync:', error);
    return NextResponse.json(
      { error: error.message || 'Manual HDC sync failed' },
      { status: 500 }
    );
  }
}
