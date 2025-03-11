import { NextRequest, NextResponse } from 'next/server';
import { generateImageTags } from '@/services/ai/image-tagging-service';

export async function POST(request: NextRequest) {
  try {
    // Parse request - should contain imageData (base64 or URL) and optional context
    const { 
      imageData, 
      headingContext, 
      documentType 
    } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: 'Missing image data' },
        { status: 400 }
      );
    }

    // Call the image tagging service
    const result = await generateImageTags(imageData, {
      headingContext,
      documentType
    });

    // Handle errors from the tagging service
    if (result.error) {
      console.error('Error generating tags:', result.error);
      
      // Fall back to default tags if there's an error
      return NextResponse.json({ 
        tags: ['property', 'building', 'real estate'],
        error: result.error
      });
    }

    // Return the generated tags
    return NextResponse.json({ tags: result.tags });
  } catch (error) {
    console.error('Error processing image tagging request:', error);
    return NextResponse.json(
      { error: 'Internal server error', tags: [] },
      { status: 500 }
    );
  }
}