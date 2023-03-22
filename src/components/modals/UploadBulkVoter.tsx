import { Group, Modal, rem, Text, useMantineTheme } from "@mantine/core";
import { Dropzone, MS_EXCEL_MIME_TYPE } from "@mantine/dropzone";
import { IconFileSpreadsheet, IconUpload, IconX } from "@tabler/icons-react";

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
  return (
    <Modal
      onClose={onClose}
      opened={isOpen}
      title={<Text weight={600}>Upload bulk voters</Text>}
      size="lg"
    >
      <Dropzone
        onDrop={(files) => console.log("accepted files", files)}
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
            <Text size="xl" inline>
              Drag excel file here or click to select files
            </Text>
          </div>
        </Group>
      </Dropzone>
    </Modal>
  );
};

export default UploadBulkVoter;
