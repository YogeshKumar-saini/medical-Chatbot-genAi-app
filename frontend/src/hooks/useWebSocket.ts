import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
    event: string;
    data: any;
}

interface UseWebSocketOptions {
    groupId: string;
    token: string;
    onMessage?: (message: WebSocketMessage) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Event) => void;
}

export function useWebSocket({
    groupId,
    token,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
}: UseWebSocketOptions) {
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return; // Already connected
        }

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
        const url = `${wsUrl}/api/v1/groups/ws/${groupId}?token=${token}`;

        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log('✅ WebSocket connected');
            setIsConnected(true);
            onConnect?.();
        };

        ws.onmessage = (event) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);

                // Handle special events
                if (message.event === 'online_users') {
                    setOnlineUsers(message.data.users || []);
                }

                // Call user-provided handler
                onMessage?.(message);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        ws.onclose = () => {
            console.log('❌ WebSocket disconnected');
            setIsConnected(false);
            onDisconnect?.();

            // Attempt to reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                console.log('🔄 Attempting to reconnect...');
                connect();
            }, 3000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            onError?.(error);
        };

        wsRef.current = ws;
    }, [groupId, token, onMessage, onConnect, onDisconnect, onError]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        wsRef.current?.close();
        wsRef.current = null;
    }, []);

    const sendMessage = useCallback((content: string, type: string = 'TEXT', replyTo?: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not connected');
            return false;
        }

        wsRef.current.send(JSON.stringify({
            event: 'send_message',
            data: { content, type, reply_to: replyTo }
        }));
        return true;
    }, []);

    const sendTyping = useCallback((isTyping: boolean) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        wsRef.current.send(JSON.stringify({
            event: 'typing',
            data: { is_typing: isTyping }
        }));
    }, []);

    const sendReaction = useCallback((messageId: string, emoji: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return false;
        }

        wsRef.current.send(JSON.stringify({
            event: 'react',
            data: { message_id: messageId, emoji }
        }));
        return true;
    }, []);

    const markAsRead = useCallback((messageId: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        wsRef.current.send(JSON.stringify({
            event: 'read_receipt',
            data: { message_id: messageId }
        }));
    }, []);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    // Heartbeat to keep connection alive
    useEffect(() => {
        if (!isConnected) return;

        const interval = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ event: 'ping' }));
            }
        }, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [isConnected]);

    return {
        isConnected,
        onlineUsers,
        sendMessage,
        sendTyping,
        sendReaction,
        markAsRead,
        reconnect: connect,
        disconnect,
    };
}
