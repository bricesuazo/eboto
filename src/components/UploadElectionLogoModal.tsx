import {
  AspectRatio,
  Box,
  Button,
  Center,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import { doc, Timestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { firestore, storage } from "../firebase/firebase";
import { electionType } from "../types/typings";
import formatBytes from "../utils/formatBytes";
import compress from "../utils/imageCompressor";

const UploadElectionLogoModal = ({
  election,
  isOpen,
  onClose,
}: {
  election: electionType;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [electionLogoUrl, setElectionLogoUrl] = useState<string | null>(
    election.logoUrl
  );

  const [image, setImage] = useState<{
    preview: string;
    name: string;
    size: number;
    file: File;
  } | null>(null);
  useEffect(() => {
    setImage(null);
    setElectionLogoUrl(election.logoUrl);
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
      <Modal
        isOpen={isUploading ? isUploading : isOpen}
        onClose={onClose}
        size="lg"
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload logo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {electionLogoUrl ? (
              <Stack spacing={4}>
                <AspectRatio position="relative" ratio={1 / 1}>
                  <Image
                    src={electionLogoUrl}
                    alt={`${election.name} logo`}
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </AspectRatio>
                <Center>
                  <Button onClick={() => setElectionLogoUrl(null)} size="sm">
                    Delete
                  </Button>
                </Center>
              </Stack>
            ) : image ? (
              <Stack spacing={4}>
                <img src={image.preview} alt="Uploaded election logo" />
                <Box>
                  <Text noOfLines={1} fontWeight="bold" fontSize="lg">
                    {image.name}
                  </Text>
                  <Text>{formatBytes(image.size)}</Text>
                  <Button onClick={() => setImage(null)} size="sm">
                    Delete
                  </Button>
                </Box>
              </Stack>
            ) : (
              <AspectRatio ratio={1 / 1}>
                <Center
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
              </AspectRatio>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} variant="ghost" disabled={isUploading}>
              Cancel
            </Button>
            <Button
              variant="solid"
              marginLeft={2}
              disabled={!image}
              isLoading={isUploading}
              onClick={async () => {
                setIsUploading(true);
                if (image) {
                  await compress(image.file)
                    .then(async (blob) => {
                      const storageRef = ref(
                        storage,
                        `elections/${election.uid}/photo`
                      );
                      const uploadTask = uploadBytesResumable(storageRef, blob);
                      uploadTask.on(
                        "state_changed",
                        (snapshot) => {
                          // const percent = Math.round(
                          //   (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                          // );
                          // update progress
                          // TODO: add progress bar
                          // setPercent(percent);
                        },
                        (err) => console.log(err),
                        () => {
                          // download url
                          getDownloadURL(uploadTask.snapshot.ref).then(
                            async (url) => {
                              await updateDoc(
                                doc(firestore, "elections", election.uid),
                                {
                                  logoUrl: url,
                                }
                              );
                            }
                          );
                        }
                      );
                    })
                    .finally(async () => {
                      await updateDoc(
                        doc(firestore, "elections", election.uid),
                        {
                          updatedAt: Timestamp.now(),
                        }
                      );
                    });
                }
                setIsUploading(false);
              }}
            >
              Upload
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UploadElectionLogoModal;
