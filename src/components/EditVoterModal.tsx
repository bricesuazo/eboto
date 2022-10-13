import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Switch,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { voterType } from "../types/typings";

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
  const [loading, setLoading] = useState(false);
  const [voter, setVoter] = useState<voterType>(selectedVoter);

  useEffect(() => {
    setVoter(selectedVoter);
  }, [selectedVoter]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <form
        onSubmit={async (e) => {
          setLoading(true);
          e.preventDefault();
          if (
            voter.fullName === selectedVoter.fullName &&
            voter.email === selectedVoter.email &&
            voter.password === selectedVoter.password &&
            voter.hasVoted === selectedVoter.hasVoted
          )
            return;

          //   Check if email is already in use
          if (
            voter.email !== selectedVoter.email ||
            voter.password !== selectedVoter.password ||
            voter.fullName !== selectedVoter.fullName
          ) {
            console.log("email or password changed");
          }

          // Update voter

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
                  value={voter.email}
                  onChange={(e) =>
                    setVoter({ ...voter, email: e.target.value })
                  }
                  disabled={loading}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  placeholder="Password"
                  value={voter.password}
                  onChange={(e) =>
                    setVoter({ ...voter, password: e.target.value })
                  }
                  disabled={loading}
                />
              </FormControl>

              <FormControl
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                //   isRequired
              >
                <FormLabel htmlFor="email-alerts" mb="0">
                  Voted
                </FormLabel>
                <Switch
                  id="email-alerts"
                  size="lg"
                  isChecked={voter.hasVoted}
                  onChange={(e) => {
                    setVoter({ ...voter, hasVoted: e.target.checked });
                  }}
                  disabled={loading}
                />
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} type="submit" isLoading={loading}>
              Save
            </Button>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  );
};

export default EditVoterModal;
