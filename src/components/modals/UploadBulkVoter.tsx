import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Group,
  Modal,
  rem,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { Dropzone, MS_EXCEL_MIME_TYPE } from "@mantine/dropzone";
import {
  IconCheck,
  IconFileSpreadsheet,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import readXlsxFile, { type Row } from "read-excel-file";
import { useRef, useState } from "react";
import { useDidUpdate } from "@mantine/hooks";
import Balancer from "react-wrap-balancer";
import { api } from "../../utils/api";
import { notifications } from "@mantine/notifications";

const UploadBulkVoter = ({
  isOpen,
  onClose,
  electionId,
}: {
  electionId: string;
  isOpen: boolean;
  onClose: () => void;
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
      voters: Row[];
    }[]
  >([]);
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
        {selectedFiles.length ? (
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
                  <Box>
                    {file.voters.map((voter) => (
                      <Flex
                        key={voter[0]?.toString()}
                        justify="space-between"
                        align="center"
                      >
                        <Text truncate>{voter[0]?.toString()}</Text>

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
                                        (v) => v[0] !== voter[0]
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
                      </Flex>
                    ))}
                  </Box>
                </Stack>
              ))}
            </Stack>
          </>
        ) : (
          <Dropzone
            openRef={openRef}
            onDrop={(files) => {
              // if (selectedFile?.find((f) => f.fileName === file.name)) {
              //   return;
              // }

              Array.from(files).forEach((file) => {
                void (async () =>
                  await readXlsxFile(file).then((rows) => {
                    if (rows.length < 1) {
                      return;
                    }

                    if (rows[0] && rows[0][0] !== "email") {
                      return;
                    }

                    if (selectedFiles?.find((f) => f.fileName === file.name)) {
                      return;
                    }

                    setSelectedFiles((prev) => {
                      if (prev) {
                        return [
                          ...prev,
                          { fileName: file.name, voters: rows.slice(1) },
                        ];
                      } else {
                        return [{ fileName: file.name, voters: rows.slice(1) }];
                      }
                    });
                  }))();
              });
            }}
            onReject={(files) => console.log("rejected files", files)}
            accept={MS_EXCEL_MIME_TYPE}
          >
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap="md"
              style={{ minHeight: rem(220), pointerEvents: "none" }}
            >
              <Dropzone.Accept>
                <IconUpload
                  size="3.2rem"
                  stroke={1.5}
                  color={
                    theme.colors.green[theme.colorScheme === "dark" ? 4 : 6]
                  }
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
        )}
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
                  emails: selectedFiles.flatMap((f) =>
                    f.voters.map((v) => v[0]?.toString() ?? "")
                  ),
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
