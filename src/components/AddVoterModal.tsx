import {
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
  Tooltip,
} from "@chakra-ui/react";
import { ArrowPathIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { electionType, voterType } from "../../typings";
import generator from "generate-password";
import { useSWRConfig } from "swr";

const AddVoterModal = ({
  isOpen,
  onClose,
  election,
}: {
  isOpen: boolean;
  onClose: () => void;
  election: electionType;
}) => {
  const { mutate } = useSWRConfig();
  const generatePassword = generator.generate({
    length: 16,
    lowercase: true,
    uppercase: true,
  });
  const [addVoter, setAddVoter] = useState<voterType | null>({
    accountType: "voter",
    uid: "",
    fullName: "",
    email: "",
    password: generatePassword,
    hasVoted: false,
    election: "",
  });
  const [loading, setLoading] = useState(false);

  const clearForm = () => {
    setAddVoter({
      accountType: "voter",
      uid: "",
      fullName: "",
      email: "",
      password: generatePassword,
      hasVoted: false,
      election: election._id,
    });
  };

  useEffect(() => {
    isOpen && clearForm();
  }, [isOpen]);
  if (!addVoter) {
    return null;
  }
  return (
    <Modal isOpen={!loading ? isOpen : true} onClose={onClose} isCentered>
      <ModalOverlay />
      <form
        onSubmit={async (e) => {
          setLoading(true);
          e.preventDefault();
          // await mutate(
          //   "/api/voter",
          //   fetch("/api/voter", {
          //     method: "POST",
          //     body: JSON.stringify({
          //       election: election._id,
          //       voter: addVoter,
          //     }),
          //   })
          // );

          onClose();
          setLoading(false);
        }}
      >
        <ModalContent>
          <ModalHeader>Add a voter</ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={6}>
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

            <FormControl mt={4} isRequired>
              <FormLabel>Email address</FormLabel>
              <Input
                placeholder="Email address"
                type="email"
                onChange={(e) =>
                  setAddVoter({ ...addVoter, email: e.target.value })
                }
                value={addVoter.email}
                disabled={loading}
              />
            </FormControl>
            <FormControl mt={4} isRequired>
              <FormLabel>Initial password</FormLabel>
              <InputGroup size="md">
                <Input
                  placeholder="Initial password"
                  type="text"
                  onChange={(e) =>
                    setAddVoter({ ...addVoter, password: e.target.value })
                  }
                  value={addVoter.password}
                  disabled={loading}
                />
                <InputRightElement>
                  <Tooltip label="Generate password">
                    <IconButton
                      disabled={loading}
                      aria-label="Generate password"
                      icon={<ArrowPathIcon width={24} />}
                      onClick={() => {
                        setAddVoter({
                          ...addVoter,
                          password: generatePassword,
                        });
                      }}
                    />
                  </Tooltip>
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </ModalBody>

          <ModalFooter justifyContent="space-between">
            <Box>
              {(addVoter.fullName || addVoter.email) && (
                <Tooltip label="Clear forms">
                  <IconButton
                    aria-label="Clear form"
                    icon={<TrashIcon width={24} />}
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
                colorScheme="blue"
                mr={3}
                type="submit"
                isLoading={loading}
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
