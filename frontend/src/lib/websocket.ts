import { io, Socket } from 'socket.io-client';

class WebSocketClient {
    private socket: Socket | null = null;
    private baseURL: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    }

    connect(groupId: string, token: string): Socket {
        if (this.socket?.connected) {
            return this.socket;
        }

        // WebSocket URL for group chat
        const wsUrl = `${this.baseURL}/api/v1/groups/ws/${groupId}?token=${token}`;

        this.socket = io(wsUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts,
        });

        this.setupEventHandlers();

        return this.socket;
    }

    private setupEventHandlers() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            this.reconnectAttempts++;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
                this.disconnect();
            }
        });

        this.socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }

    sendMessage(event: string, data: any) {
        if (!this.socket?.connected) {
            console.error('WebSocket not connected');
            return;
        }

        this.socket.emit(event, data);
    }

    on(event: string, callback: (data: any) => void) {
        if (!this.socket) return;
        this.socket.on(event, callback);
    }

    off(event: string, callback?: (data: any) => void) {
        if (!this.socket) return;
        this.socket.off(event, callback);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

// Export singleton instance
export const wsClient = new WebSocketClient();
export default wsClient;
