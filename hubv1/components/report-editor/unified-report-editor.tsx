import React, { useState, useCallback, useEffect } from 'react';
import { HeaderEditor } from './header-editor';
import { PageRenderer } from './page-renderer';
import { DocumentEditor } from '../document-editor/document-editor';
import { PhotoGrid } from '../photo-grid/photo-grid';
import { DocumentData, ReportData } from './types';
import { processDocumentData, mergeDocumentData } from './utils';

interface UnifiedReportEditorProps {
  initialData?: ReportData;
  onSave?: (data: ReportData) => void;
  readOnly?: boolean;
}

export const UnifiedReportEditor: React.FC<UnifiedReportEditorProps> = ({
  initialData,
  onSave,
  readOnly = false,
}) => {
  const [reportData, setReportData] = useState<ReportData>(initialData || {
    header: {},
    document: { blocks: [] },
    photos: [],
  });

  // Handle header updates
  const handleHeaderChange = useCallback((headerData: any) => {
    setReportData(prev => ({
      ...prev,
      header: headerData,
    }));
  }, []);

  // Handle document editor updates
  const handleDocumentChange = useCallback((documentData: DocumentData) => {
    setReportData(prev => ({
      ...prev,
      document: documentData,
    }));
  }, []);

  // Handle photo grid updates
  const handlePhotosChange = useCallback((photos: any[]) => {
    setReportData(prev => ({
      ...prev,
      photos: photos,
    }));
  }, []);

  // Save report data when changes occur
  useEffect(() => {
    if (onSave && !readOnly) {
      const timeoutId = setTimeout(() => {
        onSave(reportData);
      }, 500); // Debounce save operations
      
      return () => clearTimeout(timeoutId);
    }
  }, [reportData, onSave, readOnly]);

  return (
    <div className="unified-report-editor">
      <HeaderEditor 
        data={reportData.header} 
        onChange={handleHeaderChange}
        readOnly={readOnly}
      />
      
      <div className="editor-content-container">
        <DocumentEditor 
          initialData={reportData.document}
          onChange={handleDocumentChange}
          readOnly={readOnly}
        />
      </div>
      
      <div className="photo-grid-container">
        <PhotoGrid 
          photos={reportData.photos}
          onChange={handlePhotosChange}
          readOnly={readOnly}
        />
      </div>
      
      <div className="page-preview">
        <PageRenderer data={reportData} />
      </div>
    </div>
  );
};

export default UnifiedReportEditor;