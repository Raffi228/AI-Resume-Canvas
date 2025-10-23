
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
}

export enum CanvasItemType {
  TEXT = 'text',
  IMAGE = 'image',
}

export interface CanvasItem {
  id: string;
  type: CanvasItemType;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface ChatMessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface ChatMessage {
  role: Role;
  parts: ChatMessagePart[];
}
