import {
  Flex,
  Stack,
  TextInput,
  Button,
  Modal,
  Group,
  Text,
  rem,
  Box,
} from "@mantine/core";
import { hasLength, isNotEmpty, useForm } from "@mantine/form";
import { IconLetterCase, IconLock, IconX } from "@tabler/icons-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import AccountSettingsLayout from "../../components/layouts/AccountSettings";
import { useEffect, useRef, useState } from "react";
import { useDidUpdate, useDisclosure } from "@mantine/hooks";
import { api } from "../../utils/api";
import {
  Dropzone,
  type FileWithPath,
  IMAGE_MIME_TYPE,
} from "@mantine/dropzone";
import Image from "next/image";
import { uploadImage } from "../../utils/uploadImage";

const AccountPage = () => {
  const openRef = useRef<() => void>(null);
  const [loading, setLoading] = useState(false);
  const session = useSession();
  console.log("🚀 ~ file: index.tsx:32 ~ AccountPage ~ session:", session);
  console.log("🚀 ~ file: index.tsx:32 ~ AccountPage ~ session:", session);
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
    image: FileWithPath | null | string;
  }>({
    initialValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      image: null,
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
        image: data.image,
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
    if (session.data) {
      const data = {
        firstName: session.data.user.firstName,
        middleName: session.data.user.middleName ?? "",
        lastName: session.data.user.lastName,
        image: session.data.user.image,
      };

      accountForm.setValues(data);
      accountForm.resetDirty(data);
    }
  }, [session.data, router.pathname]);

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
            void (async () => {
              setLoading(true);
              await updateProfileMutation.mutateAsync({
                firstName: values.firstName,
                middleName: values.middleName || null,
                lastName: values.lastName,
                image:
                  typeof values.image === "string" || values.image === null
                    ? values.image
                    : session.data &&
                      (await uploadImage({
                        path:
                          "/users/" +
                          session.data.user.id +
                          "/image/" +
                          Date.now().toString(),
                        image: values.image,
                      })),
              });
              setLoading(false);
            })();
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
                disabled={session.status === "loading" || loading}
              />
              <TextInput
                placeholder="Enter your middle name"
                label="Middle name"
                {...accountForm.getInputProps("middleName")}
                icon={<IconLetterCase size="1rem" />}
                disabled={session.status === "loading" || loading}
              />
              <TextInput
                placeholder="Enter your last name"
                withAsterisk
                label="Last name"
                required
                {...accountForm.getInputProps("lastName")}
                icon={<IconLetterCase size="1rem" />}
                disabled={session.status === "loading" || loading}
              />
            </Flex>
            <Box>
              <Text
                size="sm"
                weight={500}
                component="label"
                htmlFor="image"
                inline
              >
                Profile picture
              </Text>
              <Dropzone
                id="image"
                onDrop={(files) => {
                  if (!files[0]) return;
                  accountForm.setFieldValue("image", files[0]);
                }}
                openRef={openRef}
                maxSize={5 * 1024 ** 2}
                accept={IMAGE_MIME_TYPE}
                multiple={false}
                loading={loading}
                disabled={session.status === "loading"}
              >
                <Group
                  position="center"
                  spacing="xl"
                  style={{ minHeight: rem(220), pointerEvents: "none" }}
                >
                  {accountForm.values.image ? (
                    typeof accountForm.values.image !== "string" &&
                    accountForm.values.image ? (
                      <Group>
                        <Box
                          pos="relative"
                          sx={(theme) => ({
                            width: rem(120),
                            height: rem(120),

                            [theme.fn.smallerThan("sm")]: {
                              width: rem(180),
                              height: rem(180),
                            },
                          })}
                        >
                          <Image
                            src={
                              typeof accountForm.values.image === "string"
                                ? accountForm.values.image
                                : URL.createObjectURL(accountForm.values.image)
                            }
                            alt="image"
                            fill
                          />
                        </Box>
                        <Text>{accountForm.values.image.name}</Text>
                      </Group>
                    ) : (
                      session.data?.user.image && (
                        <Group>
                          <Box
                            pos="relative"
                            sx={(theme) => ({
                              width: rem(120),
                              height: rem(120),

                              [theme.fn.smallerThan("sm")]: {
                                width: rem(180),
                                height: rem(180),
                              },
                            })}
                          >
                            <Image
                              src={session.data.user.image}
                              alt="image"
                              fill
                            />
                          </Box>
                          <Text>Current image</Text>
                        </Group>
                      )
                    )
                  ) : (
                    <Box>
                      <Text size="xl" inline align="center">
                        Drag image here or click to select image
                      </Text>
                      <Text
                        size="sm"
                        color="dimmed"
                        inline
                        mt={7}
                        align="center"
                      >
                        Attach a image to your account. Max file size is 5MB.
                      </Text>
                    </Box>
                  )}
                  <Dropzone.Reject>
                    <IconX size="3.2rem" stroke={1.5} />
                  </Dropzone.Reject>
                </Group>
              </Dropzone>
              <Button
                onClick={() => {
                  session.data &&
                    accountForm.setValues({
                      ...accountForm.values,
                      image: session.data.user.image,
                    });
                }}
                disabled={
                  !accountForm.values.image ||
                  typeof accountForm.values.image === "string" ||
                  session.status === "loading" ||
                  loading
                }
              >
                Reset image
              </Button>
              <Button
                onClick={() => {
                  accountForm.setFieldValue("image", null);
                }}
                disabled={!accountForm.values.image || loading}
              >
                Delete image
              </Button>
            </Box>

            <Button
              disabled={!accountForm.isDirty() || session.status === "loading"}
              w="fit-content"
              type="submit"
              loading={loading}
            >
              Update profile
            </Button>

            <Button
              variant="outline"
              color="red"
              w="fit-content"
              disabled={session.status === "loading"}
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
