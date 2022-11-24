import * as functions from "firebase-functions";
import admin from "firebase-admin";

admin.initializeApp();

export const scheduleElection = functions.firestore
  .document("elections/{electionId}")
  .onWrite(async (snap, context) => {
    const data = snap.data();
    const electionStartDate = data.electionStartDate;

    const electionId = context.params.electionId;

    const electionStartDateSchedule = await admin
      .firestore()
      .collection("schedules")
      .doc(electionId)
      .set({
        electionStartDate: electionStartDateTimestamp,
        electionEndDate: electionEndDateTimestamp,
      });

    return electionStartDateSchedule;
  });
