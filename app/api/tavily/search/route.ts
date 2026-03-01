import { NextRequest, NextResponse } from 'next/server';

const TAVILY_API_KEY = process.env.NEXT_PUBLIC_TAVILY_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!TAVILY_API_KEY) {
      console.error('[Tavily Proxy] API key not configured');
      return NextResponse.json(
        { error: 'Tavily API key not configured' },
        { status: 500 }
      );
    }

    const tavilyRequest = {
      ...body,
      api_key: TAVILY_API_KEY,
    };

    console.log('[Tavily Proxy] Making search request:', {
      query: tavilyRequest.query,
      search_depth: tavilyRequest.search_depth,
      max_results: tavilyRequest.max_results,
      apiKeyPresent: !!TAVILY_API_KEY,
      apiKeyPrefix: TAVILY_API_KEY?.substring(0, 10) + '...',
    });

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tavilyRequest),
    });

    const responseText = await response.text();
    console.log('[Tavily Proxy] Response status:', response.status);
    console.log('[Tavily Proxy] Response body:', responseText.substring(0, 200) + '...');

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: responseText };
      }
      
      return NextResponse.json(
        { 
          error: 'Tavily API error', 
          status: response.status,
          details: errorData 
        },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);
    return NextResponse.json(data);

  } catch (error) {
    console.error('[Tavily Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
