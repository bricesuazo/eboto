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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  ModalFooter,
  useRadioGroup,
  Text,
  Button,
  Box,
  useRadio,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { api } from "../../../src/utils/api";
import { useEffect } from "react";

function ElectionTemplateCard({
  children,
  ...props
}: {
  children: React.ReactNode;
}) {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getCheckboxProps();

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        borderWidth="1px"
        borderRadius="md"
        boxShadow="md"
        _checked={{
          bg: "teal.600",
          color: "white",
          borderColor: "teal.600",
        }}
        _focus={{
          boxShadow: "outline",
        }}
        px={5}
        py={3}
      >
        {children}
      </Box>
    </Box>
  );
}

const CreateElectionModal = ({
  isOpen,
  onClose,
}: {
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

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "template",
    defaultValue: "0",
    onChange: console.log,
  });

  const group = getRootProps();

  const createElectionMutation = api.election.create.useMutation();
  return (
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
              template: data.template as string,
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
              <Stack direction={["column", "row"]}>
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
                  isDisabled={createElectionMutation.isLoading}
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
              <Text textAlign="center" fontSize="sm">
                {
                  // calculate the number of hours depending on the voting_start and voting_end

                  watch("voting_end") - watch("voting_start")
                }{" "}
                hour
                {watch("voting_end") - watch("voting_start") > 1 ? "s" : ""}
              </Text>

              <Accordion allowMultiple>
                <AccordionItem border="none">
                  <AccordionButton>
                    <Text flex="1" textAlign="left">
                      Election template
                    </Text>
                    <AccordionIcon />
                  </AccordionButton>

                  <AccordionPanel
                    {...group}
                    display="flex"
                    flexWrap="wrap"
                    gap={2}
                  >
                    {[
                      { id: "0", value: "None" },
                      { id: "1", value: "CSSO" },
                      { id: "2", value: "CEIT" },
                      { id: "3", value: "CEadsIT" },
                      { id: "4", value: "ad" },
                      { id: "5", value: "asd" },
                    ].map((template) => {
                      const radio = getRadioProps({
                        value: template.id,
                      });
                      return (
                        <ElectionTemplateCard key={template.id} {...radio}>
                          {template.value}
                        </ElectionTemplateCard>
                      );
                    })}
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
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
  );
};

export default CreateElectionModal;
