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
import type { Partylist, Position } from "@prisma/client";

type FormValues = {
  firstName: string;
  lastName: string;
  slug: string;
  middleName: string | null;
  partylistId: string;
};

const CreateCandidateModal = ({
  isOpen,
  onClose,
  position,
  refetch,
  partylists,
}: {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  refetch: () => Promise<unknown>;
  partylists: Partylist[];
}) => {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  const createCandidateMutation = api.candidate.createSingle.useMutation({
    onSuccess: async (data) => {
      toast({
        title: `${data.first_name} ${data.last_name} created!`,
        description: "Successfully created position",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      await refetch();
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    } else {
      createCandidateMutation.reset();
    }
  }, [isOpen, reset]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    await createCandidateMutation.mutateAsync({
      firstName: data.firstName,
      lastName: data.lastName,
      slug: data.slug,
      partylistId: data.partylistId,
      position,
      middleName: data.middleName,
    });
  };

  return (
    <Modal
      isOpen={isOpen || createCandidateMutation.isLoading}
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create candidate</ModalHeader>
        <ModalCloseButton disabled={createCandidateMutation.isLoading} />
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Stack>
              <FormControl
                isInvalid={!!errors.firstName}
                isRequired
                isDisabled={createCandidateMutation.isLoading}
              >
                <FormLabel>First name</FormLabel>
                <Input
                  placeholder="Enter position name"
                  type="text"
                  {...register("firstName", {
                    required: "This is required.",
                    minLength: {
                      value: 2,
                      message: "First name must be at least 2 characters long.",
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
                isDisabled={createCandidateMutation.isLoading}
              >
                <FormLabel>Middle name</FormLabel>
                <Input
                  placeholder="Enter middle name"
                  type="text"
                  {...register("middleName")}
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
                isDisabled={createCandidateMutation.isLoading}
              >
                <FormLabel>Last name</FormLabel>
                <Input
                  placeholder="Enter last name"
                  type="text"
                  {...register("lastName", {
                    required: "This is required.",
                    minLength: {
                      value: 2,
                      message: "Last name must be at least 2 characters long.",
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
                isDisabled={createCandidateMutation.isLoading}
              >
                <FormLabel>Slug</FormLabel>
                <Input
                  placeholder="Enter slug"
                  type="text"
                  {...register("slug", {
                    required: "This is required.",
                    minLength: {
                      value: 2,
                      message: "Slug must be at least 2 characters long.",
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
                isDisabled={createCandidateMutation.isLoading}
              >
                <FormLabel>Partylist</FormLabel>

                <Select
                  placeholder="Select partylist"
                  {...register("partylistId", {
                    required: "This is required.",
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
            {createCandidateMutation.error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {createCandidateMutation.error.message}
                </AlertDescription>
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={2}
              onClick={onClose}
              disabled={createCandidateMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={createCandidateMutation.isLoading}
            >
              Create
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default CreateCandidateModal;
