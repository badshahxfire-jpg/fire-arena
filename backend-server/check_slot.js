const admin = require("firebase-admin");
require("dotenv").config();

const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
  });
}

const db = admin.firestore();
const rtdb = admin.database();

const userIdToCheck = "HNEH1UHXp4TEy9wSjen5wf4rK892";

async function checkUserSlot() {
  try {
    let found = false;
    const userDoc = await db.collection("users").doc(userIdToCheck).get();
    if (userDoc.exists) {
      console.log("User Profile Found:");
      console.log("Player Name:", userDoc.data().playerName);
      console.log("Game UID:", userDoc.data().gameUid);
      console.log("Level:", userDoc.data().level);
    } else {
      console.log("User ID not found in Firestore 'users' collection.");
    }

    const pkJoinedRef = rtdb.ref('joinedPerKillPlayers');
    const pkSnapshot = await pkJoinedRef.once('value');
    const pkData = pkSnapshot.val();

    // Update LEADER to slot 13
    await rtdb.ref('joinedPerKillPlayers/-Ovp3LbPRoMnIsSOlkrL').update({ selectedSlot: 13 });
    console.log("Updated LEADER to slot 13!");

    // Update H4X ZICO to slot 14
    await rtdb.ref('joinedPerKillPlayers/-Ovp3TIJmQ3xfAIr2fo0').update({ selectedSlot: 14 });
    console.log("Updated H4X ZICO to slot 14!");
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}
checkUserSlot();
