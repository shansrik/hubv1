import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt, userPrompt } = await request.json();
    
    // Get API key from environment variable (server-side)
    const API_KEY = process.env.CLAUDE_API_KEY;
    
    // If no API key, fall back to test response with simulated content based on prompt type
    if (!API_KEY) {
      console.log("No API key found - returning simulated response");
      
      // Extract information to determine what kind of response to simulate
      const promptType = userPrompt.toLowerCase();
      let simulatedResponse = "";
      
      // Create different simulated responses based on prompt type
      if (promptType.includes("professional")) {
        simulatedResponse = "We have conducted a comprehensive analysis of the current market conditions and identified several opportunities for strategic growth.";
      } else if (promptType.includes("casual")) {
        simulatedResponse = "Hey! So here's what we found - the market's looking pretty good right now, and we've spotted some cool opportunities.";
      } else if (promptType.includes("concise")) {
        simulatedResponse = "Analysis identified market opportunities. Implementation features phased approach for efficiency.";
      } else if (promptType.includes("expand")) {
        const originalText = userPrompt.match(/"([^"]+)"/)?.[1] || "";
        simulatedResponse = originalText + " Furthermore, this approach offers several benefits including improved scalability and maintainability.";
      } else if (promptType.includes("grammar")) {
        // Simple grammar fixes
        const originalText = userPrompt.match(/"([^"]+)"/)?.[1] || "";
        simulatedResponse = originalText.replace(/\s+([,.!?])/g, '$1').replace(/\bi\b/g, 'I');
      } else if (promptType.includes("custom")) {
        simulatedResponse = "This is a simulated response to your custom prompt. In a real implementation, Claude would process your specific instructions.";
      } else {
        simulatedResponse = "This is a simulated AI response. The Claude API key is not configured, but the functionality is working correctly.";
      }
      
      return NextResponse.json({ content: simulatedResponse });
    }
    
    console.log("API Key available, making real Claude API request"); // Log progress

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      return NextResponse.json(
        { error: `Claude API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ content: data.content[0]?.text || '' });
  } catch (error) {
    console.error('Error in Claude API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 