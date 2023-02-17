import { useRouter } from "next/router";
import { api } from "../utils/api";

const VerifyPage = () => {
  const router = useRouter();
  const { token } = router.query;

  if (typeof token !== "string") return null;

  const verifyEmail = api.user.verifyEmail.useQuery(
    {
      token,
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      // onSuccess: () => {
      //   void (async () => {
      //     await router.push("/signin");
      //   })();
      // },
    }
  );

  if (verifyEmail.isError) {
    return (
      <div>
        <h1>Error</h1>
        <p>{verifyEmail.error.message}</p>
      </div>
    );
  }

  if (verifyEmail.isSuccess) {
    // async () => await router.push("/signin");

    return (
      <div>
        <h1>Success! </h1>
        <p>Your account has been verified. Please sign in.</p>
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default VerifyPage;
