import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import getConfig from 'next/config';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  const { serverRuntimeConfig } = getConfig();
 
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname,
        /* clientPayload */
      ) => {
        // Generate a client token for the browser to upload the file
        // ⚠️ Authenticate and authorize users before generating the token.
        // Otherwise, allows anonymous uploads.
 
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/wav', 'audio/ogg'],
          token: serverRuntimeConfig.blobReadWriteToken,
          // Add prefix to the token to avoid client-side tampering
          // clientPayload: { ... },
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // ⚠️ This callback is called after the file is uploaded to the blob store.
        // You can use this callback to update your database with the blob details.
        console.log('blob upload completed', blob, tokenPayload);
 
        try {
          // Perform any necessary actions after the upload is complete
        } catch (error) {
          throw new Error('Could not update database');
        }
      },
    });
 
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
