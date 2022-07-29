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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setMessage(res.error);
    } else {
      return Router.push("/");
    }
  };

  return (
    <CredentialCard onSubmit={(e) => handleSubmit(e)}>
      <span className="font-bold text-xl">Login to your account</span>
      <div className="flex flex-col  w-full">
        <span>
          Email Address <AsteriskRequired />
        </span>
        <InputStyled
          type="email"
          placeholder="Enter your email address..."
          onChange={(e: React.FormEvent<HTMLFormElement>) =>
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
          onChange={(e: React.FormEvent<HTMLFormElement>) =>
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
      <Button type="submit">Login</Button>

      <div className="m-auto text-center">
        <span>Login using your</span>
        <GoogleButton />
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
