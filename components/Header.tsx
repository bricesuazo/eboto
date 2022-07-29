import ButtonLink from "./styled/ButtonLink";
import { LogoutIcon, MenuIcon, XIcon } from "@heroicons/react/outline";
import Logo from "./Logo";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

const Header = () => {
  const { data: session } = useSession();
  // console.log(session);

  const currentAdminLoggedIn = session?.user;
  const currentVoterLoggedIn = [];
  const [menu, setMenu] = useState(false);
  const Logout = () => {
    return (
      <LogoutIcon
        className="w-5 cursor-pointer hover:opacity-75"
        onClick={signOut}
      />
    );
  };
  return (
    <header className="select-none bg-primary flex items-center justify-between px-4 md:px-8 lg:px-12 py-4 sticky top-0 text-white z-20">
      <Logo />
      <div>
        {(() => {
          if (session) {
            return (
              <div className="flex items-center gap-x-2 ">
                <span>Hello, {currentAdminLoggedIn?.firstName}!</span>
                <ButtonLink href="/dashboard" invert>
                  Dashboard
                </ButtonLink>
                <Logout />
              </div>
            );
          } else if (Object.keys(currentVoterLoggedIn).length !== 0) {
            return (
              <div className="flex items-center gap-x-2 ">
                <ButtonLink
                  invert
                  href={`${currentVoterLoggedIn?.election?.electionIDName}`}
                  className="hidden sm:block"
                >
                  {currentVoterLoggedIn?.election?.name}
                </ButtonLink>
                <span className="hidden sm:block">
                  Hello, {currentVoterLoggedIn?.firstName}!
                </span>
                <Logout />
                {!menu && (
                  <div className="sm:hidden p-1 cursor-pointer hover:bg-black-50 rounded">
                    <MenuIcon
                      onClick={() => {
                        setMenu(true);
                      }}
                      className="w-6"
                    />
                  </div>
                )}
                {menu && (
                  <div
                    className="absolute top-0 left-0 h-screen w-full bg-black-50 z-50 sm:hidden"
                    onClick={() => setMenu(false)}
                  >
                    <div
                      className="absolute top-4 right-4 text-2xl hover:opacity-75 p-1 hover:bg-black-50 rounded"
                      onClick={() => setMenu(false)}
                    >
                      <XIcon />
                    </div>

                    <div className="flex items-center justify-center flex-col gap-y-8 h-full">
                      <ButtonLink
                        invert
                        href={`${currentVoterLoggedIn?.election?.electionIDName}`}
                        onClick={() => setMenu(false)}
                      >
                        {currentVoterLoggedIn?.election?.name}
                      </ButtonLink>
                      <div
                        className="flex items-center gap-x-2 cursor-pointer hover:opacity-75"
                        onClick={HandleLogout}
                      >
                        <span>Logout</span>
                        <LogoutIcon className="w-6" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <div className="flex gap-x-2">
                <ButtonLink href="/signin" className="hidden sm:block">
                  Login
                </ButtonLink>
                <ButtonLink href="/signin" invert className="block sm:hidden">
                  Login
                </ButtonLink>
                <ButtonLink invert href="/signup" className="hidden sm:block">
                  Signup as admin
                </ButtonLink>
              </div>
            );
          }
        })()}
      </div>
    </header>
  );
};

export default Header;
