import ApiUrlBase from '../api';
import { ChatApiEnvelope, ChatReplyResponse } from '@/src/types/chat';

export default async function SendChatMessageService(message: string): Promise<string> {
    const baseUrl = ApiUrlBase();

    const res = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
    });

    if (res.status === 401) {
        throw new Error('401');
    }

    const json = (await res.json().catch(() => null)) as ChatApiEnvelope<ChatReplyResponse> | null;

    if (!res.ok) {
        throw new Error(json?.Response?.mensagem || 'Não foi possível enviar sua mensagem. Tente novamente.');
    }

    const body = json?.['Body:'] ?? json?.Body;
    if (!body?.reply) {
        throw new Error('Resposta inválida do assistente. Tente novamente.');
    }

    return body.reply;
}
