import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const year_from = searchParams.get("year_from");
  const year_to = searchParams.get("year_to");
  const month_from = searchParams.get("month_from");
  const month_to = searchParams.get("month_to");
  const collection = searchParams.get("collection");
  const relation_type = searchParams.get("relation_type");

  // Validate that all required parameters are present
  if (!year_from || !year_to || !month_from || !month_to || !collection || !relation_type) {
    console.error("Missing required parameters");
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  // Ensure that relation_type is one of the allowed values
  if (!["transacted", "mint"].includes(relation_type.toLowerCase())) {
    console.error("Invalid relation_type specified");
    return NextResponse.json(
      { error: "Invalid relation_type specified" },
      { status: 400 }
    );
  }

  try {
    // Convert collection to lowercase
    const collectionLower = collection.toLowerCase();

    // Construct the API URL based on the provided parameters
    const apiUrl = `${process.env.API_URL}/equality/overall?year_from=${encodeURIComponent(
      year_from
    )}&year_to=${encodeURIComponent(year_to)}&month_from=${encodeURIComponent(
      month_from
    )}&month_to=${encodeURIComponent(month_to)}&collection=${encodeURIComponent(
      collectionLower
    )}&relation_type=${encodeURIComponent(relation_type)}`;

    console.log("Requesting data from:", apiUrl);
    const response = await fetch(apiUrl);
    console.log("Raw response status:", response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Parsed response data:", data);

    // Handle the case where data is a single number
    if (typeof data === "number") {
      console.log("Received a numeric score directly");
      return NextResponse.json({ overall_score: data });
    } else {
      console.warn("Unexpected data format received");
      return NextResponse.json(
        { error: "Unexpected data format" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching data:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "An unknown error occurred while fetching data" },
      { status: 500 }
    );
  }
}
