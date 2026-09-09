import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tableName = 's_ttm27', year = '2569', province = '27' } = body;

    const response = await fetch('https://opendata.moph.go.th/api/report_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: JSON.stringify({
        tableName,
        year: String(year),
        province: String(province),
        type: 'json',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `HDC Open Data returned status ${response.status}`;
      try {
        const json = JSON.parse(errText);
        if (json.message) errMsg = json.message;
      } catch (e) {}
      return NextResponse.json(
        { error: errMsg, status: response.status },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch from HDC Open Data' },
      { status: 500 }
    );
  }
}
