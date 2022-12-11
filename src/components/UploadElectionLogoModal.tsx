import {
  Box,
  Button,
  Center,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { Session } from "next-auth";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { electionType } from "../types/typings";
import formatBytes from "../utils/formatBytes";

const UploadElectionLogoModal = ({
  election,
  isOpen,
  onClose,
  session,
}: {
  election: electionType;
  isOpen: boolean;
  onClose: () => void;
  session: Session;
}) => {
  const [image, setImage] = useState<{
    preview: string;
    name: string;
    size: number;
    file: File;
  } | null>(null);
  useEffect(() => {
    setImage(null);
  }, [isOpen]);
  const {
    getRootProps,
    getInputProps,
    isFocused,
    isDragAccept,
    isDragReject,
    open,
  } = useDropzone({
    autoFocus: true,
    multiple: false,
    accept: {
      "image/jpeg": [".jpeg", ".png"],
    },
    onDrop: (acceptedFiles) => {
      setImage(
        Object.assign(acceptedFiles[0], {
          preview: URL.createObjectURL(acceptedFiles[0]),
          file: acceptedFiles[0],
        })
      );
    },
  });
  return (
    <>
      <input {...getInputProps()} />
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload logo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {election.logoUrl && election.logoUrl.length ? (
              <HStack spacing={4}>
                <Image
                  src={election.logoUrl}
                  alt={`${election.name} logo`}
                  width={256}
                  height={256}
                />
                <Box>
                  <Button onClick={() => setImage(null)} size="sm">
                    Delete
                  </Button>
                </Box>
              </HStack>
            ) : image ? (
              <HStack spacing={4}>
                <Image
                  src={image.preview}
                  alt="test"
                  width={256}
                  height={256}
                />
                <Box>
                  <Text noOfLines={1} fontWeight="bold" fontSize="lg">
                    {image.name}
                  </Text>
                  <Text>{formatBytes(image.size)}</Text>
                  <Button onClick={() => setImage(null)} size="sm">
                    Delete
                  </Button>
                </Box>
              </HStack>
            ) : (
              <Center
                height="64"
                width="full"
                p={4}
                borderWidth={4}
                borderColor={
                  isDragAccept
                    ? "green.500"
                    : isDragReject
                    ? "red.500"
                    : isFocused
                    ? "blue.500"
                    : "gray.200"
                }
                borderStyle="dashed"
                borderRadius="28px"
                cursor="pointer"
                userSelect="none"
                onClick={open}
                {...getRootProps({})}
              >
                <Text textAlign="center">
                  Drag/click the box to upload the election&apos;s logo.
                  <br />
                  (only accepts 1:1 ratio and .jpg, .jpeg, .png, .gif types)
                </Text>
              </Center>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button variant="solid" marginLeft={2} disabled={!image}>
              Upload
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UploadElectionLogoModal;
