import React, { useState, useEffect } from "react";
import { database } from "../../firebase";
import { ref, onValue, set, remove } from "firebase/database";

export default function AdminPolls() {
  const [poll, setPoll] = useState({
    question: "",
    options: [{ id: "opt1", text: "" }, { id: "opt2", text: "" }],
    isActive: false
  });
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const pollRef = ref(database, "settings/activePoll");
    const unsubPoll = onValue(pollRef, (snapshot) => {
      if (snapshot.exists()) {
        setPoll(snapshot.val());
      }
      setLoading(false);
    });

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

  const handleAddOption = () => {
    setPoll(prev => ({
      ...prev,
      options: [...(prev.options || []), { id: `opt${Date.now()}`, text: "" }]
    }));
  };

  const handleRemoveOption = (id) => {
    setPoll(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== id)
    }));
  };

  const handleOptionChange = (id, text) => {
    setPoll(prev => ({
      ...prev,
      options: prev.options.map(opt => opt.id === id ? { ...opt, text } : opt)
    }));
  };

  const handleSave = async () => {
    if (!poll.question.trim()) {
      alert("Please enter a question.");
      return;
    }
    const validOptions = poll.options.filter(o => o.text.trim() !== "");
    if (validOptions.length < 2) {
      alert("Please provide at least 2 options.");
      return;
    }

    setSaving(true);
    try {
      await set(ref(database, "settings/activePoll"), {
        ...poll,
        options: validOptions
      });
      alert("Poll updated successfully!");
    } catch (error) {
      console.error("Error saving poll:", error);
      alert("Failed to save poll.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure? This will delete all current votes and reset the poll.")) return;
    
    setSaving(true);
    try {
      await remove(ref(database, "pollVotes"));
      await set(ref(database, "settings/activePoll"), {
        question: "",
        options: [{ id: "opt1", text: "" }, { id: "opt2", text: "" }],
        isActive: false
      });
      alert("Poll reset successfully!");
    } catch (error) {
      console.error("Error resetting poll:", error);
      alert("Failed to reset poll.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center text-white py-10">Loading...</div>;
  }

  const totalVotes = Object.keys(votes).length;

  return (
    <div className="bg-[#121216] rounded-3xl p-6 border border-gray-800">
      <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-6 flex items-center gap-3">
        <span>📊</span> Manage Active Poll
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Col: Poll Editor */}
        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-2">POLL QUESTION</label>
            <input
              type="text"
              value={poll.question}
              onChange={(e) => setPoll({ ...poll, question: e.target.value })}
              placeholder="e.g. Which match should we host next?"
              className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white font-bold focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-gray-400">OPTIONS</label>
              <button 
                onClick={handleAddOption}
                className="text-xs text-orange-500 font-bold hover:text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full"
              >
                + ADD OPTION
              </button>
            </div>
            <div className="space-y-3">
              {poll.options?.map((opt, index) => (
                <div key={opt.id} className="flex gap-2">
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 bg-black/50 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-orange-500 outline-none"
                  />
                  {poll.options.length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(opt.id)}
                      className="w-11 h-11 flex-shrink-0 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500/20"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-black/30 p-4 rounded-xl border border-gray-800">
            <input
              type="checkbox"
              id="pollActive"
              checked={poll.isActive}
              onChange={(e) => setPoll({ ...poll, isActive: e.target.checked })}
              className="w-5 h-5 accent-orange-500 rounded"
            />
            <label htmlFor="pollActive" className="text-white font-bold cursor-pointer">
              Poll is Active (Visible to users)
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-orange-500 text-black font-black py-3 rounded-xl hover:bg-orange-400 transition"
            >
              {saving ? "SAVING..." : "SAVE POLL"}
            </button>
            <button
              onClick={handleReset}
              disabled={saving}
              className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 font-black py-3 rounded-xl hover:bg-red-500/20 transition"
            >
              RESET VOTES
            </button>
          </div>
        </div>

        {/* Right Col: Live Stats */}
        <div className="bg-black/30 rounded-2xl p-6 border border-gray-800 flex flex-col">
          <h3 className="text-lg font-black text-gray-300 mb-6 border-b border-gray-800 pb-4">
            Live Results ({totalVotes} Votes)
          </h3>
          
          <div className="flex-1 space-y-6">
            {poll.options?.filter(o => o.text.trim() !== "").map(opt => {
              const optVotes = Object.values(votes).filter(v => v === opt.id).length;
              const percent = totalVotes === 0 ? 0 : Math.round((optVotes / totalVotes) * 100);
              
              return (
                <div key={opt.id} className="relative">
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-bold text-gray-200">{opt.text}</span>
                    <div className="text-right">
                      <span className="block font-black text-lg text-orange-400">{percent}%</span>
                      <span className="text-xs text-gray-500">{optVotes} votes</span>
                    </div>
                  </div>
                  <div className="h-4 w-full bg-black rounded-full overflow-hidden border border-gray-800">
                    <div
                      style={{ width: `${percent}%` }}
                      className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000"
                    />
                  </div>
                </div>
              );
            })}

            {totalVotes === 0 && (
              <div className="text-center py-10 text-gray-500">
                No votes cast yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
