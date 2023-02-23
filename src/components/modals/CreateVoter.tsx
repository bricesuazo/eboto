import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Stack,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  ModalFooter,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { api } from "../../utils/api";

const CreateVoterModal = ({
  isOpen,
  onClose,
  electionId,
  onVoterCreated,
}: {
  electionId: string;
  isOpen: boolean;
  onClose: () => void;
  onVoterCreated: () => void;
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    !isOpen && reset();
  }, [isOpen, reset]);

  const createVoterMutation = api.election.createVoter.useMutation();

  return (
    <Modal isOpen={isOpen || createVoterMutation.isLoading} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add voter</ModalHeader>
        <ModalCloseButton disabled={createVoterMutation.isLoading} />
        <form
          onSubmit={handleSubmit(async (data) => {
            await createVoterMutation.mutateAsync({
              electionId,
              email: data.email as string,
            });
            onVoterCreated();
            onClose();
          })}
        >
          <ModalBody>
            <Stack>
              <FormControl
                isInvalid={!!errors.lastName}
                isRequired
                isDisabled={createVoterMutation.isLoading}
              >
                <FormLabel>Email</FormLabel>
                <Input
                  placeholder="Enter voter's email"
                  type="text"
                  {...register("email", {
                    required: "This is required.",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />

                {errors.email && (
                  <FormErrorMessage>
                    {errors.email.message?.toString()}
                  </FormErrorMessage>
                )}
              </FormControl>
              {createVoterMutation.error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {createVoterMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={2}
              onClick={onClose}
              disabled={createVoterMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={createVoterMutation.isLoading}
            >
              Create
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default CreateVoterModal;
