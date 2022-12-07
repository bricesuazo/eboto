import * as functions from "firebase-functions";
import admin from "firebase-admin";

admin.initializeApp();

export const sendEmailToVoters = functions.pubsub
  .schedule("0 * * * *")
  .onRun(async () => {
    const db = admin.firestore();
    const electionsRef = db.collection("elections");
    const elections = await electionsRef.get();
    const now = new Date();
    const nowRounded = new Date(
      Math.round(now.getTime() / (1000 * 60 * 30)) * (1000 * 60 * 30)
    );

    elections.forEach(async (election) => {
      if (
        election.data().electionStartDate.seconds ===
        admin.firestore.Timestamp.fromDate(nowRounded).seconds
      ) {
        if (
          election.data().publicity === "private" ||
          election.data().publicity !== "voters"
        ) {
          await admin
            .firestore()
            .collection("elections")
            .doc(election.id)
            .update({
              publicity: "voters",
            });
        }
        const votersRef = db
          .collection("elections")
          .doc(election.id)
          .collection("voters");
        const voters = await votersRef.get();

        voters.forEach(async (voter) => {
          const { email, password, emailSent, fullName } = voter.data();
          if (!emailSent) {
            await admin
              .firestore()
              .collection("mail")
              .add({
                to: email,
                message: {
                  subject: `Election Started ${election.data().name}`,
                  html: `Hi ${fullName},<br/>Email: ${email}<br/>Initial password: ${password}`,
                },
              })
              .then(() => {
                votersRef.doc(voter.id).update({ emailSent: true });
              });
          }
        });
      }
    });
  });
