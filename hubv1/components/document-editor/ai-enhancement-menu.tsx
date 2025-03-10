"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { AIEnhancementMenuProps } from "./types";

export default function AIEnhancementMenu({ isGeneratingAI, onEnhanceWithAI }: AIEnhancementMenuProps) {
  const [customPrompt, setCustomPrompt] = useState("");

  const handleEnhance = (type: any) => {
    if (type === 'custom') {
      if (!customPrompt.trim()) return;
      onEnhanceWithAI({ type, customPrompt });
      setCustomPrompt("");
    } else {
      onEnhanceWithAI({ type });
    }
  };

  return (
    <div className="flex flex-col space-y-2 p-2 bg-white rounded-md shadow-lg border border-gray-200">
      <div className="text-xs font-medium text-gray-500 mb-1">AI Enhancement</div>
      
      {/* Standard options */}
      <Button 
        variant="ghost"
        size="sm"
        className="justify-start"
        onClick={() => handleEnhance('expand')}
        disabled={isGeneratingAI}
      >
        <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
        <span>Expand with details</span>
      </Button>

      <Button 
        variant="ghost"
        size="sm"
        className="justify-start"
        onClick={() => handleEnhance('concise')}
        disabled={isGeneratingAI}
      >
        <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
        <span>Make concise</span>
      </Button>

      <Button 
        variant="ghost"
        size="sm"
        className="justify-start"
        onClick={() => handleEnhance('professional')}
        disabled={isGeneratingAI}
      >
        <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
        <span>Professional tone</span>
      </Button>

      <Button 
        variant="ghost"
        size="sm"
        className="justify-start"
        onClick={() => handleEnhance('grammar')}
        disabled={isGeneratingAI}
      >
        <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
        <span>Fix grammar</span>
      </Button>

      <Button 
        variant="ghost"
        size="sm"
        className="justify-start"
        onClick={() => handleEnhance('follow-up')}
        disabled={isGeneratingAI}
      >
        <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-500" />
        <span>Add follow-up</span>
      </Button>

      <div className="border-t border-gray-200 my-1"></div>

      {/* Custom prompt section */}
      <div className="mt-2">
        <label className="block text-xs text-gray-500 mb-1">Custom instruction:</label>
        <input
          className="w-full p-1 text-sm border border-gray-300 rounded"
          placeholder="E.g., Rewrite for 5th grade level"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && customPrompt.trim()) {
              handleEnhance('custom');
            }
          }}
        />
        <Button 
          size="sm"
          className="mt-1 w-full bg-yellow-500 hover:bg-yellow-600 text-white"
          onClick={() => handleEnhance('custom')}
          disabled={isGeneratingAI || !customPrompt.trim()}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1" />
          Apply Custom Prompt
        </Button>
      </div>
    </div>
  );
}