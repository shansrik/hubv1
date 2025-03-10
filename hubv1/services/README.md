# Services Directory

This directory contains service modules that handle business logic and external API interactions for the application.

## Organization

- `/services`: Root services directory
  - `/ai`: AI service modules
    - `openai-service.ts`: Handles all OpenAI API interactions

## API Design

The services are designed to abstract away the implementation details of external APIs, providing a clean interface for the application's components to use.

### AI Service

- Text generation: `callOpenAIAPI(systemPrompt, userPrompt)`
- Vision (image + text) generation: `callOpenAIVisionAPI(systemPrompt, userPrompt, photoData)`
- Image processing: `processImageForOpenAI(photoData)`
- Utility functions: `createReferenceContext(materials)`

## Using the Services

Services should be imported directly into API routes or components as needed:

```typescript
import { callOpenAIAPI } from '@/services/ai/openai-service';

// Then use the service
const result = await callOpenAIAPI(systemPrompt, userPrompt);
```

## API Routes

The API routes should be thin wrappers around the services, handling HTTP-specific concerns like request parsing, validation, and response formatting. The actual business logic should be in the services.

- `/api/ai`: Main AI endpoint that uses the OpenAI service