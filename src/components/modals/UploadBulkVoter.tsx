import {
  ActionIcon,
  Button,
  Flex,
  Group,
  Modal,
  rem,
  Stack,
  Table,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { Dropzone, MS_EXCEL_MIME_TYPE } from "@mantine/dropzone";
import {
  IconCheck,
  IconDownload,
  IconFileSpreadsheet,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import readXlsxFile from "read-excel-file";
import { useRef, useState } from "react";
import { useDidUpdate } from "@mantine/hooks";
import Balancer from "react-wrap-balancer";
import { api } from "../../utils/api";
import { notifications } from "@mantine/notifications";
import * as XLSX from "xlsx";
import type { VoterField } from "@prisma/client";

const UploadBulkVoter = ({
  isOpen,
  onClose,
  electionId,
  voterFields,
}: {
  electionId: string;
  isOpen: boolean;
  onClose: () => void;
  voterFields: VoterField[];
}) => {
  const context = api.useContext();
  const createManyVoterMutation = api.voter.createMany.useMutation({
    onSuccess: async (data) => {
      await context.election.getElectionVoter.invalidate();
      notifications.show({
        title: `${data.count} voters added!`,
        message: "Successfully added voters",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      onClose();
    },
  });

  const theme = useMantineTheme();
  const [selectedFiles, setSelectedFiles] = useState<
    {
      fileName: string;
      voters: {
        email: string;
        field: Record<string, string>;
      }[];
    }[]
  >([]);
  console.log(
    "🚀 ~ file: UploadBulkVoter.tsx:58 ~ selectedFiles:",
    selectedFiles
  );

  const openRef = useRef<() => void>(null);

  useDidUpdate(() => {
    if (isOpen) {
      setSelectedFiles([]);
    }
  }, [isOpen]);

  return (
    <Modal
      onClose={onClose}
      opened={isOpen}
      title={<Text weight={600}>Upload bulk voters</Text>}
    >
      <Stack spacing="sm">
        {!!selectedFiles.length && (
          <>
            <Button
              leftIcon={<IconUpload size="1rem" />}
              onClick={() => openRef.current?.()}
            >
              Upload
            </Button>
            <Stack>
              {selectedFiles.map((file) => (
                <Stack key={file.fileName} spacing="sm">
                  <Flex justify="space-between">
                    <Text weight={600}>{file.fileName}</Text>
                    <ActionIcon
                      title="Remove file"
                      aria-label="Remove file"
                      onClick={() => {
                        setSelectedFiles((prev) => {
                          if (prev) {
                            return prev.filter(
                              (f) => f.fileName !== file.fileName
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
                  </Flex>
                  <Table>
                    <thead>
                      <tr>
                        <th>Email</th>
                        {voterFields.map((field) => (
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
                          {voterFields.map((field) => (
                            <td key={field.name}>
                              <Text truncate>
                                {voter.field[field.name] ?? ""}
                              </Text>
                            </td>
                          ))}
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
                                            (v) => v.email !== voter.email
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
                files.find((f) => f.name === sf.fileName)
              )
            ) {
              return;
            }

            Array.from(files).forEach((file) => {
              void (async () =>
                await readXlsxFile(file).then((rows) => {
                  if (rows.length < 1) {
                    return;
                  }

                  if (
                    rows[0] &&
                    rows[0][0] !== "Email" &&
                    !voterFields.some(
                      (val, i) => rows[0] && val.name === rows[0][i + 1]
                    )
                  ) {
                    return;
                  }

                  if (selectedFiles.find((f) => f.fileName === file.name)) {
                    return;
                  }

                  setSelectedFiles((prev) => [
                    ...prev,
                    {
                      fileName: file.name,
                      voters: rows.slice(1).map((row) => {
                        return {
                          email: row[0]?.toString() ?? "",
                          field: voterFields.reduce((acc, val, i) => {
                            if (row[i + 1]) {
                              acc[val.name] = row[i + 1]?.toString() ?? "";
                            }
                            return acc;
                          }, {} as Record<string, string>),
                        };
                      }),
                    },
                  ]);
                }))();
            });
          }}
          accept={MS_EXCEL_MIME_TYPE}
        >
          <Flex
            direction="column"
            align="center"
            justify="center"
            gap="md"
            style={{ minHeight: rem(140), pointerEvents: "none" }}
          >
            <Dropzone.Accept>
              <IconUpload
                size="3.2rem"
                stroke={1.5}
                color={theme.colors.green[theme.colorScheme === "dark" ? 4 : 6]}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                size="3.2rem"
                stroke={1.5}
                color={theme.colors.red[theme.colorScheme === "dark" ? 4 : 6]}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconFileSpreadsheet size="3.2rem" stroke={1.5} />
            </Dropzone.Idle>
            <div>
              <Balancer>
                <Text size="xl" align="center">
                  Drag excel file here or click to select files
                </Text>
              </Balancer>
            </div>
          </Flex>
        </Dropzone>

        <Button
          size="xs"
          variant="outline"
          leftIcon={<IconDownload size="1rem" />}
          onClick={() => {
            const worksheet = XLSX.utils.json_to_sheet([
              {
                Email: "juan.delacruz@cvsu.edu.ph",
                ...voterFields.reduce((prev, curr) => {
                  return {
                    ...prev,
                    [curr.name]: "",
                  };
                }, {}),
              },
              {
                Email: "pedro.penduko@cvsu.edu.ph",
                ...voterFields.reduce((prev, curr) => {
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
        <Flex justify="space-between" align="center">
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
          <Group position="right" spacing="xs">
            <Button
              variant="default"
              onClick={onClose}
              //   disabled={createVoterMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={selectedFiles.length === 0}
              loading={createManyVoterMutation.isLoading}
              onClick={() => {
                createManyVoterMutation.mutate({
                  electionId,
                  voters: selectedFiles.flatMap((f) => f.voters),
                });
              }}
            >
              Upload
            </Button>
          </Group>
        </Flex>
      </Stack>
    </Modal>
  );
};

export default UploadBulkVoter;
