"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { getStoredUser } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Permission = "editor" | "viewer";

export interface Collaborator {
    socketId: string;
    userId: string;
    displayName: string;
    email?: string;
    color: string;
    role: Permission;
}

export interface CursorPosition {
    x: number;   // canvas-relative X
    y: number;   // canvas-relative Y
}

export interface CollabCursor extends Collaborator {
    position: CursorPosition;
}

export interface CanvasChangePayload {
    type: "nodes_change" | "selection_change";
    json?: string;
    selectedIds?: string[];
    [key: string]: unknown;
}

// Stable color palette for self-assignment
const COLLAB_COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
    "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
];

function pickColor(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface CollaborationContextValue {
    /** Connected collaborators (excluding self) */
    collaborators: Collaborator[];
    /** Cursors of other collaborators, keyed by socketId */
    cursors: Record<string, CollabCursor>;
    /** Whether the socket is connected */
    connected: boolean;
    /** The current user's assigned color */
    myColor: string;
    /** The current user's assigned role */
    myPermission: Permission;
    /** The socket instance */
    socket: Socket | null;
    /** Emit a cursor move event */
    emitCursorMove: (pos: CursorPosition) => void;
    /** Emit a canvas change event */
    emitCanvasChange: (payload: CanvasChangePayload) => void;
    /** Emit a selection change */
    emitSelectionChange: (selectedIds: string[]) => void;
    /** Callback when a remote canvas change arrives */
    onRemoteCanvasChange?: ((payload: CanvasChangePayload & { userId: string; displayName: string; color: string }) => void) | null;
    setOnRemoteCanvasChange: (cb: ((payload: CanvasChangePayload & { userId: string; displayName: string; color: string }) => void) | null) => void;
}

const CollaborationContext = createContext<CollaborationContextValue>({
    collaborators: [],
    cursors: {},
    connected: false,
    myColor: "#6c8fff",
    myPermission: "editor",
    socket: null,
    emitCursorMove: () => { },
    emitCanvasChange: () => { },
    emitSelectionChange: () => { },
    onRemoteCanvasChange: null,
    setOnRemoteCanvasChange: () => { },
});

// ─── Provider ─────────────────────────────────────────────────────────────────
interface Props {
    projectId: string;
    permission?: Permission;
    children: React.ReactNode;
}

export function CollaborationProvider({ projectId, permission = "editor", children }: Props) {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [cursors, setCursors] = useState<Record<string, CollabCursor>>({});
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const remoteChangeCallbackRef = useRef<((payload: CanvasChangePayload & { userId: string; displayName: string; color: string }) => void) | null>(null);

    // Derive self from stored user
    const user = getStoredUser();
    const userId = user?.id || "anon";
    const displayName = user?.name || user?.username || user?.email?.split("@")[0] || "Guest";
    const myColor = pickColor(userId);
    const myPermission = permission;

    useEffect(() => {
        const BACKEND = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api$/, "");

        console.log("[Collab] Connecting to", BACKEND, "for project", projectId);

        const socket = io(BACKEND, {
            path: "/socket.io",
            transports: ["polling", "websocket"],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("[Collab] Socket connected, id:", socket.id);
            setConnected(true);
            socket.emit("collab:join", {
                projectId,
                userId,
                displayName,
                email: user?.email || "",
                color: myColor,
                role: permission,
            });
        });

        socket.on("connect_error", (err) => {
            console.warn("[Collab] Socket connect_error:", err.message);
        });

        socket.on("disconnect", (reason) => {
            console.log("[Collab] Socket disconnected:", reason);
            setConnected(false);
        });

        // Receive full presence list on join
        socket.on("collab:presence_list", (list: Collaborator[]) => {
            console.log("[Collab] Presence list received:", list.length, "users");
            setCollaborators(list.filter(c => c.socketId !== socket.id));
        });

        // A new user joined
        socket.on("collab:user_joined", (user: Collaborator) => {
            if (user.socketId === socket.id) return;
            setCollaborators(prev => {
                if (prev.find(c => c.socketId === user.socketId)) return prev;
                return [...prev, user];
            });
        });

        // A user left
        socket.on("collab:user_left", ({ socketId }: { socketId: string; userId?: string }) => {
            setCollaborators(prev => prev.filter(c => c.socketId !== socketId));
            setCursors(prev => {
                const next = { ...prev };
                delete next[socketId];
                return next;
            });
        });

        // Remote cursor movement
        socket.on("collab:cursor_move", (data: CollabCursor & { socketId: string; position: CursorPosition }) => {
            if (!data.socketId || data.socketId === socket.id) return;
            setCursors(prev => ({
                ...prev,
                [data.socketId]: {
                    socketId: data.socketId,
                    userId: data.userId,
                    displayName: data.displayName,
                    email: data.email,
                    color: data.color,
                    role: data.role || "editor",
                    position: data.position,
                },
            }));
        });

        // Remote canvas change
        socket.on("collab:canvas_change", (data: CanvasChangePayload & { userId: string; displayName: string; color: string; socketId: string }) => {
            if (data.socketId === socket.id) return;
            console.log("[Collab] Received canvas_change from", data.displayName, "type:", data.type, "hasJson:", !!data.json);
            if (remoteChangeCallbackRef.current) {
                remoteChangeCallbackRef.current(data);
            } else {
                console.warn("[Collab] No remoteChangeCallback registered — CollabSyncHandler might not be mounted");
            }
        });

        return () => {
            socket.emit("collab:leave");
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
            setCollaborators([]);
            setCursors({});
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, userId, displayName, permission]);

    const emitCursorMove = useCallback((pos: CursorPosition) => {
        socketRef.current?.emit("collab:cursor_move", { position: pos });
    }, []);

    const emitCanvasChange = useCallback((payload: CanvasChangePayload) => {
        if (permission !== "editor") return;
        if (!socketRef.current?.connected) {
            console.warn("[Collab] emitCanvasChange skipped — socket not connected");
            return;
        }
        console.log("[Collab] Emitting canvas_change, type:", payload.type, "hasJson:", !!payload.json);
        socketRef.current.emit("collab:canvas_change", payload);
    }, [permission]);

    const emitSelectionChange = useCallback((selectedIds: string[]) => {
        socketRef.current?.emit("collab:selection_change", { selectedIds });
    }, []);

    const setOnRemoteCanvasChange = useCallback(
        (cb: ((payload: CanvasChangePayload & { userId: string; displayName: string; color: string }) => void) | null) => {
            remoteChangeCallbackRef.current = cb;
        },
        []
    );

    return (
        <CollaborationContext.Provider
            value={{
                collaborators,
                cursors,
                connected,
                myColor,
                myPermission,
                socket: socketRef.current,
                emitCursorMove,
                emitCanvasChange,
                emitSelectionChange,
                onRemoteCanvasChange: null,
                setOnRemoteCanvasChange,
            }}
        >
            {children}
        </CollaborationContext.Provider>
    );
}

export function useCollaboration() {
    return useContext(CollaborationContext);
}
