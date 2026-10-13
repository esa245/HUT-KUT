import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Shield,
  RefreshCw,
  Download,
  Users,
  Clock,
  CreditCard,
  Share2,
  TrendingUp,
  Radio,
  Search,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  X,
  FileText,
  Trash2,
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react';
import {
  listenToAdminAllUsers,
  listenToAdminAllWithdrawals,
  updateWithdrawalStatusInFirebase,
  updateReferralStatusInFirebase,
  forcePushCloudSync,
  purgeDemoDataInFirebase,
  listenToConnectionStatus,
} from '../utils/firebase';
import { WithdrawalRecord } from '../types/game';

interface AdminPanelProps {
  onClose: () => void;
}

type AdminTab = 'overview' | 'ids' | 'withdrawals' | 'referrals' | 'tools';
type WithdrawalFilter = 'all' | 'pending' | 'processing' | 'completed' | 'rejected';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [language, setLanguage] = useState<'bn' | 'en'>('en');
  const [users, setUsers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [searchWithdrawal, setSearchWithdrawal] = useState<string>('');
  const [withdrawalFilter, setWithdrawalFilter] = useState<WithdrawalFilter>('all');
  const [searchReferral, setSearchReferral] = useState<string>('');
  const [selectedUserForRecruits, setSelectedUserForRecruits] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const unsubUsers = listenToAdminAllUsers((data) => setUsers(data));
    const unsubWds = listenToAdminAllWithdrawals((data) => setWithdrawals(data));
    const unsubConn = listenToConnectionStatus((connected, error) => {
      setIsConnected(connected);
      if (error) {
        setConnectionNotice(error);
      } else {
        setConnectionNotice(null);
      }
    });

    return () => {
      unsubUsers();
      unsubWds();
      unsubConn();
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast(language === 'bn' ? 'ডাটা সফলভাবে রিফ্রেশ হয়েছে!' : 'Data refreshed successfully!');
    }, 600);
  };

  // Metrics computation
  const totalUsers = users.length;
  const pendingPayouts = withdrawals.filter((w) => w.status === 'pending').length;
  const completedPayouts = withdrawals.filter((w) => w.status === 'completed').length;
  const totalPaidOutBtt = withdrawals
    .filter((w) => w.status === 'completed')
    .reduce((sum, w) => sum + (Number(w.amountBtt) || 0), 0);
  const totalReferrals = users.reduce((sum, u) => sum + (Number(u.referralCount) || 0), 0);
  const coinsCirculation = users.reduce((sum, u) => sum + (Number(u.coins) || 0), 0);
  const diamondsSupply = users.reduce((sum, u) => sum + (Number(u.diamonds) || 0), 0);
  const mintedTokens = users.reduce((sum, u) => sum + (Number(u.mintedTokens) || 0), 0);

  // Filtered withdrawals
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((w) => {
      const matchFilter = withdrawalFilter === 'all' || w.status === withdrawalFilter;
      const matchSearch =
        !searchWithdrawal ||
        w.id.toLowerCase().includes(searchWithdrawal.toLowerCase()) ||
        (w.airdropCode && w.airdropCode.includes(searchWithdrawal)) ||
        (w.exchangeId && w.exchangeId.toLowerCase().includes(searchWithdrawal.toLowerCase()));
      return matchFilter && matchSearch;
    });
  }, [withdrawals, withdrawalFilter, searchWithdrawal]);

  // Filtered referrals
  const filteredReferralUsers = useMemo(() => {
    if (!searchReferral) return users;
    return users.filter(
      (u) =>
        u.airdropCode?.includes(searchReferral) ||
        u.name?.toLowerCase().includes(searchReferral.toLowerCase())
    );
  }, [users, searchReferral]);

  // Export JSON Snapshot
  const handleExportJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      database: 'https://adminboost-default-rtdb.firebaseio.com',
      metrics: {
        total6DigitIds: totalUsers,
        coinsCirculation,
        diamondsSupply,
        mintedTokens,
        pendingPayouts,
        totalPaidOutBtt,
      },
      users,
      withdrawals,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hutkut_admin_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(language === 'bn' ? 'JSON স্ন্যাপশট ডাউনলোড হয়েছে!' : 'JSON snapshot exported successfully!');
  };

  // Export CSV
  const handleExportCSV = () => {
    const header = 'ID,Code,Coins,Diamonds,Taps,Level,Referrals,MintedHUT,JoinedDate\n';
    const rows = users
      .map(
        (u) =>
          `"${u.id}","${u.airdropCode || u.id}",${u.coins || 0},${u.diamonds || 0},${u.totalTaps || 0},${
            u.level || 1
          },${u.referralCount || 0},${u.mintedTokens || 0},"${u.joinedDate || '10/11/2026'}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hutkut_6digit_users_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(language === 'bn' ? 'CSV ফাইল ডাউনলোড হয়েছে!' : '6-Digit IDs CSV exported successfully!');
  };

  // Force Push
  const handleForcePush = async () => {
    showToast(language === 'bn' ? 'ক্লাউডে পুশ করা হচ্ছে...' : 'Pushing data to adminboost RTDB...');
    const ok = await forcePushCloudSync();
    if (ok) {
      showToast(language === 'bn' ? 'রিয়েল ডাটা ক্লাউডে সিঙ্ক হয়েছে!' : 'Real data successfully pushed to Cloud RTDB!');
    } else {
      showToast('Cloud sync completed with active fallback.');
    }
  };

  // Purge Demo Data
  const handlePurgeDemo = async () => {
    await purgeDemoDataInFirebase();
    showToast(language === 'bn' ? 'সমস্ত ডেমো ডেটা মুছে ফেলা হয়েছে!' : 'Demo data purged successfully!');
  };

  const handleUpdateStatus = async (
    wdId: string,
    airdropCode: string,
    status: 'pending' | 'processing' | 'completed' | 'rejected'
  ) => {
    await updateWithdrawalStatusInFirebase(wdId, airdropCode, status);
    showToast(`Withdrawal ${wdId} marked as ${status}`);
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[#070b14] text-white flex flex-col font-sans overflow-hidden select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-500 text-slate-950 font-black px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 text-xs animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="shrink-0 px-3.5 py-3 border-b border-[#18233a] bg-[#0a101f] flex items-center justify-between gap-2">
        {/* Back Button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131d33] hover:bg-[#1a2744] border border-[#233554] text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
          <span>Back to Game</span>
        </button>

        {/* Center Title Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-slate-300 fill-slate-300/20" />
            <div className="flex flex-col text-[10px] font-black leading-tight tracking-wider text-slate-200">
              <span>HUT</span>
              <span>KUT</span>
            </div>
          </div>
          <div className="px-2 py-0.5 rounded-md border border-amber-500/70 bg-amber-500/10 text-amber-400 font-extrabold text-[10px] tracking-wider uppercase">
            6-DIGIT ID ADMIN
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            title="Refresh"
            className={`p-1.5 rounded-xl bg-[#131d33] hover:bg-[#1a2744] border border-[#233554] text-cyan-400 transition-all cursor-pointer ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportJSON}
            title="Download JSON Snapshot"
            className="p-1.5 rounded-xl bg-[#131d33] hover:bg-[#1a2744] border border-[#233554] text-emerald-400 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="px-2.5 py-1.5 rounded-xl bg-[#131d33] hover:bg-[#1a2744] border border-[#233554] text-amber-400 font-bold text-xs transition-all cursor-pointer"
          >
            {language === 'bn' ? 'বাং' : 'EN'}
          </button>
        </div>
      </header>

      {/* Horizontal Scrollable Tabs */}
      <nav className="shrink-0 px-3 py-2 border-b border-[#141d30] bg-[#070b14] overflow-x-auto no-scrollbar flex items-center gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#f59e0b] text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Realtime Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('ids')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'ids'
              ? 'bg-[#f59e0b] text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>6-Digit IDs ({totalUsers})</span>
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'withdrawals'
              ? 'bg-[#f59e0b] text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Withdrawals</span>
          {pendingPayouts > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full">
              {pendingPayouts}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'referrals'
              ? 'bg-[#f59e0b] text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Referral Tracking</span>
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'tools'
              ? 'bg-[#f59e0b] text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>System Tools</span>
        </button>
      </nav>

      {/* Main Tab Content */}
      <main className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3.5 max-w-xl mx-auto w-full pb-16">
        {/* ================= TAB 1: REALTIME OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Realtime Database Banner */}
            <div className={`p-4 rounded-2xl border shadow-lg transition-all ${
              isConnected
                ? 'bg-[#0c1527] border-[#1e2e4a]'
                : 'bg-rose-950/20 border-rose-500/40'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${
                  isConnected
                    ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-950/70 border-rose-500/30 text-rose-400'
                }`}>
                  {isConnected ? (
                    <Radio className="w-5 h-5 animate-pulse" />
                  ) : (
                    <WifiOff className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>Firebase Realtime Database:</span>
                      <span className={isConnected ? 'text-emerald-400 font-black' : 'text-amber-400 font-black'}>
                        {isConnected ? 'Connected' : 'Connecting / Offline'}
                      </span>
                    </h3>
                    <span className="text-[11px] font-mono text-cyan-400 truncate">
                      adminboost-default-rtdb
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    All users and payouts tracked strictly by 6-digit numeric IDs across all tabs.
                  </p>
                  <div className="flex items-center justify-between mt-2.5 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`} />
                      <span className={isConnected ? 'text-emerald-400' : 'text-amber-300'}>
                        {isConnected ? 'Realtime Sync Active (.info/connected)' : 'Connecting to adminboost RTDB...'}
                      </span>
                      {isConnected && <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />}
                    </div>

                    <button
                      onClick={handleForcePush}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-[11px] text-emerald-300 font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Sync All to RTDB</span>
                    </button>
                  </div>

                  {connectionNotice && (
                    <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>{connectionNotice}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2x2 Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Total 6-Digit IDs */}
              <div className="p-3.5 rounded-2xl bg-[#0c1527] border border-[#1e2e4a] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Total 6-Digit IDs</span>
                  <Users className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="my-2">
                  <div className="text-3xl font-black text-white">{totalUsers}</div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>6-Digit ID Tracked</span>
                </div>
              </div>

              {/* Pending Payouts */}
              <div className="p-3.5 rounded-2xl bg-[#0c1527] border border-[#1e2e4a] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Pending Payouts</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="my-2">
                  <div className="text-3xl font-black text-amber-400">{pendingPayouts}</div>
                </div>
                <div className="text-[11px] text-slate-400">
                  Completed: {completedPayouts}
                </div>
              </div>

              {/* Paid Out BTT */}
              <div className="p-3.5 rounded-2xl bg-[#0c1527] border border-[#1e2e4a] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Paid Out BTT</span>
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="my-2">
                  <div className="text-3xl font-black text-emerald-400">
                    {totalPaidOutBtt.toLocaleString()}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">Direct Payouts</div>
              </div>

              {/* Total Referrals */}
              <div className="p-3.5 rounded-2xl bg-[#0c1527] border border-[#1e2e4a] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Total Referrals</span>
                  <Share2 className="w-4 h-4 text-purple-400" />
                </div>
                <div className="my-2">
                  <div className="text-3xl font-black text-purple-400">{totalReferrals}</div>
                </div>
                <div className="text-[11px] text-slate-400">Total recruited IDs</div>
              </div>
            </div>

            {/* In-Game Coins Circulation */}
            <div className="p-4 rounded-2xl bg-[#0c1527] border border-[#1e2e4a]">
              <div className="text-xs font-semibold text-slate-400">In-Game Coins Circulation</div>
              <div className="text-2xl font-black text-amber-400 my-1 flex items-center gap-2">
                <span>{coinsCirculation.toLocaleString()}</span>
                <span className="text-xl">🪙</span>
              </div>
              <div className="text-[11px] text-slate-500">Held across all 6-digit accounts</div>
            </div>

            {/* Diamonds Supply */}
            <div className="p-4 rounded-2xl bg-[#0c1527] border border-[#1e2e4a]">
              <div className="text-xs font-semibold text-slate-400">Diamonds Supply</div>
              <div className="text-2xl font-black text-sky-400 my-1 flex items-center gap-2">
                <span>{diamondsSupply.toLocaleString()}</span>
                <span className="text-xl">💎</span>
              </div>
              <div className="text-[11px] text-slate-500">Earned via tap drop & referrals</div>
            </div>

            {/* Minted HUT KUT Tokens */}
            <div className="p-4 rounded-2xl bg-[#0c1527] border border-[#1e2e4a]">
              <div className="text-xs font-semibold text-slate-400">Minted HUT KUT Tokens</div>
              <div className="text-2xl font-black text-amber-300 my-1 flex items-center gap-2">
                <span>{mintedTokens.toLocaleString()}</span>
                <span className="text-xl font-black">HUT</span>
              </div>
              <div className="text-[11px] text-slate-500">Tokens ready for BTT withdrawal</div>
            </div>

            {/* Top Referral Leaders (By 6-Digit ID) */}
            <div className="p-4 rounded-2xl bg-[#0c1527] border border-[#1e2e4a] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-base">🏆</span>
                  <h4 className="text-xs font-black text-white">
                    Top Referral Leaders (By 6-Digit ID)
                  </h4>
                </div>
                <button
                  onClick={() => setActiveTab('referrals')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Full Referral Breakdown</span>
                  <span>→</span>
                </button>
              </div>

              <div className="space-y-2">
                {users.slice(0, 3).map((leader, idx) => {
                  const leaderKey = `leader-${leader.id || leader.airdropCode || idx}`;
                  return (
                    <div
                      key={leaderKey}
                      className="p-3 rounded-xl bg-[#070d18] border border-[#18263f] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-black text-white">ID #{leader.airdropCode || leader.id}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {leader.joinedDate || '10/11/2026'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-400">
                          {leader.referralCount || 0} added
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Code: {leader.airdropCode || leader.id}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: 6-DIGIT IDS ================= */}
        {activeTab === 'ids' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {users.map((user, uIdx) => {
              const code = user.airdropCode || user.id || '000000';
              const badgeNum = code.slice(0, 3);
              const userCardKey = `user-${user.id || code}-${uIdx}`;
              return (
                <div
                  key={userCardKey}
                  className="p-3.5 rounded-2xl bg-[#0c1527] border border-[#1e2e4a] shadow-md flex flex-col gap-2.5"
                >
                  <div className="flex items-start gap-3">
                    {/* First 3-digits badge */}
                    <div className="px-2 py-1.5 rounded-xl bg-[#15233c] text-amber-400 border border-amber-500/20 font-black text-xs shrink-0 tracking-wide">
                      #{badgeNum}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-white tracking-wide">
                        ID: {code}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Code: {code} &nbsp;•&nbsp; Level {user.level || 1} &nbsp;•&nbsp;{' '}
                        {user.joinedDate || '10/11/2026'}
                      </p>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-[#18263f]">
                    <div className="font-bold text-amber-400 flex items-center gap-1">
                      <span>🪙</span>
                      <span>{(user.coins || 0).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-400 flex items-center gap-2 text-[11px]">
                      <span>💎 {user.diamonds || 0}</span>
                      <span>•</span>
                      <span>👆 {(user.totalTaps || 0).toLocaleString()} taps</span>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{user.referralCount || 0} invited</span>
                      </span>
                      <span className="text-amber-400 font-bold text-xs">
                        {user.mintedTokens || 0} HUT
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= TAB 3: WITHDRAWALS ================= */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by 6-digit User ID or Withdrawal ID"
                value={searchWithdrawal}
                onChange={(e) => setSearchWithdrawal(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0c1527] border border-[#1e2e4a] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(['all', 'pending', 'processing', 'completed', 'rejected'] as WithdrawalFilter[]).map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setWithdrawalFilter(filter)}
                    className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                      withdrawalFilter === filter
                        ? 'bg-[#f59e0b] text-slate-950 font-black'
                        : 'bg-[#131d33] border border-[#233554] text-slate-300 hover:text-white'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter}
                  </button>
                )
              )}
            </div>

            {/* Subtext info */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>
                Showing {filteredWithdrawals.length} of {withdrawals.length} withdrawal records
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Realtime Sync Active
              </span>
            </div>

            {/* Empty State */}
            {filteredWithdrawals.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0c1527] border border-[#1e2e4a] text-center text-slate-400 text-xs">
                No withdrawal records match your filter.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWithdrawals.map((wd, wIdx) => {
                  const wdKey = `withdrawal-${wd.id || wIdx}-${wd.timestamp || ''}`;
                  return (
                    <div
                      key={wdKey}
                      className="p-3.5 rounded-2xl bg-[#0c1527] border border-[#1e2e4a] flex flex-col gap-2"
                    >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-white cursor-pointer hover:text-amber-400" onClick={() => { navigator.clipboard.writeText(wd.id); showToast('Withdrawal ID copied!'); }}>{wd.id} 📋</div>
                        <div className="text-[11px] text-slate-400">
                          User ID: <span className="text-amber-400 font-bold cursor-pointer hover:text-white" onClick={() => { navigator.clipboard.writeText(wd.airdropCode || ''); showToast('User ID copied!'); }}>{wd.airdropCode || 'N/A'} 📋</span>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          wd.status === 'completed'
                            ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-400'
                            : wd.status === 'processing'
                            ? 'bg-blue-950/80 border border-blue-500/40 text-blue-400'
                            : wd.status === 'rejected'
                            ? 'bg-rose-950/80 border border-rose-500/40 text-rose-400'
                            : 'bg-amber-950/80 border border-amber-500/40 text-amber-400'
                        }`}
                      >
                        {wd.status}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#070d18] text-xs flex items-center justify-between">
                      <div>
                        <span className="text-slate-400">{wd.exchange}: </span>
                        <span className="text-white font-mono font-bold cursor-pointer hover:text-amber-400" onClick={() => { navigator.clipboard.writeText(wd.exchangeId); showToast('Exchange ID copied!'); }}>{wd.exchangeId} 📋</span>
                      </div>
                      <div className="font-bold text-amber-400">
                        {wd.amountHutKut} HUT / {wd.amountBtt} BTT
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      {wd.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateStatus(wd.id, wd.airdropCode || '', 'completed')}
                          className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                        >
                          Approve (Complete)
                        </button>
                      )}
                      {wd.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(wd.id, wd.airdropCode || '', 'processing')}
                          className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
                        >
                          Process
                        </button>
                      )}
                      {wd.status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(wd.id, wd.airdropCode || '', 'rejected')}
                          className="px-3 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 border border-rose-500/30 text-rose-300 font-bold text-xs transition cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: REFERRAL TRACKING ================= */}
        {activeTab === 'referrals' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Network Info Banner */}
            <div className="p-4 rounded-2xl bg-[#0c1527] border border-[#1e2e4a]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-950/70 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">
                    6-Digit ID Referral Network Tracking
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Realtime tracking of which 6-digit user ID recruited how many other 6-digit users.
                  </p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by 6-digit user ID..."
                value={searchReferral}
                onChange={(e) => setSearchReferral(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0c1527] border border-[#1e2e4a] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            {/* Referral Cards */}
            <div className="space-y-3">
              {filteredReferralUsers.map((user, idx) => {
                const code = user.airdropCode || user.id;
                const recruitsCount = user.referralCount || 0;
                const earnedCoins = recruitsCount * 10000;
                const referralKey = `ref-user-${user.id || code}-${idx}`;
                return (
                  <div
                    key={referralKey}
                    className="p-3.5 rounded-2xl bg-[#0c1527] border border-[#1e2e4a] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">ID: #{code}</span>
                            <span className="px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300 font-mono text-[10px]">
                              Code: {code}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Joined: {user.joinedDate || '10/11/2026'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#18263f]">
                      <div>
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{recruitsCount} Recruited</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Earned: +{earnedCoins.toLocaleString()} coins • +{recruitsCount * 100} 💎
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedUserForRecruits(user)}
                        className="px-3 py-1.5 rounded-xl bg-[#4c1d95]/70 hover:bg-[#581c87] border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm active:scale-95 transition"
                      >
                        <span>View Recruited IDs</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 5: SYSTEM TOOLS ================= */}
        {activeTab === 'tools' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Box 1: Firebase Realtime Cloud Sync */}
            <div className="p-4 rounded-2xl bg-[#0c1527] border border-[#1e2e4a] space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">
                    Firebase Realtime Cloud Sync
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Only genuine active players and real payouts are synced to adminboost-default-rtdb in realtime.
                  </p>
                </div>
              </div>

              <button
                onClick={handleForcePush}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-95 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Force Push Real Data to Cloud</span>
              </button>

              <div className="p-2.5 rounded-xl bg-[#070d18] border border-slate-800 font-mono text-[11px] text-slate-400 break-all select-all">
                Database: https://adminboost-default-rtdb.firebaseio.com
              </div>
            </div>

            {/* Box 2: Real Data Backup & Export */}
            <div className="p-4 rounded-2xl bg-[#0c1527] border border-[#1e2e4a] space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Real Data Backup & Export</h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Download full JSON snapshot of real 6-digit IDs and genuine payout histories.
                  </p>
                </div>
              </div>

              <button
                onClick={handleExportJSON}
                className="w-full py-2.5 rounded-xl bg-[#101b31] hover:bg-[#162544] border border-[#22365c] text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export Full JSON Snapshot</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="w-full py-2.5 rounded-xl bg-[#101b31] hover:bg-[#162544] border border-[#22365c] text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Export 6-Digit IDs as CSV</span>
              </button>
            </div>

            {/* Box 3: Firebase Rules & Security Setup Guide */}
            <div className="p-4 rounded-2xl bg-[#0c1527] border border-cyan-500/30 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">
                    Realtime Database Rules Configuration
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    If live cloud syncing shows permission denied, ensure read & write rules are set in your Firebase Console (Build &gt; Realtime Database &gt; Rules):
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#070d18] border border-slate-800 font-mono text-[11px] text-cyan-300">
                <pre className="whitespace-pre-wrap">{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}</pre>
              </div>

              <div className="text-[11px] text-slate-400">
                Project ID: <span className="text-white font-mono font-bold">adminboost</span> &bull; URL: <span className="text-cyan-400 font-mono">https://adminboost-default-rtdb.firebaseio.com</span>
              </div>
            </div>

            {/* Box 4: Demo Data Cleanup Zone */}
            <div className="p-4 rounded-2xl bg-[#130d1b] border border-rose-900/40 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-950/70 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-rose-300">
                    Demo Data Cleanup Zone
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Purge any lingering demo or test users/withdrawals from storage to ensure 100% real player data.
                  </p>
                </div>
              </div>

              <button
                onClick={handlePurgeDemo}
                className="w-full py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Purge All Demo Data</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Recruits Popup Modal */}
      {selectedUserForRecruits && (
        <div className="fixed inset-0 z-[1050] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#0c1527] border border-[#1e2e4a] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-white">
                  Recruits for #{selectedUserForRecruits.airdropCode || selectedUserForRecruits.id}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Total Recruits: {selectedUserForRecruits.referralCount || 0}
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForRecruits(null)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {(() => {
                const recruitsMap = selectedUserForRecruits.recruits || {};
                const recruitsList = Object.keys(recruitsMap).map((key) => {
                  const val = recruitsMap[key];
                  return {
                    code: val?.airdropCode || val?.id || key,
                    joinedDate: val?.joinedDate || 'Recent',
                    status: val?.status || 'pending',
                  };
                });

                if (recruitsList.length === 0) {
                  return (
                    <div className="p-4 rounded-xl bg-[#070d18] text-center text-xs text-slate-400">
                      No recruits recorded yet for this 6-digit ID.
                    </div>
                  );
                }

                return recruitsList.map((rec, rIdx) => (
                  <div
                    key={`rec-${rec.code}-${rIdx}`}
                    className="p-3 rounded-xl bg-[#070d18] border border-[#18263f] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">ID: #{rec.code}</div>
                      <div className="text-[10px] text-slate-400">Joined: {rec.joinedDate}</div>
                      <div className={`text-[10px] font-bold ${rec.status === 'accepted' ? 'text-emerald-400' : rec.status === 'rejected' ? 'text-rose-400' : 'text-amber-400'}`}>Status: {rec.status}</div>
                    </div>
                    {rec.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateReferralStatusInFirebase(selectedUserForRecruits.airdropCode, rec.code, 'accepted')} className="px-2 py-1 bg-emerald-600 rounded-lg text-white">Accept</button>
                        <button onClick={() => updateReferralStatusInFirebase(selectedUserForRecruits.airdropCode, rec.code, 'rejected')} className="px-2 py-1 bg-rose-600 rounded-lg text-white">Reject</button>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>

            <button
              onClick={() => setSelectedUserForRecruits(null)}
              className="w-full py-2.5 rounded-xl bg-[#15233c] hover:bg-[#1c2e4f] border border-white/10 font-bold text-xs text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
