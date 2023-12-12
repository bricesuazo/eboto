"use client";

import { useEffect } from "react";
import Image from "next/image";
import { api } from "@/trpc/client";
import {
  ActionIcon,
  Alert,
  Box,
  Drawer,
  Flex,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  rem,
  ScrollArea,
  ScrollAreaAutosize,
  Skeleton,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure, useViewportSize } from "@mantine/hooks";
import { IconAlertCircle, IconMessage2, IconX } from "@tabler/icons-react";

export default function MyMessagesElection({
  election_id,
}: {
  election_id: string;
}) {
  const [opened, { close, toggle }] = useDisclosure(false);

  const { width } = useViewportSize();

  useEffect(() => {
    if (width < 1000 && opened) {
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  // const TriggerButton = forwardRef<
  //   HTMLButtonElement,
  //   React.ComponentPropsWithoutRef<"button">
  // >((props, ref) => (
  //   <ActionIcon
  //     ref={ref}
  //     variant={!opened ? "filled" : "light"}
  //     radius="xl"
  //     size={60}
  //     onClick={toggle}
  //     {...props}
  //   >
  //     {opened ? <IconX /> : <IconMessage2 />}
  //   </ActionIcon>
  // ));

  return (
    <>
      <Popover
        opened={opened}
        onChange={toggle}
        width={400}
        position="top"
        shadow="md"
        withArrow
      >
        <PopoverTarget>
          <ActionIcon
            variant={!opened ? "filled" : "light"}
            radius="xl"
            size={60}
            onClick={toggle}
            style={{
              position: "fixed",
              bottom: rem(80),
              left: rem(20),
              zIndex: 100,
            }}
          >
            {opened ? <IconX /> : <IconMessage2 />}
          </ActionIcon>
        </PopoverTarget>
        <PopoverDropdown visibleFrom="sm">
          <ScrollArea h={400}>
            <Text ta="center" size="sm" c="gray" mb="xs">
              Messages
            </Text>

            <Message opened={opened} election_id={election_id} />
          </ScrollArea>
        </PopoverDropdown>
      </Popover>

      <Drawer
        radius="md"
        opened={opened}
        onClose={close}
        title="Messages"
        scrollAreaComponent={ScrollAreaAutosize}
        hiddenFrom="sm"
      >
        <Message opened={opened} election_id={election_id} />
      </Drawer>
    </>
  );
}

function Message({
  election_id,
  opened,
}: {
  election_id: string;
  opened: boolean;
}) {
  const getAllMyMessagesQuery = api.election.getAllMyMessages.useQuery(
    { election_id },
    { enabled: opened },
  );
  return (
    <>
      {!getAllMyMessagesQuery.data || getAllMyMessagesQuery.isLoading ? (
        <Stack gap="xs">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} h={60} />
          ))}
        </Stack>
      ) : getAllMyMessagesQuery.data.length === 0 ? (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          color="yellow"
          title="No messages"
          variant="filled"
        >
          You have not received any messages from the commissioner yet.
        </Alert>
      ) : (
        <Stack gap="sm">
          {getAllMyMessagesQuery.data.map((room) => (
            <UnstyledButton
              key={room.id}
              p="md"
              style={{
                border: "1px solid #80808050",
                borderRadius: 8,
              }}
              w="100%"
              // onClick={() =>
              //   setChat({
              //     type: "admin",
              //     id: room.id,
              //     name: room.messages[0]?.user.name ?? "",
              //     title: room.name,
              //   })
              // }
            >
              <Flex justify="space-between">
                <Box>
                  <Text
                    lineClamp={1}
                    style={{
                      wordBreak: "break-all",
                    }}
                  >
                    {room.name}
                  </Text>
                  {room.messages[0] && (
                    <Flex align="center" gap="sm">
                      <Image
                        src={
                          room.messages[0].user.image ??
                          room.messages[0].user.image_file?.url ??
                          ""
                        }
                        alt={room.messages[0].user.name + " image."}
                        width={20}
                        height={20}
                        style={{
                          borderRadius: "50%",
                        }}
                      />
                      <Text
                        size="sm"
                        lineClamp={1}
                        style={{
                          wordBreak: "break-all",
                        }}
                      >
                        {room.messages[0].message}
                      </Text>
                    </Flex>
                  )}
                </Box>
                {/* <HoverCard openDelay={500}>
                  <HoverCardTarget>
                    <Text
                      size="xs"
                      c="gray"
                      aria-label={moment(room.created_at).format(
                        "MMMM D, YYYY hh:mm A",
                      )}
                      miw="fit-content"
                    >
                      {moment(room.created_at).fromNow()}
                    </Text>
                  </HoverCardTarget>
                  <HoverCardDropdown>
                    <Text size="xs" c="gray">
                      {moment(room.created_at).format("MMMM D, YYYY hh:mm A")}
                    </Text>
                  </HoverCardDropdown>
                </HoverCard> */}
              </Flex>
            </UnstyledButton>
          ))}
        </Stack>
      )}
    </>
  );
}
