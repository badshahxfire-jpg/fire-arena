const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
  });
}

const rtdb = admin.database();

async function syncPrizePool() {
  try {
    const liveTournamentsSnap = await rtdb.ref("liveTournaments").once("value");
    const joinedPlayersSnap = await rtdb.ref("joinedPlayers").once("value");

    const liveTournaments = liveTournamentsSnap.val();
    const joinedPlayers = joinedPlayersSnap.val() || {};

    if (!liveTournaments) {
      console.log("No live tournaments.");
      process.exit(0);
    }

    for (const [tId, tournament] of Object.entries(liveTournaments)) {
      let actualJoinedCount = 0;
      for (const key in joinedPlayers) {
        if (joinedPlayers[key].tournamentId === tId) {
          actualJoinedCount++;
        }
      }

      const entryFee = Number(tournament.entryFee) || 0;
      
      let multiplier = 1;
      if (tournament.tournamentType === "DUO" || tournament.tournamentType === "2V2") multiplier = 2;
      else if (tournament.tournamentType === "SQUAD" || tournament.tournamentType === "4V4") multiplier = 4;
      else if (tournament.tournamentType === "3V3") multiplier = 3;
      else if (tournament.tournamentType === "1V2") multiplier = 2;

      const realPlayerCount = actualJoinedCount * multiplier;
      const totalCollection = entryFee * realPlayerCount;
      const adminProfit = Math.floor(totalCollection * 0.10);
      const currentPrizePool = Math.floor(totalCollection - adminProfit);

      console.log(`Tournament ${tId} (${tournament.tournamentTitle}):`);
      console.log(`  Actual Joined: ${actualJoinedCount}`);
      console.log(`  Real Players: ${realPlayerCount}`);
      console.log(`  Collection: ${totalCollection}`);
      console.log(`  Prize Pool: ${currentPrizePool}`);

      if (
        tournament.joinedCount !== actualJoinedCount ||
        tournament.currentPrizePool !== currentPrizePool
      ) {
        await rtdb.ref(`liveTournaments/${tId}`).update({
          joinedCount: actualJoinedCount,
          realPlayerCount: realPlayerCount,
          currentPrizePool: currentPrizePool,
          currentAdminProfit: adminProfit
        });
        console.log(`  -> UPDATED in DB!`);
      } else {
        console.log(`  -> Already in sync.`);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

syncPrizePool();
