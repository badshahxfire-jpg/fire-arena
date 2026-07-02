const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fire-baadshah-arena-default-rtdb.firebaseio.com"
});

async function checkJoinedPlayers() {
  const snap = await admin.database().ref("joinedPlayers").get();
  const data = snap.val() || {};
  
  const matches = {};
  
  Object.keys(data).forEach(k => {
    const p = data[k];
    if (!matches[p.tournamentTitle]) matches[p.tournamentTitle] = [];
    matches[p.tournamentTitle].push(p.userEmail);
  });
  
  for (const title in matches) {
    const emails = matches[title];
    const duplicates = emails.filter((item, index) => emails.indexOf(item) !== index);
    if (duplicates.length > 0) {
      console.log(`Tournament: ${title} has duplicates: ${duplicates}`);
    }
  }
  
  console.log("Done checking duplicates.");
  process.exit();
}
checkJoinedPlayers();
