import { getAuth } from "firebase/auth";
import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPage,
} from "next";
import React from "react";
import { auth } from "../firebase/firebase";
import { verifyIdToken } from "../firebase/firebase-admin";

const VerifyPage: NextPage = () => {
  return <div>VerifyPage</div>;
};

export default VerifyPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  // const cookies = context.req.headers.cookie;
  // const token = await verifyIdToken(cookies?.split("=")[1] as string);
  // console.log(token);

  // if (auth) {
  //   return {
  //     redirect: {
  //       destination: "/",
  //       permanent: false,
  //     },
  //   };
  // }
  return {
    props: {},
  };
};
