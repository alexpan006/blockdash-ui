// src/app/api/singlegraph/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope');
  const collection = searchParams.get('collection');
  const limit = searchParams.get('limit');
  const community_id = searchParams.get('community_id'); 

  if (!scope || !collection || !limit || !community_id) {
    return NextResponse.json(
      { error: 'Missing scope, collection, limit, or community_id parameters' },
      { status: 400 }
    );
  }

  // Parse collections parameter to form the query string
  const collections = collection.split(',');
  const collectionQuery = collections.map(col => `collection=${col}`).join('&');

  const endpoint = `${process.env.API_URL}/community/single_community?community_id=${community_id}&scope=${scope}&${collectionQuery}&limit=${limit}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch data from the external API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

