import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Extract query parameters from the request
    const { searchParams } = new URL(req.url);
    const year_from = searchParams.get('year_from');
    const year_to = searchParams.get('year_to');
    const month_from = searchParams.get('month_from');
    const month_to = searchParams.get('month_to');

    // Build the external API URL
    const apiUrl = `${
          process.env.API_URL
        }/history/collection_distribution?year_from=${year_from}&year_to=${year_to}&month_from=${month_from}&month_to=${month_to}`;

    // Fetch data from the external API
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Return the fetched data as JSON
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
