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
                  html: `
                  <body>
                    <main
                      style="
                        max-width: 42rem;
                        margin: auto;
                        border: 1px solid #dedede;
                        border-radius: 0.5rem;
                        overflow: hidden;
                        height: fit-content;
                      "
                    >
                      <div style="padding: 1.5rem 3rem; background-color: #1b651b">
                        <h2 style="color: white">${
                          election.data().name
                        } has started!</h2>
                      </div>
                      <div style="padding: 1.5rem 3rem">
                        <p>Hello, <span style="font-weight: bold">${fullName}!</span></p>
                        <p>
                          An admin created an account for you as a voter in
                          <a href="https://eboto-mo.com" target="_blank" style="color: #1b651b"
                            >eBoto Mo.</a
                          >
                        </p>
                        <blockquote style="line-height: 1rem">
                          <h3>Your credentials</h3>
                          <div style="line-height: 0.5rem">
                            <p>
                              Email:
                              <span style="font-weight: bold">${email}</span>
                            </p>
                            <p>
                              Password: <span style="font-weight: bold">${password}</span>
                            </p>
                          </div>
                        </blockquote>
                        <p>Always remember to vote wisely!</p>
                        <a
                          href="https://eboto-mo.com/signin"
                          target="_blank"
                          style="
                            margin-top: 2rem;
                            margin-left: auto;
                            margin-right: auto;
                            display: block;
                            width: fit-content;
                            padding: 1rem 4rem;
                            background-color: #1b651b;
                            color: white;
                            text-align: center;
                            border-radius: 1rem;
                            text-decoration: none;
                            font-weight: bold;
                          "
                          >Sign in
                        </a>
                      </div>
                    </main>
                  </body>
                  `,
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
