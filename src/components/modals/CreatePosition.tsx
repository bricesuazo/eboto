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
};

const CreatePositionModal = ({
  isOpen,
  onClose,
  electionId,
  order,
}: {
  isOpen: boolean;
  onClose: () => void;
  electionId: string;
  order: number;
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

  const createPositionMutation = api.position.createSingle.useMutation({
    onSuccess: (data) => {
      toast({
        title: `${data.name} created!`,
        description: "Successfully created position",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    await createPositionMutation.mutateAsync({
      name: data.name,
      electionId,
      order,
    });
  };

  return (
    <Modal
      isOpen={isOpen || createPositionMutation.isLoading}
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create position</ModalHeader>
        <ModalCloseButton disabled={createPositionMutation.isLoading} />
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Stack>
              <FormControl
                isInvalid={!!errors.name}
                isRequired
                isDisabled={createPositionMutation.isLoading}
              >
                <FormLabel>Position name</FormLabel>
                <Input
                  placeholder="Enter position name"
                  type="text"
                  {...register("name", {
                    required: "This is required.",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters long.",
                    },
                  })}
                />

                {errors.name && (
                  <FormErrorMessage>
                    {errors.name.message?.toString()}
                  </FormErrorMessage>
                )}
              </FormControl>
            </Stack>
            {createPositionMutation.error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {createPositionMutation.error.message}
                </AlertDescription>
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={2}
              onClick={onClose}
              disabled={createPositionMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={createPositionMutation.isLoading}
            >
              Create
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default CreatePositionModal;
