import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") || "100";
  const collections = searchParams.getAll("collection");
  
  if (!collections.length) {
    return NextResponse.json({ error: 'Missing collection parameters' }, { status: 400 });
  }

  const collectionQuery = collections.map(col => `collection=${col}`).join('&');
  const url = `${process.env.API_URL}/centrality/degree?${collectionQuery}&limit=${limit}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Type assertion to ensure error is of type Error
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
    }
  }
}
