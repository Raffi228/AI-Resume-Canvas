
import React from 'react';
import { AddTextIcon, UploadImageIcon, GenerateIcon } from './icons';

interface ToolbarProps {
  onAddText: () => void;
  onUploadImage: () => void;
  onGenerateResume: () => void;
  isGenerating: boolean;
  view: 'canvas' | 'resume';
}

const ToolbarButton: React.FC<React.PropsWithChildren<{ onClick: () => void; disabled?: boolean; label: string }>> = ({ onClick, disabled, label, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
    aria-label={label}
  >
    {children}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const Toolbar: React.FC<ToolbarProps> = ({ onAddText, onUploadImage, onGenerateResume, isGenerating, view }) => {
  if (view === 'resume') {
    return (
      <header className="absolute top-0 left-0 right-0 z-10 p-2 flex justify-center items-center bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm">
         <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Resume Preview & Editor</h1>
      </header>
    );
  }
    
  return (
    <header className="absolute top-0 left-0 right-0 z-10 p-2 flex justify-between items-center bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 px-4">AI Resume Canvas</h1>
      <div className="flex items-center gap-3">
        <ToolbarButton onClick={onAddText} label="Add Note">
          <AddTextIcon className="w-5 h-5" />
        </ToolbarButton>
        <ToolbarButton onClick={onUploadImage} label="Add Image">
          <UploadImageIcon className="w-5 h-5" />
        </ToolbarButton>
        <button
          onClick={onGenerateResume}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-wait transition-all duration-200"
        >
          {isGenerating ? (
            <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
            </>
          ) : (
            <>
              <GenerateIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Generate Resume</span>
              <span className="sm:hidden">Generate</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default Toolbar;
