import { useState } from "react";
import AsteriskRequired from "../AsteriskRequired";
import CredentialCard from "../CredentialCard";
import GoogleButton from "../GoogleButton";

import Button from "../styled/Button";
import InputStyled from "../styled/InputStyled";
import LinkStyled from "../styled/LinkStyled";
import Router from "next/router";
import { signIn } from "next-auth/react";
import { v4 as uuidv4 } from "uuid";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import capitalizeFirstLetterEachWord from "../../util/capitalizeFirstLetterEachWord";

const SignupCard = () => {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setLoading(true);
    const querySnapshot = await getDocs(
      query(collection(db, "admins"), where("email", "==", email))
    );
    const user = querySnapshot.docs[0];

    if (user) {
      setMessage("Email already exists.");
    } else {
      await addDoc(collection(db, "admins"), {
        userId: uuidv4(),
        firstName: capitalizeFirstLetterEachWord(firstName),
        lastName: capitalizeFirstLetterEachWord(lastName),
        email: email,
        password: confirmPassword,
        createdAt: new Date(),
        profilePicture: "",
        elections: [],
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
    }
    setLoading(false);
  };

  const handleConfirmPassword = () => {
    password !== confirmPassword
      ? setMessage("")
      : setMessage("Passwords do not match");
  };

  return (
    <CredentialCard
      onSubmit={(e: React.ChangeEvent<HTMLInputElement>) => handleSubmit(e)}
    >
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFirstName(e.target.value)
            }
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setLastName(e.target.value)
            }
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setConfirmPassword(e.target.value);
            handleConfirmPassword();
          }}
          required
          minLength="8"
        />
      </div>

      <span>{message}</span>
      <Button
        type="submit"
        disabled={
          password !== confirmPassword ||
          password.length < 8 ||
          confirmPassword.length < 8 ||
          !firstName ||
          !lastName ||
          !email ||
          !password ||
          !confirmPassword ||
          loading
        }
        loading={loading}
      >
        Create an account
      </Button>

      {/* <div className="w-full grid place-items-center mt-2">
        <span>Create an account using your</span>
        <GoogleButton />
      </div> */}
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
