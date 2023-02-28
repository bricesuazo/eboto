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
  Select,
} from "@chakra-ui/react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { api } from "../../utils/api";
import { useEffect } from "react";
import type { Candidate, Partylist } from "@prisma/client";

type FormValues = {
  firstName: string;
  lastName: string;
  slug: string;
  partylistId: string;
  middleName: string | null;
};

const EditCandidateModal = ({
  isOpen,
  onClose,
  candidate,
  partylists,
  refetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  partylists: Partylist[];
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
    if (isOpen) {
      reset();
      editPositionMutation.reset();
    }
  }, [isOpen, reset]);

  const editPositionMutation = api.candidate.editSingle.useMutation({
    onSuccess: async (data) => {
      await refetch();
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
    await editPositionMutation.mutateAsync({
      id: candidate.id,
      firstName: data.firstName,
      lastName: data.lastName,
      slug: data.slug,
      electionId: candidate.electionId,
      positionId: candidate.positionId,
      partylistId: data.partylistId,
    });
  };

  return (
    <Modal isOpen={isOpen || editPositionMutation.isLoading} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Edit Candidate - {candidate.first_name} {candidate.last_name}
        </ModalHeader>
        <ModalCloseButton disabled={editPositionMutation.isLoading} />
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Stack>
              <FormControl
                isInvalid={!!errors.firstName}
                isRequired
                isDisabled={editPositionMutation.isLoading}
              >
                <FormLabel>First name</FormLabel>
                <Input
                  placeholder="Enter candidate's first name"
                  type="text"
                  {...register("firstName", {
                    required: "This is required.",
                    value: candidate.first_name,
                    minLength: {
                      value: 3,
                      message: "Name must be at least 3 characters long.",
                    },
                  })}
                />
                {errors.firstName && (
                  <FormErrorMessage>
                    {errors.firstName.message?.toString()}
                  </FormErrorMessage>
                )}
              </FormControl>
              <FormControl
                isInvalid={!!errors.middleName}
                isDisabled={editPositionMutation.isLoading}
              >
                <FormLabel>Middle name</FormLabel>
                <Input
                  placeholder="Enter candidate's middle name"
                  type="text"
                  {...register("middleName", {
                    value: candidate.middle_name,
                  })}
                />
                {errors.middleName && (
                  <FormErrorMessage>
                    {errors.middleName.message?.toString()}
                  </FormErrorMessage>
                )}
              </FormControl>
              <FormControl
                isInvalid={!!errors.lastName}
                isRequired
                isDisabled={editPositionMutation.isLoading}
              >
                <FormLabel>Last name</FormLabel>
                <Input
                  placeholder="Enter candidate's last name"
                  type="text"
                  {...register("lastName", {
                    required: "This is required.",
                    value: candidate.last_name,
                    minLength: {
                      value: 3,
                      message: "Name must be at least 3 characters long.",
                    },
                  })}
                />
                {errors.lastName && (
                  <FormErrorMessage>
                    {errors.lastName.message?.toString()}
                  </FormErrorMessage>
                )}
              </FormControl>
              <FormControl
                isInvalid={!!errors.slug}
                isRequired
                isDisabled={editPositionMutation.isLoading}
              >
                <FormLabel>Slug</FormLabel>
                <Input
                  placeholder="Enter candidate name"
                  type="text"
                  {...register("slug", {
                    required: "This is required.",
                    value: candidate.slug,
                    minLength: {
                      value: 3,
                      message: "Name must be at least 3 characters long.",
                    },
                  })}
                />
                {errors.slug && (
                  <FormErrorMessage>
                    {errors.slug.message?.toString()}
                  </FormErrorMessage>
                )}
              </FormControl>
              <FormControl
                isInvalid={!!errors.partylistId}
                isRequired
                isDisabled={editPositionMutation.isLoading}
              >
                <FormLabel>Partylist</FormLabel>

                <Select
                  placeholder="Select partylist"
                  {...register("partylistId", {
                    required: "This is required.",
                    value: candidate.partylistId,
                  })}
                >
                  {partylists.map((partylist) => (
                    <option key={partylist.id} value={partylist.id}>
                      {partylist.name}
                    </option>
                  ))}
                </Select>

                {errors.slug && (
                  <FormErrorMessage>
                    {errors.slug.message?.toString()}
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
