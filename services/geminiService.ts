import { GoogleGenAI, Chat } from '@google/genai';
import { ChatMessage, CanvasItem, CanvasItemType } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. App may not function correctly.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

let chatInstance: Chat | null = null;
let currentModel = '';

function getChat(model: string, systemInstruction: string): Chat {
  if (!chatInstance || currentModel !== model) {
    chatInstance = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    currentModel = model;
  }
  return chatInstance;
}

export async function getChatResponse(
  history: ChatMessage[],
  newMessage: string,
  newFile: { mimeType: string; data: string } | null,
  isThinkingMode: boolean
): Promise<string> {
  const modelName = isThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  const systemInstruction = `你是一个友好、鼓励人的简历写作教练，名叫“简精灵”。帮助用户阐述他们的经历和技能，引导他们建立一份强有力的简历。请始终使用中文与用户交流。`;

  const chat = getChat(modelName, systemInstruction);

  const parts: (string | { inlineData: { mimeType: string; data: string } })[] = [];
  if (newMessage) {
    parts.push(newMessage);
  }
  if (newFile) {
    parts.push({
      inlineData: {
        mimeType: newFile.mimeType,
        data: newFile.data,
      },
    });
  }

  if (parts.length === 0) {
      return "请输入信息或上传文件。";
  }

  const result = await chat.sendMessage({ parts });
  return result.text;
}

export async function generateResume(items: CanvasItem[]): Promise<string> {
  const model = 'gemini-2.5-pro';

  const textItems = items.filter(item => item.type === 'text').map(item => `- ${item.content}`).join('\n');
  const imageItems = items.filter(item => item.type === 'image');

  const prompt = `
你是一位专业的简历撰写专家和文档设计师。你的任务是根据用户提供的非结构化笔记和图片，生成一份专业的简历。

- 分析文本笔记，理解用户的经历、技能和成就。
- 将图片作为他们职位、项目或成就的背景线索。
- 将信息组织成标准的简历模块（如：个人总结、工作经历、教育背景、专业技能）。
- 撰写简洁、以行动为导向的项目符号要点。
- 将整个输出格式化为单一的 Markdown 文本块。不要使用代码块（例如 \`\`\`markdown）。使其看起来像一份真实的简历文档。使用标题、粗体、斜体和项目符号列表来创建一个干净、专业且视觉上吸引人的布局。
- **严格**根据以下提供的笔记信息生成简历。
- **不要**添加任何无法从用户笔记中直接推断出的部分或细节。
- 如果缺少某个标准模块（如教育背景）的信息，请完全省略该模块。你的目标是专业地组织给定的信息，而不是创造新内容。

以下是用户的笔记：
${textItems}

现在请生成简历。
`;
  
  const contents = {
      parts: [
          { text: prompt },
          ...imageItems.map(item => ({
              inlineData: {
                  mimeType: 'image/jpeg', // Assuming jpeg, could be improved
                  data: item.content,
              }
          }))
      ]
  };

  const response = await ai.models.generateContent({
    model: model,
    contents: contents,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
    },
  });

  return response.text;
}


export async function getCanvasSuggestion(newItem: CanvasItem, allItems: CanvasItem[]): Promise<string> {
    const otherItemsContent = allItems
        .filter(item => item.id !== newItem.id && item.type === 'text')
        .map(item => `- ${item.content}`)
        .join('\n');

    const newItemContent = newItem.type === CanvasItemType.TEXT
        ? `一条内容为：“${newItem.content}” 的文本笔记`
        : `一张图片`;

    const prompt = `
    作为一名鼓励型简历教练，用户正在画布上构建他们的简历。他们刚刚添加了${newItemContent}。
    请基于此，提供一个非常简短、有帮助且鼓励人心的建议（最多1-2句话）。你的建议应该帮助他们扩展这个想法，或者思考接下来要添加什么。
    作为参考，这里是他们画布上的其他文本笔记：
    ${otherItemsContent}

    请保持友好和对话式的语气，并使用中文。不要使用 markdown。
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting canvas suggestion:", error);
        return "很棒的开始！继续添加更多细节吧。";
    }
}