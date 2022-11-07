import {
  Box,
  Button,
  Center,
  Flex,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorMode,
} from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import NextLink from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import readXlsxFile, { Row } from "read-excel-file";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";

interface UploadBulkVotersModalProps {
  onClose: () => void;
  isOpen: boolean;
}
const UploadBulkVotersModal = ({
  onClose,
  isOpen,
}: UploadBulkVotersModalProps) => {
  const { colorMode } = useColorMode();
  const [selectedFile, setSelectedFile] = useState<
    | [
        {
          fileName: string;
          voters: Row[];
        }
      ]
    | null
  >(null);

  useEffect(() => {
    !isOpen && setSelectedFile(null);
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
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
    },
    onDrop: (acceptedFiles) => {
      Array.from(acceptedFiles).forEach(async (file) => {
        if (selectedFile?.find((f) => f.fileName === file.name)) {
          return;
        }
        await readXlsxFile(file).then((rows) => {
          // @ts-ignore
          setSelectedFile((prev) => {
            if (prev) {
              return [...prev, { fileName: file.name, voters: rows.slice(1) }];
            } else {
              return [{ fileName: file.name, voters: rows.slice(1) }];
            }
          });
        });
      });
    },
  });

  return (
    <>
      <input {...getInputProps()} />
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
            <Flex justifyContent="space-between" alignItems="center">
              <Button onClick={open} leftIcon={<ArrowUpTrayIcon width={18} />}>
                Import voters
              </Button>
              <Box textAlign="right">
                <Tooltip
                  maxWidth="full"
                  bgColor={colorMode === "light" ? "gray.50" : "gray.700"}
                  color={
                    colorMode === "light" ? "blackAlpha.800" : "whiteAlpha.800"
                  }
                  label={
                    <TableContainer width="fit-content">
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th>Full name</Th>
                            <Th>Email address</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          <Tr>
                            <Td>DELA CRUZ, JUAN A.</Td>
                            <Td>juan.delacruz@cvsu.edu.ph</Td>
                          </Tr>
                          <Tr>
                            <Td>PENDUKO, PEDRO S.</Td>
                            <Td>pedro.penduko@cvsu.edu.ph</Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </TableContainer>
                  }
                  placement="top"
                  hasArrow
                >
                  <Text fontSize="xs" color="gray.400">
                    <NextLink href="/assets/excel/voters_sample.xlsx" download>
                      <Link>Download the sample file</Link>
                    </NextLink>
                  </Text>
                </Tooltip>
                <Tooltip
                  maxWidth="full"
                  bgColor={colorMode === "light" ? "gray.50" : "gray.700"}
                  color={
                    colorMode === "light" ? "blackAlpha.800" : "whiteAlpha.800"
                  }
                  label={
                    <TableContainer width="fit-content">
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th>
                              Full
                              name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Email
                              address
                            </Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          <Tr>
                            <Td textAlign="center">{"/* No data */"}</Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </TableContainer>
                  }
                  hasArrow
                >
                  <Text fontSize="xs" color="gray.400">
                    <NextLink
                      href="/assets/excel/voters_template.xlsx"
                      download
                    >
                      <Link>Download the template file</Link>
                    </NextLink>
                  </Text>
                </Tooltip>
              </Box>
            </Flex>

            {!selectedFile?.length ? (
              <Center height="lg" p={4}>
                <Center
                  height="full"
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
                      : colorMode === "light"
                      ? "gray.200"
                      : "gray.600"
                  }
                  borderStyle="dashed"
                  borderRadius="28px"
                  cursor="pointer"
                  userSelect="none"
                  {...getRootProps({})}
                >
                  <Text textAlign="center">
                    Import voters from excel file (.xlsx)
                  </Text>
                </Center>
              </Center>
            ) : (
              <TableContainer>
                <Box overflow="auto" height="lg">
                  <Table variant="simple" size="sm">
                    <Thead
                      position="sticky"
                      top={0}
                      backgroundColor="gray.700"
                      zIndex={1}
                    >
                      <Tr>
                        <Th>Full name</Th>
                        <Th>Email address</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>

                    <Tbody>
                      {selectedFile.map((file, i) => {
                        return (
                          <>
                            <Button
                              size="xs"
                              variant="outline"
                              mt={2}
                              onClick={() =>
                                // @ts-ignore
                                setSelectedFile((prev) => {
                                  if (prev) {
                                    return prev.filter(
                                      (_, index) => index !== i
                                    );
                                  } else {
                                    return null;
                                  }
                                })
                              }
                            >
                              Delete {file.fileName}
                            </Button>
                            {file.voters.map((row, i) => (
                              <Tr
                                key={i}
                                _hover={{ backgroundColor: "whiteAlpha.100" }}
                              >
                                <Td>{row[0].toLocaleString()}</Td>
                                <Td>{row[1].toLocaleString()}</Td>
                                {/* delete row and if no row delete file */}
                                <Td onClick={() => console.log(row, i)}>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => {
                                      // @ts-ignore
                                      setSelectedFile((prev) => {
                                        if (prev) {
                                          const newFile = {
                                            ...prev[i],
                                            voters: prev[i].voters.filter(
                                              (_, index) => index !== i
                                            ),
                                          };
                                          if (newFile.voters.length === 0) {
                                            return prev.filter(
                                              (_, index) => index !== i
                                            );
                                          } else {
                                            return [
                                              ...prev.slice(0, i),
                                              newFile,
                                              ...prev.slice(i + 1),
                                            ];
                                          }
                                        } else {
                                          return null;
                                        }
                                      });
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </Td>

                                {/* <Td>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() =>
                                      setSelectedFile((prev) => {
                                        if (prev) {
                                          return prev.map((file, index) => {
                                            if (index === i) {
                                              return {
                                                ...file,
                                                voters: file.voters.filter(
                                                  (_, index) => index !== i
                                                ),
                                              };
                                            } else {
                                              return file;
                                            }
                                          });
                                        } else {
                                          return null;
                                        }
                                      })
                                    }
                                  >
                                    Delete
                                  </Button>
                                </Td> */}
                              </Tr>
                            ))}
                          </>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              </TableContainer>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} disabled={!selectedFile?.length}>
              Upload
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UploadBulkVotersModal;
