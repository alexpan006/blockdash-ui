import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const endpointType = searchParams.get("endpoint_type");
  const year_from = searchParams.get("year_from");
  const year_to = searchParams.get("year_to");
  const month_from = searchParams.get("month_from");
  const month_to = searchParams.get("month_to");
  const collections = searchParams.getAll("collection");
  const relation_types = searchParams.getAll("relation_type");

  if (collections.length === 0) {
    console.error("No collections specified");
    return NextResponse.json(
      { error: "No collections specified" },
      { status: 400 }
    );
  }

  let dataSets: any[] = [];

  try {
    // Handle the case where the endpointType is "active_user"
    if (endpointType === "active_user") {
      for (const relation_type of relation_types) {
        const apiUrl = `${
          process.env.API_URL
        }/history/active_user?year_from=${year_from}&year_to=${year_to}&month_from=${month_from}&month_to=${month_to}&${collections
          .map((col) => `collection=${encodeURIComponent(col)}`)
          .join("&")}&relation_type=${encodeURIComponent(relation_type)}`;

        console.log("Requesting data from:", apiUrl);
        const response = await fetch(apiUrl, { next: { revalidate: 0 } });
        console.log("Raw response status:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Parsed response data:", data);

        if (data.dates && data.counts) {
          console.log("Data is correctly structured");
          dataSets.push({ relation_type, data });
        } else {
          console.warn("Data is missing expected fields");
        }
      }
    } else {
      // Handle the other cases
      let apiUrl: string;

      if (endpointType === "mint") {
        apiUrl = `${
          process.env.API_URL
        }/history/mint?year_from=${year_from}&year_to=${year_to}&month_from=${month_from}&month_to=${month_to}&${collections
          .map((col) => `collection=${encodeURIComponent(col)}`)
          .join("&")}`;
      } else if (endpointType === "transaction") {
        apiUrl = `${
          process.env.API_URL
        }/history/transaction?year_from=${year_from}&year_to=${year_to}&month_from=${month_from}&month_to=${month_to}&${collections
          .map((col) => `collection=${encodeURIComponent(col)}`)
          .join("&")}`;
      } else {
        console.error("Invalid endpoint type");
        return NextResponse.json(
          { error: "Invalid endpoint type" },
          { status: 400 }
        );
      }

      console.log("Requesting data from:", apiUrl);
      const response = await fetch(apiUrl);
      console.log("Raw response status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Parsed response data:", data);

      if (data.dates && data.counts) {
        console.log("Data is correctly structured");
        dataSets.push(data);
      } else {
        console.warn("Data is missing expected fields");
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error);

    // Cast error to the type that has `message` property
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: "An unknown error occurred" },
        { status: 500 }
      );
    }
  }

  console.log("Final dataSets:", dataSets);
  return NextResponse.json(dataSets);
}
