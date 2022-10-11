import Router from "next/router";
import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebase";
import Cookies from "js-cookie";

const useAuth = () => {
  const [user] = useAuthState(auth);

  useEffect(() => {
    // if (user !== null && user?.emailVerified === false) {
    //   // Router.push("/verify");
    //   return;
    // }

    const run = async () => {
      if (!user) {
        Cookies.remove("eboto-mo-auth");
      } else {
        const token = await user.getIdToken();
        Cookies.set("eboto-mo-auth", token, { path: "/" });
      }
    };

    run();
  }, [user]);
};

export default useAuth;
