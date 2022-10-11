import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  Spinner,
  Stack,
  Switch,
} from "@chakra-ui/react";

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPage,
} from "next";
import Head from "next/head";
import { useState } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { electionType } from "../../../../typings";
import { firestore } from "../../../firebase/firebase";
import DashboardLayout from "../../../layout/DashboardLayout";

interface SettingsPageProps {
  electionIdName: string;
}
const SettingsPage = ({ electionIdName }: SettingsPageProps) => {
  const [electionData] = useCollectionData(
    query(
      collection(firestore, "elections"),
      where("electionIdName", "==", electionIdName)
    )
  );
  const election = electionData && (electionData[0] as electionType);

  const initialState = {
    name: election?.name,
    electionIdName: election?.electionIdName,
    ongoing: election?.ongoing,
  };
  const [settings, setSettings] = useState(initialState);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <Head>
        <title>Settings | eBoto Mo</title>
      </Head>
      <DashboardLayout title="Settings">
        {!election ? (
          <Spinner />
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                (settings.name === election.name &&
                  settings.electionIdName === election.electionIdName &&
                  settings.ongoing === election.ongoing) ||
                !settings.name ||
                !settings.electionIdName
              ) {
                return;
              }

              setLoading(true);
              await updateDoc(
                doc(firestore, "elections", election._id),
                settings
              );

              setSettings(initialState);
              setLoading(false);
            }}
          >
            <Stack alignItems="flex-end" spacing={6}>
              <FormControl>
                <FormLabel>Election Name</FormLabel>
                <Input
                  placeholder={election.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSettings({
                      ...settings,
                      name: e.target.value,
                    });
                  }}
                  value={settings.name}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Election ID Name</FormLabel>
                <InputGroup>
                  <InputLeftAddon children="eboto-mo.com/" />
                  <Input
                    placeholder={election.electionIdName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setSettings({
                        ...settings,
                        electionIdName: e.target.value,
                      });
                    }}
                    value={settings.electionIdName}
                  />
                </InputGroup>
                <FormHelperText>
                  Election ID name must be unique.
                </FormHelperText>
              </FormControl>
              <FormControl
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <FormLabel htmlFor="toggle-election-ongoing" mb="0">
                  Election Ongoing
                </FormLabel>
                <Switch
                  id="toggle-election-ongoing"
                  size="lg"
                  checked={settings.ongoing}
                  onChange={(e) => {
                    setSettings({ ...settings, ongoing: e.target.checked });
                  }}
                />
              </FormControl>
              <Button
                type="submit"
                isLoading={loading}
                disabled={
                  (settings.name === election.name &&
                    settings.electionIdName === election.electionIdName &&
                    settings.ongoing === election.ongoing) ||
                  !settings.name ||
                  !settings.electionIdName
                }
              >
                Save
              </Button>
            </Stack>
          </form>
        )}
      </DashboardLayout>
    </>
  );
};

export default SettingsPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  // const electionQuery = query(
  //   collection(firestore, "elections"),
  //   where("electionIdName", "==", context.query.electionIdName)
  // );
  // const electionSnapshot = await getDocs(electionQuery);
  // if (electionSnapshot.docs) {
  //   return {
  //     props: {
  //       election: JSON.parse(JSON.stringify(electionSnapshot.docs[0].data())),
  //     },
  //   };
  // } else {
  //   return {
  //     notFound: true,
  //   };
  // }
  return { props: { electionIdName: context.query.electionIdName } };
};
