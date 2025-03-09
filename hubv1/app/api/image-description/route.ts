import { NextRequest, NextResponse } from 'next/server';

// Claude API key and endpoint
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Parse request - should contain imageData (base64 or URL)
    const { imageData, promptType = 'default' } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: 'Missing image data' },
        { status: 400 }
      );
    }

    // For real implementation, we would call Claude to analyze the image
    // For now, simulate with pre-defined descriptions

    // Introduce a delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    let description = '';

    // Generate different types of descriptions based on promptType
    switch (promptType) {
      case 'detailed':
        description = "This image shows a well-maintained property with clean architectural lines. The structure appears to be in good condition with no visible signs of deterioration or damage. The lighting is balanced, providing a clear view of the elements. The materials used appear to be standard construction quality and are consistent with similar properties in this category.";
        break;
      case 'technical':
        description = "Image depicts a building component/structure displaying consistent material integrity. No observable defects detected in visible surfaces. Finishes appear intact with minimal wear. Interior fixtures maintain appropriate positioning and alignment. Overall condition assessment: Good to Excellent based on visual inspection.";
        break;
      case 'simple':
        description = "Clean, well-maintained space with good lighting. No visible problems or damage.";
        break;
      default:
        // Generate a random description from these options for variety
        const descriptions = [
          "Interior space with adequate natural lighting and well-maintained surfaces.",
          "Building exterior showing good structural integrity with no obvious defects.",
          "Property feature in normal working condition with standard aesthetic appeal.",
          "Well-maintained area with clean finishes and appropriate functionality.",
          "Architectural element displaying consistent quality and attention to detail."
        ];
        description = descriptions[Math.floor(Math.random() * descriptions.length)];
    }

    // Return the generated description
    return NextResponse.json({ description });
  } catch (error) {
    console.error('Error processing image description request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}