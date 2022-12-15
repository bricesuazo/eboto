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
  useToast,
} from "@chakra-ui/react";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import {
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import readXlsxFile, { Row } from "read-excel-file";
import { v4 as uuidv4 } from "uuid";
import { firestore } from "../firebase/firebase";
import { electionType } from "../types/typings";
import generatePassword from "../utils/generatePassword";

interface UploadBulkVotersModalProps {
  onClose: () => void;
  isOpen: boolean;
  election: electionType;
}
const UploadBulkVotersModal = ({
  onClose,
  isOpen,
  election,
}: UploadBulkVotersModalProps) => {
  const toast = useToast();
  const { colorMode } = useColorMode();
  const [loading, setLoading] = useState(false);
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
                            <Th textTransform="lowercase">full_name</Th>
                            <Th textTransform="lowercase">email</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          <Tr>
                            <Td>DELA CRUZ, JUAN A.</Td>
                            <Td textTransform="lowercase">
                              juan.delacruz@cvsu.edu.ph
                            </Td>
                          </Tr>
                          <Tr>
                            <Td>PENDUKO, PEDRO S.</Td>
                            <Td textTransform="lowercase">
                              pedro.penduko@cvsu.edu.ph
                            </Td>
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
                            <Th textTransform="lowercase">
                              full_name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;email
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

                    <Tbody width="full">
                      {selectedFile.map((file, fileIndex) => {
                        return (
                          <Box key={fileIndex}>
                            <Button
                              size="xs"
                              variant="outline"
                              mt={2}
                              onClick={() =>
                                // @ts-ignore
                                setSelectedFile((prev) => {
                                  if (prev) {
                                    return prev.filter(
                                      (_, index) => index !== fileIndex
                                    );
                                  } else {
                                    return null;
                                  }
                                })
                              }
                            >
                              Delete {file.fileName}
                            </Button>
                            {file.voters.map((row, rowIndex) => (
                              <Tr
                                key={rowIndex}
                                _hover={{ backgroundColor: "whiteAlpha.100" }}
                              >
                                <Td>{row[0].toLocaleString()}</Td>
                                <Td>{row[1].toLocaleString()}</Td>
                                {/* delete row and if no row delete file */}
                                <Td>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => {
                                      if (file.voters.length === 1) {
                                        // @ts-ignore
                                        setSelectedFile((prev) => {
                                          if (prev) {
                                            return prev.filter(
                                              (_, index) => index !== fileIndex
                                            );
                                          } else {
                                            return null;
                                          }
                                        });
                                      } else {
                                        // @ts-ignore
                                        setSelectedFile((prev) => {
                                          if (prev) {
                                            return prev.map((file, index) => {
                                              if (index === fileIndex) {
                                                return {
                                                  ...file,
                                                  voters: file.voters.filter(
                                                    (_, index) =>
                                                      index !== rowIndex
                                                  ),
                                                };
                                              } else {
                                                return file;
                                              }
                                            });
                                          } else {
                                            return null;
                                          }
                                        });
                                      }
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </Td>
                              </Tr>
                            ))}
                          </Box>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              </TableContainer>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={async () => {
                setLoading(true);

                const batch = writeBatch(firestore);
                if (selectedFile) {
                  const voters = selectedFile.flatMap((file) => file.voters);
                  const votersData = voters.map((voter) => ({
                    full_name: voter[0],
                    email: voter[1],
                  }));
                  let arrayUniqueByEmail = votersData.filter(
                    (value, index, self) =>
                      self.map((x) => x.email).indexOf(value.email) == index
                  );

                  // try {
                  //   await runTransaction(firestore, async (transaction) => {
                  //     arrayUniqueByEmail.forEach(async (voter) => {
                  //       const isVoterExists = await getDocs(
                  //         query(
                  //           collection(
                  //             firestore,
                  //             "elections",
                  //             election.uid,
                  //             "voters"
                  //           ),
                  //           where("email", "==", voter.email)
                  //         )
                  //       );

                  //       if (isVoterExists.docs.length !== 0) {
                  //         toast({
                  //           title: "Error!",
                  //           description: `Voter with email ${voter.email} already exists`,
                  //           status: "error",
                  //           duration: 5000,
                  //           isClosable: true,
                  //         });
                  //       } else {
                  //         const uid = generatePassword(20);
                  //         const voterRef = doc(
                  //           firestore,
                  //           "elections",
                  //           election.uid,
                  //           "voters",
                  //           uid
                  //         );
                  //         transaction.set(voterRef, {
                  //           election: election.uid,
                  //           id: uuidv4(),
                  //           uid,
                  //           email: voter.email,
                  //           fullName: voter.full_name,
                  //           hasVoted: false,
                  //           password: generatePassword(),
                  //           accountType: "voter",
                  //           createdAt: Timestamp.now(),
                  //           updatedAt: Timestamp.now(),
                  //         });
                  //       }
                  //     });
                  //   });
                  //   toast({
                  //     title: "Uploaded!",
                  //     description: "The voters have been uploaded",
                  //     status: "success",
                  //     duration: 5000,
                  //     isClosable: true,
                  //   });
                  // } catch (e: any) {
                  //   toast({
                  //     title: "Error!",
                  //     description: e || "The voters have not been uploaded",
                  //     status: "error",
                  //     duration: 5000,
                  //     isClosable: true,
                  //   });
                  // }

                  const isVoterExists = await getDocs(
                    query(
                      collection(
                        firestore,
                        "elections",
                        election.uid,
                        "voters"
                      ),
                      where(
                        "email",
                        "in",
                        arrayUniqueByEmail.map((voter) => voter.email)
                      )
                    )
                  );
                  const existedVoters = isVoterExists.docs.map((doc) =>
                    doc.data()
                  );

                  if (!isVoterExists.empty) {
                    arrayUniqueByEmail = arrayUniqueByEmail.filter(
                      (voter) =>
                        !existedVoters.some(
                          (existedVoter) => existedVoter.email === voter.email
                        )
                    );
                  }

                  if (arrayUniqueByEmail.length === 0) {
                    toast({
                      title: "Error!",
                      description: `All voters already exists`,
                      status: "error",
                      duration: 5000,
                      isClosable: true,
                    });
                  } else {
                    arrayUniqueByEmail.forEach((voter) => {
                      const uid = generatePassword(20);
                      const votersRef = doc(
                        firestore,
                        "elections",
                        election.uid,
                        "voters",
                        uid
                      );
                      batch.set(votersRef, {
                        election: election.uid,
                        id: uuidv4(),
                        uid,
                        email: voter.email,
                        fullName: voter.full_name,
                        hasVoted: false,
                        password: generatePassword(),
                        accountType: "voter",
                        createdAt: Timestamp.now(),
                        updatedAt: Timestamp.now(),
                      });
                    });
                    await batch
                      .commit()
                      .catch((e) => {
                        toast({
                          title: "Error!",
                          description: e || "The voters have not been uploaded",
                          status: "error",
                          duration: 9000,
                          isClosable: true,
                        });
                      })
                      .finally(() => {
                        toast({
                          title: "Uploaded!",
                          description: `${arrayUniqueByEmail.length} voter/s have been uploaded`,
                          status: "success",
                          duration: 9000,
                          isClosable: true,
                        });
                      });
                  }
                }
                setLoading(false);
                onClose();
              }}
              isLoading={loading}
              disabled={!selectedFile?.length}
            >
              Upload
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UploadBulkVotersModal;
