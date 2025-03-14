# API Routes

This directory contains the API routes for the application.

## Routes

- `/api/ai`: Main AI endpoint for all AI-related functionality
  - Text generation
  - Image + text processing (vision)

## Structure

Each route follows a standard structure:

1. Parse and validate request
2. Call the appropriate service function
3. Handle errors and format response

## Example

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { someService } from '@/services/some-service';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request
    const { param1, param2 } = await request.json();
    
    // 2. Call service
    const result = await someService(param1, param2);
    
    // 3. Return formatted response
    return NextResponse.json({ data: result });
  } catch (error) {
    // Handle errors
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

## API Design Principles

1. **Separation of concerns**: Route handlers should only deal with HTTP concerns
2. **Thin controllers**: Business logic should be in services, not in route handlers
3. **Consistent error handling**: Use standard error format across all routes
4. **Input validation**: Validate all inputs before processing