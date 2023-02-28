import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Select,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import type { ElectionPublicity } from "@prisma/client";
import { useRouter } from "next/router";
import { type SubmitHandler, useForm } from "react-hook-form";
import ElectionDashboardHeader from "../../../components/ElectionDashboardHeader";
import { api } from "../../../utils/api";
import { convertNumberToHour } from "../../../utils/convertNumberToHour";

type FormValues = {
  name: string;
  start_date: string;
  end_date: string;
  slug: string;
  voting_start: number;
  voting_end: number;
  publicity: ElectionPublicity;
};

const DashboardSettings = () => {
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>();

  const { electionSlug } = router.query;

  const election = api.election.getElectionSettings.useQuery(
    electionSlug as string,
    {
      enabled: router.isReady,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  const updateElectionMutation = api.election.update.useMutation({
    onSuccess: async (data) => {
      if (electionSlug !== data.slug) {
        await router.push(`/dashboard/${data.slug}/settings`);
      } else {
        await election.refetch();
      }
      toast({
        title: "Election settings updated.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  const deleteElectionMutation = api.election.delete.useMutation({
    onSuccess: async () => {
      await router.push("/dashboard");
    },
  });

  if (election.isLoading) {
    return <div>Loading...</div>;
  }

  if (election.isError) {
    return <div>Error</div>;
  }

  if (!election.data) {
    return <div>Not found</div>;
  }

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    await updateElectionMutation.mutateAsync({
      name: data.name,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      slug: data.slug,
      voting_start: data.voting_start,
      voting_end: data.voting_end,
      id: election.data.id,
      publicity: data.publicity,
    });
  };

  return (
    <Container maxW="4xl">
      <ElectionDashboardHeader slug={election.data.slug} />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <FormControl
            isInvalid={!!errors.name}
            isRequired
            isDisabled={updateElectionMutation.isLoading}
          >
            <FormLabel>Election name</FormLabel>
            <Input
              placeholder="Enter election name"
              type="text"
              {...register("name", {
                value: election.data.name,
                required: "This is required.",
                minLength: {
                  value: 3,
                  message: "Election name must be at least 3 characters long.",
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
            isInvalid={!!errors.slug}
            isRequired
            isDisabled={updateElectionMutation.isLoading}
          >
            <FormLabel>Election slug</FormLabel>
            <Input
              placeholder="Enter election slug"
              type="text"
              {...register("slug", {
                value: election.data.slug,
                required: "This is required.",
                minLength: {
                  value: 3,
                  message: "Election slug must be at least 3 characters long.",
                },
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
              isDisabled={updateElectionMutation.isLoading}
            >
              <FormLabel>Voting start date</FormLabel>
              <Input
                type="date"
                {...register("start_date", {
                  value: election.data.start_date.toISOString().split("T")[0],
                  required: "This is required.",
                })}
                defaultValue={
                  election.data.start_date.toISOString().split("T")[0]
                }
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
              isDisabled={updateElectionMutation.isLoading}
            >
              <FormLabel>Voting end date</FormLabel>
              <Input
                type="date"
                {...register("end_date", {
                  value: election.data.end_date.toISOString().split("T")[0],
                  required: "This is required.",
                })}
                defaultValue={
                  election.data.end_date.toISOString().split("T")[0]
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
              isDisabled={updateElectionMutation.isLoading}
            >
              <FormLabel>Voting hour start</FormLabel>
              <Select
                {...register("voting_start", {
                  required: "This is required.",
                  valueAsNumber: true,
                  value: election.data.voting_start,
                })}
                defaultValue={election.data.voting_start}
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
              isDisabled={updateElectionMutation.isLoading}
            >
              <FormLabel>Voting hour end</FormLabel>
              <Select
                {...register("voting_end", {
                  value: election.data.voting_end,
                  required: "This is required.",
                  valueAsNumber: true,
                })}
                defaultValue={election.data.voting_end}
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
            opacity={updateElectionMutation.isLoading ? 0.5 : 1}
          >
            {watch("voting_end") - watch("voting_start")} hour
            {watch("voting_end") - watch("voting_start") > 1 ? "s" : ""}
          </Text>

          <FormControl
            isInvalid={!!errors.publicity}
            isRequired
            isDisabled={updateElectionMutation.isLoading}
          >
            <FormLabel>Publicity</FormLabel>
            <Select
              {...register("publicity", {
                value: election.data.publicity,
                required: "This is required.",
              })}
            >
              {["PRIVATE", "VOTER", "PUBLIC"].map((p, i) => (
                <option value={p} key={i}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>

            {errors.publicity && (
              <FormErrorMessage>
                {errors.publicity.message?.toString()}
              </FormErrorMessage>
            )}
          </FormControl>

          {updateElectionMutation.error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {updateElectionMutation.error.message}
              </AlertDescription>
            </Alert>
          )}
        </Stack>

        <Flex mt={4} justifyContent="space-between">
          <Button
            colorScheme="blue"
            type="submit"
            isLoading={updateElectionMutation.isLoading}
          >
            Update
          </Button>
          <Button
            variant="outline"
            colorScheme="red"
            onClick={() => deleteElectionMutation.mutate(election.data.id)}
            isLoading={deleteElectionMutation.isLoading}
          >
            Delete
          </Button>
        </Flex>
      </form>
    </Container>
  );
};

export default DashboardSettings;
