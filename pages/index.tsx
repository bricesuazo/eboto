import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import Button from "../components/styled/Button";
import { getSession } from "next-auth/react";

const Home: NextPage = () => {
  return (
    <>
      <div className="p-4 md:p-8 relative flex justify-center items-center w-full bg-cvsu-landing-page h-[calc(100vh-15rem)] bg-no-repeat bg-cover bg-center bg-fixed">
        <div className="z-10 flex flex-col gap-y-2 text-center text-white md:w-2/3">
          <div className="flex items-center justify-center w-full">
            <span className="text-[#FFDE59] drop-shadow-[-8px_8px_0px_#1F7A3A] text-5xl sm:text-6xl font-bold md:text-7xl lg:text-8xl leading-none min-w-max">
              eBoto Mo
            </span>
            <div className="invert bg-eboto-mo-logo bg-contain bg-no-repeat bg-center w-16 h-16 lg:w-28 lg:h-28 rotate-12"></div>
          </div>

          <span className="text-lg md:text-xl">
            An Online Voting System for Cavite State University - Don Severino
            Delas Alas Campus with Real-time Voting Count.
          </span>
        </div>
        <div className="w-full h-full bg-black absolute top-0 left-0 inset-0 opacity-50"></div>
      </div>

      <div className="w-full m-auto flex flex-col items-center max-w-6xl mb-24">
        <div className="w-full px-4 py-16 md:p-8 lg:p-12 flex flex-col items-center gap-4 md:flex-row ">
          <div className="bg-vote1 bg-contain bg-center bg-no-repeat w-72 h-72 md:hidden"></div>
          <div className="w-full flex flex-col gap-y-4 items-center md:items-start flex-1">
            <div className="font-anton uppercase flex flex-col text-center md:text-left">
              <span className="text-6xl sm:text-8xl md:text-8xl lg:text-9xl leading-none min-w-max">
                Vote now!
              </span>
              <span className="text-3xl sm:text-4xl lg:text-5xl text-yellow">
                It&apos;s your right!
              </span>
            </div>
            <span className="text-lg text-center md:text-left">
              Take nothing for granted! Voting is about more than just electing
              a candidate; it&apos;s also about choosing the appropriate
              policies and individuals to make decisions that will affect our
              Alma Mater.
            </span>
            <Link href="/signin">
              <a>
                <Button bold>Signin as voter</Button>
              </a>
            </Link>
          </div>
          <div className="bg-vote1 bg-contain bg-center bg-no-repeat w-[18rem] h-[18rem] lg:w-[24rem] lg:h-[24rem] hidden md:block"></div>
        </div>

        <div className="w-full px-4 py-16 md:p-8 lg:p-12 flex flex-col items-center gap-4 md:flex-row">
          <div className="bg-vote2 bg-contain bg-center bg-no-repeat w-[18rem] h-[18rem] lg:w-[24rem] lg:h-[24rem]"></div>
          <div className="flex flex-col gap-y-4 flex-1">
            <div className="font-anton uppercase flex flex-col text-center md:text-left">
              <span className="text-6xl sm:text-8xl md:text-8xl lg:text-9xl leading-none min-w-max">
                Know your
              </span>
              <span className="text-3xl sm:text-4xl lg:text-5xl text-yellow">
                candidates!
              </span>
            </div>
            <span className="w-full text-lg text-center md:text-left">
              Credentials matter - it is an undeniable fact that credentials are
              an essential component of our educational system. Take the time to
              learn about the candidates and their agendas.
            </span>
          </div>
        </div>

        <div className="w-full px-4 py-16 md:p-8 lg:p-12 flex flex-col lg:items-center gap-4 md:flex-row">
          <div className="bg-vote3 bg-contain bg-center bg-no-repeat h-72 md:hidden"></div>
          <div className="flex flex-col gap-y-4 flex-1">
            <div className="font-anton uppercase flex flex-col text-center md:text-left">
              <span className="text-6xl sm:text-8xl md:text-8xl lg:text-9xl leading-none min-w-max">
                Your votes
              </span>
              <span className="text-3xl sm:text-4xl lg:text-5xl text-yellow">
                are safe!
              </span>
            </div>
            <span className="text-lg text-center md:text-left">
              Your vote security is our outmost priority! The number of votes at
              the homepage is real-time where you can also monitor the actual
              counting of votes. Your votes and all your data are safe and
              secure in our database.
            </span>
          </div>
          <div className="bg-vote3 bg-contain bg-center bg-no-repeat w-[18rem] h-[18rem] lg:w-[24rem] lg:h-[24rem] hidden md:block" />
        </div>
        <Link href="/signup">
          <a>
            <Button bold>Create an account as admin</Button>
          </a>
        </Link>
      </div>
    </>
  );
};

export default Home;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession({ req: context.req });

  if (session) {
    // return {
    //   redirect: {
    //     destination: "/dashboard",
    //     permanent: false,
    //   },
    // };
  }
  return { props: { session } };
};
