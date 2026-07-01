const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
});

const rtdb = admin.database();
const db = admin.firestore();

async function run() {
  const tId = '-OwO_2gjc1yBPNiCukY0';
  
  // 1. Get slotLocks
  const locksSnap = await rtdb.ref(`slotLocks/${tId}`).get();
  if (!locksSnap.exists()) {
    console.log("No locks found");
    process.exit();
  }
  
  const locks = locksSnap.val();
  let count = 0;
  
  for (let slot = 1; slot < locks.length; slot++) {
    const lockData = locks[slot];
    if (!lockData || !lockData.bookedBy) continue;
    
    const userId = lockData.bookedBy;
    
    // Check if they are already in joinedPlayers
    const joinedSnap = await rtdb.ref("joinedPlayers")
      .orderByChild("tournamentId").equalTo(tId).get();
      
    let alreadyJoined = false;
    if (joinedSnap.exists()) {
      Object.values(joinedSnap.val()).forEach(p => {
        if (p.userId === userId) alreadyJoined = true;
      });
    }
    
    if (alreadyJoined) {
      console.log(`Slot ${slot} (${userId}) is already in joinedPlayers. Skipping.`);
      continue;
    }
    
    console.log(`Restoring Slot ${slot} for User ${userId}...`);
    
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists) {
      console.log(`User ${userId} not found in Firestore. Skipping.`);
      continue;
    }
    const u = userSnap.data();
    
    // Notice selectedSlot is forced to Number, just like JoinPopup normally does via coercion
    const joinedData = {
      tournamentId: tId,
      tournamentTitle: 'boom',
      tournamentType: 'SOLO',
      userEmail: u.email,
      userId: userId,
      mobileNumber: u.mobileNumber || u.phone || '',
      gameUid: u.gameUid || u.uid || '',
      ingameName: u.ingameName || u.name || u.displayName || '',
      gameLevel: u.gameLevel || u.level || '',
      selectedSlot: Number(slot),
      createdAt: new Date(lockData.bookedAt).toLocaleString(),
      entryFeeDeducted: true,
      coinsDeducted: 25,
      winCoinsDeducted: 0
    };
    
    const pushRef = await rtdb.ref("joinedPlayers").push(joinedData);
    console.log(`Pushed to key: ${pushRef.key}`);
    console.log(`Restored Slot ${slot} successfully!`);
    count++;
  }
  
  console.log(`Restoration complete! Restored ${count} players.`);
  
  const verifySnap = await rtdb.ref("joinedPlayers").orderByChild("tournamentId").equalTo(tournamentId).once("value");
  console.log(`Found ${verifySnap.numChildren()} players in DB for this tournament after push.`);
  
  process.exit();
}

run();
