import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/">
      <a className="font-semibold text-2xl hover:opacity-75 flex items-center gap-x-2">
        <div className="bg-eboto-mo-logo bg-contain bg-center bg-no-repeat invert w-8 h-8" />
        eBoto Mo
      </a>
    </Link>
  );
};

export default Logo;
