import Link from "next/link";
import Button from "./Button";

const ButtonLink = ({
  children,
  invert,
  href,
  className,
}: {
  children: React.ReactNode;
  invert?: boolean;
  href: string;
  className?: string;
}) => {
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
