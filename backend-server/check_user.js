const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fire-baadshah-arena-default-rtdb.firebaseio.com"
});

const uid = "EVIHm1UDCcceYQR9yOYp6drGFHV2";

async function checkUser() {
  try {
    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    console.log("--- FIRESTORE USER DATA ---");
    console.log(userDoc.exists ? userDoc.data() : "User not found in Firestore");

    console.log("\n--- REALTIME DB COIN HISTORY ---");
    const coinHistSnap = await admin.database().ref(`coinHistory/${uid}`).get();
    if (coinHistSnap.exists()) {
      const history = coinHistSnap.val();
      const sortedHistory = Object.values(history).sort((a, b) => new Date(a.date) - new Date(b.date));
      sortedHistory.forEach(h => {
        console.log(`[${h.date}] ${h.type} : ${h.amount > 0 ? '+' : ''}${h.amount} - ${h.message}`);
      });
    } else {
      console.log("No coin history found in RTDB.");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

checkUser();
