import React, { useState, useRef, useEffect } from 'react';
import { CanvasItem, CanvasItemType } from '../types';

interface DraggableItemProps {
  item: CanvasItem;
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
  onUpdateContent: (id: string, content: string) => void;
  onResize: (id: string, size: { width: number; height: number }) => void;
  onActivate: (id: string, rect: DOMRect) => void;
  onDeactivate: (id: string) => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ item, onUpdatePosition, onUpdateContent, onResize, onActivate, onDeactivate }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const itemRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.resize-handle') || (e.target as HTMLElement).closest('textarea')) {
        return;
    }
    e.preventDefault();
    setIsDragging(true);
    const rect = itemRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onUpdatePosition(item.id, {
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
      if (isResizing && itemRef.current) {
         const rect = itemRef.current.parentElement?.getBoundingClientRect();
         if (rect) {
            const newWidth = e.clientX - item.position.x - rect.left;
            const newHeight = e.clientY - item.position.y - rect.top;
            onResize(item.id, { width: Math.max(150, newWidth), height: Math.max(100, newHeight) });
         }
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, item.id, item.position, onUpdatePosition, onResize]);

  const handleFocus = () => {
      if (itemRef.current) {
          onActivate(item.id, itemRef.current.getBoundingClientRect());
      }
  };

  const handleBlur = () => {
      onDeactivate(item.id);
  };

  return (
    <div
      ref={itemRef}
      className="absolute bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 flex flex-col cursor-grab focus:cursor-grabbing transition-shadow duration-200"
      style={{
        left: `${item.position.x}px`,
        top: `${item.position.y}px`,
        width: `${item.size.width}px`,
        height: `${item.size.height}px`,
        boxShadow: isDragging ? '0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -2px rgba(0,0,0,0.1)' : '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)'
      }}
      onMouseDown={handleMouseDown}
    >
      {item.type === CanvasItemType.TEXT ? (
        <textarea
          value={item.content}
          onChange={(e) => onUpdateContent(item.id, e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full h-full bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none resize-none"
          placeholder="Write anything..."
        />
      ) : (
        <img src={`data:image/png;base64,${item.content}`} alt="canvas item" className="w-full h-full object-contain" />
      )}
      <div 
        className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeMouseDown}
      >
        <svg className="w-full h-full text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19l14-14M19 19l-7-7"></path>
        </svg>
      </div>
    </div>
  );
};

export default DraggableItem;