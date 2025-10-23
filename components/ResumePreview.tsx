
import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExportIcon } from './icons';

interface ResumePreviewProps {
  markdown: string;
  onBack: () => void;
  setMarkdown: (markdown: string) => void;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ markdown, onBack, setMarkdown }) => {
  const resumeRef = useRef<HTMLDivElement>(null);
  
  const handleExport = () => {
    const printWindow = window.open('', '', 'height=800,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Resume</title>');
      printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
      printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; } .no-print { display: none; } }</style>');
      printWindow.document.write('</head><body class="font-sans">');
      printWindow.document.write('<div class="p-8">');
      printWindow.document.write(resumeRef.current?.innerHTML || '');
      printWindow.document.write('</div></body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
          printWindow.print();
          printWindow.close();
      }, 250);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center p-4 sm:p-8 pt-20 bg-gray-200 dark:bg-gray-900 overflow-y-auto">
        <div className="w-full max-w-4xl flex justify-between items-center mb-4">
            <button onClick={onBack} className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                &larr; Back to Canvas
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">
                <ExportIcon className="w-5 h-5"/>
                Export as PDF
            </button>
        </div>
        <div 
          ref={resumeRef}
          className="w-full max-w-4xl bg-white dark:bg-gray-800 shadow-2xl p-8 sm:p-12"
          style={{aspectRatio: '8.5 / 11'}}
        >
          <div 
             contentEditable
             suppressContentEditableWarning
             onBlur={e => setMarkdown(e.currentTarget.innerText)}
             className="prose prose-sm dark:prose-invert max-w-none focus:outline-none h-full"
           >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-200" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold border-b-2 border-indigo-500 pb-1 mt-4 mb-2 text-gray-700 dark:text-gray-300" {...props} />,
                p: ({node, ...props}) => <p className="mb-1 leading-normal" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />,
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>
    </div>
  );
};

export default ResumePreview;
