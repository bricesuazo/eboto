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
  useToast,
} from "@chakra-ui/react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { api } from "../../utils/api";
import { useEffect } from "react";

type FormValues = {
  name: string;
  acronym: string;
};

const CreatePartylistModal = ({
  isOpen,
  onClose,
  electionId,
  refetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  electionId: string;
  refetch: () => Promise<unknown>;
}) => {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  useEffect(() => {
    isOpen && reset();
  }, [isOpen, reset]);

  const createPartylistMutation = api.partylist.createSingle.useMutation({
    onSuccess: async (data) => {
      await refetch();
      toast({
        title: `${data.name} (${data.acronym}) created!`,
        description: "Successfully created partylist",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    await createPartylistMutation.mutateAsync({
      name: data.name,
      acronym: data.acronym,
      electionId,
    });
  };

  return (
    <Modal
      isOpen={isOpen || createPartylistMutation.isLoading}
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create partylist</ModalHeader>
        <ModalCloseButton disabled={createPartylistMutation.isLoading} />
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Stack>
              <FormControl
                isInvalid={!!errors.name}
                isRequired
                isDisabled={createPartylistMutation.isLoading}
              >
                <FormLabel>Partylist name</FormLabel>
                <Input
                  placeholder="Enter partylist name"
                  type="text"
                  {...register("name", {
                    required: "This is required.",
                    minLength: {
                      value: 3,
                      message: "Name must be at least 3 characters long.",
                    },
                  })}
                />

                {errors.name && (
                  <FormErrorMessage>
                    {errors.name.message?.toString()}
                  </FormErrorMessage>
                )}
              </FormControl>
              <FormControl
                isInvalid={!!errors.acronym}
                isRequired
                isDisabled={createPartylistMutation.isLoading}
              >
                <FormLabel>Acronym</FormLabel>
                <Input
                  placeholder="Enter acronym"
                  type="text"
                  {...register("acronym", {
                    required: "This is required.",
                    minLength: {
                      value: 1,
                      message: "Acronym must be at least 1 character long.",
                    },
                  })}
                />

                {errors.acronym && (
                  <FormErrorMessage>{errors.acronym.message}</FormErrorMessage>
                )}
              </FormControl>
            </Stack>
            {createPartylistMutation.error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {createPartylistMutation.error.message}
                </AlertDescription>
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={2}
              onClick={onClose}
              disabled={createPartylistMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={createPartylistMutation.isLoading}
            >
              Create
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default CreatePartylistModal;
