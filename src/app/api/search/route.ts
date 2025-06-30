import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query, max_results = 10 } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Invalid query parameter" },
        { status: 400 },
      );
    }

    // Use DuckDuckGo instant answer API
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "DuckDuckGoMCP/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }

    const data = await response.json();

    // Format results for LLM consumption
    const results = {
      query,
      instant_answer: data.AbstractText || null,
      definition: data.Definition || null,
      answer: data.Answer || null,
      related_topics:
        data.RelatedTopics?.slice(0, max_results).map((topic: any) => ({
          text: topic.Text,
          url: topic.FirstURL,
        })) || [],
      results:
        data.Results?.slice(0, max_results).map((result: any) => ({
          title: result.Text,
          url: result.FirstURL,
        })) || [],
    };

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      {
        error: "Search request failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "DuckDuckGo Search API",
    usage: 'POST with { "query": "search terms", "max_results": 10 }',
  });
}
