import React, { useState, useRef } from 'react';
import { TemplatePicker } from '../src/designer/components/TemplatePicker';

export function TestTemplatePickerPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-2xl font-bold mb-2">Template Picker Test Page</h1>
          <p className="text-gray-600">Testing TemplatePicker component</p>
          {selectedTemplateId && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">Selected Template ID: {selectedTemplateId}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <TemplatePicker
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={setSelectedTemplateId}
          />
        </div>
      </div>
    </div>
  );
}
