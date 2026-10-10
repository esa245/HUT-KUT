import React, { useState, useRef, useCallback } from 'react';
import { Zap, Flame } from 'lucide-react';
import { FloatingParticle, Language } from '../types/game';
import { translations, formatNumber, toBengaliDigits } from '../utils/translations';
import { soundManager } from '../utils/audio';
import coinImg from '../assets/images/hut_kut_coin.jpg';

interface TapAreaProps {
  energy: number;
  maxEnergy: number;
  clickPower: number;
  energyRegenRate: number;
  isTurboActive: boolean;
  turboSecondsLeft: number;
  language: Language;
  onTap: (count: number, coords: Array<{ x: number; y: number }>) => void;
  floatingParticles: FloatingParticle[];
}

export const TapArea: React.FC<TapAreaProps> = ({
  energy,
  maxEnergy,
  clickPower,
  energyRegenRate,
  isTurboActive,
  turboSecondsLeft,
  language,
  onTap,
  floatingParticles,
}) => {
  const t = translations[language];
  const coinContainerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);

  const energyPercent = Math.max(0, Math.min(100, (energy / maxEnergy) * 100));
  const effectivePower = isTurboActive ? clickPower * 5 : clickPower;

  // Calculate remaining time to full energy (24h full recharge cycle)
  const secondsToFull = energy < maxEnergy && energyRegenRate > 0
    ? Math.max(0, Math.round((maxEnergy - energy) / energyRegenRate))
    : 0;
  const hoursToFull = Math.floor(secondsToFull / 3600);
  const minsToFull = Math.floor((secondsToFull % 3600) / 60);
  const secsToFull = secondsToFull % 60;

  // Multi-touch handler for mobile touch screens
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault(); // prevent unwanted scrolling / zoom
      if (energy < effectivePower && !isTurboActive) {
        soundManager.playClick();
        return;
      }

      const rect = coinContainerRef.current?.getBoundingClientRect();
      const coords: Array<{ x: number; y: number }> = [];

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (rect) {
          coords.push({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
          });

          // calculate tilt based on first touch relative to center
          if (i === 0) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const deltaX = (touch.clientX - rect.left - centerX) / centerX;
            const deltaY = (touch.clientY - rect.top - centerY) / centerY;
            setTilt({ x: deltaX * 15, y: -deltaY * 15 });
          }
        }
      }

      setIsPressed(true);
      if (coords.length > 0) {
        onTap(coords.length, coords);
      }
    },
    [energy, effectivePower, isTurboActive, onTap]
  );

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  // Desktop Pointer fallback
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only process mouse clicks if not already a touch event
      if (e.pointerType === 'touch') return;

      if (energy < effectivePower && !isTurboActive) {
        soundManager.playClick();
        return;
      }

      const rect = coinContainerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const deltaX = (clickX - centerX) / centerX;
      const deltaY = (clickY - centerY) / centerY;
      setTilt({ x: deltaX * 15, y: -deltaY * 15 });
      setIsPressed(true);

      onTap(1, [{ x: clickX, y: clickY }]);
    },
    [energy, effectivePower, isTurboActive, onTap]
  );

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  const formatLangNumber = (num: number) => {
    const formatted = formatNumber(num, language);
    return language === 'bn' ? toBengaliDigits(formatted) : formatted;
  };

  return (
    <div className="flex-1 flex flex-col justify-between items-center py-4 px-4 relative overflow-hidden select-none max-w-4xl mx-auto w-full">
      {/* Turbo Active Banner */}
      {isTurboActive && (
        <div className="animate-bounce flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-extrabold text-xs shadow-lg shadow-amber-500/40 z-30 mb-1">
          <Flame className="w-4 h-4 fill-white animate-pulse" />
          <span>
            {t.turboActive} 5X COINS ({turboSecondsLeft}s)
          </span>
        </div>
      )}

      {/* Main Tapping Interactive Coin Section */}
      <div
        ref={coinContainerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative my-auto flex items-center justify-center cursor-pointer touch-none"
        style={{ perspective: 1000 }}
      >
        {/* Outer Glow Halo Ring */}
        <div
          className={`absolute rounded-full transition-all duration-300 pointer-events-none ${
            isTurboActive
              ? 'w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] bg-gradient-to-tr from-amber-500/40 via-orange-500/50 to-red-500/40 blur-2xl animate-pulse'
              : 'w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] bg-amber-500/20 blur-xl'
          }`}
        />

        {/* Decorative Golden Orbiting Ring */}
        <div className="absolute w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] rounded-full border border-amber-500/20 border-dashed animate-spin-slow pointer-events-none" />

        {/* The 3D Coin Button itself */}
        <div
          className={`relative w-[210px] h-[210px] sm:w-[250px] sm:h-[250px] rounded-full p-2.5 transition-transform duration-75 select-none ${
            isTurboActive
              ? 'ring-4 ring-orange-500/80 shadow-[0_0_50px_rgba(249,115,22,0.6)]'
              : 'ring-2 ring-amber-400/40 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
          }`}
          style={{
            transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale(${isPressed ? 0.94 : 1})`,
            transformStyle: 'preserve-3d',
            background: 'radial-gradient(circle, #2d1a04 0%, #170d03 70%, #0d0600 100%)',
          }}
        >
          {/* Beveled Coin Inner Container */}
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-amber-400/60 shadow-inner relative group">
            <img
              src={coinImg}
              alt="Hut Kut Tap Loys Coin"
              className="w-full h-full object-cover rounded-full pointer-events-none select-none transition-transform duration-150 group-hover:scale-105"
              draggable={false}
            />

            {/* Gleam reflection overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none rounded-full" />
          </div>
        </div>

        {/* Floating Numbers & Diamond Particles */}
        {floatingParticles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute pointer-events-none font-black text-xl sm:text-2xl z-50 animate-float-fade ${
              particle.type === 'diamond'
                ? 'text-cyan-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.9)]'
                : particle.type === 'turbo'
                ? 'text-orange-400 drop-shadow-[0_0_12px_rgba(249,115,22,1)] scale-125'
                : 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
            }`}
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
            }}
          >
            {particle.text}
          </div>
        ))}
      </div>

      {/* Energy Section */}
      <div className="w-full max-w-sm mt-auto z-10">
        <div className="flex items-center justify-between text-xs font-semibold mb-1.5 px-1">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="uppercase tracking-wider text-[11px] font-bold text-slate-300">
              {t.energy}
            </span>
          </div>
          <div className="text-slate-300 font-mono text-xs">
            <span className="font-bold text-white">{formatLangNumber(energy)}</span>
            <span className="text-white/40"> / </span>
            <span className="text-slate-400">{formatLangNumber(maxEnergy)}</span>
          </div>
        </div>

        {/* Energy Bar Track */}
        <div className="w-full h-3 bg-slate-950/80 rounded-full p-0.5 border border-white/10 shadow-inner overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-150 ease-out ${
              energyPercent < 20
                ? 'bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
            }`}
            style={{ width: `${energyPercent}%` }}
          />
        </div>

        {/* Tap Power & Rare Diamond chance info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
          <span>
            {language === 'bn' ? 'প্রতি ট্যাপে:' : 'Per Tap:'}{' '}
            <strong className="text-amber-400 font-bold">
              +{formatLangNumber(effectivePower)}
            </strong>
          </span>
          <span className="text-sky-300 font-medium">
            {language === 'bn' ? '💎 ০.৫% বিরল সুযোগ' : '💎 0.5% Rare Chance'}
          </span>
        </div>

        {/* Fast energy recharge countdown notice */}
        {energy < maxEnergy && (
          <div className="mt-1.5 text-[10.5px] text-center text-emerald-300/90 font-mono bg-slate-900/80 py-1 px-2 rounded-xl border border-emerald-500/20 shadow-sm flex items-center justify-center gap-1.5">
            <span className="animate-spin-slow text-emerald-400">⚡</span>
            <span>
              {language === 'bn'
                ? `এনার্জি রিচার্জ হচ্ছে: ${toBengaliDigits(minsToFull)} মিনিট ${toBengaliDigits(secsToFull)} সেকেন্ড বাকি`
                : `Energy refilling: ${minsToFull}m ${secsToFull}s remaining`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
