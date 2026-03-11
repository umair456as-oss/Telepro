import { useState, useEffect, useRef } from 'react';
import { 
  Shield, Trash2, Edit2, X, Check, ArrowLeft, Ban, Activity, 
  BadgeCheck, Bot, Sparkles, Send, Search, LayoutDashboard, UserCog,
  Terminal as TerminalIcon, Globe, Lock, Cpu, Zap, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { cn } from '../utils';
import { api } from '../services/api';
import { GoogleGenAI } from "@google/genai";

// --- Sub-Components for Clean Code ---

// 1. Stats Card (Overview Dashboard ke liye)
const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-[#212121] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-white/5 flex items-center justify-between"
  >
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className={`text-2xl font-mono font-bold ${color}`}>{value}</h3>
    </div>
    <div className={`p-3 rounded-lg bg-opacity-10 ${color.replace('text', 'bg')}`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
  </motion.div>
);

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'banned' | 'verified' | 'controls'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [targetQuery, setTargetQuery] = useState('');
  const [targetResult, setTargetResult] = useState<User | null>(null);

  const aiEndRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async () => {
    try {
      const data = await api.get('/users');
      setUsers(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const handleAiAsk = async () => {
    if (!aiInput.trim()) return;
    
    const userMsg = aiInput;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAiLoading(true);

    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: "You are the TelePro System AI. You assist administrators with system management, user data analysis, and security protocols. Keep your tone professional, technical, and slightly 'terminal-like'.",
        }
      });

      setAiMessages(prev => [...prev, { role: 'bot', text: response.text || "System error: No response generated." }]);
    } catch (err) {
      console.error(err);
      setAiMessages(prev => [...prev, { role: 'bot', text: "Critical Error: Connection to Neural Link failed." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTargetSearch = () => {
    const found = users.find(u => 
      u.username?.toLowerCase() === targetQuery.toLowerCase() || 
      u.email?.toLowerCase() === targetQuery.toLowerCase()
    );
    setTargetResult(found || null);
  };

  const handleBan = async (uid: string, currentStatus: boolean | undefined) => {
    try {
      await api.post(`/admin/users/${uid}/ban`, { banned: !currentStatus });
      fetchUsers();
    } catch (error) {
      console.error("Error toggling ban status:", error);
    }
  };

  const handleToggleVerified = async (uid: string, currentStatus: boolean | undefined) => {
    try {
      await api.post(`/admin/users/${uid}/verify`, { verified: !currentStatus });
      fetchUsers();
    } catch (error) {
      console.error("Error toggling verified status:", error);
    }
  };

  const handleEdit = (user: User) => {
    // Implement edit logic or modal
    console.log("Editing user:", user);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.displayName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                          (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (u.username?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    if (activeTab === 'banned') return matchesSearch && u.banned;
    if (activeTab === 'verified') return matchesSearch && u.verified;
    return matchesSearch;
  });

  const activeUsers = users.filter(u => u.status === 'online').length;
  const bannedUsersCount = users.filter(u => u.banned).length;
  const verifiedUsersCount = users.filter(u => u.verified).length;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] dark:bg-[#1c1c1c]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] dark:bg-[#1c1c1c] font-sans text-sm overflow-hidden">
      
      {/* --- Modern Header --- */}
      <header className="bg-white dark:bg-[#212121] border-b border-slate-200 dark:border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" /> Core Control Panel
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">V3.1.0 • SYSTEM_READY</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search database..."
              className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-[#1c1c1c] border-none rounded-full w-64 focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-xs font-bold shadow-lg shadow-blue-200 hover:scale-105 transition-transform"
          >
            <Sparkles className="w-4 h-4" /> AI ASSIST
          </button>
        </div>
      </header>

      {/* --- Main Layout --- */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#212121] p-4 hidden lg:flex flex-col gap-2">
          <p className="text-[10px] font-bold text-slate-400 px-4 mb-2">MAIN MENU</p>
          <NavButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={LayoutDashboard} label="Dashboard" />
          <NavButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={UserCog} label="User Database" />
          <NavButton active={activeTab === 'banned'} onClick={() => setActiveTab('banned')} icon={Ban} label="Blacklist" />
          <NavButton active={activeTab === 'verified'} onClick={() => setActiveTab('verified')} icon={BadgeCheck} label="Verified" />
          <NavButton active={activeTab === 'controls'} onClick={() => setActiveTab('controls')} icon={TerminalIcon} label="Controls" />
        </aside>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <StatCard label="Total Records" value={users.length} icon={UserCog} color="text-blue-600" />
                    <StatCard label="Online Now" value={activeUsers} icon={Activity} color="text-green-600" />
                    <StatCard label="Restricted" value={bannedUsersCount} icon={Ban} color="text-red-600" />
                    <StatCard label="Verified" value={verifiedUsersCount} icon={BadgeCheck} color="text-purple-600" />
                  </div>
                  
                  {/* --- System Terminal Interface --- */}
                  <div className="bg-slate-900 rounded-xl p-6 shadow-2xl border border-slate-700 font-mono overflow-hidden relative">
                    <div className="flex gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <p className="text-green-400 leading-relaxed text-xs">
                      [SYS] Database synchronized successfully... <br/>
                      [LOG] Admin login detected at {new Date().toLocaleTimeString()} <br/>
                      [SEC] All firewalls operational. <br/>
                      <span className="animate-pulse">_</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Data Table for Users */}
              {(activeTab === 'users' || activeTab === 'banned' || activeTab === 'verified') && (
                <div className="bg-white dark:bg-[#212121] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-[#1c1c1c] border-b border-slate-200 dark:border-white/5">
                        <tr>
                          <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-widest">User</th>
                          <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Contact</th>
                          <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Role</th>
                          <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-xs">
                        {filteredUsers.map((u) => (
                          <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#1c1c1c] overflow-hidden group-hover:ring-2 ring-blue-500 transition-all">
                                  {u.photoURLs && u.photoURLs[0] ? (
                                    <img src={u.photoURLs[0]} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                      <UserCog size={20} />
                                    </div>
                                  )}
                              </div>
                              <div>
                                  <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                                    {u.displayName || u.username}
                                    {u.verified && <BadgeCheck size={14} className="text-blue-500" />}
                                  </p>
                                  <p className="text-[10px] text-slate-400">UID: {u.uid.substring(0,8)}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                              {u.email}<br/><span className="text-slate-400">{u.phoneNumber}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold",
                                u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                              )}>
                                {(u.role || 'user').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleToggleVerified(u.uid, u.verified)} 
                                  className={cn("p-2 rounded-lg transition-colors", u.verified ? "bg-purple-50 text-purple-600" : "hover:bg-purple-50 text-slate-400 hover:text-purple-600")}
                                  title={u.verified ? "Unverify User" : "Verify User"}
                                >
                                  <BadgeCheck size={16}/>
                                </button>
                                <button 
                                  onClick={() => handleEdit(u)} 
                                  className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                                  title="Edit User"
                                >
                                  <Edit2 size={16}/>
                                </button>
                                <button 
                                  onClick={() => handleBan(u.uid, u.banned)} 
                                  className={cn("p-2 rounded-lg transition-colors", u.banned ? "bg-red-600 text-white" : "hover:bg-red-50 text-red-600")}
                                  title={u.banned ? "Unban User" : "Ban User"}
                                >
                                  <Ban size={16}/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredUsers.length === 0 && (
                    <div className="p-12 text-center text-slate-400 font-mono">
                      NO RECORDS MATCHING CRITERIA.
                    </div>
                  )}
                </div>
              )}

              {/* Controls Tab */}
              {activeTab === 'controls' && (
                <div className="space-y-6">
                  <div className="bg-slate-900 rounded-2xl p-8 border border-slate-700 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                      <Cpu className="w-6 h-6 text-blue-500" />
                      <h2 className="text-xl font-mono font-bold text-white uppercase tracking-tighter">Target Acquisition System</h2>
                    </div>
                    
                    <div className="flex gap-4 mb-8">
                      <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input 
                          type="text"
                          placeholder="ENTER USERNAME OR EMAIL..."
                          className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          value={targetQuery}
                          onChange={(e) => setTargetQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleTargetSearch()}
                        />
                      </div>
                      <button 
                        onClick={handleTargetSearch}
                        className="px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                      >
                        <Zap className="w-5 h-5" /> LOCATE
                      </button>
                    </div>

                    {targetResult ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-800/50 rounded-xl border border-slate-700/50"
                      >
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className="w-24 h-24 rounded-full border-4 border-blue-500/30 overflow-hidden">
                            <img src={targetResult.photoURLs?.[0] || `https://picsum.photos/seed/${targetResult.uid}/200/200`} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-lg">{targetResult.displayName}</p>
                            <p className="text-blue-400 font-mono text-xs">@{targetResult.username}</p>
                          </div>
                        </div>
                        
                        <div className="md:col-span-2 space-y-4 font-mono text-xs">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                              <p className="text-slate-500 mb-1 uppercase">Status</p>
                              <p className={cn("font-bold", targetResult.status === 'online' ? "text-green-500" : "text-slate-400")}>
                                {targetResult.status?.toUpperCase() || 'OFFLINE'}
                              </p>
                            </div>
                            <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                              <p className="text-slate-500 mb-1 uppercase">Access Level</p>
                              <p className="text-blue-400 font-bold">{targetResult.role?.toUpperCase() || 'USER'}</p>
                            </div>
                            <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                              <p className="text-slate-500 mb-1 uppercase">Verification</p>
                              <p className={cn("font-bold", targetResult.verified ? "text-purple-500" : "text-slate-400")}>
                                {targetResult.verified ? 'VERIFIED' : 'UNVERIFIED'}
                              </p>
                            </div>
                            <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                              <p className="text-slate-500 mb-1 uppercase">Account ID</p>
                              <p className="text-white">{targetResult.uid.substring(0, 12)}...</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3 pt-4">
                            <button className="flex-1 py-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/50 rounded-lg transition-all font-bold">TERMINATE SESSION</button>
                            <button className="flex-1 py-3 bg-blue-600/20 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-600/50 rounded-lg transition-all font-bold">OVERRIDE PERMS</button>
                          </div>
                        </div>
                      </motion.div>
                    ) : targetQuery && (
                      <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
                        <p className="text-slate-500 font-mono">NO TARGET MATCHES FOUND IN CURRENT SECTOR.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* --- AI Assistant Panel --- */}
      <AnimatePresence>
        {showAiPanel && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAiPanel(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-700 z-[101] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800">
                <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6 text-blue-500" />
                  <div>
                    <h3 className="text-white font-mono font-bold uppercase tracking-tighter">Neural Assistant</h3>
                    <p className="text-[10px] text-green-500 font-mono">LINK_ESTABLISHED</p>
                  </div>
                </div>
                <button onClick={() => setShowAiPanel(false)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-900">
                {aiMessages.length === 0 && (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-blue-500/20 mx-auto mb-4" />
                    <p className="text-slate-500 font-mono text-xs">AWAITING INPUT COMMANDS...</p>
                  </div>
                )}
                {aiMessages.map((msg, i) => (
                  <div key={i} className={cn(
                    "flex flex-col max-w-[85%] space-y-1",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}>
                    <div className={cn(
                      "p-3 rounded-xl font-mono text-xs leading-relaxed",
                      msg.role === 'user' ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 border border-slate-700"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex items-center gap-2 text-blue-500 font-mono text-[10px] animate-pulse">
                    <Cpu className="w-3 h-3 animate-spin" /> PROCESSING_REQUEST...
                  </div>
                )}
                <div ref={aiEndRef} />
              </div>

              <div className="p-6 bg-slate-800 border-t border-slate-700">
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="ENTER COMMAND..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-xs outline-none focus:ring-1 focus:ring-blue-500"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()}
                  />
                  <button 
                    onClick={handleAiAsk}
                    disabled={isAiLoading || !aiInput.trim()}
                    className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sidebar Button Helper
const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full",
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
    )}
  >
    <Icon size={18} />
    <span className="font-medium text-xs uppercase tracking-wide">{label}</span>
  </button>
);
