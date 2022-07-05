import { useState } from "react";
import { AsteriskRequired, CredentialCard, GoogleButton } from "../index";
import { Button, InputStyled, LinkStyled } from "../styled";

const SignupCard = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  return (
    <CredentialCard
      onSubmit={(e) => {
        e.preventDefault();
        if (
          firstName &&
          lastName &&
          email &&
          password &&
          confirmPassword &&
          password === confirmPassword
        ) {
          HandleAdminSignup({
            firstName: firstName.replace(/(^\w{1})|(\s+\w{1})/g, (letter) =>
              letter.toUpperCase()
            ),
            lastName: firstName.replace(/(^\w{1})|(\s+\w{1})/g, (letter) =>
              letter.toUpperCase()
            ),
            password,
            email,
          });
        }
      }}
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
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength="8"
        />
      </div>

      <Button type="submit">Create an account</Button>

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
