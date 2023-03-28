import {
  Flex,
  Stack,
  TextInput,
  Button,
  Modal,
  Group,
  Text,
} from "@mantine/core";
import { hasLength, isNotEmpty, useForm } from "@mantine/form";
import { IconLetterCase, IconLock } from "@tabler/icons-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import AccountSettingsLayout from "../../components/layouts/AccountSettings";
import { useEffect, useState } from "react";
import { useDidUpdate, useDisclosure } from "@mantine/hooks";
import { api } from "../../utils/api";

const AccountPage = () => {
  const session = useSession();
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);
  const [page, setPage] = useState<number>(0);

  const confirmPasswordMutation = api.user.checkPassword.useMutation({
    onSuccess: () => setPage(1),
  });
  const deleteAccountMutation = api.user.deleteAccount.useMutation({
    onSuccess: async () => {
      await signOut({
        callbackUrl: "/signin",
      });
      close();
    },
  });

  const accountForm = useForm<{
    firstName: string;
    middleName: string;
    lastName: string;
    image: string;
  }>({
    initialValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      image: "",
    },
    validateInputOnBlur: true,
    validate: {
      firstName: isNotEmpty("First name is required"),
      lastName: isNotEmpty("Last name is required"),
    },
  });
  const confirmationForm = useForm<{
    password: string;
  }>({
    initialValues: {
      password: "",
    },
    validateInputOnBlur: true,
    clearInputErrorOnChange: true,
    validate: {
      password: hasLength(
        { min: 8 },
        "Password must be at least 8 characters long"
      ),
    },
  });

  const updateProfileMutation = api.user.updateProfile.useMutation({
    onSuccess: (data) => {
      const dataFormatted = {
        firstName: data.first_name,
        middleName: data.middle_name ?? "",
        lastName: data.last_name,
        image: data.image ?? "",
      };

      accountForm.setValues(dataFormatted);
      accountForm.resetDirty(dataFormatted);
    },
  });

  useDidUpdate(() => {
    if (opened) {
      confirmationForm.reset();
      confirmPasswordMutation.reset();
      setPage(0);
    }
  }, [opened]);

  useDidUpdate(() => {
    if (page === 0) {
      confirmPasswordMutation.reset();
    }
  }, [confirmationForm.values.password]);

  useEffect(() => {
    if (session.status === "authenticated") {
      const data = {
        firstName: session.data.user.firstName,
        middleName: session.data.user.middleName ?? "",
        lastName: session.data.user.lastName,
        image: session.data.user.image ?? "",
      };

      accountForm.setValues(data);
      accountForm.resetDirty(data);
    }
  }, [session.status, router.pathname]);

  return (
    <>
      <Modal
        opened={opened || confirmPasswordMutation.isLoading}
        onClose={close}
        title={<Text weight={600}>Confirm delete</Text>}
      >
        <form
          onSubmit={confirmationForm.onSubmit((value) =>
            page === 0
              ? confirmPasswordMutation.mutate({
                  password: value.password,
                })
              : deleteAccountMutation.mutate()
          )}
        >
          <Stack spacing="sm">
            {page === 0 && (
              <TextInput
                placeholder="Enter your password"
                description="Enter your password to confirm your identity"
                label="Password"
                required
                withAsterisk
                type="password"
                {...confirmationForm.getInputProps("password")}
                icon={<IconLock size="1rem" />}
                error={
                  confirmationForm.errors.password ||
                  confirmPasswordMutation.error?.message
                }
              />
            )}

            {page === 1 && (
              <Text>
                Are you sure you want to delete your account? This action is
                irreversible.
              </Text>
            )}

            <Group position="right" spacing="xs">
              <Button
                variant="default"
                onClick={close}
                disabled={
                  confirmPasswordMutation.isLoading ||
                  deleteAccountMutation.isLoading
                }
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="red"
                variant="outline"
                disabled={!confirmationForm.isValid()}
                loading={
                  confirmPasswordMutation.isLoading ||
                  deleteAccountMutation.isLoading
                }
              >
                {page === 0 ? "Confirm" : "Yes, delete my account"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
      <AccountSettingsLayout>
        <form
          onSubmit={accountForm.onSubmit((values) => {
            updateProfileMutation.mutate({
              firstName: values.firstName,
              middleName: values.middleName || null,
              lastName: values.lastName,
              image: values.image || null,
            });
          })}
        >
          <Stack>
            <Flex
              gap="sm"
              sx={(theme) => ({
                [theme.fn.smallerThan("sm")]: {
                  flexDirection: "column",
                },
              })}
            >
              <TextInput
                placeholder="Enter your first name"
                withAsterisk
                label="First name"
                required
                {...accountForm.getInputProps("firstName")}
                icon={<IconLetterCase size="1rem" />}
                disabled={
                  session.status === "loading" ||
                  updateProfileMutation.isLoading
                }
              />
              <TextInput
                placeholder="Enter your middle name"
                label="Middle name"
                {...accountForm.getInputProps("middleName")}
                icon={<IconLetterCase size="1rem" />}
                disabled={
                  session.status === "loading" ||
                  updateProfileMutation.isLoading
                }
              />
              <TextInput
                placeholder="Enter your last name"
                withAsterisk
                label="Last name"
                required
                {...accountForm.getInputProps("lastName")}
                icon={<IconLetterCase size="1rem" />}
                disabled={
                  session.status === "loading" ||
                  updateProfileMutation.isLoading
                }
              />
            </Flex>

            <Button
              disabled={!accountForm.isDirty()}
              w="fit-content"
              type="submit"
              loading={updateProfileMutation.isLoading}
            >
              Update profile
            </Button>

            <Button
              variant="outline"
              color="red"
              w="fit-content"
              onClick={open}
            >
              Delete Account
            </Button>
          </Stack>
        </form>
      </AccountSettingsLayout>
    </>
  );
};

export default AccountPage;
