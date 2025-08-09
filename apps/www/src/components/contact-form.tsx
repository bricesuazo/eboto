'use client';

import {
  Box,
  Button,
  Flex,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAt, IconMapPin, IconPhone, IconSun } from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';

import type { ContactForm } from '~/schema/contact';
import { ContactFormSchema } from '~/schema/contact';
import classes from '~/styles/Home.module.css';
import { api } from '~/trpc/client';

export default function ContactForm() {
  const sendMessageMutation = api.system.sendMessage.useMutation({
    onSuccess: () => {
      form.reset();
    },
  });
  const form = useForm<ContactForm>({
    initialValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
    validate: zod4Resolver(ContactFormSchema),
  });
  return (
    <Paper radius="lg" withBorder p="sm">
      <Flex direction={{ base: 'column', sm: 'row' }}>
        <div
          className={classes.contacts}
          style={{ backgroundImage: `url(/images/bg.svg)` }}
        >
          <Text fz="lg" fw={700} className={classes['title-parent']} c="#fff">
            Contact information
          </Text>

          <Stack>
            {[
              {
                title: 'Email',
                description: 'contact@eboto.app',
                icon: IconAt,
              },
              {
                title: 'Phone',
                description: '+63 961 719 6607',
                icon: IconPhone,
              },
              {
                title: 'Address',
                description: 'Philippines',
                icon: IconMapPin,
              },
              {
                title: 'Working hours',
                description: '10AM – 7PM (PHT)',
                icon: IconSun,
              },
            ].map((item, index) => (
              <div key={index} className={classes.wrapper}>
                <Box mr="md">
                  <item.icon />
                </Box>

                <div>
                  <Text size="xs" className={classes['title-contact']}>
                    {item.title}
                  </Text>
                  <Text className={classes.description}>
                    {item.description}
                  </Text>
                </div>
              </div>
            ))}
          </Stack>
        </div>

        <form
          className={classes.form}
          onSubmit={form.onSubmit((values) =>
            sendMessageMutation.mutate(values),
          )}
        >
          <Text fz="lg" fw={700} className={classes['title-parent']}>
            Get in touch
          </Text>

          <div className={classes.fields}>
            <Flex gap="md" direction={{ base: 'column', sm: 'row' }}>
              <TextInput
                label="Name"
                placeholder="Your name"
                disabled={sendMessageMutation.isPending}
                w="100%"
                {...form.getInputProps('name')}
              />
              <TextInput
                label="Email Address"
                placeholder="brice@bricesuazo.com"
                w="100%"
                disabled={sendMessageMutation.isPending}
                required
                {...form.getInputProps('email')}
              />
            </Flex>

            <TextInput
              mt="md"
              label="Subject"
              placeholder="Subject"
              disabled={sendMessageMutation.isPending}
              required
              {...form.getInputProps('subject')}
            />

            <Textarea
              required
              mt="md"
              label="Your message"
              placeholder="Please include all relevant information"
              autosize
              minRows={2}
              maxRows={5}
              disabled={sendMessageMutation.isPending}
              {...form.getInputProps('message')}
            />

            <Group justify="flex-end" mt="md">
              <Button
                type="submit"
                w={{ base: '100%', sm: 'fit-content' }}
                loading={sendMessageMutation.isPending}
              >
                Send message
              </Button>
            </Group>
          </div>
        </form>
      </Flex>
    </Paper>
  );
}
