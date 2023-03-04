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
import type { Partylist } from "@prisma/client";

type FormValues = {
  name: string;
  acronym: string;
};

const EditPartylistModal = ({
  isOpen,
  onClose,
  partylist,
  refetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  partylist: Partylist;
  refetch: () => Promise<unknown>;
}) => {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>();

  const editPartylistMutation = api.partylist.editSingle.useMutation({
    onSuccess: async (data) => {
      await refetch();
      toast({
        title: `${data.name} (${data.acronym}) updated!`,
        description: "Successfully updated partylist",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    } else {
      editPartylistMutation.reset();
    }
  }, [isOpen, reset]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    await editPartylistMutation.mutateAsync({
      id: partylist.id,
      name: data.name,
      acronym: data.acronym,
    });
  };

  return (
    <Modal isOpen={isOpen || editPartylistMutation.isLoading} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Edit Partylist - {partylist.name} ({partylist.acronym})
        </ModalHeader>
        <ModalCloseButton disabled={editPartylistMutation.isLoading} />
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <Stack>
              <FormControl
                isInvalid={!!errors.name}
                isRequired
                isDisabled={editPartylistMutation.isLoading}
              >
                <FormLabel>Partylist name</FormLabel>
                <Input
                  placeholder="Enter partylist name"
                  type="text"
                  {...register("name", {
                    required: "This is required.",
                    value: partylist.name,
                    validate: (value) => {
                      if (
                        value === partylist.name &&
                        watch("acronym") === partylist.acronym
                      ) {
                        return "Name must be different from the current name.";
                      }
                    },
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
                isDisabled={editPartylistMutation.isLoading}
              >
                <FormLabel>Acronym</FormLabel>
                <Input
                  placeholder="Enter acronym"
                  type="text"
                  {...register("acronym", {
                    required: "This is required.",
                    value: partylist.acronym,
                    validate: (value) => {
                      if (
                        value === partylist.acronym &&
                        watch("name") === partylist.name
                      ) {
                        return "Acronym must be different from the current acronym.";
                      }
                    },
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
            {editPartylistMutation.error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {editPartylistMutation.error.message}
                </AlertDescription>
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={2}
              onClick={onClose}
              disabled={editPartylistMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={editPartylistMutation.isLoading}
            >
              Create
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default EditPartylistModal;
