import Image from "next/image";

const GoogleButton = () => {
  return (
    <button
      type="button"
      className="w-fit flex items-center gap-x-2 p-2 rounded-md border-2 border-gray-100 hover:border-gray-200 transition-all"
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
