import React, { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { rtdb } from '../utils/firebase';
import { Trophy, Users } from 'lucide-react';

export const TopReferrers: React.FC = () => {
  const [topReferrers, setTopReferrers] = useState<any[]>([]);

  useEffect(() => {
    const usersRef = ref(rtdb, 'users');
    const unsub = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const usersArray = Object.entries(data).map(([key, val]: [string, any]) => {
        const recruits = val.recruits || {};
        const acceptedRecruits = Object.values(recruits).filter(
          (r: any) => r.status === 'accepted'
        ).length;
        return {
          id: val.airdropCode || key,
          acceptedCount: acceptedRecruits,
        };
      });

      const sorted = usersArray
        .filter(u => u.acceptedCount > 0)
        .sort((a, b) => b.acceptedCount - a.acceptedCount)
        .slice(0, 10);

      setTopReferrers(sorted);
    });

    return () => off(usersRef);
  }, []);

  if (topReferrers.length === 0) return null;

  return (
    <div className="p-4 rounded-3xl bg-slate-900 border border-amber-500/30 mb-4 shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-amber-400" />
        <h3 className="font-black text-white">Top 10 Referrers</h3>
      </div>
      <div className="max-h-96 overflow-y-auto pr-2 space-y-2">
        {topReferrers.map((user, index) => (
          <div key={user.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                #{index + 1}
              </span>
              <span className="text-sm font-bold text-slate-200">Airdrop ID: {user.id}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-black text-sm">
              <Users className="w-4 h-4" />
              {user.acceptedCount}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-slate-500 text-center font-mono">
        Source: adminboost-default-rtdb (Realtime)
      </div>
    </div>
  );
};
