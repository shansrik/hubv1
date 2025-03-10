import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { 
      systemPrompt, 
      userPrompt, 
      includePhoto = false, 
      photoData = null,
      photoDescription = null 
    } = await request.json();
    
    // Debug log to check if photo data is being received
    console.log("Photo included:", includePhoto);
    console.log("Photo data type:", photoData ? typeof photoData : "null");
    console.log("Photo data length:", photoData ? 
      (typeof photoData === 'string' ? photoData.substring(0, 50) + "..." : "not a string") : 
      "null");
    
    // Get API key from environment variable (server-side)
    const API_KEY = process.env.OPENAI_API_KEY;
    
    // If no API key, return a helpful error
    if (!API_KEY) {
      console.log("No OpenAI API key found - returning error");
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 400 }
      );
    }
    
    console.log("API Key available, making OpenAI API request");

    // Prepare the API request with or without image
    let requestBody;
    
    // Determine which model to use (GPT-4o for images, GPT-4 Turbo otherwise)
    const model = includePhoto && photoData 
      ? "gpt-4o" 
      : "gpt-4-turbo";
    
    console.log("Using model:", model);
    
    if (includePhoto && photoData) {
      console.log("Including photo in OpenAI API request");
      
      // Prepare content array with text and image
      const content = [
        {
          type: "text",
          text: userPrompt
        }
      ];
      
      // If it's a data URL, use the full URL for OpenAI
      let imageContent;
      if (typeof photoData === 'string' && photoData.startsWith('data:image')) {
        // OpenAI accepts the full data URL
        console.log("Photo is a data URL");
        imageContent = {
          type: "image_url",
          image_url: {
            url: photoData,
            detail: "high" // Can be 'low', 'high', or 'auto'
          }
        };
      } else if (typeof photoData === 'string') {
        // If it's just base64, add the data URL prefix
        console.log("Photo is base64, adding prefix");
        imageContent = {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${photoData}`,
            detail: "high"
          }
        };
      } else {
        console.error("Photo data is not a string:", typeof photoData);
        return NextResponse.json(
          { error: 'Invalid photo data format' },
          { status: 400 }
        );
      }
      
      // Multi-modal request structure for OpenAI
      requestBody = {
        model: model,
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              { type: "text", text: userPrompt },
              imageContent
            ]
          }
        ],
        temperature: 0.7
      };
      
      // Log the structure of the request (without the full image data)
      console.log("Request structure:", {
        model: requestBody.model,
        max_tokens: requestBody.max_tokens,
        messages: [
          {
            role: requestBody.messages[0].role,
            content: requestBody.messages[0].content
          },
          {
            role: requestBody.messages[1].role,
            content: [
              requestBody.messages[1].content[0],
              { 
                type: requestBody.messages[1].content[1].type,
                image_url: {
                  url: "DATA_URL_TRUNCATED",
                  detail: requestBody.messages[1].content[1].image_url.detail
                }
              }
            ]
          }
        ]
      });
    } else {
      // Standard text-only request
      console.log("Text-only request, no photo included");
      requestBody = {
        model: model,
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7
      };
    }
    
    // Make the API request
    console.log("Sending request to OpenAI API...");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return NextResponse.json(
        { error: `OpenAI API error: ${errorText}` },
        { status: response.status }
      );
    }

    console.log("Received successful response from OpenAI");
    const data = await response.json();
    return NextResponse.json({ content: data.choices[0]?.message?.content || '' });
  } catch (error) {
    console.error('Error in OpenAI API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}