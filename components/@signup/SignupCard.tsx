import { useState } from "react";
import AsteriskRequired from "../AsteriskRequired";
import CredentialCard from "../CredentialCard";
import GoogleButton from "../GoogleButton";

import Button from "../styled/Button";
import InputStyled from "../styled/InputStyled";
import LinkStyled from "../styled/LinkStyled";
import Axios from "axios";
import Router from "next/router";
import { signIn } from "next-auth/react";

const SignupCard = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await Axios.post("/api/admin", {
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: confirmPassword,
    })
      .then(async () => {
        await signIn("credentials", {
          redirect: false,
          email: email,
          password: confirmPassword,
        });
        return Router.push("/");
      })
      .catch((err) => setMessage(err.response.data.error));
  };

  const handleConfirmPassword = () => {
    password !== confirmPassword
      ? setMessage("")
      : setMessage("Passwords do not match");
  };

  return (
    <CredentialCard onSubmit={(e) => handleSubmit(e)}>
      <label className="font-bold text-xl">Create an account</label>
      <div className="w-full flex gap-x-2">
        <div className="flex flex-col w-full">
          <label>
            First Name
            <AsteriskRequired />
          </label>
          <InputStyled
            type="text"
            placeholder="Enter your first name..."
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col w-full">
          <label>
            Last Name
            <AsteriskRequired />
          </label>
          <InputStyled
            type="text"
            placeholder="Enter your last name..."
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex flex-col w-full">
        <label>
          Email Address
          <AsteriskRequired />
        </label>
        <InputStyled
          type="email"
          placeholder="Enter your email address..."
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col w-full">
        <label>
          Password
          <AsteriskRequired />
        </label>
        <InputStyled
          type="password"
          placeholder="Enter your password..."
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength="8"
        />
      </div>
      <div className="flex flex-col w-full">
        <label>
          Confirm Password
          <AsteriskRequired />
        </label>
        <InputStyled
          type="password"
          placeholder="Enter your password again..."
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            handleConfirmPassword();
          }}
          required
          minLength="8"
        />
      </div>

      <span>{message}</span>
      <Button type="submit" disabled={password !== confirmPassword}>
        Create an account
      </Button>

      <div className="w-full grid place-items-center mt-2">
        <span>Login using your</span>
        <GoogleButton />
      </div>
      <div className="">
        <span>
          Already have an account?{" "}
          <LinkStyled href="/signin">Signin here.</LinkStyled>
        </span>
      </div>
    </CredentialCard>
  );
};

export default SignupCard;
