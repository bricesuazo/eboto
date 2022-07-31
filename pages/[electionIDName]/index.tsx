import axios from "axios";
import type { NextPage } from "next";
import { GetServerSideProps } from "next";

const ElectionPage: NextPage = ({ selectedElection: election }) => {
  return (
    <div>
      <span>{election.electionName}</span>
    </div>
  );
};

export default ElectionPage;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const electionIDName = ctx.params?.electionIDName;

  const selectedElection = await axios
    .get(`${process.env.HOST}/api/election`, {
      params: {
        electionIDName,
      },
    })
    .then((res) => res.data);

  if (selectedElection) {
    return {
      props: { selectedElection },
    };
  } else {
    return {
      notFound: true,
    };
  }
};
