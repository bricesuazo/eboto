import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { userAtom } from "../atoms/userAtom";
import Footer from "./Footer";
import Header from "./Header";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const [userState, setUserState] = useRecoilState(userAtom);

  useEffect(() => {
    setUserState(session?.user);
  }, [session, setUserState]);

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
};

export default Layout;
