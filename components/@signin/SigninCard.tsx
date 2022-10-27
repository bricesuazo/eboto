import React, { useState } from "react";
import AsteriskRequired from "../AsteriskRequired";
import GoogleButton from "../GoogleButton";
import CredentialCard from "../CredentialCard";
import Button from "../styled/Button";
import InputStyled from "../styled/InputStyled";
import LinkStyled from "../styled/LinkStyled";
import Router from "next/router";
import { signIn } from "next-auth/react";

const SigninCard = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (!res?.error) {
      Router.push("/");
    } else {
      setMessage(res.error);
      setLoading(false);
    }
  };

  const handleGoogleSignin = async () => {
    // async signIn({ account, profile }) {
    //   if (account.provider === "google") {
    //     return profile.email_verified && profile.email.endsWith("@example.com")
    //   }
    //   return true // Do different verification for other providers that don't have `email_verified`
    // },
    await signIn("google").then((res) => {
      console.log(res);
    });
  };

  return (
    <CredentialCard
      onSubmit={(e: React.FormEvent<HTMLFormElement>) => handleSubmit(e)}
    >
      <span className="font-bold text-xl">Login to your account</span>
      <div className="flex flex-col  w-full">
        <span>
          Email Address <AsteriskRequired />
        </span>
        <InputStyled
          type="email"
          placeholder="Enter your email address..."
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          required
          value={email}
        />
      </div>
      <div className="flex flex-col w-full">
        <span>
          Password
          <AsteriskRequired />
        </span>
        <InputStyled
          type="password"
          placeholder="Enter your password..."
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
          required
          minLength="8"
          value={password}
        />
        <LinkStyled
          href="/forgot-password"
          className="text-blue-900 hover:underline text-sm"
        >
          Forgot password?
        </LinkStyled>

        <span className="">{message}</span>
      </div>
      <Button
        type="submit"
        loading={loading}
        disabled={!email || !password || password.length < 8 || loading}
      >
        Login
      </Button>

      <div className="m-auto text-center">
        <span>Login using your</span>
        <GoogleButton onClick={handleGoogleSignin} />
      </div>
      <div className="text-center">
        <span>
          No account yet?{" "}
          <LinkStyled href="/signup">Signup as admin here.</LinkStyled>
        </span>
      </div>
    </CredentialCard>
  );
};

export default SigninCard;
