import { NextRequest, NextResponse } from 'next/server';
import { callOpenAIAPI, callOpenAIVisionAPI } from '@/services/ai/openai-service';

export async function POST(request: NextRequest) {
  try {
    const { 
      systemPrompt, 
      userPrompt, 
      includePhoto = false, 
      photoData = null
    } = await request.json();
    
    // Log request details (without sensitive data)
    console.log("AI API Request:", {
      includePhoto,
      photoDataLength: photoData ? `${typeof photoData === 'string' ? photoData.length : 'not a string'}` : 'null',
    });
    
    // Check for API key
    const API_KEY = process.env.OPENAI_API_KEY;
    if (!API_KEY) {
      console.log("No OpenAI API key found - returning error");
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 400 }
      );
    }
    
    let content;
    
    // Call the appropriate service based on whether image is included
    if (includePhoto && photoData) {
      console.log("Processing request with image...");
      content = await callOpenAIVisionAPI(systemPrompt, userPrompt, photoData);
    } else {
      console.log("Processing text-only request...");
      content = await callOpenAIAPI(systemPrompt, userPrompt);
    }
    
    console.log("AI response received successfully");
    return NextResponse.json({ content });
    
  } catch (error) {
    console.error('Error in AI API route:', error);
    
    // Return appropriate error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `AI API error: ${errorMessage}` },
      { status: 500 }
    );
  }
}