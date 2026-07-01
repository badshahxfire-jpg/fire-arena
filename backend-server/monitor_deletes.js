const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
});

const rtdb = admin.database();

async function run() {
  const tId = '-OwO_2gjc1yBPNiCukY0';
  console.log("Listening for child_removed on joinedPlayers...");
  
  rtdb.ref("joinedPlayers").on("child_removed", (snapshot) => {
    const val = snapshot.val();
    if (val && val.tournamentId === tId) {
      console.log(`\n⚠️ PLAYER REMOVED: ${val.ingameName} (Slot ${val.selectedSlot}, ID: ${snapshot.key})`);
      console.log(`Time: ${new Date().toLocaleString()}`);
    }
  });

  rtdb.ref("joinedPlayers").on("child_added", (snapshot) => {
    const val = snapshot.val();
    if (val && val.tournamentId === tId) {
      console.log(`✅ PLAYER ADDED: ${val.ingameName} (Slot ${val.selectedSlot}, ID: ${snapshot.key})`);
    }
  });

  rtdb.ref("debug_logs").on("child_added", (snapshot) => {
    console.log(`🚨 FRONTEND CALLED REMOVE! 🚨`);
    console.log(snapshot.val());
  });

  // Keep alive
  setInterval(() => {}, 1000);
}

run();
