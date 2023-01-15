import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Stack,
  Tooltip,
  WrapItem,
} from "@chakra-ui/react";
import { TrashIcon } from "@heroicons/react/24/outline";
import {
  collection,
  deleteDoc,
  doc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { firestore } from "../firebase/firebase";
import { voterType } from "../types/typings";
import isAdminExists from "../utils/isAdminExists";
import isVoterExists from "../utils/isVoterExists";

interface EditVoterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoter: voterType;
}
const EditVoterModal = ({
  isOpen,
  onClose,
  selectedVoter,
}: EditVoterModalProps) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [voter, setVoter] = useState<voterType>(selectedVoter);

  useEffect(() => {
    setVoter(selectedVoter);
  }, [selectedVoter]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={false}>
      <ModalOverlay />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);

          // Check if email is already in use
          if (voter.email !== selectedVoter.email) {
            if (
              (await isAdminExists(voter.email)) ||
              (await isVoterExists(voter.election, voter.email))
            ) {
              setError("Email is already in use");
              setLoading(false);
              return;
            }
          }

          // Update voter
          await updateDoc(
            doc(firestore, "elections", voter.election, "voters", voter.uid),
            {
              fullName: voter.fullName,
              email: voter.email,
              updatedAt: Timestamp.now(),
            }
          );
          await updateDoc(doc(firestore, "elections", voter.election), {
            updatedAt: Timestamp.now(),
          });

          onClose();
          setLoading(false);
        }}
      >
        <ModalContent>
          <ModalHeader>Edit voter</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Full name</FormLabel>
                <Input
                  placeholder="Full name"
                  value={voter.fullName}
                  onChange={(e) =>
                    setVoter({ ...voter, fullName: e.target.value })
                  }
                  disabled={loading}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  placeholder="Email"
                  value={voter.email.toLocaleLowerCase()}
                  onChange={(e) =>
                    setVoter({
                      ...voter,
                      email: e.target.value.toLocaleLowerCase(),
                    })
                  }
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

          <ModalFooter>
            <Flex justifyContent="space-between" width="100%">
              <Popover>
                {({ onClose: onCloseDeleteModal }: { onClose: () => void }) => (
                  <>
                    <PopoverTrigger>
                      <WrapItem>
                        <Tooltip label="Delete voter">
                          <IconButton
                            aria-label="Delete voter"
                            icon={<TrashIcon width={18} />}
                            color="red.400"
                            disabled={loading}
                          />
                        </Tooltip>
                      </WrapItem>
                    </PopoverTrigger>
                    <PopoverContent width="100%">
                      <PopoverArrow />
                      <PopoverCloseButton />
                      <PopoverHeader>Delete voter?</PopoverHeader>
                      <PopoverBody>
                        <HStack>
                          <Button
                            onClick={onCloseDeleteModal}
                            disabled={loading}
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={async () => {
                              setLoading(true);
                              await deleteDoc(
                                doc(
                                  collection(
                                    firestore,
                                    "elections",
                                    voter.election,
                                    "voters"
                                  ),
                                  voter.uid
                                )
                              );
                              setLoading(false);
                              onClose();
                            }}
                            isLoading={loading}
                            colorScheme="red"
                            size="sm"
                          >
                            Delete
                          </Button>
                        </HStack>
                      </PopoverBody>
                    </PopoverContent>
                  </>
                )}
              </Popover>
              <Box>
                <Button
                  mr={3}
                  type="submit"
                  isLoading={loading}
                  disabled={
                    voter.fullName === selectedVoter.fullName &&
                    voter.email === selectedVoter.email &&
                    voter.password === selectedVoter.password &&
                    voter.hasVoted === selectedVoter.hasVoted
                  }
                >
                  Save
                </Button>
                <Button onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
              </Box>
            </Flex>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  );
};

export default EditVoterModal;
