import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CanvasItem, ChatMessage, Role, CanvasItemType, ChatMessagePart } from './types';
import { generateResume, getChatResponse } from './services/geminiService';
import { fileToBase64 } from './utils';
import Canvas from './components/Canvas';
import ResumePreview from './components/ResumePreview';
import Toolbar from './components/Toolbar';
import Coach from './components/Coach';

const App: React.FC = () => {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: Role.MODEL,
      parts: [{ text: "你好！我是你的AI简历教练“简精灵”。把你的想法、经历，甚至是图片拖到画布上，我来帮你打造一份完美的简历。我们先从哪里开始呢？" }],
    },
  ]);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'canvas' | 'resume'>('canvas');
  const [generatedResume, setGeneratedResume] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [coachPosition, setCoachPosition] = useState<{ top: number; left: number } | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateItemPosition = useCallback((id: string, position: { x: number; y: number }) => {
    setCanvasItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, position } : item))
    );
  }, []);

  const handleUpdateItemContent = useCallback((id: string, content: string) => {
    setCanvasItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, content } : item))
    );
  }, []);
  
  const handleResizeItem = useCallback((id: string, size: { width: number; height: number }) => {
    setCanvasItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, size } : item))
    );
  }, []);

  const addCanvasItem = (type: CanvasItemType, content: string, position?: {x: number, y: number}) => {
    const newItem: CanvasItem = {
      id: `item-${Date.now()}`,
      type,
      content,
      position: position || { x: 50, y: 50 },
      size: type === CanvasItemType.TEXT ? { width: 250, height: 150 } : { width: 300, height: 200 },
    };
    setCanvasItems((prev) => [...prev, newItem]);
  };

  const handleAddText = () => {
    addCanvasItem(CanvasItemType.TEXT, '新的笔记...');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await fileToBase64(file);
      addCanvasItem(CanvasItemType.IMAGE, base64);
    }
  };
  
  const handleCanvasDrop = async (file: File, position: { x: number; y: number }) => {
    if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        addCanvasItem(CanvasItemType.IMAGE, base64, position);
    }
  };

  const handleSendMessage = async (message: string, file: { mimeType: string, data: string } | null) => {
    setIsLoading(true);
    setError(null);
    
    const parts: ChatMessagePart[] = [];
    if (message.trim()) {
      parts.push({ text: message });
    }
    if (file) {
      parts.push({ inlineData: file });
    }

    if (parts.length === 0) {
      setIsLoading(false);
      return;
    }

    const userMessage: ChatMessage = {
      role: Role.USER,
      parts,
    };

    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);

    try {
      const responseText = await getChatResponse(newMessages, message, file, isThinkingMode);
      setChatMessages((prev) => [...prev, { role: Role.MODEL, parts: [{ text: responseText }] }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发生未知错误。';
      setError(`获取回复失败: ${errorMessage}`);
      setChatMessages((prev) => [...prev, { role: Role.MODEL, parts: [{ text: `抱歉，我遇到了一个错误。请再试一次。 ${errorMessage}` }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateResume = async () => {
    if (canvasItems.length === 0) {
      setError("画布是空的，请先添加一些笔记或图片！");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const resumeMarkdown = await generateResume(canvasItems);
      setGeneratedResume(resumeMarkdown);
      setView('resume');
    } catch (err) {
       const errorMessage = err instanceof Error ? err.message : '发生未知错误。';
       setError(`生成简历失败: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateItem = (id: string, rect: DOMRect) => {
    setActiveItemId(id);
    setCoachPosition({ top: rect.top, left: rect.right + 15 });
  };
  
  const handleDeactivateItem = (id: string) => {
    if(activeItemId === id) {
        setActiveItemId(null);
        setCoachPosition(null);
    }
  };
  
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="flex h-screen w-screen font-sans text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <main className="flex-1 flex flex-col relative">
        <Toolbar
          onAddText={handleAddText}
          onUploadImage={() => imageInputRef.current?.click()}
          onGenerateResume={handleGenerateResume}
          isGenerating={isLoading && view === 'canvas'}
          view={view}
        />
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        {error && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50">
                {error}
            </div>
        )}

        {view === 'canvas' ? (
          <Canvas
            items={canvasItems}
            onUpdatePosition={handleUpdateItemPosition}
            onUpdateContent={handleUpdateItemContent}
            onResize={handleResizeItem}
            onDropItem={handleCanvasDrop}
            onActivateItem={handleActivateItem}
            onDeactivateItem={handleDeactivateItem}
          />
        ) : (
          <ResumePreview
            markdown={generatedResume}
            onBack={() => setView('canvas')}
            setMarkdown={setGeneratedResume}
          />
        )}
      </main>

      <Coach
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isThinkingMode={isThinkingMode}
        setIsThinkingMode={setIsThinkingMode}
        canvasItems={canvasItems}
        coachPosition={coachPosition}
      />
    </div>
  );
};

export default App;