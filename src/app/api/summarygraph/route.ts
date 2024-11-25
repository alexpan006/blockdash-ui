import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope');
  const limit = searchParams.get('limit');
  
  // Collect all collection parameters into an array
  const collections = searchParams.getAll('collection');

  if (!scope || !collections.length || !limit) {
    return NextResponse.json({ error: 'Missing scope, collection, or limit parameters' }, { status: 400 });
  }

  // Construct the collection query parameter correctly
  const collectionQuery = collections.map(col => `collection=${col}`).join('&');
  const endpoint = `${process.env.API_URL}/community/summary?limit=${limit}&scope=${scope}&${collectionQuery}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch data from the external API' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
