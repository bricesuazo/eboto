import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}
export const verifyIdToken = async (token: string) => {
  return await admin
    .auth()
    .verifyIdToken(token)
    .catch((error) => {
      throw error;
    });
};

export default admin;
