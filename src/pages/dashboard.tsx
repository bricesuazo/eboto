import {
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  useDisclosure,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { api } from "../utils/api";
import { useEffect } from "react";

const DashboardPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const createElectionMutation = api.election.create.useMutation();
  // const myElections = api.election.getMyElections.useQuery(undefined, {
  //   refetchOnWindowFocus: false,
  //   refetchOnMount: false,
  //   refetchOnReconnect: false,
  // });

  useEffect(() => {
    !isOpen && reset();
  }, [isOpen, reset]);

  return (
    <Container maxW="4xl">
      <Button onClick={onOpen}>Create election</Button>
      <Modal
        isOpen={isOpen || createElectionMutation.isLoading}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create election</ModalHeader>
          <ModalCloseButton disabled={createElectionMutation.isLoading} />
          <form
            onSubmit={handleSubmit(async (data) => {
              await createElectionMutation.mutateAsync({
                name: data.name as string,
                start_date: data.start_date as Date,
                end_date: data.end_date as Date,
                slug: data.slug as string,
                voting_start: data.voting_start as number,
                voting_end: data.voting_end as number,
              });
              onClose();
            })}
          >
            <ModalBody>
              <Stack>
                <FormControl
                  isInvalid={!!errors.name}
                  isRequired
                  isDisabled={createElectionMutation.isLoading}
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
                  isDisabled={createElectionMutation.isLoading}
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
                <Stack direction="row">
                  <FormControl
                    isInvalid={!!errors.start_date}
                    isRequired
                    isDisabled={createElectionMutation.isLoading}
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
                    isDisabled={createElectionMutation.isLoading}
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
                        new Date(Date.now() + 6.048e8)
                          .toISOString()
                          .split("T")[0]
                      }
                    />

                    {errors.end_date && (
                      <FormErrorMessage>
                        {errors.end_date.message?.toString()}
                      </FormErrorMessage>
                    )}
                  </FormControl>
                </Stack>
                <Stack direction="row">
                  <FormControl
                    isInvalid={!!errors.start_date}
                    isRequired
                    isDisabled={createElectionMutation.isLoading}
                  >
                    <FormLabel>Voting hour start</FormLabel>
                    <Select
                      {...register("voting_start", {
                        required: "This is required.",
                        valueAsNumber: true,
                      })}
                    >
                      {[...Array(24).keys()].map((_, i) => (
                        <option value={i} key={i}>
                          {i === 0
                            ? "12 AM"
                            : i < 12
                            ? `${i} AM`
                            : i === 12
                            ? "12 PM"
                            : `${i - 12} PM`}
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
                    isDisabled={createElectionMutation.isLoading}
                  >
                    <FormLabel>Voting end date</FormLabel>
                    <Select
                      {...register("voting_end", {
                        required: "This is required.",
                        valueAsNumber: true,
                      })}
                    >
                      {[...Array(24).keys()].map((_, i) => (
                        <option value={i} key={i}>
                          {i === 0
                            ? "12 AM"
                            : i < 12
                            ? `${i} AM`
                            : i === 12
                            ? "12 PM"
                            : `${i - 12} PM`}
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
              </Stack>
            </ModalBody>

            <ModalFooter>
              <Button
                variant="ghost"
                mr={2}
                onClick={onClose}
                disabled={createElectionMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={createElectionMutation.isLoading}
              >
                Create
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default DashboardPage;
