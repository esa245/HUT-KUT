import React, { useState } from 'react';
import { Users, Copy, Check, Share2, Sparkles, Send, Award, Gift, ArrowLeft } from 'lucide-react';
import { ReferralFriend, Language } from '../types/game';
import { translations, formatNumber, toBengaliDigits } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { getUserAirdropCode } from '../utils/firebase';
import { TopReferrers } from './TopReferrers';

interface ReferralViewProps {
  friends: ReferralFriend[];
  language: Language;
  onInviteFriend: (isPremium: boolean) => void;
  onBack: () => void;
}

export const ReferralView: React.FC<ReferralViewProps> = ({
  friends,
  language,
  onInviteFriend,
  onBack,
}) => {
  const t = translations[language];
  const [copied, setCopied] = useState(false);

  const myAirdropCode = getUserAirdropCode();
  const telegramReferralUrl = `http://t.me/hutkut_taptep_bot/myapp?start=${myAirdropCode}`;
  const webReferralUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${myAirdropCode}`;

  const [activeTab, setActiveTab] = useState<'telegram' | 'web'>('telegram');
  const referralUrl = activeTab === 'telegram' ? telegramReferralUrl : webReferralUrl;

  const handleCopy = () => {
    soundManager.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleTelegramShare = () => {
    soundManager.playClick();
    const shareText = encodeURIComponent(`🦊 Join HUT KUT TAP - Loys Coin tap-to-earn game with my exclusive referral link and get 10,000 FREE coins + 100 💎 diamonds!\n${telegramReferralUrl}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(telegramReferralUrl)}&text=${shareText}`, '_blank');
  };

  const handleWhatsAppShare = () => {
    soundManager.playClick();
    const shareText = encodeURIComponent(`🦊 Join HUT KUT TAP - Loys Coin tap-to-earn game and claim 10,000 bonus coins!\n${webReferralUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
  };

  const formatLangNumber = (num: number) => {
    const formatted = formatNumber(num, language);
    return language === 'bn' ? toBengaliDigits(formatted) : formatted;
  };

  const totalCoinsEarned = friends.reduce((sum, f) => sum + f.rewardEarned, 0);
  const totalDiamondsEarned = friends.reduce((sum, f) => sum + f.diamondsEarned, 0);

  return (
    <div className="flex-1 flex flex-col min-h-0 px-4 py-3 overflow-y-auto pb-24 select-none max-w-4xl mx-auto w-full">
      {/* Top Navigation Bar with Back Button */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            soundManager.playClick();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-sm hover:border-amber-500/40"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          <span>{t.backToTap}</span>
        </button>
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-4 h-4 text-amber-400" />
          <span>{t.friends}</span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border border-amber-500/30 text-center mb-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 mx-auto shadow-lg shadow-amber-500/30 mb-2.5">
          <Gift className="w-7 h-7" />
        </div>
        <h3 className="font-black text-lg text-white mb-0.5">{t.referralTitle}</h3>
        <p className="text-xs text-amber-200/80 max-w-md mx-auto leading-relaxed">{t.referralSubtitle}</p>
      </div>

      <TopReferrers />

      {/* Rewards Tiers Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
        {/* Tier 1: Regular */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">{t.regularFriend}</h4>
            <div className="text-xs font-black text-amber-400 mt-0.5">{t.regularReward}</div>
            <div className="text-[10px] text-slate-400">
              {language === 'bn' ? 'বন্ধু জয়েন করলেই দুজনেই পাবেন' : 'For both you and your friend'}
            </div>
          </div>
        </div>

        {/* Tier 2: Premium */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-purple-200">{t.premiumFriend}</h4>
            <div className="text-xs font-black text-purple-300 mt-0.5">{t.premiumReward}</div>
            <div className="text-[10px] text-slate-400">
              {language === 'bn' ? 'টেলিগ্রাম প্রিমিয়াম একাউন্টে ৩ গুণ বোনাস' : '3x rewards with Telegram Premium'}
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link & Sharing Actions */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 mb-4 shadow-md">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab('telegram')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold ${activeTab === 'telegram' ? 'bg-slate-700 text-white' : 'bg-slate-950 text-slate-400'}`}
          >
            {t.telegramInviteLink}
          </button>
          <button
            onClick={() => setActiveTab('web')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold ${activeTab === 'web' ? 'bg-slate-700 text-white' : 'bg-slate-950 text-slate-400'}`}
          >
            {t.webInviteLink}
          </button>
        </div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          {t.yourReferralLink}
        </label>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 bg-slate-950 px-3 py-2.5 rounded-xl border border-white/10 text-xs font-mono text-amber-300 truncate select-all">
            {referralUrl}
          </div>
          <button
            onClick={handleCopy}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              copied
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
            }`}
          >
            {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (language === 'bn' ? 'কপি হয়েছে' : 'Copied!') : t.copyLink}</span>
          </button>
        </div>

        {/* Quick share buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleTelegramShare}
            className="py-2.5 px-3 rounded-xl bg-[#229ED9]/20 hover:bg-[#229ED9]/30 border border-[#229ED9]/40 text-[#229ED9] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{t.shareTelegram}</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="py-2.5 px-3 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{t.shareWhatsApp}</span>
          </button>
        </div>
      </div>

      {/* Referral Statistics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">{t.friendsInvited}</div>
          <div className="text-lg font-black text-white mt-0.5">
            {language === 'bn' ? toBengaliDigits(friends.length) : friends.length}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">{t.coins}</div>
          <div className="text-lg font-black text-amber-400 mt-0.5">
            +{formatLangNumber(totalCoinsEarned)}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">{t.diamonds}</div>
          <div className="text-lg font-black text-sky-400 mt-0.5">
            +{formatLangNumber(totalDiamondsEarned)} 💎
          </div>
        </div>
      </div>

      {/* Friends List */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          {t.friendList} ({language === 'bn' ? toBengaliDigits(friends.length) : friends.length})
        </h4>

        {friends.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 text-center text-slate-400 text-xs">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>{t.noFriendsYet}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    friend.isPremium
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 text-white'
                      : 'bg-slate-800 text-amber-400 border border-white/10'
                  }`}>
                    {friend.isPremium ? '⭐' : '🦊'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white">{friend.name}</span>
                      {friend.isPremium && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                          PREMIUM
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">{friend.joinedAt}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-amber-400">
                    +{formatLangNumber(friend.rewardEarned)} 🪙
                  </div>
                  <div className="text-[10px] font-semibold text-sky-400">
                    +{friend.diamondsEarned} 💎
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
