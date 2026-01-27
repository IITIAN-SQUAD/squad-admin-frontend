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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const backendUrl = process.env.BACKEND_URL || 'https://serve.iitiansquad.com';
    const apiUrl = `${backendUrl}/v0/admin/blog/author/${id}`;
    
    // Get auth token from cookies
    const authToken = request.cookies.get('jwt')?.value || request.cookies.get('auth_token')?.value;
    
    console.log('[Author API] GET - URL:', apiUrl);
    console.log('[Author API] GET - Auth token:', authToken ? 'exists' : 'missing');

    const response = await fetch(apiUrl, getFetchOptions(authToken, 'GET', undefined, request));
    console.log('[Author API] GET - Backend response status:', response.status);

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
      
      console.error('[Author API] GET - Backend error:', errorData);
      
      // Forward the actual backend error response
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log('[Author API] GET - Backend response data:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Author API] GET - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const backendUrl = process.env.BACKEND_URL || 'https://serve.iitiansquad.com';
    const apiUrl = `${backendUrl}/v0/admin/blog/author/${id}`;
    
    // Get auth token from cookies
    const authToken = request.cookies.get('jwt')?.value || request.cookies.get('auth_token')?.value;
    
    console.log('[Author API] PUT - URL:', apiUrl);
    console.log('[Author API] PUT - Request body:', body);
    console.log('[Author API] PUT - Auth token:', authToken ? 'exists' : 'missing');

    const response = await fetch(apiUrl, getFetchOptions(authToken, 'PUT', JSON.stringify(body), request));
    console.log('[Author API] PUT - Backend response status:', response.status);

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
      
      console.error('[Author API] PUT - Backend error:', errorData);
      
      // Forward the actual backend error response
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log('[Author API] PUT - Backend response data:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Author API] PUT - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const backendUrl = process.env.BACKEND_URL || 'https://serve.iitiansquad.com';
    const apiUrl = `${backendUrl}/v0/admin/blog/author/${id}`;
    
    // Get auth token from cookies
    const authToken = request.cookies.get('jwt')?.value || request.cookies.get('auth_token')?.value;
    
    console.log('[Author API] DELETE - URL:', apiUrl);
    console.log('[Author API] DELETE - Auth token:', authToken ? 'exists' : 'missing');

    const response = await fetch(apiUrl, getFetchOptions(authToken, 'DELETE', undefined, request));
    console.log('[Author API] DELETE - Backend response status:', response.status);

    // DELETE returns 204 No Content on success
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

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
      
      console.error('[Author API] DELETE - Backend error:', errorData);
      
      // Forward the actual backend error response
      return NextResponse.json(errorData, { status: response.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[Author API] DELETE - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
