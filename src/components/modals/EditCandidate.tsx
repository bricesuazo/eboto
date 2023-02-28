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
import type { Candidate } from "@prisma/client";

type FormValues = {
  name: string;
};

const EditCandidateModal = ({
  isOpen,
  onClose,
  candidate,
}: {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
}) => {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>();

  useEffect(() => {
    if (isOpen) {
      setValue("name", candidate.first_name);
    } else {
      reset({
        name: candidate.first_name,
      });
    }
  }, [isOpen, reset]);

  const editPositionMutation = api.candidate.editSingle.useMutation({
    onSuccess: (data) => {
      toast({
        title: `${data.first_name} updated!`,
        description: "Successfully updated candidate",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    // await editPositionMutation.mutateAsync({
    //   id: candidate.id,
    //   name: data.name,
    // });
  };

  return (
    <Modal isOpen={isOpen || editPositionMutation.isLoading} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Position - {candidate.first_name}</ModalHeader>
        <ModalCloseButton disabled={editPositionMutation.isLoading} />
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Stack>
              <FormControl
                isInvalid={!!errors.name}
                isRequired
                isDisabled={editPositionMutation.isLoading}
              >
                <FormLabel>Position name</FormLabel>
                <Input
                  placeholder="Enter candidate name"
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
            </Stack>
            {editPositionMutation.error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {editPositionMutation.error.message}
                </AlertDescription>
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={2}
              onClick={onClose}
              disabled={editPositionMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={editPositionMutation.isLoading}
            >
              Create
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default EditCandidateModal;
