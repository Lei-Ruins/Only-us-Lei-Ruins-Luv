import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Video, 
  VideoOff,
  Mic,
  MicOff,
  MessageSquare, 
  Send, 
  Copy, 
  PhoneOff, 
  Settings2,
  Lock,
  Download,
  Paperclip,
  Trash2,
  Check,
  Sparkles,
  Camera,
  RefreshCw,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import { usePeer } from './hooks/usePeer';
import { useContacts } from './hooks/useContacts';
import { ConnectionStatus } from './types';

export default function App() {
  const {
    myPeerId,
    remotePeerId,
    status,
    messages,
    localStream,
    remoteStream,
    isScreenSharing,
    isAudioMuted,
    isVideoMuted,
    connectToPeer,
    startVideoCall,
    toggleScreenShare,
    toggleAudio,
    toggleVideo,
    startLocalStream,
    sendMessage,
    sendFile,
    endCall,
    reset,
    errorMessage
  } = usePeer();
  
  const { contacts, saveContact, removeContact } = useContacts();
  const isConnected = status === ConnectionStatus.CONNECTED;

  // Simple Portal Entrance State
  const [hasEntered, setHasEntered] = useState(() => {
    return localStorage.getItem('onlyus_entered') === 'true' || localStorage.getItem('leiruins_entered') === 'true';
  });

  // Pre-warm camera immediately once entering the workspace to guarantee symmetrical track states
  useEffect(() => {
    if (hasEntered) {
      startLocalStream().catch(err => {
        console.warn("Camera auto-prewarm blocked or failed by device constraints:", err);
      });
    }
  }, [hasEntered, startLocalStream]);
  
  const [peerIdInput, setPeerIdInput] = useState('');
  const [detectedLinkPeerId, setDetectedLinkPeerId] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [isSelfViewHidden, setIsSelfViewHidden] = useState(false);
  const [isLayoutSwapped, setIsLayoutSwapped] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Callback-based reference hooks...
  const localVideoRef = React.useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      if (localStream) {
        if (node.srcObject !== localStream) {
          node.srcObject = localStream;
        }
        node.play().catch(err => console.warn("Local video play blocked:", err));
      } else {
        node.srcObject = null;
      }
    }
  }, [localStream]);

  const remoteVideoRef = React.useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      if (remoteStream) {
        if (node.srcObject !== remoteStream) {
          node.srcObject = remoteStream;
        }
        node.play().catch(err => console.warn("Remote video play blocked:", err));
      } else {
        node.srcObject = null;
      }
    }
  }, [remoteStream]);

  // Check URL Link parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const peerId = params.get('peer');
    if (peerId && myPeerId) {
      if (peerId !== myPeerId) {
        setDetectedLinkPeerId(peerId);
        setPeerIdInput(peerId);
      }
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.warn("History push/replace error:", e);
      }
    }
  }, [myPeerId]);

  // Save peer as contact once connected to retain link memory
  useEffect(() => {
    if (isConnected && remotePeerId) {
      const exists = contacts.find(c => c.id === remotePeerId);
      if (!exists) {
        saveContact(remotePeerId, `Peer - ${remotePeerId.slice(0, 4)}`);
      }
    }
  }, [isConnected, remotePeerId, contacts, saveContact]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopyInvite = () => {
    if (!myPeerId) return;
    const inviteLink = `\( {window.location.origin} \){window.location.pathname}?peer=${myPeerId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Payload size limits exceeded (Max 10MB).");
        return;
      }
      sendFile(file);
    }
  };

  const executeEnter = async () => {
    localStorage.setItem('onlyus_entered', 'true');
    setHasEntered(true);
    try {
      await startLocalStream();
    } catch (err) {
      console.warn("Lobby entry stream pre-warm failed:", err);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#050406] text-[#E5E1E6] flex flex-col relative overflow-hidden select-none">
      
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.2] pointer-events-none z-0"
        style={{ backgroundImage: `url('/local.jpg')` }}
      />
      <div className="absolute inset-0 bg-[#060508]/95 z-0 pointer-events-none" />

      {/* Header - Added Official Hub Link */}
      <header className="px-6 py-3 border-b border-white/[0.03] bg-neutral-950/20 backdrop-blur-xl flex items-center justify-between z-50 relative shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-serif text-base tracking-[0.25em] uppercase font-bold text-white">OnlyUs</span>
          <span className="w-1 h-1 rounded-full bg-rose-500/90 animate-pulse" />
        </div>

        {hasEntered && (
          <div className="flex items-center gap-4">
            {/* === OFFICIAL HUB LINK (Header) === */}
            <a
              href="https://lei-ruins.github.io/Lei-Ruins-Official-Hub/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium px-3 py-1 border border-white/10 hover:border-white/30 rounded-full text-white/70 hover:text-white transition-all"
            >
              Official Hub
            </a>

            {myPeerId && (
              <button 
                onClick={handleCopyInvite}
                className="text-[9px] uppercase font-mono tracking-widest text-[#E11D48] hover:text-rose-400 transition-colors flex items-center gap-1.5 bg-rose-500/[0.03] px-2 py-1 rounded border border-rose-500/10"
              >
                {copiedNotification ? <Check size={8} className="text-[#34C759]" /> : <Copy size={8} />}
                <span>{copiedNotification ? 'Link Copied' : 'Invite'}</span>
              </button>
            )}

            <button
              onClick={() => {
                localStorage.removeItem('onlyus_entered');
                localStorage.removeItem('leiruins_entered');
                setHasEntered(false);
                endCall();
              }}
              className="text-[8px] font-mono uppercase tracking-[0.15em] text-white/30 hover:text-rose-400 transition-colors"
            >
              Exit
            </button>
          </div>
        )}
      </header>

      {/* Main app space */}
      <main className="flex-1 relative flex flex-col overflow-hidden z-10 w-full max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* ==== STAGE 1: PORTAL ENTRY SCREEN ==== */}
          {!hasEntered ? (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full space-y-8 my-auto"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-rose-950/20 border border-rose-500/15 rounded-xl flex items-center justify-center mx-auto shadow-inner">
                  <Shield size={20} className="text-rose-500" />
                </div>
                
                <h1 className="font-serif text-4xl tracking-[0.1em] text-white font-medium">
                  OnlyUs
                </h1>
                
                <p className="text-xs text-white/45 max-w-xs mx-auto leading-relaxed">
                  Real-time direct transceiver channel. Secure, browser-native direct sync with no cloud interception points.
                </p>
              </div>

              <div className="w-full bg-[#08070a]/90 border border-white/[0.04] p-6 rounded-[1.5rem] space-y-5 text-left shadow-2xl relative">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-rose-400 flex items-center gap-1">
                    <Sparkles size={10} /> Transmission Config
                  </span>
                  <p className="text-[10px] text-white/40">OnlyUs initiates direct client connection pipelines to secure real-time communications.</p>
                </div>

                <div className="border-t border-white/[0.04]" />

                <div className="space-y-3 font-mono text-[10px]">
                  <div className="flex justify-between items-center text-white/60">
                    <span>TRANSMISSION PROTOCOL</span>
                    <span className="text-white font-bold select-all">WEBRTC P2P DIRECT</span>
                  </div>
                  <div className="flex justify-between items-center text-white/60">
                    <span>SECURITY PARADIGM</span>
                    <span className="text-rose-400 font-bold">END-TO-END</span>
                  </div>
                </div>

                {/* === OFFICIAL HUB LINK (Portal Screen) === */}
                <div className="pt-3">
                  <a
                    href="https://lei-ruins.github.io/Lei-Ruins-Official-Hub/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-3 text-sm font-medium border border-white/20 hover:border-white/40 rounded-2xl text-white/80 hover:text-white transition-all hover:bg-white/5"
                  >
                    ← Visit Lei Ruins Official Hub
                  </a>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={executeEnter}
                    className="w-full bg-[#E11D48] hover:bg-[#F43F5E] text-white text-[10px] font-bold uppercase tracking-widest py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98] border border-rose-500/20"
                  >
                    Establish Secure Handshake
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            // ... rest of your code remains unchanged
            <AnimatePresence mode="wait">
              {/* Lobby and Active Chat sections unchanged */}
              {!isConnected ? (
                // ... (lobby code same as before)
                <motion.div key="lobby" ... > ... </motion.div>
              ) : (
                // ... (active chat code same as before)
                <motion.div key="active" ... > ... </motion.div>
              )}
            </AnimatePresence>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
