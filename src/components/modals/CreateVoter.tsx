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
  Select,
  ModalFooter,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { api } from "../../utils/api";
import { convertNumberToHour } from "../../libs/convertNumberToHour";

const CreateVoterModal = ({
  isOpen,
  onClose,
  electionId,
}: {
  electionId: string;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
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
        //   onSubmit={handleSubmit(async (data) => {
        //     await createVoterMutation.mutateAsync({
        //       electionId,
        //       userId: data.userId,
        //     });
        //     onClose();
        //   })}
        >
          <ModalBody>
            <Stack>
              <HStack>
                <FormControl
                  isInvalid={!!errors.firstName}
                  isRequired
                  isDisabled={createVoterMutation.isLoading}
                >
                  <FormLabel>First name</FormLabel>
                  <Input
                    placeholder="Enter voter's first name"
                    type="text"
                    {...register("firstName", {
                      required: "This is required.",
                    })}
                  />

                  {errors.firstName && (
                    <FormErrorMessage>
                      {errors.firstName.message?.toString()}
                    </FormErrorMessage>
                  )}
                </FormControl>
                <FormControl
                  isInvalid={!!errors.lastName}
                  isRequired
                  isDisabled={createVoterMutation.isLoading}
                >
                  <FormLabel>Last name</FormLabel>
                  <Input
                    placeholder="Enter voter's last name"
                    type="text"
                    {...register("lastName", {
                      required: "This is required.",
                    })}
                  />

                  {errors.lastName && (
                    <FormErrorMessage>
                      {errors.lastName.message?.toString()}
                    </FormErrorMessage>
                  )}
                </FormControl>
              </HStack>
              <FormControl
                isInvalid={!!errors.lastName}
                isRequired
                isDisabled={createVoterMutation.isLoading}
              >
                <FormLabel>Email</FormLabel>
                <Input
                  placeholder="Enter voter's last name"
                  type="text"
                  {...register("lastName", {
                    required: "This is required.",
                  })}
                />

                {errors.lastName && (
                  <FormErrorMessage>
                    {errors.lastName.message?.toString()}
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
