import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, CanvasItem } from '../types';
import { fileToBase64 } from '../utils';
import { getCanvasSuggestion } from '../services/geminiService';
import ChatItem from './ChatItem';
import { SendIcon, AttachmentIcon, GenerateIcon, CoachIconIdle, CoachIconThinking, CoachIconSuggesting, CloseIcon } from './icons';

type CoachState = 'idle' | 'thinking' | 'suggesting';

interface CoachProps {
  messages: ChatMessage[];
  onSendMessage: (message: string, file: { mimeType: string, data: string } | null) => void;
  isLoading: boolean;
  isThinkingMode: boolean;
  setIsThinkingMode: (value: boolean) => void;
  canvasItems: CanvasItem[];
  coachPosition: { top: number; left: number } | null;
}

const Coach: React.FC<CoachProps> = ({ messages, onSendMessage, isLoading, isThinkingMode, setIsThinkingMode, canvasItems, coachPosition }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [coachState, setCoachState] = useState<CoachState>('idle');
    const prevItemsRef = useRef<CanvasItem[]>([]);
    const suggestionTimeoutRef = useRef<number | null>(null);
    const debounceTimeoutRef = useRef<number | null>(null);
    
    const [input, setInput] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isLoading) {
            setCoachState('thinking');
        } else if (coachState === 'thinking') {
            setCoachState('idle');
        }
    }, [isLoading, coachState]);

    useEffect(() => {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

        debounceTimeoutRef.current = window.setTimeout(() => {
            if (canvasItems.length > prevItemsRef.current.length) {
                const newItem = canvasItems[canvasItems.length - 1];
                getCanvasSuggestion(newItem, prevItemsRef.current).then(res => {
                    setSuggestion(res);
                    setCoachState('suggesting');
                    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
                    suggestionTimeoutRef.current = window.setTimeout(() => {
                        setSuggestion(null);
                        if (!isLoading) setCoachState('idle');
                    }, 8000);
                });
            }
            prevItemsRef.current = canvasItems;
        }, 1000);

        return () => {
            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        }

    }, [canvasItems, isLoading]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if(isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);
    
    const handleSend = async () => {
        if (input.trim() === '' && !file) return;

        let fileData: { mimeType: string, data: string } | null = null;
        if (file) {
        const base64 = await fileToBase64(file);
        fileData = { mimeType: file.type, data: base64 };
        }

        onSendMessage(input, fileData);
        setInput('');
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
        }
    };
    
    const openChat = () => {
        setIsOpen(true);
        if (coachState === 'suggesting') {
           if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
           setSuggestion(null);
           if (!isLoading) setCoachState('idle');
        }
    }

    const getCoachIcon = () => {
        const iconClass = "w-8 h-8 text-white";
        switch (coachState) {
            case 'thinking': return <CoachIconThinking className={iconClass} />;
            case 'suggesting': return <CoachIconSuggesting className={iconClass} />;
            default: return <CoachIconIdle className={iconClass} />;
        }
    }

    const positionStyle = coachPosition 
        ? { top: `${coachPosition.top}px`, left: `${coachPosition.left}px`, bottom: 'auto', right: 'auto' }
        : { bottom: '1.5rem', right: '1.5rem' };
    
    return (
        <>
            <div 
                className={`fixed z-40 w-full max-w-sm h-[70vh] max-h-[600px] shadow-2xl rounded-lg transition-all duration-300 ease-in-out origin-bottom-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
            >
               <div className="bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full w-full rounded-lg">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">AI教练-简精灵</h2>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">深度思考模式</span>
                            <button
                                onClick={() => setIsThinkingMode(!isThinkingMode)}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isThinkingMode ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isThinkingMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 transition-opacity duration-300 ${isThinkingMode ? 'opacity-100' : 'opacity-0 h-4'}`}>
                            <GenerateIcon className="w-3 h-3 inline-block mr-1"/>
                            使用更强大的模型来处理复杂问题。
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {messages.map((msg, index) => (
                        <ChatItem key={index} message={msg} />
                        ))}
                        {isLoading && (
                            <div className="flex justify-start my-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                  AI
                                </div>
                                <div className="p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 ml-3">
                                    <div className="flex items-center space-x-1">
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse-fast"></span>
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse-medium"></span>
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse-slow"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-lg">
                        {file && (
                            <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-300 flex justify-between items-center">
                                <span>{file.name}</span>
                                <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700">&times;</button>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*,application/pdf"
                        />
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400">
                            <AttachmentIcon className="w-6 h-6" />
                        </button>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                            }}
                            placeholder="咨询你的教练..."
                            className="flex-1 bg-gray-100 dark:bg-gray-700 border-transparent rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            rows={1}
                        />
                        <button onClick={handleSend} disabled={isLoading} className="p-2 text-white bg-indigo-600 rounded-full hover:bg-indigo-700 disabled:bg-indigo-400">
                            <SendIcon className="w-5 h-5" />
                        </button>
                        </div>
                    </div>
                </div>
            </div>

            <div 
                className="fixed z-50 transition-all duration-500 ease-in-out"
                style={positionStyle}
            >
                {suggestion && !isOpen && (
                    <div className={`absolute bottom-full mb-2 w-64 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-3 rounded-lg shadow-lg animate-fade-in-up ${coachPosition ? 'right-0' : 'right-0'}`}>
                        <p className="text-sm">{suggestion}</p>
                        <div className={`absolute -bottom-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white dark:border-t-gray-700 ${coachPosition ? 'left-4' : 'right-4'}`}></div>
                    </div>
                )}
                <button
                    onClick={() => isOpen ? setIsOpen(false) : openChat()}
                    className="w-16 h-16 bg-indigo-600 rounded-full shadow-xl hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 flex items-center justify-center transition-all transform hover:scale-110 duration-200"
                    aria-label={isOpen ? "关闭AI教练" : "打开AI教练"}
                >
                    <span className={`absolute inset-0 rounded-full ${coachState === 'suggesting' ? 'animate-pulse-strong' : ''}`}></span>
                    <div className="transform transition-transform duration-300 ease-in-out" style={{ transform: isOpen ? 'rotate(45deg) scale(0.8)' : 'rotate(0deg) scale(1)'}}>
                        {isOpen ? <CloseIcon className="w-8 h-8 text-white" /> : getCoachIcon()}
                    </div>
                </button>
            </div>
             <style>{`
                .animate-pulse-fast { animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                .animate-pulse-medium { animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) 200ms infinite; }
                .animate-pulse-slow { animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) 400ms infinite; }
                .animate-pulse-strong { animation: pulse-strong 2s infinite; }
                @keyframes pulse-strong {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
            `}</style>
        </>
    );
};

export default Coach;