import { NextRequest, NextResponse } from 'next/server';

const API_URL = `${process.env.API_URL}/update/times`;

export async function GET(req: NextRequest) {
  try {
    console.log(`Fetching data from URL: ${API_URL}`); // Log the URL

    const response = await fetch(API_URL, { next: { revalidate: 0 } });

    if (!response.ok) {
      return NextResponse.json({ message: 'Failed to fetch data' }, { status: response.status });
    }

    const data = await response.json();
    console.log("Fetched data:", data); // Log the fetched data
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
