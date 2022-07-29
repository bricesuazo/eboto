import Link from "next/link";
import Button from "./Button";

const ButtonLink = ({ children, invert, href, className }) => {
  return (
    <div className={className}>
      <Link href={href}>
        <a>
          <Button invert={invert}>{children}</Button>
        </a>
      </Link>
    </div>
  );
};

export default ButtonLink;
