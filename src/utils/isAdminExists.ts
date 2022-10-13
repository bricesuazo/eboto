import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../firebase/firebase";

const isAdminExists = async (email: string) => {
  const adminSnaphot = await getDocs(
    query(collection(firestore, "admins"), where("email", "==", email))
  );

  return adminSnaphot.docs.length !== 0;
};

export default isAdminExists;
