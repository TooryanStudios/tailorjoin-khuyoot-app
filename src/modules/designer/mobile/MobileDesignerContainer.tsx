import React from 'react';
import { Upload, Wand2 } from 'lucide-react';

interface ModelOption {
  id: string;
  name: string;
  thumbnailUrl: string;
}

interface MobileDesignerContainerProps {
  previewImage: string;
  isProcessing: boolean;
  models: ModelOption[];
  selectedModelId?: string;
  onSelectModel: (id: string) => void;
  fabricImage?: string;
  onFabricUpload: (file: File) => void;
  onGenerate: () => void;
  canGenerate: boolean;
}

export function MobileDesignerContainer({
  previewImage,
  isProcessing,
  models,
  selectedModelId,
  onSelectModel,
  fabricImage,
  onFabricUpload,
  onGenerate,
  canGenerate,
}: MobileDesignerContainerProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFabricUpload(file);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-200">
      {/* Header */}
      <div className="border-b border-zinc-800 p-4">
        <h1 className="text-lg font-bold text-white">Designer V2.1</h1>
        <p className="text-xs text-zinc-500">Fabric Swap (Mobile)</p>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Result Preview */}
        <div className="relative w-full aspect-[3/4] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
          {previewImage ? (
            <img
              src={previewImage}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
              <p className="text-sm">No preview available</p>
            </div>
          )}
          
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                <p className="text-sm text-white">Processing...</p>
              </div>
            </div>
          )}
        </div>

        {/* Model Selection */}
        {models.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-2">Model / Template</h3>
            <div className="grid grid-cols-3 gap-2">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => onSelectModel(model.id)}
                  className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                    selectedModelId === model.id
                      ? 'border-blue-500 ring-2 ring-blue-500/50'
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {model.thumbnailUrl ? (
                    <img
                      src={model.thumbnailUrl}
                      alt={model.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <span className="text-xs text-zinc-500">No preview</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fabric Upload */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-400 mb-2">Fabric</h3>
          <div className="relative">
            {fabricImage ? (
              <div className="relative w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                <img
                  src={fabricImage}
                  alt="Fabric"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-600 bg-zinc-900/50">
                <Upload className="w-8 h-8 text-zinc-600 mb-2" />
                <span className="text-sm text-zinc-500">Upload Fabric</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
