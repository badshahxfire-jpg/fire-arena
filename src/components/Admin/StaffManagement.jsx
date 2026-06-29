import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { ref as dbRef, set as dbSet } from "firebase/database";
import { db, database } from "../../firebase";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    try {
      setLoading(true);
      const staffDoc = await getDoc(doc(db, "adminData", "staffList"));
        setStaffList(staffDoc.data().emails || []);
        // Sync to RTDB on fetch to ensure it's up to date
        const joinedEmails = (staffDoc.data().emails || []).join(",");
        await dbSet(dbRef(database, "adminData/staffEmails"), joinedEmails);
      } else {
        // Create document if it doesn't exist
        await setDoc(doc(db, "adminData", "staffList"), { emails: [] });
        setStaffList([]);
        await dbSet(dbRef(database, "adminData/staffEmails"), "");
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    const emailToAdd = newStaffEmail.trim().toLowerCase();
    
    if (!emailToAdd) return;
    
    // Basic email validation
    if (!emailToAdd.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    if (staffList.includes(emailToAdd)) {
      alert("This email is already in the staff list.");
      return;
    }

    try {
      setActionLoading(true);
      const staffRef = doc(db, "adminData", "staffList");
      
      // Update Firestore
      await setDoc(staffRef, {
        emails: arrayUnion(emailToAdd)
      }, { merge: true });
      // Update local state
      const updatedList = [...staffList, emailToAdd];
      setStaffList(updatedList);
      
      // Sync to RTDB
      await dbSet(dbRef(database, "adminData/staffEmails"), updatedList.join(","));
      
      setNewStaffEmail("");
      alert(`✅ ${emailToAdd} has been added as Staff!`);
    } catch (error) {
      console.error("Failed to add staff:", error);
      alert("Error adding staff. Check permissions.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveStaff = async (emailToRemove) => {
    if (!window.confirm(`Are you sure you want to remove ${emailToRemove} from staff?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const staffRef = doc(db, "adminData", "staffList");
      
      // Update Firestore
      await setDoc(staffRef, {
        emails: arrayRemove(emailToRemove)
      }, { merge: true });
      
      // Update local state
      const updatedList = staffList.filter(e => e !== emailToRemove);
      setStaffList(updatedList);
      
      // Sync to RTDB
      await dbSet(dbRef(database, "adminData/staffEmails"), updatedList.join(","));
      
      alert(`🚫 ${emailToRemove} has been removed from Staff!`);
    } catch (error) {
      console.error("Failed to remove staff:", error);
      alert("Error removing staff. Check permissions.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <div className="bg-[#111] border border-purple-500/20 rounded-3xl p-6 md:p-8 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
        
        {/* Header */}
        <div className="mb-8 border-b border-gray-800 pb-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-wider">
            Staff Management
          </h2>
          <p className="text-gray-400 text-sm mt-2 font-medium max-w-lg mx-auto">
            Add or remove staff members using their email address. Staff members have limited access to the admin dashboard (they cannot add/deduct coins, manage staff, or change app settings).
          </p>
        </div>

        {/* Add Staff Form */}
        <div className="bg-[#1a1a2e] p-6 rounded-2xl border border-purple-500/10 mb-8">
          <h3 className="text-lg font-black text-purple-400 mb-4 flex items-center gap-2">
            <span>➕</span> ADD NEW STAFF
          </h3>
          <form onSubmit={handleAddStaff} className="flex flex-col md:flex-row gap-4">
            <input
              type="email"
              placeholder="Enter staff email address"
              value={newStaffEmail}
              onChange={(e) => setNewStaffEmail(e.target.value)}
              className="flex-1 bg-black rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-purple-500 text-white transition-all"
              disabled={actionLoading}
            />
            <button
              type="submit"
              disabled={actionLoading || !newStaffEmail}
              className="bg-purple-600 hover:bg-purple-700 text-white font-black px-8 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-wait whitespace-nowrap"
            >
              {actionLoading ? "ADDING..." : "ADD STAFF"}
            </button>
          </form>
        </div>

        {/* Staff List */}
        <div>
          <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <span>👥</span> CURRENT STAFF MEMBERS ({staffList.length})
          </h3>
          
          {loading ? (
            <div className="text-center py-12 text-purple-400 font-bold animate-pulse">
              LOADING STAFF LIST...
            </div>
          ) : staffList.length === 0 ? (
            <div className="text-center py-12 bg-black/40 rounded-2xl border border-gray-800">
              <p className="text-gray-500 font-bold">No staff members found.</p>
              <p className="text-gray-600 text-sm mt-1">Add an email above to grant staff access.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {staffList.map((email, index) => (
                <div key={index} className="bg-black/50 border border-gray-800 hover:border-purple-500/30 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 transition-all">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="bg-purple-500/20 text-purple-400 p-2 rounded-lg">
                      👨‍💼
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-white font-bold truncate">{email}</p>
                      <p className="text-purple-400/60 text-xs font-bold uppercase mt-0.5">Staff Account</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveStaff(email)}
                    disabled={actionLoading}
                    className="w-full md:w-auto bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-6 py-2.5 rounded-lg font-black text-xs transition-all disabled:opacity-50"
                  >
                    REMOVE
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
