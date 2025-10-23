
import React from 'react';
import { ChatMessage, Role } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatItemProps {
  message: ChatMessage;
}

const ChatItem: React.FC<ChatItemProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const imagePart = message.parts.find(p => p.inlineData);
  const textPart = message.parts.find(p => p.text);

  return (
    <div className={`flex gap-3 my-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          AI
        </div>
      )}
      <div className={`p-3 rounded-lg max-w-sm lg:max-w-md ${isUser ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
        {imagePart?.inlineData && (
          <img 
            src={`data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`} 
            alt="Uploaded content" 
            className="rounded-md max-h-48 mb-2" 
          />
        )}
        {textPart?.text && (
             <ReactMarkdown 
                className="prose prose-sm dark:prose-invert max-w-none"
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside" {...props} />,
                }}
            >
                {textPart.text}
            </ReactMarkdown>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-800 dark:text-gray-200 font-bold text-sm flex-shrink-0">
          You
        </div>
      )}
    </div>
  );
};

export default ChatItem;
