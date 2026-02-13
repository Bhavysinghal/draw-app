'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import '@excalidraw/excalidraw/index.css';
import { RoomChat } from '@/components/RoomChat';
import { useParams } from 'next/navigation';
import { BACKEND_URL, WSS_URL } from '../../../config';

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false }
);

interface CursorPosition {
  x: number;
  y: number;
  clientId: string;
  color: string;
  username: string;
}

export default function CanvasPage() {
  // 1. Get the Slug from the URL
  const params = useParams();
  const roomSlug = params.roomId as string; 
  
  // 2. State for the actual Numeric ID (fetched from backend)
  const [roomId, setRoomId] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const excalidrawAPIRef = useRef<any>(null); 
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clientId = useRef<string>(Math.random().toString(36).slice(2));
  const userColor = useRef<string>(getRandomColor());
  const username = useRef<string>(''); 
  const sendElementsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [remoteCursors, setRemoteCursors] = useState<Record<string, CursorPosition>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // New State for Invite and Save features
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  /* AI STATE (Commented Out) */
  // const [showAIModal, setShowAIModal] = useState(false);
  // const [aiPrompt, setAiPrompt] = useState('');
  // const [aiLoading, setAiLoading] = useState(false);

  // 0. Resolve Slug to Numeric ID
  useEffect(() => {
    if (!roomSlug) return;
    
    fetch(`${BACKEND_URL}/room/${roomSlug}`)
      .then(res => res.json())
      .then(data => {
        if (data.room?.id) {
          setRoomId(data.room.id);
        }
      })
      .catch(e => console.error("Failed to resolve room slug"));
  }, [roomSlug]);

  // 1. Initialize User Data from JWT
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        setCurrentUserId(payload.userId);
        username.current = payload.name || "Anonymous User";
      } catch (e) {
        console.error("Token decode error", e);
      }
    }
  }, []);

// 2. LOAD SNAPSHOT LOG (Using roomSlug)
  useEffect(() => {
    if (!roomSlug) return; // 👈 Now waits for roomSlug, not roomId

    fetch(`${BACKEND_URL}/chats/${roomSlug}`, { // 👈 Changed to roomSlug
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        const history = data.messages || [];
        const allElements: any[] = [];

        history.reverse().forEach((msg: any) => {
          try {
            const parsed = JSON.parse(msg.message); 
            if (Array.isArray(parsed)) {
                allElements.push(...parsed);
            }
          } catch (e) {}
        });

        const syncInitial = () => {
          if (excalidrawAPIRef.current) {
            const currentScene = excalidrawAPIRef.current.getSceneElements();
            const merged = mergeElements(currentScene, allElements);
            excalidrawAPIRef.current.updateScene({ elements: merged });
          } else {
            setTimeout(syncInitial, 200);
          }
        };
        syncInitial();
      })
      .catch(e => console.error("Error loading history:", e));
  }, [roomSlug]); // 👈 Changed dependency

  // 3. WebSocket Lifecycle (Waits for roomId)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !roomId) return;

    const connect = () => {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
        return;
      }

      const ws = new WebSocket(`${WSS_URL}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'join_room', roomId }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'drawing' && data.clientId !== clientId.current) {
            if (excalidrawAPIRef.current) {
              const currentElements = excalidrawAPIRef.current.getSceneElements();
              const merged = mergeElements(currentElements, data.elements);
              excalidrawAPIRef.current.updateScene({ elements: merged });
            }
          }
          if (data.type === 'cursor' && data.clientId !== clientId.current) {
            setRemoteCursors(prev => ({
              ...prev,
              [data.clientId]: {
                x: data.pointer.x,
                y: data.pointer.y,
                clientId: data.clientId,
                color: data.color || '#000000',
                username: data.username, 
              },
            }));
          }
        } catch (e) {}
      };

      ws.onclose = (e) => {
        if (!e.wasClean) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };
    };

    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close(1000, "Unmounted");
    };
  }, [roomId]);

  // 4. Interaction Handlers
  const handleChange = (elements: readonly any[]) => {
    // Added check: Do not send if roomId is not yet resolved
    if (!roomId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    if (sendElementsTimer.current) clearTimeout(sendElementsTimer.current);
    sendElementsTimer.current = setTimeout(() => {
      wsRef.current?.send(JSON.stringify({
        type: 'drawing',
        roomId,
        elements,
        clientId: clientId.current,
      }));
    }, 100);
  };

  const handlePointerUpdate = (payload: any) => {
    // Added check: Do not send if roomId is not yet resolved
    if (!roomId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'cursor',
      clientId: clientId.current,
      roomId,
      pointer: payload.pointer,
      color: userColor.current,
      username: username.current, 
    }));
  };

  // 3. SAVE SNAPSHOT (Using roomSlug)
const handleSaveToServer = async () => {
    console.log("1. Save button clicked!");
    console.log("2. Current roomSlug is:", roomSlug);
    console.log("3. Backend URL is configured as:", BACKEND_URL);

    if (!roomSlug) {
        console.error("❌ ERROR: roomSlug is missing! Check your browser URL.");
        return;
    }
    
    if (!excalidrawAPIRef.current) {
        console.error("❌ ERROR: Excalidraw canvas is not ready!");
        return;
    }

    setSaveStatus('saving');
    const elements = excalidrawAPIRef.current.getSceneElements();
    const targetUrl = `${BACKEND_URL}/chats/${roomSlug}`;
    
    console.log(`4. Attempting to send POST request to: ${targetUrl}`);

    try {
        const response = await fetch(targetUrl, { 
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ message: JSON.stringify(elements) }) 
        });
        
        console.log("5. Backend responded with status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ HTTP Error ${response.status}:`, errorText);
            setSaveStatus('idle');
            return;
        }
        
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
        console.error("❌ Fetch completely failed (Network error or server offline):", e);
        setSaveStatus('idle');
    }
  };
  // Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveToServer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roomId]);

  // Handle Collaborator Invite
  const handleInvite = async () => {
    if (!inviteEmail || !roomId) return;
    setInviteStatus('sending');
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${BACKEND_URL}/rooms/${roomId}/add-collaborator`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `${token}` 
        },
        body: JSON.stringify({ email: inviteEmail })
      });

      if (res.ok) {
        setInviteStatus('sent');
        setTimeout(() => setInviteStatus('idle'), 3000);
        setInviteEmail('');
      } else {
        setInviteStatus('error');
      }
    } catch (e) {
      setInviteStatus('error');
    }
  };

  const handleShare = () => { setShowShare(true); setCopied(false); };
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#f0f0f0]">
      <Excalidraw
        excalidrawAPI={(api) => (excalidrawAPIRef.current = api)}
        theme="light"
        onChange={handleChange}
        onPointerUpdate={handlePointerUpdate}
        UIOptions={{ 
          canvasActions: { loadScene: true, export: { saveFileToDisk: true }, saveAsImage: true },
        }}
      />

      {/* Unified Bottom UI */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
        {/* Last Saved Indicator */}
        {lastSaved && (
          <span className="text-xs text-gray-500 font-medium bg-white/80 px-2 py-0.5 rounded-full shadow-sm">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}

        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-200">
          <button
            onClick={handleSaveToServer}
            disabled={saveStatus === 'saving'}
            className={`text-sm font-semibold rounded-lg px-4 py-1.5 shadow transition-all duration-200 flex items-center gap-2
              ${saveStatus === 'saved' ? 'bg-green-100 text-green-700' : 'bg-slate-900 text-white'}
              ${saveStatus === 'saving' ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'}
            `}
          >
            {saveStatus === 'saving' ? (
              <>Saving...</>
            ) : saveStatus === 'saved' ? (
              <>Saved ✓</>
            ) : (
              <>Save <span className="text-[10px] opacity-60 ml-1">⌘S</span></>
            )}
          </button>

          <button
            onClick={handleShare}
            className="text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg px-4 py-1.5 bg-white hover:bg-slate-50 transition-all shadow-sm"
          >
            Share
          </button>
        </div>
      </div>

      {/* Share Popup */}
      {showShare && (
        <div className="fixed inset-0 bg-black/20 z-[60]" onClick={() => setShowShare(false)}>
          <div 
            className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-2xl p-6 w-[350px]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Share Project</h3>
              <button onClick={() => setShowShare(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* Section 1: Copy Link */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Public Link</label>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={typeof window !== 'undefined' ? window.location.href : ''} 
                  className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 outline-none" 
                />
                <button 
                  onClick={handleCopyLink} 
                  className={`text-sm px-4 py-2 rounded-lg font-medium transition-all ${copied ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="w-full h-px bg-slate-100 my-4" />

            {/* Section 2: Invite Collaborator */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Invite Collaborator</label>
              <div className="flex gap-2">
                <input 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 transition-colors"
                />
                <button 
                  onClick={handleInvite}
                  disabled={inviteStatus === 'sending' || inviteStatus === 'sent'}
                  className={`text-sm px-4 py-2 rounded-lg font-medium text-white transition-all
                    ${inviteStatus === 'sent' ? 'bg-green-500' : inviteStatus === 'error' ? 'bg-red-500' : 'bg-blue-600 hover:bg-blue-700'}
                    ${inviteStatus === 'sending' ? 'opacity-70' : ''}
                  `}
                >
                  {inviteStatus === 'sending' ? '...' : inviteStatus === 'sent' ? 'Sent' : 'Invite'}
                </button>
              </div>
              {inviteStatus === 'sent' && <p className="text-xs text-green-600 mt-2">Invitation sent successfully!</p>}
              {inviteStatus === 'error' && <p className="text-xs text-red-600 mt-2">Failed to send invite.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Cursor Overlay */}
      <div className="absolute inset-0 pointer-events-none z-40">
        {Object.values(remoteCursors).map((cursor) => (
          <div key={cursor.clientId} className="absolute transition-all duration-100 ease-out" style={{ left: cursor.x, top: cursor.y }}>
            <div className="relative">
              <div className="absolute left-4 top-4 whitespace-nowrap px-2 py-1 rounded shadow-md text-[11px] font-bold text-white" style={{ backgroundColor: cursor.color }}>
                {cursor.username}
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" fill={cursor.color} stroke="white" strokeWidth="2"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Wait for roomId before rendering RoomChat to prevent errors */}
      {roomId && <RoomChat roomId={roomId} ws={wsRef.current} currentUserId={currentUserId} />}
    </div>
  );
}

// 4. Helper Function
function mergeElements(existing: any[], incoming: any[]): any[] {
  const map = new Map();
  existing.forEach(el => map.set(el.id, el));
  incoming.forEach(el => {
      const prev = map.get(el.id);
      // If the incoming element is newer (higher version), overwrite
      if (!prev || el.version > prev.version || (el.version === prev.version && el.versionNonce > prev.versionNonce)) {
          map.set(el.id, el);
      }
  });
  return Array.from(map.values()).filter((el: any) => !el.isDeleted);
}

function getRandomColor(): string {
  const colors = ['#FF4C4C', '#4CFF4C', '#4C4CFF', '#FFAA00', '#00CFFF', '#FF00DD', '#7C3AED'];
  return colors[Math.floor(Math.random() * colors.length)];
}