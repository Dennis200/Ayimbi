import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
 
export async function POST(request: Request): Promise<NextResponse> {
  const { urls } = (await request.json()) as { urls: string[] };

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Storage token is not configured.' },
      { status: 500 },
    );
  }
 
  try {
    await del(urls, {
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blobs:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
