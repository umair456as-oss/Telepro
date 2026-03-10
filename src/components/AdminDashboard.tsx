import { useState, useEffect } from 'react';
import { 
  Shield, Trash2, Edit2, X, Check, ArrowLeft, Ban, Activity, 
  BadgeCheck, Bot, Sparkles, Send, Search, LayoutDashboard, UserCog 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { cn } from '../utils';
import { api } from '../services/api';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'banned' | 'verified'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);

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
                          <th className="px-6 py-4 font-bold text-slate-500 text-xs">USER</th>
                          <th className="px-6 py-4 font-bold text-slate-500 text-xs">CONTACT</th>
                          <th className="px-6 py-4 font-bold text-slate-500 text-xs">ROLE</th>
                          <th className="px-6 py-4 font-bold text-slate-500 text-xs text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
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
                                  <p className="text-[10px] text-slate-400 font-mono">UID: {u.uid.substring(0,8)}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
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
                    <div className="p-12 text-center text-slate-400">
                      No users found matching your criteria.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
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
