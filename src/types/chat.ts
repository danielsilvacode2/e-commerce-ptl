export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
}

export interface ChatReplyResponse {
    reply: string;
}

export interface ChatApiEnvelope<T> {
    Response?: { status: number; mensagem: string };
    'Body:'?: T;
    Body?: T;
}
