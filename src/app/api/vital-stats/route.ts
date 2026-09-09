import { NextResponse } from 'next/server';
import vitalSummaryData from '@/data/vital_stats_summary.json';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section'); // 'all', 'meta', 'population', 'birth', 'death', 'life_expectancy'
    const year = searchParams.get('year') || '2568';
    const district = searchParams.get('district') || 'รวมทั้งหมด';
    const type = searchParams.get('type') || 'รวมทั้งหมด';
    const gender = searchParams.get('gender') || 'รวมทั้งหมด';
    const ageGroup = searchParams.get('ageGroup') || 'รวมทั้งหมด';

    if (section === 'meta') {
      return NextResponse.json({ success: true, data: vitalSummaryData.meta });
    }

    if (section === 'population') {
      const yrPyramid = (vitalSummaryData.popPyramids as any)[year] || {};
      const distPyramid = yrPyramid[district] || yrPyramid['รวมทั้งหมด'] || {};
      const typePyramid = distPyramid[type] || distPyramid['รวมทั้งหมด'] || null;

      const distTrends = (vitalSummaryData.popTrends as any)[district] || (vitalSummaryData.popTrends as any)['รวมทั้งหมด'] || {};
      const typeTrends = distTrends[type] || distTrends['รวมทั้งหมด'] || null;

      return NextResponse.json({
        success: true,
        data: {
          pyramid: typePyramid,
          trend: typeTrends,
          availableYears: vitalSummaryData.meta.availableYears,
          districts: vitalSummaryData.meta.districts
        }
      });
    }

    if (section === 'birth') {
      const yrBirth = (vitalSummaryData.birthCache as any)[year] || (vitalSummaryData.birthCache as any)['รวมทั้งหมด'] || {};
      const distBirth = yrBirth[district] || yrBirth['รวมทั้งหมด'] || {};
      const gBirth = distBirth[gender] || distBirth['รวมทั้งหมด'] || null;

      return NextResponse.json({
        success: true,
        data: {
          birthData: gBirth,
          birthYears: vitalSummaryData.meta.birthYears,
          districts: vitalSummaryData.meta.districts
        }
      });
    }

    if (section === 'death') {
      const distDeath = (vitalSummaryData.deathCache as any)[district] || (vitalSummaryData.deathCache as any)['รวมทั้งหมด'] || {};
      const gDeath = distDeath[gender] || distDeath['รวมทั้งหมด'] || {};
      const agDeath = gDeath[ageGroup] || gDeath['รวมทั้งหมด'] || null;

      return NextResponse.json({
        success: true,
        data: {
          deathData: agDeath,
          deathYears: vitalSummaryData.meta.deathYears,
          deathAgeGroups: vitalSummaryData.meta.deathAgeGroups,
          districts: vitalSummaryData.meta.districts
        }
      });
    }

    if (section === 'life_expectancy') {
      const leData = (vitalSummaryData.leCache as any)[district] || (vitalSummaryData.leCache as any)['รวมทั้งหมด'] || null;

      return NextResponse.json({
        success: true,
        data: {
          lifeExpectancy: leData,
          deathYears: vitalSummaryData.meta.deathYears,
          districts: vitalSummaryData.meta.districts
        }
      });
    }

    // Default: return full summary structure
    return NextResponse.json({
      success: true,
      meta: vitalSummaryData.meta,
      hasCache: true
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
