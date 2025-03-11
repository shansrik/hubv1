"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, X, Check } from "lucide-react";
import { ReportHeader } from "./types";

interface HeaderEditorProps {
  header: ReportHeader;
  onSave: (header: ReportHeader) => void;
}

export default function HeaderEditor({ header, onSave }: HeaderEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedHeader, setEditedHeader] = useState<ReportHeader>(header);

  const handleChange = (field: keyof ReportHeader, value: string) => {
    setEditedHeader({
      ...editedHeader,
      [field]: value
    });
  };

  const handleSave = () => {
    onSave(editedHeader);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedHeader(header);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex justify-between items-center p-2 border-b border-gray-200">
        <div className="text-sm font-medium">{header.documentTitle}</div>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => setIsEditing(true)}
          className="h-8 w-8 p-0 rounded-full"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <h3 className="text-md font-medium mb-3">Edit Report Header</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Company Name</label>
          <Input
            value={editedHeader.companyName}
            onChange={e => handleChange('companyName', e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Document Title</label>
          <Input
            value={editedHeader.documentTitle}
            onChange={e => handleChange('documentTitle', e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Project Number</label>
          <Input
            value={editedHeader.projectNumber}
            onChange={e => handleChange('projectNumber', e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Issue Date</label>
          <Input
            value={editedHeader.issueDate}
            onChange={e => handleChange('issueDate', e.target.value)}
            className="w-full"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          className="h-8 px-3"
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          className="h-8 px-3"
        >
          <Check className="h-4 w-4 mr-1" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}