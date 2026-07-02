const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fire-baadshah-arena-default-rtdb.firebaseio.com"
});

async function cleanupDuplicates() {
  const db = admin.database();
  const firestore = admin.firestore();
  const snap = await db.ref("joinedPlayers").get();
  const data = snap.val() || {};
  
  const userJoined = {}; // "tournamentId_userEmail" -> key of the first one
  let deletedCount = 0;
  let refundedAmount = 0;

  for (const key in data) {
    const p = data[key];
    const uniqueKey = `${p.tournamentId}_${p.userEmail}`;
    
    if (userJoined[uniqueKey]) {
      // It's a duplicate!
      console.log(`Deleting duplicate for ${p.userEmail} in ${p.tournamentTitle} (key: ${key})`);
      
      const coinsDeducted = Number(p.coinsDeducted || 0);
      const winCoinsDeducted = Number(p.winCoinsDeducted || 0);
      
      // Refund the coins in Firestore
      if (coinsDeducted > 0) {
        const userRef = firestore.collection("users").doc(p.userId);
        await userRef.update({
          coins: admin.firestore.FieldValue.increment(coinsDeducted),
          winCoins: admin.firestore.FieldValue.increment(winCoinsDeducted)
        });
        
        // Log transaction
        await firestore.collection("users").doc(p.userId).collection("coinHistory").add({
          amount: coinsDeducted,
          type: "REFUND",
          description: `Refund for duplicate join: ${p.tournamentTitle}`,
          reason: `Refund for duplicate join: ${p.tournamentTitle}`,
          isAddition: true,
          isBonus: false,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          date: new Date().toLocaleString(),
          dateString: new Date().toLocaleString()
        });
        console.log(`Refunded ${coinsDeducted} coins to ${p.userEmail}`);
        refundedAmount += coinsDeducted;
      }

      // Delete from RTDB
      await db.ref(`joinedPlayers/${key}`).remove();
      deletedCount++;
    } else {
      // First time seeing this user in this tournament
      userJoined[uniqueKey] = key;
    }
  }
  
  console.log(`Cleanup complete! Deleted ${deletedCount} duplicate entries and refunded ${refundedAmount} coins.`);
  process.exit();
}
cleanupDuplicates();
