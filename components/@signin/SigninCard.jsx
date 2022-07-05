import { useState } from "react";
import { AsteriskRequired, GoogleButton, CredentialCard } from "../index";
import { Button, InputStyled, LinkStyled } from "../styled";
import Link from "next/link";

const SigninCard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <CredentialCard
      onSubmit={(e) => {
        e.preventDefault();
        HandleLogin({ email, password });
      }}
    >
      <span className="font-bold text-xl">Login to your account</span>
      <div className="flex flex-col  w-full">
        <span>
          Email Address <AsteriskRequired />
        </span>
        <InputStyled
          type="email"
          placeholder="Enter your email address..."
          onChange={(e) => setEmail(e.target.value)}
          required
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
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength="8"
        />
        <LinkStyled
          href="/forgot-password"
          className="text-blue-900 hover:underline text-sm"
        >
          Forgot password?
        </LinkStyled>
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
