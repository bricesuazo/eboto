import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "../../firebase/firebase";
import admin from "../../firebase/firebase-admin";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { voterType } from "../../../typings";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { voter, election } = JSON.parse(req.body);
  switch (req.method) {
    case "POST":
      await admin
        .auth()
        .createUser({
          email: voter.email,
          emailVerified: false,
          password: voter.password,
          displayName: voter.fullName,
          disabled: false,
        })
        .then(async (userRecord) => {
          const userDoc: voterType = {
            uid: userRecord.uid,
            accountType: "voter",
            fullName: voter.fullName,
            email: voter.email,
            password: voter.password,
            hasVoted: false,
            election,
          };
          await setDoc(doc(firestore, "voters", userRecord.uid), userDoc)
            .then((user) => {
              res.status(200).json({ message: user });
            })
            .catch((error) => {
              res.status(500).json({ message: error });
            });
        });

      break;
    case "DELETE":
      await admin
        .auth()
        .deleteUser(voter.uid)
        .then(async () => {
          await deleteDoc(doc(firestore, "voters", voter.uid))
            .then(() => {
              res.status(200).json({ message: "User deleted successfully" });
            })
            .catch((error) => {
              res.status(500).json({ message: error });
            });
        })
        .catch((error) => {
          res.status(500).json({ message: error });
        });

      break;
    case "PUT":
      if (voter.fullName && voter.password && voter.email) {
        await admin
          .auth()
          .updateUser(voter.uid, {
            displayName: voter.fullName,
            email: voter.email,
            password: voter.password,
          })
          .then(async () => {
            res
              .status(200)
              .json({ message: "User updated on auth successfully" });
          })
          .catch((error) => {
            res.status(500).json({ message: error });
          });
      }

      const { uid, accountType, election, ...otherVoterData } = voter;

      await updateDoc(doc(firestore, "voters", voter.uid), otherVoterData)
        .then(() => {
          res
            .status(200)
            .json({ message: "User updated on firestore successfully" });
        })
        .catch((error) => {
          res.status(500).json({ message: error });
        });

      break;
  }
}
