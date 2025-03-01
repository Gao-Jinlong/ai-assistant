import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const response = await fetch(`${process.env.NESTJS_SERVER}/api/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json(
      { error: 'Failed to fetch from API' },
      { status: 500 },
    );
  }
}
