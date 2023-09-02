import { Button } from "@react-email/button";
import { Html } from "@react-email/html";

export const Email: React.FC<
  Readonly<{
    url: string;
  }>
> = ({ url }) => {
  return (
    <Html lang="en">
      <Button href={url}>Click me</Button>
    </Html>
  );
};
