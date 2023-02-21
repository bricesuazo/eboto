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
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { api } from "../../utils/api";

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
        <ModalHeader>Create election</ModalHeader>
        <ModalCloseButton disabled={createVoterMutation.isLoading} />
        <form
          onSubmit={handleSubmit(async (data) => {
            await createVoterMutation.mutateAsync({
              electionId,
              userId: data.userId,
            });
            onClose();
          })}
        >
          <ModalBody>
            <Stack>
              <FormControl
                isInvalid={!!errors.name}
                isRequired
                isDisabled={createVoterMutation.isLoading}
              >
                <FormLabel>Election name</FormLabel>
                <Input
                  placeholder="Enter election name"
                  type="text"
                  {...register("name", {
                    required: "This is required.",
                  })}
                />

                {errors.name && (
                  <FormErrorMessage>
                    {errors.name.message?.toString()}
                  </FormErrorMessage>
                )}
              </FormControl>
              <FormControl
                isInvalid={!!errors.slug}
                isRequired
                isDisabled={createVoterMutation.isLoading}
              >
                <FormLabel>Election slug</FormLabel>
                <Input
                  placeholder="Enter election slug"
                  type="text"
                  {...register("slug", {
                    required: "This is required.",
                  })}
                />

                {errors.slug && (
                  <FormErrorMessage>
                    {errors.slug.message?.toString()}
                  </FormErrorMessage>
                )}
              </FormControl>
              <Stack direction={["column", "row"]}>
                <FormControl
                  isInvalid={!!errors.start_date}
                  isRequired
                  isDisabled={createVoterMutation.isLoading}
                >
                  <FormLabel>Voting start date</FormLabel>
                  <Input
                    type="date"
                    {...register("start_date", {
                      valueAsDate: true,
                      required: "This is required.",
                    })}
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />

                  {errors.start_date && (
                    <FormErrorMessage>
                      {errors.start_date.message?.toString()}
                    </FormErrorMessage>
                  )}
                </FormControl>
                <FormControl
                  isInvalid={!!errors.end_date}
                  isRequired
                  isDisabled={createVoterMutation.isLoading}
                >
                  <FormLabel>Voting end date</FormLabel>
                  <Input
                    type="date"
                    {...register("end_date", {
                      valueAsDate: true,
                      required: "This is required.",
                    })}
                    defaultValue={
                      // https://stackoverflow.com/a/53236544
                      new Date(Date.now() + 6.048e8).toISOString().split("T")[0]
                    }
                  />

                  {errors.end_date && (
                    <FormErrorMessage>
                      {errors.end_date.message?.toString()}
                    </FormErrorMessage>
                  )}
                </FormControl>
              </Stack>
              <Stack direction={["column", "row"]} alignItems="center">
                <FormControl
                  isInvalid={!!errors.start_date}
                  isRequired
                  isDisabled={createVoterMutation.isLoading}
                >
                  <FormLabel>Voting hour start</FormLabel>
                  <Select
                    {...register("voting_start", {
                      required: "This is required.",
                      valueAsNumber: true,
                      value: 7,
                    })}
                    defaultValue={7}
                  >
                    {[...Array(24).keys()].map((_, i) => (
                      <option value={i} key={i}>
                        {convertNumberToHour(i)}
                      </option>
                    ))}
                  </Select>

                  {errors.start_date && (
                    <FormErrorMessage>
                      {errors.start_date.message?.toString()}
                    </FormErrorMessage>
                  )}
                </FormControl>

                <FormControl
                  isInvalid={!!errors.end_date}
                  isRequired
                  isDisabled={createVoterMutation.isLoading}
                >
                  <FormLabel>Voting hour end</FormLabel>
                  <Select
                    {...register("voting_end", {
                      required: "This is required.",
                      valueAsNumber: true,
                      value: 19,
                    })}
                    defaultValue={19}
                  >
                    {[...Array(24).keys()].map((_, i) => (
                      <option
                        value={i}
                        key={i}
                        disabled={i < watch("voting_start")}
                      >
                        {convertNumberToHour(i)}
                      </option>
                    ))}
                  </Select>

                  {errors.end_date && (
                    <FormErrorMessage>
                      {errors.end_date.message?.toString()}
                    </FormErrorMessage>
                  )}
                </FormControl>
              </Stack>
              <Text
                textAlign="center"
                fontSize="sm"
                opacity={createVoterMutation.isLoading ? 0.5 : 1}
              >
                {
                  // calculate the number of hours depending on the voting_start and voting_end

                  watch("voting_end") - watch("voting_start")
                }{" "}
                hour
                {watch("voting_end") - watch("voting_start") > 1 ? "s" : ""}
              </Text>
            </Stack>
            {createVoterMutation.error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {createVoterMutation.error.message}
                </AlertDescription>
              </Alert>
            )}
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
