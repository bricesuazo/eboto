import { useEffect } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronDownIcon, PlusIcon } from "@heroicons/react/outline";

import { getSession } from "next-auth/react";
import { GetServerSideProps, NextPage } from "next";
import DashboardSidebar from "../../components/DashboardSidebar";
import { useRecoilState } from "recoil";
import { electionIdAtom, electionAtom } from "../../atoms/electionAtom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase.config";
import CreateElectionModal from "../../components/CreateElectionModal";
import { userAtom } from "../../atoms/userAtom";

const Dashboard: NextPage = () => {
  const [selectedElectionId, setSelectedElectionId] =
    useRecoilState(electionIdAtom);
  const [selectedElection, setSelectedElection] = useRecoilState(electionAtom);
  const [userState, setUserState] = useRecoilState(userAtom);
  const currentAdminLoggedIn = userState;

  useEffect(() => {
    const fetchElection = async () => {
      const querySnapshot = await getDocs(
        query(
          collection(db, "elections"),
          where("electionId", "==", selectedElectionId)
        )
      );
      return querySnapshot.docs.map((doc) => doc.data());
    };

    fetchElection().then((election) => setSelectedElection(election[0]));
  }, [selectedElectionId, userState, setSelectedElection]);

  return (
    <>
      <CreateElectionModal />

      <div className=" flex flex-col gap-4 p-4 bg-slate-50">
        <div className="w-1/4 min-w-fit h-auto cursor-pointer select-none">
          <div className="flex gap-x-2">
            <div className="w-full">
              <Listbox
                value={selectedElectionId}
                onChange={(e) => setSelectedElectionId(e)}
              >
                <Listbox.Button className="flex items-center justify-between bg-white rounded-md w-full p-4">
                  {currentAdminLoggedIn?.elections.length === 0 ? (
                    <span>No election yet</span>
                  ) : (
                    <span>{selectedElectionId}</span>
                  )}

                  <ChevronDownIcon className="w-6" />
                </Listbox.Button>
                <Transition
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                >
                  <div className="absolute w-full">
                    <Listbox.Options className="w-full mt-1 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm ">
                      {currentAdminLoggedIn?.elections.map(
                        (election: string) => {
                          return (
                            <Listbox.Option
                              key={election}
                              value={election}
                              className="hover:bg-[#EEEEEE] p-2 w-full"
                            >
                              {election}
                            </Listbox.Option>
                          );
                        }
                      )}
                    </Listbox.Options>
                  </div>
                </Transition>
              </Listbox>
            </div>

            <button className="bg-white p-4 font-bold rounded-md w-16 grid place-items-center text-xl hover:scale-110 transition-scale">
              <PlusIcon className="w-4" />
            </button>
          </div>
        </div>

        <div className="space-x-4 flex">
          <div className="flex-initial w-1/4 bg-white min-w-fit rounded-tr-lg overflow-hidden">
            <DashboardSidebar />
          </div>
          {/* <div className="flex-auto w-auto h-fit bg-white p-4">
          {dashboardSidebar.map((dashboard) => (
            <Route
              key={dashboard.id}
              exact
              path={`/${dashboard.name.toLowerCase()}`}
              element={<DashboardMain type={dashboard.name.toLowerCase()} />}
            />
          ))}
        </div> */}
        </div>
      </div>
    </>
  );
};

export default Dashboard;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession({ req: context.req });
  if (!session) {
    return {
      redirect: {
        destination: "/signin",
        permanent: false,
      },
    };
  }
  return {
    props: { session },
  };
};
