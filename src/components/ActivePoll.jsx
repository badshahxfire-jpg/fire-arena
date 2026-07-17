import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, onValue, set } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";

export default function ActivePoll({ user }) {
  const [poll, setPoll] = useState(null);
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    // Listen to active poll configuration
    const pollRef = ref(database, "settings/activePoll");
    const unsubPoll = onValue(pollRef, (snapshot) => {
      const data = snapshot.val();
      setPoll(data);
      setLoading(false);
    });

    // Listen to poll votes
    const votesRef = ref(database, "pollVotes");
    const unsubVotes = onValue(votesRef, (snapshot) => {
      if (snapshot.exists()) {
        setVotes(snapshot.val());
      } else {
        setVotes({});
      }
    });

    return () => {
      unsubPoll();
      unsubVotes();
    };
  }, []);

  const handleVote = async (optionId) => {
    if (!user) {
      alert("Please login to cast your vote!");
      return;
    }
    
    // Prevent double voting (just in case UI doesn't catch it quickly)
    if (votes[user.uid]) return;

    setVoting(true);
    try {
      const userVoteRef = ref(database, `pollVotes/${user.uid}`);
      await set(userVoteRef, optionId);
    } catch (error) {
      console.error("Error casting vote:", error);
      alert("Failed to cast vote. Please try again.");
    } finally {
      setVoting(false);
    }
  };

  if (loading) return null;
  if (!poll || !poll.isActive) return null;

  const totalVotes = Object.keys(votes).length;
  const userVotedId = user ? votes[user.uid] : null;

  // Calculate percentages
  const getPercentage = (optionId) => {
    if (totalVotes === 0) return 0;
    const optionVotes = Object.values(votes).filter(v => v === optionId).length;
    return Math.round((optionVotes / totalVotes) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 my-6 w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/50 backdrop-blur-md rounded-3xl p-6 border border-orange-500/20 relative overflow-hidden shadow-2xl"
      >
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/4 w-1/2 h-full bg-gradient-to-b from-orange-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              📊
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider">{poll.question || "Community Poll"}</h3>
              <p className="text-sm text-gray-400 font-medium">Vote for the next match!</p>
            </div>
          </div>

          <div className="space-y-3">
            {!userVotedId ? (
              // Voting View
              <AnimatePresence>
                {poll.options && poll.options.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => handleVote(option.id)}
                    disabled={voting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-between transition-all duration-300 ${
                      voting ? "opacity-50 cursor-wait bg-white/5 text-gray-400" : "bg-white/5 hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/30 text-gray-300 hover:text-white"
                    }`}
                  >
                    <span>{option.text}</span>
                    <span className="text-sm opacity-50">Vote ➜</span>
                  </motion.button>
                ))}
              </AnimatePresence>
            ) : (
              // Results View
              <div className="space-y-4">
                {poll.options && poll.options.map((option) => {
                  const percent = getPercentage(option.id);
                  const isSelected = userVotedId === option.id;

                  return (
                    <div key={option.id} className="relative">
                      <div className="flex justify-between items-end mb-2">
                        <span className={`font-bold text-sm ${isSelected ? "text-orange-400" : "text-gray-300"}`}>
                          {option.text} {isSelected && "✓"}
                        </span>
                        <span className={`font-bold text-lg ${isSelected ? "text-orange-400" : "text-gray-400"}`}>
                          {percent}%
                        </span>
                      </div>
                      
                      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${isSelected ? "bg-gradient-to-r from-orange-500 to-rose-500" : "bg-gray-600"}`}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="text-center pt-2 text-xs font-bold text-gray-500 tracking-wider">
                  TOTAL VOTES: {totalVotes}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
