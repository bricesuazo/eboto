import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Tooltip,
} from "@chakra-ui/react";
import { ArrowPathIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { electionType, voterType } from "../types/typings";

import {
  addDoc,
  collection,
  doc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { firestore } from "../firebase/firebase";
import generatePassword from "../utils/generatePassword";
import isAdminExists from "../utils/isAdminExists";
import isVoterExists from "../utils/isVoterExists";
import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";

const AddVoterModal = ({
  isOpen,
  onClose,
  election,
}: {
  isOpen: boolean;
  onClose: () => void;
  election: electionType;
}) => {
  const [addVoter, setAddVoter] = useState<voterType>({
    accountType: "voter",
    fullName: "",
    email: "",
    password: "",
    hasVoted: false,
    election: "",
    id: uuidv4(),
    uid: "",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    emailSent: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearForm = () => {
    setAddVoter({
      accountType: "voter",
      id: uuidv4(),
      fullName: "",
      email: "",
      password: "",
      hasVoted: false,
      election: election.uid,
      uid: "",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      emailSent: false,
    });
  };
  useEffect(() => {
    setError(null);
  }, []);

  useEffect(() => {
    isOpen && clearForm();
  }, [isOpen]);

  return (
    <Modal
      isOpen={!loading ? isOpen : true}
      onClose={onClose}
      trapFocus={false}
    >
      <ModalOverlay />
      <form
        onSubmit={async (e) => {
          setLoading(true);
          setError(null);
          e.preventDefault();

          if (
            (await isAdminExists(addVoter.email)) ||
            (await isVoterExists(addVoter.election, addVoter.email))
          ) {
            setError("Email already exists");
            setLoading(false);
            return;
          }

          await addDoc(
            collection(firestore, "elections", election.uid, "voters"),
            {
              ...addVoter,
              password: CryptoJS.AES.encrypt(
                generatePassword(),
                process.env.NEXT_PUBLIC_CRYPTOJS_SECRET!
              ).toString(),
              // password: bcrypt.hashSync(
              //   generatePassword(),
              //   bcrypt.genSaltSync(10)
              // ),
            }
          ).then(async (docRef) => {
            await updateDoc(
              doc(firestore, "elections", election.uid, "voters", docRef.id),
              {
                uid: docRef.id,
              }
            );
          });
          await updateDoc(doc(firestore, "elections", election.uid), {
            updatedAt: Timestamp.now(),
          });
          onClose();
          setLoading(false);
        }}
      >
        <ModalContent>
          <ModalHeader>Add a voter</ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={6}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Full name</FormLabel>
                <Input
                  placeholder="Full name"
                  onChange={(e) =>
                    setAddVoter({ ...addVoter, fullName: e.target.value })
                  }
                  value={addVoter.fullName}
                  disabled={loading}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email address</FormLabel>
                <Input
                  placeholder="Email address"
                  type="email"
                  onChange={(e) =>
                    setAddVoter({
                      ...addVoter,
                      email: e.target.value.trim().toLocaleLowerCase(),
                    })
                  }
                  value={addVoter.email}
                  disabled={loading}
                />
              </FormControl>

              {error && (
                <Alert status="error">
                  <AlertIcon />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </Stack>
          </ModalBody>

          <ModalFooter justifyContent="space-between">
            <Box>
              {(addVoter.fullName || addVoter.email) && (
                <Tooltip label="Clear forms">
                  <IconButton
                    aria-label="Clear form"
                    icon={<TrashIcon width={18} />}
                    onClick={() => {
                      (addVoter.fullName || addVoter.email) && clearForm();
                    }}
                    disabled={loading}
                  />
                </Tooltip>
              )}
            </Box>
            <Box>
              <Button
                mr={3}
                type="submit"
                isLoading={loading}
                disabled={
                  !addVoter.fullName && !addVoter.email && !addVoter.password
                }
              >
                Save
              </Button>
              <Button onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            </Box>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  );
};

export default AddVoterModal;
