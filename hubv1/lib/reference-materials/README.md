# Reference Materials for Claude AI Integration

This directory contains reference materials that will be used by Claude to enhance text content in the document editor. These materials provide context, style guidelines, and terminology to ensure Claude's responses are consistent with your organization's standards.

## Available Reference Files

- `terminology.json` - Industry-specific terms and definitions
- `style-guide.md` - General writing style guidelines
- `naming-conventions.md` - How to name things in your documents
- `tone-guidelines.md` - Voice and tone guidelines for different types of content
- `legal-requirements.md` - Required legal text and disclaimers

## How to Use

1. Edit the files in this directory to customize the reference materials for your specific needs
2. Update the imports in `lib/ai-service.ts` if you add or rename files
3. The reference materials will be included in the system prompt for Claude when generating text

## Example Usage

```javascript
// In a component file:
import { createReferenceContext } from "@/lib/ai-service";

// Load the reference materials
const referenceContext = createReferenceContext({
  terminology: {
    "API": "Application Programming Interface",
    "UI": "User Interface",
    // Add more terminology
  },
  styleGuide: "Use active voice. Keep sentences under 20 words when possible...",
  namingConventions: "Use PascalCase for component names...",
  // Add more reference materials
});

// Use the reference context in your prompts
const systemPrompt = `
  You are an expert text editor.
  ${referenceContext}
  Please enhance the text according to these guidelines.
`;
```

## Adding New Reference Materials

1. Create a new file in this directory
2. Update the `createReferenceContext` function in `lib/ai-service.ts` to include your new material
3. Use the updated function in your components

## Format Guidelines

- JSON files should be properly formatted with valid JSON syntax
- Markdown files should use standard markdown formatting
- Avoid including sensitive information in these files
- Keep file sizes reasonable to avoid large prompts