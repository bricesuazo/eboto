import type { NextApiRequest, NextApiResponse } from "next";
import admin from "../../firebase/firebase-admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // const voter = JSON.parse(req.body);
    await admin
      .auth()
      .importUsers([
        {
          uid: "uid1",
          email: "eboto.cvsu@gmail.com",
        },
        // {
        //   uid: "uid2",
        //   email: "user2@example.com",
        // },
      ])
      .then((userImportResult) => {
        console.log(userImportResult);
        res.json(userImportResult);
      })
      .catch((error) => {
        console.log(error);
        res.json(error);
      });
    // res.status(200).json(JSON.parse(req.body));
  }
}
