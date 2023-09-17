"use client";

import { api } from "@/trpc/client";
import type { VoterField } from "@eboto-mo/db/schema";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  rem,
} from "@mantine/core";
import {
  Dropzone,
  DropzoneAccept,
  DropzoneIdle,
  DropzoneReject,
  MS_EXCEL_MIME_TYPE,
} from "@mantine/dropzone";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconDownload,
  IconFileSpreadsheet,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import Balancer from "react-wrap-balancer";
import * as XLSX from "xlsx";

export default function UploadBulkVoter({
  election_id,
  voter_fields,
}: {
  election_id: string;
  voter_fields: VoterField[];
}) {
  const [opened, { open, close }] = useDisclosure();

  const { mutate, isLoading, isError, error, reset } =
    api.election.uploadBulkVoter.useMutation({
      onSuccess: ({ count }) => {
        notifications.show({
          title: `${count} voter(s) added!`,
          message: "Successfully added voters",
          icon: <IconCheck size="1.1rem" />,
          autoClose: 5000,
        });
        close();
      },
    });

  const [selectedFiles, setSelectedFiles] = useState<
    {
      fileName: string;
      voters: {
        email: string;
      }[];
    }[]
  >([]);

  const openRef = useRef<() => void>(null);

  useEffect(() => {
    if (opened) {
      setSelectedFiles([]);
      reset();
    }
  }, [opened]);

  useEffect(() => {
    reset();
  }, [selectedFiles]);

  return (
    <>
      <Button
        onClick={open}
        leftSection={<IconUpload size="1rem" />}
        variant="light"
        // style={(theme) => ({
        //   [theme.fn.smallerThan("xs")]: {
        //     width: "100%",
        //   },
        // })}
      >
        Import
      </Button>
      <Modal
        onClose={close}
        opened={opened}
        title={<Text fw={600}>Upload bulk voters</Text>}
      >
        <Stack gap="sm">
          {!!selectedFiles.length && (
            <>
              <Button
                leftSection={<IconUpload size="1rem" />}
                onClick={() => openRef.current?.()}
              >
                Upload
              </Button>
              <Stack>
                {selectedFiles.map((file) => (
                  <Stack key={file.fileName} gap="sm">
                    <Group justify="space-between">
                      <Text fw={600}>{file.fileName}</Text>
                      <ActionIcon
                        title="Remove file"
                        aria-label="Remove file"
                        onClick={() => {
                          setSelectedFiles((prev) => {
                            if (prev) {
                              return prev.filter(
                                (f) => f.fileName !== file.fileName,
                              );
                            } else {
                              return [];
                            }
                          });
                        }}
                        disabled={selectedFiles.length === 0}
                        variant="outline"
                        color="red"
                      >
                        <IconTrash size="1.25rem" />
                      </ActionIcon>
                    </Group>
                    <Table>
                      <thead>
                        <tr>
                          <th>Email</th>
                          {voter_fields.map((field) => (
                            <th key={field.name}>{field.name}</th>
                          ))}
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {file.voters.map((voter) => (
                          <tr key={voter.email}>
                            <td>
                              <Text truncate>{voter.email}</Text>
                            </td>

                            <td>
                              <ActionIcon
                                title="Remove voter"
                                aria-label="Remove voter"
                                onClick={() => {
                                  setSelectedFiles((prev) => {
                                    return prev
                                      .map((f) => {
                                        if (f.fileName === file.fileName) {
                                          return {
                                            ...f,

                                            voters: f.voters.filter(
                                              (v) => v.email !== voter.email,
                                            ),
                                          };
                                        } else {
                                          return f;
                                        }
                                      })
                                      .filter((f) => f.voters.length > 0);
                                  });
                                }}
                                disabled={selectedFiles.length === 0}
                                color="red"
                              >
                                <IconTrash size="1.25rem" />
                              </ActionIcon>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Stack>
                ))}
              </Stack>
            </>
          )}
          <Dropzone
            openRef={openRef}
            hidden={!!selectedFiles.length}
            onDrop={(files) => {
              if (
                selectedFiles.find((sf) =>
                  files.find((f) => f.name === sf.fileName),
                )
              ) {
                return;
              }

              // TODO: Fix this
              // Array.from(files).forEach((file) => {
              //   void (async () =>
              //     await readXlsxFile(file).then((rows) => {
              //       if (rows.length < 1) {
              //         return;
              //       }

              //       if (
              //         rows[0] &&
              //         rows[0][0] !== "Email" &&
              //         !voter_fields.some(
              //           (val, i) => rows[0] && val.name === rows[0][i + 1],
              //         )
              //       ) {
              //         return;
              //       }

              //       if (selectedFiles.find((f) => f.fileName === file.name)) {
              //         return;
              //       }

              //       setSelectedFiles((prev) => [
              //         ...prev,
              //         {
              //           fileName: file.name,
              //           voters: rows.slice(1).map((row) => {
              //             return {
              //               email: row[0]?.toString() ?? "",
              //               field: voter_fields.reduce(
              //                 (acc, val, i) => {
              //                   acc[val.name] = row[i + 1]?.toString() ?? "";

              //                   return acc;
              //                 },
              //                 {} as Record<string, string>,
              //               ),
              //             };
              //           }),
              //         },
              //       ]);
              //     }))();
              // });
            }}
            accept={MS_EXCEL_MIME_TYPE}
          >
            <Group
              // direction="column"
              align="center"
              justify="center"
              gap="md"
              style={{ minHeight: rem(140), pointerEvents: "none" }}
            >
              <DropzoneAccept>
                <IconUpload
                  size="3.2rem"
                  stroke={1.5}
                  // color={
                  //   theme.colors.green[theme.colorScheme === "dark" ? 4 : 6]
                  // }
                />
              </DropzoneAccept>
              <DropzoneReject>
                <IconX
                  size="3.2rem"
                  stroke={1.5}
                  // color={theme.colors.red[theme.colorScheme === "dark" ? 4 : 6]}
                />
              </DropzoneReject>
              <DropzoneIdle>
                <IconFileSpreadsheet size="3.2rem" stroke={1.5} />
              </DropzoneIdle>
              <div>
                <Balancer>
                  <Text size="xl" ta="center">
                    Drag excel file here or click to select files
                  </Text>
                </Balancer>
              </div>
            </Group>
          </Dropzone>

          {isError && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              color="red"
              title="Error"
            >
              {error.message}
            </Alert>
          )}

          <Button
            size="xs"
            variant="outline"
            leftSection={<IconDownload size="1rem" />}
            onClick={() => {
              const worksheet = XLSX.utils.json_to_sheet([
                {
                  Email: "juan.delacruz@cvsu.edu.ph",
                  ...voter_fields.reduce((prev, curr) => {
                    return {
                      ...prev,
                      [curr.name]: "",
                    };
                  }, {}),
                },
                {
                  Email: "pedro.penduko@cvsu.edu.ph",
                  ...voter_fields.reduce((prev, curr) => {
                    return {
                      ...prev,
                      [curr.name]: "",
                    };
                  }, {}),
                },
              ]);
              const workbook = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
              XLSX.writeFile(workbook, "voters.xlsx");
            }}
          >
            Download sample excel file
          </Button>
          <Group justify="space-between" align="center">
            <ActionIcon
              title="Clear all"
              aria-label="Clear all"
              onClick={() => {
                setSelectedFiles([]);
              }}
              disabled={selectedFiles.length === 0}
              variant="outline"
              size="lg"
              color="red"
            >
              <IconTrash size="1.25rem" />
            </ActionIcon>
            <Group justify="right" gap="xs">
              <Button variant="default" onClick={close} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={selectedFiles.length === 0}
                loading={isLoading}
                onClick={() =>
                  mutate({
                    election_id,
                    voters: selectedFiles.flatMap((file) => file.voters),
                  })
                }
              >
                Upload
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
