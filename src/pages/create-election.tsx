import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import CreateElectionModal from "../components/CreateElectionModal";
import { Box } from "@chakra-ui/react";

const CreateElectionPage = () => {
  return (
    <Box minHeight="3xl">
      <CreateElectionModal isOpen={true} cantClose={true} onClose={() => {}} />
    </Box>
  );
};

export default CreateElectionPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const session = await getSession(context);
  if (
    session &&
    session.user.accountType === "admin" &&
    session.user?.elections.length !== 0
  ) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }
  return {
    props: {},
  };
};
