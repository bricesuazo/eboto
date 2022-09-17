import Link from "next/link";

const LinkStyled = ({
  children,
  href,
  className,
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
}) => {
  return (
    <Link href={href}>
      <a className={`hover:underline text-primary font-semibold ${className}`}>
        {children}
      </a>
    </Link>
  );
};

export default LinkStyled;
