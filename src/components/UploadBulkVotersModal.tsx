import {
  Button,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import readXlsxFile, { Row } from "read-excel-file";

interface UploadBulkVotersModalProps {
  onClose: () => void;
  isOpen: boolean;
}
const UploadBulkVotersModal = ({
  onClose,
  isOpen,
}: UploadBulkVotersModalProps) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<Row[][]>([[]]);

  const onHandleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files?.length !== 0) {
      Array.from(e.target.files).forEach(async (file) => {
        await readXlsxFile(file).then((rows) => {
          setSelectedFile((prev) => [...prev, rows.slice(1)]);
        });
      });
    } else {
      console.log("no");
    }
    console.log(selectedFile);
  };

  useEffect(() => {
    setSelectedFile([]);
  }, [isOpen]);

  return (
    <>
      <Input
        type="file"
        hidden
        accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ref={fileRef}
        onChange={onHandleFileChange}
        multiple
      />
      <Modal
        onClose={onClose}
        isOpen={isOpen}
        isCentered
        closeOnOverlayClick={false}
        size="6xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload bulk voters</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Download the{" "}
              <NextLink href="/assets/excel/voters_sample.xlsx" download>
                <Link>sample file</Link>
              </NextLink>
            </Text>
            <Text>
              Download the{" "}
              <NextLink href="/assets/excel/voters_template.xlsx" download>
                <Link>template file</Link>
              </NextLink>
            </Text>

            <Button onClick={() => fileRef.current && fileRef.current.click()}>
              Upload
            </Button>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Upload</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UploadBulkVotersModal;
