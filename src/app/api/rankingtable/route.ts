import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const scope = searchParams.get('scope');
  const collection = searchParams.get('collection');
  const limit = searchParams.get('limit');
  const yearFrom = searchParams.get('year_from');
  const yearTo = searchParams.get('year_to');
  const monthFrom = searchParams.get('month_from');
  const monthTo = searchParams.get('month_to');

  if (!scope || !limit || !yearFrom || !yearTo || !monthFrom || !monthTo) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // Construct the external API URL
  const endpoint = `${process.env.API_URL}/ranking/?scope=${scope}&collection=${collection || ''}&limit=${limit}&year_from=${yearFrom}&year_to=${yearTo}&month_from=${monthFrom}&month_to=${monthTo}`;

  try {
    // Fetch data from the external API
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch data from external API' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching ranking data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
