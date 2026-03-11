/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Phone, Video, Settings, User, Search, 
  MoreVertical, Send, Smile, Paperclip, Mic, LogOut, 
  Plus, X, PhoneOff, VideoOff, Check, CheckCheck, 
  Menu, Moon, Sun, Pin, Trash2, Edit2, Reply, 
  File, Image as ImageIcon, Hash, Users, Radio, 
  ChevronLeft, ChevronRight, Camera, Info, Palette,
  Lock, Shield, ArrowLeft
} from 'lucide-react';
import { cn, formatTime, formatDate, formatFileSize } from './utils';
import { User as AppUser, Chat, Message, Call, Bot } from './types';
import AdminDashboard from './components/AdminDashboard';
import socket from './services/socket';
import { api } from './services/api';

// --- Components ---

const Login = ({ onLogin }: { onLogin: (user: any, token: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const data = mode === 'register' 
        ? { email, password, displayName, username: username || email.split('@')[0] }
        : { email, password };
      
      const res = await api.post(endpoint, data);
      onLogin(res.user, res.token);
    } catch (err: any) {
      let message = 'Authentication failed';
      try {
        // Try to parse as JSON first
        const errorData = JSON.parse(err.message);
        message = errorData.error || message;
      } catch {
        // If not JSON, check if it's HTML (likely a proxy error)
        if (err.message.includes('<html') || err.message.includes('<!DOCTYPE')) {
          message = 'Server error (Proxy/Network). Please ensure you are using the correct App URL.';
        } else {
          message = err.message || message;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    setError('');
    try {
      await api.post('/auth/otp-request', { phoneNumber: phone });
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    try {
      const res = await api.post('/auth/otp-verify', { phoneNumber: phone, code: otp });
      onLogin(res.user, res.token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError('Google login is temporarily disabled. Please use Email or Phone.');
  };

  return (
    <div className="h-screen bg-[#f4f4f5] dark:bg-[#1c1c1c] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-[#212121] p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border border-gray-100 dark:border-white/5 my-8"
      >
        <div className="w-20 h-20 bg-[#2481cc] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transform rotate-12">
          <Send className="w-10 h-10 text-white -rotate-12" />
        </div>
        <h1 className="text-3xl font-bold text-[#1c1c1c] dark:text-white mb-2">TelePro</h1>
        <p className="text-[#707579] mb-8 text-base leading-relaxed">
          {mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create an account to get started.'}
        </p>
        
        <div id="recaptcha-container"></div>

        <div className="flex bg-gray-100 dark:bg-[#1c1c1c] p-1 rounded-xl mb-6">
          <button 
            onClick={() => setMethod('email')}
            className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", method === 'email' ? "bg-white dark:bg-[#2d2d2d] shadow-sm text-[#2481cc]" : "text-[#707579]")}
          >
            Email
          </button>
          <button 
            onClick={() => setMethod('phone')}
            className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", method === 'phone' ? "bg-white dark:bg-[#2d2d2d] shadow-sm text-[#2481cc]" : "text-[#707579]")}
          >
            Phone
          </button>
        </div>

        {method === 'email' ? (
          <div className="space-y-4">
            {mode === 'register' && (
              <input
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#f4f4f5] dark:bg-[#1c1c1c] border-2 border-transparent focus:border-[#2481cc] outline-none rounded-xl py-3 px-5 text-base transition-all dark:text-white"
              />
            )}
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#f4f4f5] dark:bg-[#1c1c1c] border-2 border-transparent focus:border-[#2481cc] outline-none rounded-xl py-3 px-5 text-base transition-all dark:text-white"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#f4f4f5] dark:bg-[#1c1c1c] border-2 border-transparent focus:border-[#2481cc] outline-none rounded-xl py-3 px-5 text-base transition-all dark:text-white"
            />
            <button
              onClick={handleEmailAuth}
              disabled={loading}
              className={cn(
                "w-full bg-[#2481cc] hover:bg-[#1c68a6] text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2",
                loading && "opacity-70 cursor-not-allowed"
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
            <p className="text-sm text-[#707579]">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-[#2481cc] font-bold hover:underline"
              >
                {mode === 'login' ? 'Register' : 'Login'}
              </button>
            </p>
          </div>
        ) : (
          step === 'phone' ? (
            <div className="space-y-4">
              <input
                type="tel"
                placeholder="Phone Number (e.g. +1234567890)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#f4f4f5] dark:bg-[#1c1c1c] border-2 border-transparent focus:border-[#2481cc] outline-none rounded-xl py-3 px-5 text-base transition-all dark:text-white"
              />
              <button
                onClick={handlePhoneLogin}
                className="w-full bg-[#2481cc] hover:bg-[#1c68a6] text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
              >
                Continue with Phone
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Verification Code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-[#f4f4f5] dark:bg-[#1c1c1c] border-2 border-transparent focus:border-[#2481cc] outline-none rounded-xl py-3 px-5 text-base transition-all dark:text-white text-center tracking-widest"
              />
              <button
                onClick={handleVerifyOtp}
                className="w-full bg-[#2481cc] hover:bg-[#1c68a6] text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
              >
                Verify Code
              </button>
              <button
                onClick={() => setStep('phone')}
                className="w-full text-[#2481cc] font-bold py-2 hover:underline transition-all"
              >
                Change Phone Number
              </button>
            </div>
          )
        )}

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
          <span className="text-xs text-[#707579] font-bold uppercase">OR</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white dark:bg-[#1c1c1c] hover:bg-gray-50 dark:hover:bg-white/5 text-[#1c1c1c] dark:text-white font-bold py-3 rounded-xl transition-all shadow-md border border-gray-200 dark:border-white/10 flex items-center justify-center gap-3 active:scale-95"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Sign in with Google
        </button>

        {error && <p className="text-red-500 mt-4 text-sm bg-red-50 dark:bg-red-900/10 p-2 rounded-lg">{error}</p>}
        
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/20">
          <p className="text-xs font-bold text-[#2481cc] uppercase mb-1">Admin Access</p>
          <p className="text-xs text-[#707579]">Email: <span className="font-mono font-bold">admin@telepro.com</span></p>
          <p className="text-xs text-[#707579]">Pass: <span className="font-mono font-bold">admin123</span></p>
          <p className="text-[10px] text-[#707579] mt-2 italic">* Or click your avatar 5 times in the sidebar after login.</p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
          <p className="text-[10px] text-[#707579]">
            Running on <span className="font-bold">Cloud Run</span>. 
            Note: This app requires a persistent backend and will not work on static hosts like Netlify.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeFolder, setActiveFolder] = useState('All');
  const [isSecretChatMode, setIsSecretChatMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [themeColor, setThemeColor] = useState('#2481cc');
  const [typingUsers, setTypingUsers] = useState<{ [chatId: string]: string[] }>({});
  const [logoClicks, setLogoClicks] = useState(0);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  const handleLogoClick = async () => {
    setLogoClicks(prev => {
      const next = prev + 1;
      if (next >= 5) {
        if (user) {
          const updatedUser = { ...user, role: 'admin' as const };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          api.post('/admin/promote', {}).catch(console.error);
        }
        return 0;
      }
      return next;
    });
  };

  useEffect(() => {
    if (activeChat) setShowChatOnMobile(true);
  }, [activeChat]);
  
  const filteredUsers = users.filter(u => 
    u.uid !== user?.uid && 
    (u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth & Initial Data
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      socket.connect();
      socket.emit('authenticate', token);
      fetchInitialData();
    } else {
      setLoading(false);
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const [chatsData, usersData] = await Promise.all([
        api.get('/chats'),
        api.get('/users')
      ]);
      setChats(chatsData);
      setUsers(usersData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleLogin = (user: AppUser, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    socket.connect();
    socket.emit('authenticate', token);
    fetchInitialData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    socket.disconnect();
  };

  // Socket Listeners
  useEffect(() => {
    if (!user) return;

    socket.on('new_message', (message: Message) => {
      if (activeChat && message.chatId === activeChat.id) {
        setMessages(prev => [...prev, message]);
      }
      // Update last message in chats list
      setChats(prev => prev.map(c => 
        c.id === message.chatId ? { ...c, lastMessage: message, updatedAt: message.timestamp } : c
      ));
    });

    socket.on('user_status', ({ userId, status, lastSeen }) => {
      setUsers(prev => prev.map(u => 
        u.uid === userId ? { ...u, status, lastSeen } : u
      ));
    });

    socket.on('user_typing', ({ chatId, userId, isTyping }) => {
      setTypingUsers(prev => {
        const current = prev[chatId] || [];
        if (isTyping) {
          if (!current.includes(userId)) return { ...prev, [chatId]: [...current, userId] };
        } else {
          return { ...prev, [chatId]: current.filter(id => id !== userId) };
        }
        return prev;
      });
    });

    socket.on('message_updated', (updatedMsg: Message) => {
      setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      setChats(prev => prev.map(c => {
        if (c.id === updatedMsg.chatId && c.lastMessage?.id === updatedMsg.id) {
          return { ...c, lastMessage: updatedMsg };
        }
        return c;
      }));
    });

    return () => {
      socket.off('new_message');
      socket.off('user_status');
      socket.off('user_typing');
      socket.off('message_updated');
    };
  }, [user, activeChat]);

  // Fetch Messages when chat changes
  useEffect(() => {
    if (!activeChat) return;
    api.get(`/chats/${activeChat.id}/messages`).then(setMessages).catch(console.error);
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeChat || !user) return;

    const text = inputText;
    setInputText('');
    
    // Stop typing when sending
    socket.emit('typing', { chatId: activeChat.id, isTyping: false });

    if (editingMessage) {
      socket.emit('edit_message', { messageId: editingMessage.id, text });
      setEditingMessage(null);
    } else {
      socket.emit('send_message', {
        chatId: activeChat.id,
        text,
        type: 'text'
      });
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (activeChat) {
      socket.emit('typing', { chatId: activeChat.id, isTyping: e.target.value.length > 0 });
    }
  };

  const deleteMessage = async (msgId: string) => {
    socket.emit('delete_message', msgId);
  };

  const startNewChat = async (other: AppUser | Chat) => {
    if (!user) return;
    
    // If it's already a chat object
    if ('type' in other) {
      setActiveChat(other as Chat);
      setShowNewChat(false);
      setIsSecretChatMode(false);
      return;
    }

    const otherUser = other as AppUser;
    const existingChat = chats.find(c => 
      c.participants.includes(otherUser.uid) && 
      c.type === (isSecretChatMode ? 'secret' : 'personal')
    );

    if (existingChat) {
      setActiveChat(existingChat);
      setShowNewChat(false);
      setIsSecretChatMode(false);
      return;
    }

    try {
      const chatData = {
        type: isSecretChatMode ? 'secret' : 'personal',
        participants: [user.uid, otherUser.uid],
        name: otherUser.displayName || otherUser.username
      };
      const newChat = await api.post('/chats', chatData);
      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat);
      setShowNewChat(false);
      setIsSecretChatMode(false);
      
      // Join socket room
      socket.emit('authenticate', localStorage.getItem('token'));
    } catch (error) {
      console.error(error);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const getOtherParticipant = (chat: Chat) => {
    if (chat.type === 'group' || chat.type === 'channel') return { displayName: chat.name, photoURL: chat.photoURL };
    const otherId = chat.participants.find(p => p !== user?.uid);
    return users.find(u => u.uid === otherId) || { displayName: 'User', photoURL: null };
  };

  const filteredChats = chats.filter(chat => {
    if (activeFolder === 'All') return true;
    if (activeFolder === 'Personal') return chat.type === 'personal';
    if (activeFolder === 'Groups') return chat.type === 'group';
    if (activeFolder === 'Channels') return chat.type === 'channel';
    return true;
  });

  if (loading) return (
    <div className="h-screen bg-[#f4f4f5] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2481cc]"></div>
    </div>
  );

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className={cn("min-h-screen flex items-center justify-center font-sans transition-all duration-500", isDarkMode ? "dark bg-[#0f0f0f]" : "bg-[#DEE5EB]")}>
      <div className={cn(
        "w-full h-screen sm:h-[90vh] sm:max-w-[450px] sm:rounded-[3rem] sm:border-[8px] sm:border-[#1c1c1c] overflow-hidden relative shadow-2xl bg-white dark:bg-[#1c1c1c] transition-all",
        isDarkMode ? "sm:border-[#2d2d2d]" : "sm:border-[#1c1c1c]"
      )}>
        {/* Sidebar Overlay */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="absolute inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            />
          )}
        </AnimatePresence>

        {/* Sidebar Menu */}
        <motion.div 
          initial={{ x: -300 }}
          animate={{ x: showSidebar ? 0 : -300 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute left-0 top-0 bottom-0 w-[300px] bg-white dark:bg-[#212121] z-[70] shadow-2xl flex flex-col"
        >
          <div className="p-6 bg-[#2481cc] text-white">
            <div className="flex justify-between items-start mb-4">
              <div className="w-16 h-16 rounded-full bg-white/20 overflow-hidden border-2 border-white/30 cursor-pointer" onClick={handleLogoClick}>
                <img src={user?.photoURLs?.[0] || `https://picsum.photos/seed/${user.uid}/100/100`} alt="Me" className="w-full h-full object-cover" />
              </div>
              <button onClick={toggleTheme} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </button>
            </div>
            <h3 className="font-bold text-lg">{user?.displayName}</h3>
            <p className="text-white/70 text-sm">@{user?.username}</p>
          </div>
          <div className="flex-1 py-4 overflow-y-auto">
            {user?.role === 'admin' && (
              <div 
                onClick={() => { setShowAdminDashboard(true); setShowSidebar(false); }}
                className="px-4 py-3 flex items-center gap-6 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors text-amber-500"
              >
                <Shield className="w-6 h-6" />
                <span className="font-bold">Core Control Panel</span>
              </div>
            )}
            <div className="px-4 py-3 flex items-center gap-6 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors">
              <Users className="w-6 h-6 text-gray-400" />
              <span className="font-medium">New Group</span>
            </div>
          <div className="px-4 py-3 flex items-center gap-6 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors">
            <Radio className="w-6 h-6 text-gray-400" />
            <span className="font-medium">New Channel</span>
          </div>
          <div className="px-4 py-3 flex items-center gap-6 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors">
            <User className="w-6 h-6 text-gray-400" />
            <span className="font-medium">Contacts</span>
          </div>
          <div className="px-4 py-3 flex items-center gap-6 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors">
            <Phone className="w-6 h-6 text-gray-400" />
            <span className="font-medium">Calls</span>
          </div>
          <div className="px-4 py-3 flex items-center gap-6 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors">
            <Pin className="w-6 h-6 text-gray-400" />
            <span className="font-medium">Saved Messages</span>
          </div>
          <div className="px-4 py-3 flex items-center gap-6 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors">
            <Settings className="w-6 h-6 text-gray-400" />
            <span className="font-medium">Settings</span>
          </div>
          {user?.role === 'admin' && (
            <div 
              onClick={() => {
                setShowAdminDashboard(true);
                setShowSidebar(false);
              }}
              className="px-4 py-3 flex items-center gap-6 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors text-[#2481cc]"
            >
              <Shield className="w-6 h-6" />
              <span className="font-medium">Admin Panel</span>
            </div>
          )}
          <div className="mt-4 border-t border-gray-100 dark:border-white/5 pt-4">
            <div onClick={handleLogout} className="px-4 py-3 flex items-center gap-6 hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer transition-colors text-red-500">
              <LogOut className="w-6 h-6" />
              <span className="font-medium">Logout</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Sidebar (Chat List) */}
      <div className={cn(
        "w-full sm:w-[400px] flex flex-col border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#212121] h-full",
        showChatOnMobile && "hidden sm:flex"
      )}>
        <div className="p-4 flex items-center gap-4">
          <button onClick={() => setShowSidebar(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <Menu className="w-6 h-6 text-[#707579]" />
          </button>
          <div className="flex-1 bg-[#f4f4f5] dark:bg-[#1c1c1c] rounded-full px-4 py-2 flex items-center gap-3 border border-transparent focus-within:border-[#2481cc] transition-all">
            <Search className="w-5 h-5 text-[#707579]" />
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-full text-sm"
            />
          </div>
        </div>

        {/* Folders/Tabs */}
        <div className="flex px-4 border-b border-gray-100 dark:border-white/5">
          {['All', 'Personal', 'Groups', 'Channels'].map(folder => (
            <button
              key={folder}
              onClick={() => setActiveFolder(folder)}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-all relative",
                activeFolder === folder ? "text-[#2481cc]" : "text-[#707579] hover:text-[#1c1c1c] dark:hover:text-white"
              )}
            >
              {folder}
              {activeFolder === folder && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2481cc]" />
              )}
            </button>
          ))}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map(chat => {
            const other = getOtherParticipant(chat);
            return (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={cn(
                  "flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors relative",
                  activeChat?.id === chat.id && "bg-[#2481cc] text-white hover:bg-[#2481cc]"
                )}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden mr-4 flex-shrink-0 shadow-sm">
                  <img src={other.photoURL || `https://picsum.photos/seed/${chat.id}/100/100`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold truncate">{other.displayName}</h4>
                    <span className={cn("text-xs", activeChat?.id === chat.id ? "text-white/70" : "text-[#707579]")}>
                      {formatTime(chat.updatedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={cn("text-sm truncate", activeChat?.id === chat.id ? "text-white/80" : "text-[#707579]")}>
                      {chat.lastMessage?.isDeleted ? 'Message deleted' : chat.lastMessage?.text || 'No messages yet'}
                    </p>
                    {chat.isPinned && <Pin className="w-3 h-3 rotate-45" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAB */}
        <button 
          onClick={() => setShowNewChat(true)}
          className="absolute bottom-6 left-[320px] w-14 h-14 bg-[#2481cc] text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
        >
          <Plus className="w-8 h-8" />
        </button>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col relative bg-[#f4f4f5] dark:bg-[#1c1c1c] h-full",
        !showChatOnMobile && "hidden sm:flex"
      )}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-[64px] bg-white dark:bg-[#212121] px-4 sm:px-6 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={() => setShowChatOnMobile(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full sm:hidden"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfile(true)}>
                  <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm">
                    <img src={getOtherParticipant(activeChat).photoURL || `https://picsum.photos/seed/${activeChat.id}/100/100`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg leading-tight truncate max-w-[150px] sm:max-w-none">
                      {getOtherParticipant(activeChat).displayName}
                    </h3>
                  <div className="flex items-center gap-1">
                    {typingUsers[activeChat.id]?.length > 0 ? (
                      <p className="text-xs font-medium text-[#2481cc] animate-pulse">
                        {users.find(u => u.uid === typingUsers[activeChat.id][0])?.displayName || 'Someone'} is typing...
                      </p>
                    ) : (
                      <p className={cn(
                        "text-xs font-medium",
                        getOtherParticipant(activeChat).status === 'online' ? "text-[#2481cc]" : "text-[#707579]"
                      )}>
                        {getOtherParticipant(activeChat).status === 'online' ? 'online' : `last seen ${formatTime(getOtherParticipant(activeChat).lastSeen)}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-[#707579]">
                <Search className="w-6 h-6 cursor-pointer hover:text-[#2481cc] transition-colors" />
                <Phone className="w-6 h-6 cursor-pointer hover:text-[#2481cc] transition-colors" />
                <MoreVertical className="w-6 h-6 cursor-pointer hover:text-[#2481cc] transition-colors" />
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat dark:opacity-90">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-2xl shadow-sm max-w-[75%] relative group chat-bubble-pop",
                    msg.senderId === user.uid 
                      ? "self-end bg-[#effdde] dark:bg-[#2b5278] rounded-tr-none" 
                      : "self-start bg-white dark:bg-[#212121] rounded-tl-none"
                  )}
                >
                  {msg.isDeleted ? (
                    <span className="italic text-gray-400 text-sm flex items-center gap-2">
                      <Trash2 className="w-3 h-3" /> This message was deleted
                    </span>
                  ) : (
                    <>
                      <p className="text-[15px] leading-relaxed">{msg.text}</p>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        {msg.isEdited && <span className="text-[10px] text-[#707579] italic">edited</span>}
                        <span className="text-[11px] text-[#707579]">{formatTime(msg.timestamp)}</span>
                        {msg.senderId === user.uid && <CheckCheck className="w-3.5 h-3.5 text-[#4fc3f7]" />}
                      </div>
                      
                      {/* Message Actions */}
                      <div className="absolute top-0 right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                        <button onClick={() => {
                          setEditingMessage(msg);
                          setInputText(msg.text);
                        }} className="p-1.5 bg-white dark:bg-[#212121] rounded-full shadow-md hover:text-[#2481cc]">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteMessage(msg.id)} className="p-1.5 bg-white dark:bg-[#212121] rounded-full shadow-md hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-[#212121] flex items-end gap-4 shadow-lg">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-[#707579]">
                <Paperclip className="w-6 h-6" />
              </button>
              <div className="flex-1 bg-[#f4f4f5] dark:bg-[#1c1c1c] rounded-2xl px-4 py-3 flex flex-col">
                {editingMessage && (
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2 text-[#2481cc]">
                      <Edit2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Edit Message</span>
                    </div>
                    <X className="w-4 h-4 cursor-pointer" onClick={() => { setEditingMessage(null); setInputText(''); }} />
                  </div>
                )}
                <textarea
                  placeholder="Message"
                  rows={1}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  className="bg-transparent outline-none w-full text-[15px] resize-none max-h-32"
                />
              </div>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-[#707579]">
                <Smile className="w-6 h-6" />
              </button>
              {inputText.trim() ? (
                <button 
                  onClick={handleSendMessage}
                  className="p-3 bg-[#2481cc] text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="w-6 h-6" />
                </button>
              ) : (
                <button className="p-3 bg-[#2481cc] text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all">
                  <Mic className="w-6 h-6" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="w-48 h-48 bg-gray-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-8">
              <Send className="w-20 h-20 text-gray-400 opacity-30" />
            </div>
            <h2 className="text-2xl font-bold text-gray-400 mb-2">Select a chat to start messaging</h2>
            <p className="text-gray-400 max-w-xs">TelePro is a secure, cloud-based messaging platform.</p>
          </div>
        )}
      </div>

      {/* Admin Dashboard Overlay */}
      <AnimatePresence>
        {showAdminDashboard && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-0 bg-white dark:bg-[#1c1c1c] z-[100] flex flex-col"
          >
            <AdminDashboard onBack={() => setShowAdminDashboard(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Chat / Search Modal */}
      <AnimatePresence>
        {showNewChat && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 bg-white dark:bg-[#1c1c1c] z-[80] flex flex-col"
          >
            <div className="h-[64px] px-6 flex items-center gap-6 border-b border-gray-100 dark:border-white/5">
              <X className="w-6 h-6 cursor-pointer text-[#707579]" onClick={() => {
                setShowNewChat(false);
                setIsSecretChatMode(false);
              }} />
              <div className="flex-1 flex items-center gap-4">
                <input 
                  type="text" 
                  placeholder="Search by username or name" 
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none text-lg"
                />
                <div 
                  onClick={() => setIsSecretChatMode(!isSecretChatMode)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition-all",
                    isSecretChatMode ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-white/5 text-[#707579]"
                  )}
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Secret</span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-[#2481cc] text-sm font-bold uppercase px-4 mb-4">
                {searchQuery ? 'Search Results' : 'Global Search'}
              </h3>
              {filteredUsers.length > 0 ? filteredUsers.map(u => (
                <div
                  key={u.uid}
                  onClick={() => startNewChat(u)}
                  className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-colors"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden mr-4 shadow-sm">
                    <img src={u.photoURLs?.[0] || `https://picsum.photos/seed/${u.uid}/100/100`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold">{u.displayName}</h4>
                    <p className="text-sm text-[#707579]">@{u.username}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-gray-400">
                  No users found matching "{searchQuery}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Info Side Panel */}
      <AnimatePresence>
        {showProfile && activeChat && (
          <motion.div 
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="absolute right-0 top-0 bottom-0 w-[400px] bg-white dark:bg-[#212121] z-[60] shadow-2xl flex flex-col border-l border-gray-100 dark:border-white/5"
          >
            <div className="p-6 flex items-center gap-6 border-b border-gray-100 dark:border-white/5">
              <X className="w-6 h-6 cursor-pointer text-[#707579]" onClick={() => setShowProfile(false)} />
              <h2 className="text-xl font-bold">User Info</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="relative h-[400px] bg-gray-200">
                <img 
                  src={getOtherParticipant(activeChat).photoURL || `https://picsum.photos/seed/${activeChat.id}/400/400`} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent text-white">
                  <h3 className="text-2xl font-bold">{getOtherParticipant(activeChat).displayName}</h3>
                  <p className="text-white/70">last seen recently</p>
                </div>
              </div>
              <div className="p-6 space-y-8">
                <div className="flex items-center gap-6">
                  <Info className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="text-sm text-[#707579]">Bio</p>
                    <p className="font-medium">{(getOtherParticipant(activeChat) as AppUser).bio || 'Available'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <Hash className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="text-sm text-[#707579]">Username</p>
                    <p className="font-medium text-[#2481cc]">@{(getOtherParticipant(activeChat) as AppUser).username || getOtherParticipant(activeChat).displayName?.toLowerCase().replace(/\s+/g, '_')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <Palette className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="text-sm text-[#707579]">Theme</p>
                    <div className="flex gap-2 mt-2">
                      {['#2481cc', '#008069', '#8e44ad', '#e67e22', '#c0392b'].map(color => (
                        <div 
                          key={color} 
                          onClick={() => setThemeColor(color)}
                          className="w-8 h-8 rounded-full cursor-pointer border-2 border-white shadow-sm" 
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}
