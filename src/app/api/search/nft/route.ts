import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nft = searchParams.get('nft');
  const collection = searchParams.get('collection');

  console.log('Received parameters:', { nft, collection }); // Log the received parameters

  if (!nft || !collection) {
    return NextResponse.json({ error: 'Missing nft or collection parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(`${process.env.API_URL}/search/nft?identifier=${nft}&collection=${collection}`);
    if (response.status === 404) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 });
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error fetching NFT data:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      console.error('Unexpected error fetching NFT data:', error);
      return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 });
    }
  }
}
