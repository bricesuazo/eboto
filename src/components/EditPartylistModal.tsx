import {
  Box,
  Button,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Tooltip,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { electionType, partylistType } from "../types/typings";
import { TrashIcon } from "@heroicons/react/24/outline";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebase";

const EditPartylistModal = ({
  isOpen,
  onClose,
  election,
  partylist,
}: {
  isOpen: boolean;
  onClose: () => void;
  election: electionType;
  partylist: partylistType;
}) => {
  const clearForm = () => {
    setPartylistData({
      name: partylist.name,
      abbreviation: partylist.abbreviation,
      logo: partylist.logo,
      description: partylist.description ? partylist.description : "",
    });
  };
  const [partylistData, setPartylistData] = useState({
    name: partylist.name,
    abbreviation: partylist.abbreviation,
    logo: partylist.logo,
    description: partylist.description ? partylist.description : "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    clearForm();
    setLoading(false);
  }, [isOpen]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={false} isCentered>
      <ModalOverlay />
      <form
        onSubmit={async (e) => {
          setLoading(true);
          e.preventDefault();
          await updateDoc(
            doc(
              firestore,
              "elections",
              election.uid,
              "partylists",
              partylist.uid
            ),
            partylistData
          );
          onClose();
          setLoading(false);
        }}
      >
        <ModalContent>
          <ModalHeader>Edit partylist</ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={6}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  placeholder="Partylist name"
                  onChange={(e) =>
                    setPartylistData({ ...partylistData, name: e.target.value })
                  }
                  value={partylistData.name}
                  disabled={loading}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Abbreviation</FormLabel>
                <Input
                  placeholder="Partylist abbreviation"
                  onChange={(e) =>
                    setPartylistData({
                      ...partylistData,
                      abbreviation: e.target.value,
                    })
                  }
                  value={partylistData.abbreviation}
                  disabled={loading}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Input
                  placeholder="Partylist description"
                  onChange={(e) =>
                    setPartylistData({
                      ...partylistData,
                      description: e.target.value,
                    })
                  }
                  value={partylistData.description}
                  disabled={loading}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Logo</FormLabel>
                <Input type="file" disabled={loading} accept="image/*" />
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter justifyContent="space-between">
            <Box>
              {(partylist.name || partylist.abbreviation) && (
                <Tooltip label="Clear forms">
                  <IconButton
                    aria-label="Clear form"
                    icon={<TrashIcon width={18} />}
                    onClick={() => {
                      (partylist.name || partylist.abbreviation) && clearForm();
                    }}
                    disabled={loading}
                  />
                </Tooltip>
              )}
            </Box>
            <Box>
              <Button
                colorScheme="blue"
                mr={3}
                type="submit"
                isLoading={loading}
                disabled={!partylist.name || !partylist.abbreviation}
              >
                Save
              </Button>
              <Button onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            </Box>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  );
};

export default EditPartylistModal;
