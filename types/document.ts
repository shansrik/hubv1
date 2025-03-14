import type React from "react"

// Document block type for the block-style editor
export interface DocumentBlock {
  id: string;
  type: string;
  content: string;
  aiAssisted?: boolean;
}

// Simple document structure for our application
export interface Document {
  id: string;
  title: string;
  blocks: DocumentBlock[];
  images?: Array<{
    id: string;
    url: string;
  }>;
}

