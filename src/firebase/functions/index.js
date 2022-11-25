import * as functions from "firebase-functions";
import admin from "firebase-admin";

admin.initializeApp();

export const sendEmailToVoters = functions.pubsub
  .schedule("30 * * * *")
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
        const votersRef = db
          .collection("elections")
          .doc(election.id)
          .collection("voters");
        const voters = await votersRef.get();

        voters.forEach(async (voter) => {
          const { email, initialPassword, emailSent } = voter.data();
          if (!emailSent) {
            await admin
              .firestore()
              .collection("mail")
              .add({
                to: email,
                message: {
                  subject: `Election Started ${election.data().electionName}`,
                  html: `Email:${email}<br/>Initial password: ${initialPassword}`,
                },
              })
              .then(() => {
                votersRef.doc(voter.id).update({ emailSent: true });
              });
          }
        });
      }
      return null;
    });
  });

// schedule a email send to voters with their credentials when the election is started
// export const sendVoterCredentials = functions.firestore
//   .document("elections/{electionId}")
//   .onWrite(async (change, context) => {
//     console.log("change.after.data()", change.after.data());
//     console.log("context", context);

//     // const election = change.after.data();
//     // const electionId = context.params.electionId;
//     // const db = admin.firestore();

//     // if (election.status === "started") {
//     //   const voters = await db
//     //     .collection("elections")
//     //     .doc(electionId)
//     //     .collection("voters")
//     //     .get();

//     //   voters.forEach(async (voter) => {
//     //     const voterData = voter.data();
//     //     const voterId = voter.id;

//     //     const email = {
//     //       to: voterData.email,
//     //       from: " <your email>",
//     //       subject: "Your credentials for the election",
//     //       text: `Your credentials for the election are: \n Voter ID: ${voterId} \n Password: ${voterData.password}`,
//     //     };

//     //     await db
//     //       .collection("elections")
//     //       .doc(electionId)
//     //       .collection("voters")
//     //       .doc(voterId)
//     //       .update({ emailSent: true });
//     //   });
//     // }
//   });
