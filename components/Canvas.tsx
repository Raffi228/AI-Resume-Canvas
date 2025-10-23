import React, { useState } from 'react';
import { CanvasItem } from '../types';
import DraggableItem from './DraggableItem';

interface CanvasProps {
  items: CanvasItem[];
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
  onUpdateContent: (id: string, content: string) => void;
  onResize: (id: string, size: { width: number, height: number}) => void;
  onDropItem: (file: File, position: { x: number; y: number }) => void;
  onActivateItem: (id: string, rect: DOMRect) => void;
  onDeactivateItem: (id: string) => void;
}

const Canvas: React.FC<CanvasProps> = ({ items, onUpdatePosition, onUpdateContent, onResize, onDropItem, onActivateItem, onDeactivateItem }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const position = { x: e.clientX, y: e.clientY };
      onDropItem(file, position);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div 
        className={`flex-1 w-full h-full relative overflow-auto bg-dots pt-16 transition-all duration-300 ${isDraggingOver ? 'border-4 border-dashed border-indigo-400' : 'border-4 border-transparent'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
       <style>{`
          .bg-dots {
            background-image: radial-gradient(circle at 1px 1px, hsla(0,0%,70%,.5) 1px, transparent 0);
            background-size: 20px 20px;
          }
          .dark .bg-dots {
            background-image: radial-gradient(circle at 1px 1px, hsla(0,0%,50%,.3) 1px, transparent 0);
          }
        `}</style>
      
      {isDraggingOver && (
        <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center pointer-events-none">
          <p className="text-xl font-semibold text-indigo-600 dark:text-indigo-300 bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-lg">在此处放置图片</p>
        </div>
      )}

      {items.length === 0 && !isDraggingOver && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-500 dark:text-gray-400">
              <h2 className="text-2xl font-semibold">你的画布已准备就绪。</h2>
              <p className="mt-2">使用工具栏添加笔记或拖放图片。</p>
          </div>
      )}

      {items.map((item) => (
        <DraggableItem
          key={item.id}
          item={item}
          onUpdatePosition={onUpdatePosition}
          onUpdateContent={onUpdateContent}
          onResize={onResize}
          onActivate={onActivateItem}
          onDeactivate={onDeactivateItem}
        />
      ))}
    </div>
  );
};

export default Canvas;