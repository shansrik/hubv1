"use client"

import { useState } from "react"
import type { DocumentTemplate } from "@/types/document"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TemplateEditorProps {
  initialTemplate: DocumentTemplate
  onSave: (template: DocumentTemplate) => void
  onCancel: () => void
}

export default function TemplateEditor({ initialTemplate, onSave, onCancel }: TemplateEditorProps) {
  const [template, setTemplate] = useState<DocumentTemplate>(initialTemplate)

  const handleChange = (field: string, value: any) => {
    setTemplate((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleMarginChange = (side: string, value: string) => {
    setTemplate((prev) => ({
      ...prev,
      margins: {
        ...prev.margins,
        [side]: value,
      },
    }))
  }

  const handleHeaderChange = (field: string, value: string) => {
    setTemplate((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        [field]: value,
      },
    }))
  }

  const handleFooterChange = (field: string, value: string) => {
    setTemplate((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        [field]: value,
      },
    }))
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <h2 className="text-xl font-bold mb-4">Edit Document Template</h2>

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="header">Header & Footer</TabsTrigger>
          <TabsTrigger value="css">CSS</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input id="name" value={template.name} onChange={(e) => handleChange("name", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={template.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pageSize">Page Size</Label>
              <Select value={template.pageSize} onValueChange={(value) => handleChange("pageSize", value)}>
                <SelectTrigger id="pageSize">
                  <SelectValue placeholder="Select page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="Letter">Letter</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orientation">Orientation</Label>
              <Select
                value={template.orientation}
                onValueChange={(value) => handleChange("orientation", value as "portrait" | "landscape")}
              >
                <SelectTrigger id="orientation">
                  <SelectValue placeholder="Select orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Margins</Label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label htmlFor="marginTop" className="text-xs">
                  Top
                </Label>
                <Input
                  id="marginTop"
                  value={template.margins.top}
                  onChange={(e) => handleMarginChange("top", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="marginRight" className="text-xs">
                  Right
                </Label>
                <Input
                  id="marginRight"
                  value={template.margins.right}
                  onChange={(e) => handleMarginChange("right", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="marginBottom" className="text-xs">
                  Bottom
                </Label>
                <Input
                  id="marginBottom"
                  value={template.margins.bottom}
                  onChange={(e) => handleMarginChange("bottom", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="marginLeft" className="text-xs">
                  Left
                </Label>
                <Input
                  id="marginLeft"
                  value={template.margins.left}
                  onChange={(e) => handleMarginChange("left", e.target.value)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="header" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="headerHeight">Header Height</Label>
              <Input
                id="headerHeight"
                value={template.header?.height || "0.5in"}
                onChange={(e) => handleHeaderChange("height", e.target.value)}
                className="w-24"
              />
            </div>
            <Label htmlFor="headerContent">Header Content (HTML)</Label>
            <Textarea
              id="headerContent"
              value={template.header?.content || ""}
              onChange={(e) => handleHeaderChange("content", e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="footerHeight">Footer Height</Label>
              <Input
                id="footerHeight"
                value={template.footer?.height || "0.5in"}
                onChange={(e) => handleFooterChange("height", e.target.value)}
                className="w-24"
              />
            </div>
            <Label htmlFor="footerContent">Footer Content (HTML)</Label>
            <Textarea
              id="footerContent"
              value={template.footer?.content || ""}
              onChange={(e) => handleFooterChange("content", e.target.value)}
              rows={4}
            />
            <p className="text-xs text-gray-500">
              Use <code>&lt;span class="page-number"&gt;&lt;/span&gt;</code> for current page and{" "}
              <code>&lt;span class="page-count"&gt;&lt;/span&gt;</code> for total pages.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="css" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="css">Custom CSS</Label>
            <Textarea
              id="css"
              value={template.css}
              onChange={(e) => handleChange("css", e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
          </div>
        </TabsContent>

        <TabsContent value="json" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jsonTemplate">Template JSON</Label>
            <Textarea
              id="jsonTemplate"
              value={JSON.stringify(template, null, 2)}
              rows={20}
              readOnly
              className="font-mono text-sm"
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(template)}>Save Template</Button>
      </div>
    </div>
  )
}

