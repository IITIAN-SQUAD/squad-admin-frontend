import { NextRequest, NextResponse } from 'next/server';

// Helper function to get fetch options with auth and cookie forwarding
function getFetchOptions(authToken: string | undefined, method: string, body?: string, request?: NextRequest) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    },
  };

  if (body) {
    options.body = body;
  }

  // Forward cookies from the incoming request to the backend
  if (request) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      options.headers = {
        ...options.headers,
        'cookie': cookieHeader,
      };
    }
  }

  return options;
}

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'https://serve.iitiansquad.com';
    const apiUrl = `${backendUrl}/v0/admin/blog/author`;
    
    // Get auth token from cookies
    const authToken = request.cookies.get('jwt')?.value || request.cookies.get('auth_token')?.value;
    
    console.log('[Authors API] GET - URL:', apiUrl);
    console.log('[Authors API] GET - Auth token:', authToken ? 'exists' : 'missing');

    const response = await fetch(apiUrl, getFetchOptions(authToken, 'GET', undefined, request));
    console.log('[Authors API] GET - Backend response status:', response.status);

    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = { error: await response.text() };
        }
      } catch (parseError) {
        errorData = { error: await response.text() };
      }
      
      console.error('[Authors API] GET - Backend error:', errorData);
      
      // Forward the actual backend error response
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log('[Authors API] GET - Backend response data:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Authors API] GET - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = process.env.BACKEND_URL || 'https://serve.iitiansquad.com';
    const apiUrl = `${backendUrl}/v0/admin/blog/author`;
    
    // Get auth token from cookies
    const authToken = request.cookies.get('jwt')?.value || request.cookies.get('auth_token')?.value;
    
    console.log('[Authors API] POST - URL:', apiUrl);
    console.log('[Authors API] POST - Request body:', body);
    console.log('[Authors API] POST - Auth token:', authToken ? 'exists' : 'missing');

    const response = await fetch(apiUrl, getFetchOptions(authToken, 'POST', JSON.stringify(body), request));
    console.log('[Authors API] POST - Backend response status:', response.status);

    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = { error: await response.text() };
        }
      } catch (parseError) {
        errorData = { error: await response.text() };
      }
      
      console.error('[Authors API] POST - Backend error:', errorData);
      
      // Forward the actual backend error response
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log('[Authors API] POST - Backend response data:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Authors API] POST - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
