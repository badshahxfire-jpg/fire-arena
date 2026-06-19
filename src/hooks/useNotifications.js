import { useState, useEffect } from "react";
import { ref, onValue, update, remove, push, get } from "firebase/database";
import { database } from "../firebase";
import notificationSound from "../assets/notification.mp3";

const playNotificationSound = () => {
  try {
    const audio = new Audio(notificationSound);
    audio.volume = 1.0;
    audio.play().catch(e => console.log("Audio play failed:", e));
  } catch (e) {
    console.log("Audio error:", e);
  }
};

export function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [isSoundMuted, setIsSoundMuted] = useState(() => {
    try {
      return localStorage.getItem("isSoundMuted") === "true";
    } catch (e) {
      console.warn("localStorage is not available for isSoundMuted:", e);
      return false;
    }
  });

  const toggleMute = () => {
    setIsSoundMuted((prev) => {
      const newState = !prev;
      try {
        localStorage.setItem("isSoundMuted", String(newState));
      } catch (e) {
        console.warn(e);
      }
      return newState;
    });
  };

  useEffect(() => {
    if (!user) return;

    const notifRef = ref(database, `notifications/${user.uid}`);
    
    const unsubscribe = onValue(notifRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        const loadedData = Object.keys(data).map((key) => ({ 
          id: key, 
          ...data[key],
          seen: data[key].seen || false
        }));
        
        // Sort by newest first
        const sortedData = loadedData.sort((a, b) => {
          return new Date(b.time) - new Date(a.time);
        });
        
        setNotifications(sortedData);
        
        const unseen = sortedData.filter((item) => !item.seen);
        setUnseenCount(unseen.length);
        
        // Play sound for new notifications
        if (unseen.length > 0) {
          if (!isSoundMuted) {
            playNotificationSound();
          }
          
          // Show browser notification for latest
          const latest = sortedData[0];
          if (!latest.seen && Notification.permission === "granted") {
            new Notification(latest.title, {
              body: latest.message,
              icon: "/logo.png",
            });
          }
        }
      } else {
        setNotifications([]);
        setUnseenCount(0);
      }
    });
    
    // Request notification permission
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    
    return () => unsubscribe();
  }, [user]);

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    if (!user) return;
    try {
      await update(ref(database, `notifications/${user.uid}/${notificationId}`), {
        seen: true,
      });
    } catch (error) {
      console.log("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    try {
      for (const notif of notifications) {
        if (!notif.seen) {
          await update(ref(database, `notifications/${user.uid}/${notif.id}`), {
            seen: true,
          });
        }
      }
    } catch (error) {
      console.log("Error marking all as read:", error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!user) return;
    
    if (!window.confirm("Delete all notifications?")) return;
    
    try {
      await remove(ref(database, `notifications/${user.uid}`));
      alert("All Notifications Deleted ✅");
      setNotifications([]);
      setUnseenCount(0);
    } catch (error) {
      alert(error.message);
    }
  };

  // Send notification to user (Admin function)
  const sendNotification = async (userId, title, message) => {
    try {
      await push(ref(database, `notifications/${userId}`), {
        title,
        message,
        time: new Date().toLocaleString(),
        seen: false,
      });
      return true;
    } catch (error) {
      console.log("Error sending notification:", error);
      return false;
    }
  };

  // Send bulk notification to all joined players of a tournament
  const sendBulkNotification = async (tournamentId, title, message) => {
    try {
      const joinedRef = ref(database, "joinedPlayers");
      const snapshot = await get(joinedRef);
      const data = snapshot.val();
      
      if (data) {
        const players = Object.values(data).filter(p => p.tournamentId === tournamentId);
        
        for (const player of players) {
          await push(ref(database, `notifications/${player.userId}`), {
            title,
            message,
            time: new Date().toLocaleString(),
            seen: false,
          });
        }
      }
      return true;
    } catch (error) {
      console.log("Error sending bulk notification:", error);
      return false;
    }
  };

  return {
    notifications,
    unseenCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    sendNotification,
    sendBulkNotification,
    isSoundMuted,
    toggleMute,
  };
}