import { useRouter } from "next/router";
import { api } from "../utils/api";

const VerifyPage = () => {
  const router = useRouter();
  const { token, type } = router.query;

  if (
    typeof token !== "string" ||
    typeof type !== "string" ||
    type !== ("EMAIL_VERIFICATION" || "PASSWORD_RESET" || "ELECTION_INVITATION")
  )
    return null;

  const verifyEmail = api.token.verify.useQuery(
    {
      token,
      type,
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      onSuccess: () => {
        void (async () => {
          await router.push("/signin");
        })();
      },
    }
  );

  if (verifyEmail.isLoading) {
    return (
      <div>
        <h1>Loading...</h1>
      </div>
    );
  }

  if (verifyEmail.isError) {
    return (
      <div>
        <h1>Error</h1>
        <p>{verifyEmail.error.message}</p>
      </div>
    );
  }

  // TODO: Add password input when election invitation is accepted

  return (
    <div>
      <h1>Success! </h1>
      <p>Your account has been verified. Please sign in.</p>
    </div>
  );
};

export default VerifyPage;
