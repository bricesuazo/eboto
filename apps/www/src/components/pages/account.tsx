'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Box,
  Button,
  Group,
  Modal,
  rem,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { hasLength, useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconAt, IconLetterCase, IconLock, IconX } from '@tabler/icons-react';

import type { RouterOutputs } from '@eboto/api';

import { createClient } from '~/supabase/client';
import { api } from '~/trpc/client';
import { transformUploadImage } from '~/utils';

export default function AccountPageClient(
  props: RouterOutputs['auth']['getUserProtected'],
) {
  const utils = api.useUtils();
  const openRef = useRef<() => void>(null);
  const [loading, setLoading] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [page, setPage] = useState<number>(0);

  const getUserProtectedQuery = api.auth.getUserProtected.useQuery(undefined, {
    initialData: props,
  });

  // const confirmPasswordMutation = api.user.checkPassword.useMutation({
  //   onSuccess: () => setPage(1),
  // });
  const deleteAccountMutation = api.user.deleteAccount.useMutation({
    onSuccess: async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      close();
    },
  });

  const accountForm = useForm<{
    // firstName: string;
    // middleName: string;
    // lastName: string;
    name?: string | null;
    image?: File | null | string;
  }>({
    initialValues: {
      //   firstName: "",
      //   middleName: "",
      //   lastName: "",
      name: getUserProtectedQuery.data.db.name,
      image: getUserProtectedQuery.data.db.image_url,
    },
    // validate: {
    //   firstName: isNotEmpty("First name is required"),
    //   lastName: isNotEmpty("Last name is required"),
    // },
  });
  const confirmationForm = useForm<{
    password: string;
  }>({
    initialValues: {
      password: '',
    },
    validate: {
      password: hasLength(
        { min: 8 },
        'Password must be at least 8 characters long',
      ),
    },
  });

  const updateProfileMutation = api.user.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.auth.getUser.invalidate();
      const user = await getUserProtectedQuery.refetch();

      const dataFormatted = {
        // firstName: data.first_name,
        // middleName: data.middle_name ?? "",
        // lastName: data.last_name,
        name: user.data?.db.name ?? null,
        image: user.data?.db.image_url ?? null,
      };

      accountForm.setValues(dataFormatted);
      accountForm.resetDirty(dataFormatted);
    },
  });

  useEffect(() => {
    if (opened) {
      confirmationForm.reset();
      //   confirmPasswordMutation.reset();
      setPage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  //   useEffect(() => {
  //     if (page === 0) {
  //       confirmPasswordMutation.reset();
  //     }
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, [confirmationForm.values.password]);

  // useEffect(() => {
  //   const data = {
  //     //   firstName: session.user.firstName,
  //     //   middleName: session.user.middleName ?? "",
  //     //   lastName: session.user.lastName,
  //     name: getUserProtectedQuery.data.user.name ?? null,
  //     image: getUserProtectedQuery.data.user.image ?? null,
  //   };

  //   accountForm.setValues(data);
  //   // accountForm.resetDirty(data);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [pathname]);

  return (
    <>
      <Modal
        opened={
          opened
          //   || confirmPasswordMutation.isPending
        }
        onClose={close}
        title={<Text fw={600}>Confirm delete</Text>}
      >
        <form
        //   onSubmit={confirmationForm.onSubmit((value) =>
        //     page === 0
        //       ? confirmPasswordMutation.mutate({
        //           password: value.password,
        //         })
        //       : deleteAccountMutation.mutate(),
        //   )}
        >
          <Stack gap="sm">
            {page === 0 && (
              <TextInput
                placeholder="Enter your password"
                description="Enter your password to confirm your identity"
                label="Password"
                required
                withAsterisk
                type="password"
                {...confirmationForm.getInputProps('password')}
                leftSection={<IconLock size="1rem" />}
                error={
                  confirmationForm.errors.password
                  //   ||
                  //   confirmPasswordMutation.error?.message
                }
              />
            )}

            {page === 1 && (
              <Text>
                Are you sure you want to delete your account? This action is
                irreversible.
              </Text>
            )}

            <Group justify="right" gap="xs">
              <Button
                variant="default"
                onClick={close}
                disabled={
                  // confirmPasswordMutation.isPending ||
                  deleteAccountMutation.isPending
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
                  //   confirmPasswordMutation.isPending ||
                  deleteAccountMutation.isPending
                }
              >
                {page === 0 ? 'Confirm' : 'Yes, delete my account'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <form
        onSubmit={accountForm.onSubmit((values) => {
          void (async () => {
            setLoading(true);

            await updateProfileMutation.mutateAsync({
              // firstName: values.firstName,
              // middleName: values.middleName || null,
              // lastName: values.lastName,
              name: values.name ?? '',
              image:
                values.image !== null && typeof values.image !== 'string'
                  ? values.image
                    ? await transformUploadImage(values.image)
                    : undefined
                  : null,
            });

            setLoading(false);
          })();
        })}
      >
        <Stack>
          <TextInput
            placeholder="Email"
            label="Email"
            value={getUserProtectedQuery.data.db.email}
            leftSection={<IconAt size="1rem" />}
            readOnly
            disabled
          />
          <TextInput
            placeholder="Enter your name"
            withAsterisk
            label="Full name"
            required
            {...accountForm.getInputProps('name')}
            leftSection={<IconLetterCase size="1rem" />}
            disabled={loading}
          />
          <Box>
            <Text size="sm" fw={500} component="label" htmlFor="image" inline>
              Profile picture
            </Text>
            <Stack gap="xs">
              <Dropzone
                id="image"
                onDrop={(files) => {
                  if (!files[0]) return;
                  accountForm.setFieldValue('image', files[0]);
                }}
                openRef={openRef}
                maxSize={5 * 1024 ** 2}
                accept={IMAGE_MIME_TYPE}
                multiple={false}
                loading={loading}
              >
                <Group
                  justify="center"
                  gap="xl"
                  style={{ minHeight: rem(140), pointerEvents: 'none' }}
                >
                  {accountForm.values.image ? (
                    typeof accountForm.values.image !== 'string' ? (
                      <Group>
                        <Box pos="relative" w={rem(120)} h={rem(120)}>
                          <Image
                            src={URL.createObjectURL(accountForm.values.image)}
                            alt="image"
                            fill
                            sizes="100%"
                            priority
                            style={{ objectFit: 'cover' }}
                          />
                        </Box>
                        <Text>{accountForm.values.name}</Text>
                      </Group>
                    ) : (
                      props.db.image_url && (
                        <Group>
                          <Box
                            pos="relative"
                            style={() => ({
                              width: rem(120),
                              height: rem(120),
                            })}
                          >
                            <Image
                              src={props.db.image_url}
                              alt="image"
                              fill
                              sizes="100%"
                              priority
                              style={{ objectFit: 'cover' }}
                            />
                          </Box>
                          <Text>Current image</Text>
                        </Group>
                      )
                    )
                  ) : accountForm.values.image ? (
                    <Group>
                      <Box pos="relative" w={rem(120)} h={rem(120)}>
                        <Image
                          src={accountForm.values.image}
                          alt="image"
                          fill
                          sizes="100%"
                          priority
                          style={{ objectFit: 'cover' }}
                        />
                      </Box>
                      <Text>Current image</Text>
                    </Group>
                  ) : (
                    <Box>
                      <Text size="xl" inline ta="center">
                        Drag image here or click to select image
                      </Text>
                      <Text size="sm" color="dimmed" inline mt={7} ta="center">
                        Attach a image to your account. Max file size is 5MB.
                      </Text>
                    </Box>
                  )}
                  <Dropzone.Reject>
                    <IconX size="3.2rem" stroke={1.5} />
                  </Dropzone.Reject>
                </Group>
              </Dropzone>
              <Group grow>
                <Button
                  variant="light"
                  onClick={() => {
                    accountForm.setValues({
                      ...accountForm.values,
                      image: getUserProtectedQuery.data.db.image_url,
                    });
                  }}
                  disabled={
                    accountForm.values.image ===
                      getUserProtectedQuery.data.db.image_url || loading
                  }
                >
                  Reset image
                </Button>
                <Button
                  color="red"
                  variant="light"
                  onClick={() => {
                    accountForm.setValues({ image: null });
                  }}
                  disabled={!accountForm.values.image || loading}
                >
                  Delete image
                </Button>
              </Group>
            </Stack>
          </Box>
          <Group justify="space-between" gap={0}>
            <Button
              disabled={!accountForm.isDirty()}
              w="fit-content"
              type="submit"
              loading={loading}
              hiddenFrom="xs"
            >
              Update
            </Button>
            <Button
              disabled={!accountForm.isDirty()}
              w="fit-content"
              type="submit"
              loading={loading}
              visibleFrom="xs"
            >
              Update profile
            </Button>
            <Button
              variant="outline"
              color="red"
              w="fit-content"
              onClick={open}
              disabled
            >
              Delete Account
            </Button>
          </Group>
        </Stack>
      </form>
    </>
  );
}
