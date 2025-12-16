import React from 'react';
import Icons from './Icons'; // Assuming Icons is defined in a separate file

const ImageUpload = ({ label, onChange, previewUrl, multiple, accept, subtext }) => (
    <div className="w-full">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
        <label className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 relative overflow-hidden group
            ${previewUrl 
                ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/10 dark:border-indigo-700' 
                : 'border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-indigo-400'
            }`}>
            
            {!previewUrl ? (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 z-10 text-center px-4">
                    <div className="p-3 bg-white dark:bg-gray-700 rounded-full mb-3 text-indigo-500 shadow-sm group-hover:scale-110 group-hover:text-indigo-600 transition-all">
                        <Icons.Upload />
                    </div>
                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-300 font-medium">Click to upload</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{subtext || 'JPG, PNG (Max 5MB)'}</p>
                </div>
            ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <p className="text-white text-sm font-bold bg-white/20 px-4 py-2 rounded-full backdrop-blur-md">Change Image</p>
                    </div>
                </div>
            )}
            <input type="file" className="hidden" onChange={onChange} multiple={multiple} accept={accept} />
        </label>
    </div>
);

export default ImageUpload;