import Image from "next/image";
import { MouseEvent } from "react";

interface Props {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}
const GoogleButton = ({ onClick }: Props) => {
  return (
    <button
      type="button"
      className="w-fit flex items-center gap-x-2 p-2 rounded-md border-2 border-gray-100 hover:border-gray-200 transition-all"
      onClick={onClick}
    >
      <Image
        src="https://www.freepnglogos.com/uploads/google-logo-png/google-logo-png-suite-everything-you-need-know-about-google-newest-0.png"
        alt=""
        width={25}
        height={25}
        objectFit="cover"
      />
      <span>CvSU Account</span>
    </button>
  );
};

export default GoogleButton;
