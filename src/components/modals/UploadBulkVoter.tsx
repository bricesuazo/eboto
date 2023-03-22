import { Group, Modal, rem, Text, useMantineTheme } from "@mantine/core";
import { Dropzone, MS_EXCEL_MIME_TYPE } from "@mantine/dropzone";
import { IconFileSpreadsheet, IconUpload, IconX } from "@tabler/icons-react";
import readXlsxFile, { type Row } from "read-excel-file";
import { useState } from "react";

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
  >();
  console.log("selectedFile", selectedFiles);
  return (
    <Modal
      onClose={onClose}
      opened={isOpen}
      title={<Text weight={600}>Upload bulk voters</Text>}
      size="lg"
    >
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

                if (
                  rows[0] &&
                  (rows[0][0] !== "full_name" || rows[0][1] !== "email")
                ) {
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
        <Group
          position="center"
          spacing="xl"
          style={{ minHeight: rem(220), pointerEvents: "none" }}
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
            <Text size="xl" align="center">
              Drag excel file here or click to select files
            </Text>
          </div>
        </Group>
      </Dropzone>
    </Modal>
  );
};

export default UploadBulkVoter;
