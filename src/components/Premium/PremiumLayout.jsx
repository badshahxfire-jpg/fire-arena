import React, { useState } from "react";
import PremiumNavbar from "./PremiumNavbar";
import PremiumSidebar from "./PremiumSidebar";
import PremiumHero from "./PremiumHero";
import PremiumTournaments from "./PremiumTournaments";
import PremiumStats from "./PremiumStats";

export default function PremiumLayout({
  user,
  coins,
  unseenCount,
  tournaments,
  analytics,
  onLoginClick,
  onRegisterClick,
  onWalletClick,
  onNotificationsClick,
  onProfileClick,
  onWithdrawClick,
  onHistoryClick,
  onReferralClick,
  onJoinClick,
  onLeaderboardClick,
  onToggleUI
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30">
      <PremiumNavbar 
        user={user}
        coins={coins}
        unseenCount={unseenCount}
        onLoginClick={onLoginClick}
        onRegisterClick={onRegisterClick}
        onWalletClick={onWalletClick}
        onNotificationsClick={onNotificationsClick}
        onProfileClick={onProfileClick}
        onToggleUI={onToggleUI}
        onToggleSidebar={() => setIsSidebarOpen(true)}
      />

      <div className="flex">
        <PremiumSidebar 
          coins={coins}
          onWalletClick={onWalletClick}
          onWithdrawClick={onWithdrawClick}
          onHistoryClick={onHistoryClick}
          onReferralClick={onReferralClick}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden w-full max-w-[1600px] mx-auto">
          <PremiumHero stats={analytics} />
          
          <PremiumTournaments 
            tournaments={tournaments} 
            onJoinClick={onJoinClick} 
          />
          
          <PremiumStats 
            stats={analytics}
            onDeposit={onWalletClick}
            onWithdraw={onWithdrawClick}
            onProfile={onProfileClick}
            onHistory={onHistoryClick}
            onLeaderboard={onLeaderboardClick}
            onNotifications={onNotificationsClick}
          />
          
          {/* Minimal Footer */}
          <footer className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-orange-500 text-xl">🔥</span>
              <span className="font-bold text-gray-400">FIRE BAADSHAH ARENA</span>
            </div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-orange-500 transition">PLAY</a>
              <a href="#" className="hover:text-orange-500 transition">COMPETE</a>
              <a href="#" className="hover:text-orange-500 transition">WIN</a>
            </div>
            <div>
              © 2026 FIRE BAADSHAH ARENA. All Rights Reserved.
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
