import { useRecoilState, useRecoilValue } from "recoil";
import { electionIdAtom } from "../atoms/electionAtom";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import InputStyled from "./styled/InputStyled";
import Button from "./styled/Button";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase.config";
import { userAtom } from "../atoms/userAtom";
import { electionCreationBase } from "../constant/constant";
import { useSession } from "next-auth/react";

const CreateElectionModal = () => {
  // const { data: session } = useSession();
  const [selectedElectionId, setSelectedElectionId] =
    useRecoilState(electionIdAtom);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [userState, setUserState] = useRecoilState<any>(userAtom);
  const [isOpen, setIsOpen] = useState(
    userState === null || userState.elections?.length === 0
  );

  const [electionTemp, setElectionTemp] = useState(electionCreationBase);
  const handleCreateElection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const querySnapshot = await getDocs(
      query(
        collection(db, "elections"),
        where("electionIDName", "==", electionTemp.electionIDName)
      )
    );
    if (querySnapshot.docs.length !== 0) {
      setMessage("Election ID name already exists.");
    } else {
      const res = await addDoc(collection(db, "elections"), electionTemp).catch(
        (err) => setMessage(err.response.data.error)
      );

      if (res) {
        await updateDoc(doc(db, "admins", userState?._id), {
          elections: arrayUnion(electionTemp.id),
        });
        setSelectedElectionId(electionTemp.id);
        setUserState({
          ...userState,
          elections: [...userState?.elections, electionTemp.id],
        });
        setIsOpen(false);
      } else {
        setMessage("Failed to create election.");
      }
      setMessage("");
    }
    setLoading(false);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog className="relative z-20" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-bold text-center text-gray-900"
                >
                  Create an election
                </Dialog.Title>

                <form
                  className="mt-2 flex flex-col space-y-4"
                  onSubmit={(e) => handleCreateElection(e)}
                >
                  <div className="">
                    <label htmlFor="name">Election Name: </label>
                    <InputStyled
                      id="name"
                      type="text"
                      placeholder="Enter Election Name..."
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setElectionTemp({
                          ...electionTemp,
                          name: e.target.value,
                          electionIDName: e.target.value
                            .replace(/[^A-Za-z0-9-]/g, "-")
                            .toLocaleLowerCase(),
                        });
                      }}
                      required
                      value={electionTemp.name}
                    />
                  </div>
                  <div className="">
                    <label htmlFor="electionIDName">Election ID Name: </label>
                    <InputStyled
                      id="electionIDName"
                      type="text"
                      placeholder="Enter Election ID Name..."
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setElectionTemp({
                          ...electionTemp,
                          electionIDName: e.target.value
                            .replace(/[^A-Za-z0-9-]/g, "-")
                            .toLocaleLowerCase(),
                        });
                      }}
                      required
                      value={electionTemp.electionIDName}
                    />
                  </div>
                  {message && (
                    <span className="text-red-500 text-sm">{message}</span>
                  )}
                  <Button
                    type="submit"
                    disabled={
                      !electionTemp.name ||
                      !electionTemp.electionIDName ||
                      loading
                    }
                    loading={loading}
                  >
                    Create Election
                  </Button>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateElectionModal;
