import {
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
import { IconFileSpreadsheet, IconUpload, IconX } from "@tabler/icons-react";
import readXlsxFile, { type Row } from "read-excel-file";
import { useState } from "react";
import { useDidUpdate } from "@mantine/hooks";
import Balancer from "react-wrap-balancer";

const UploadBulkVoter = ({
  isOpen,
  onClose,
  electionId,
  refetch,
}: {
  electionId: string;
  isOpen: boolean;
  onClose: () => void;
  refetch: () => Promise<unknown>;
}) => {
  const theme = useMantineTheme();
  const [selectedFiles, setSelectedFiles] = useState<
    {
      fileName: string;
      voters: Row[];
    }[]
  >([]);

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
          <Stack>
            {selectedFiles.map((file) => (
              <Stack key={file.fileName} spacing="sm">
                <Flex justify="space-between">
                  <Text weight={600}>{file.fileName}</Text>
                  <Button
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
                    color="red"
                    compact
                  >
                    Delete
                  </Button>
                </Flex>
                <Stack spacing="xs">
                  {file.voters.map((voter) => (
                    <Flex key={voter[0]?.toString()} justify="space-between">
                      <Text>{voter[0]?.toString()}</Text>
                      <Button
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
                        compact
                        color="red"
                      >
                        Delete
                      </Button>
                    </Flex>
                  ))}
                </Stack>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Dropzone
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
                <Text size="xl" align="center">
                  <Balancer>
                    Drag excel file here or click to select files
                  </Balancer>
                </Text>
              </div>
            </Flex>
          </Dropzone>
        )}
        <Flex justify="space-between">
          <Button
            color="red"
            onClick={() => {
              setSelectedFiles([]);
            }}
            disabled={selectedFiles.length === 0}
          >
            Clear all
          </Button>
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
              //   loading={createVoterMutation.isLoading}
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
