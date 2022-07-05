import { Logo } from "./index";
import Link from "next/link";
import {
  PhoneIcon,
  MailIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/outline";
import { Button } from "./styled";

const Footer = () => {
  return (
    <footer className="p-4 md:p-8 lg:p-12 bg-primary text-white grid grid-cols-2 gap-x-8 md:grid-cols-3 lg:grid-cols-4 text-center md:text-left z-20 sticky">
      <div className="flex flex-col gap-y-2 col-span-2 items-center md:items-start">
        <Logo />
        <span className="text-sm md:text-base">
          An Online Voting System for Cavite State University - Don Severino
          Delas Alas Campus with Real-time Voting Count.
        </span>

        <div className="flex flex-col justify-center md:justify-left mt-4 md:mt-0">
          <div className="flex flex-row items-center justify-center md:justify-start gap-x-2.5">
            <PhoneIcon className="w-4" />
            <span>+63 961 719 6607</span>
          </div>
          <div className="flex flex-row items-center justify-center md:justify-start gap-x-2.5">
            <MailIcon className="w-4" />
            <a href="mailto:contact@eboto-mo.com">contact@eboto-mo.com</a>
          </div>
        </div>
      </div>
      <div className="md:flex flex-col hidden">
        <span className="font-semibold">Quick Links:</span>
        <ul className="list-disc">
          <li>
            <Link href="/about" className="font-regular">
              About us
            </Link>
          </li>
          <li>
            <Link href="/contact">Contact</Link>
          </li>
        </ul>
      </div>
      <div className="hidden lg:flex flex-col gap-y-2">
        <span className="font-semibold text-xl">Contact Us</span>
        <form action="" className="flex flex-col gap-1 items-end">
          <input
            className="w-full bg-black p-2 rounded-md outline-none"
            type="text"
            placeholder="Your email address"
          />
          <textarea
            className="w-full bg-black p-2 rounded-md outline-none"
            name=""
            id=""
            placeholder="Message..."
          ></textarea>
          <Button
            invert
            className="w-fit flex items-center gap-x-2 font-bold"
            type="submit"
          >
            <PaperAirplaneIcon className="w-4 rotate-45" />
            <span>Send</span>
          </Button>
        </form>
      </div>
    </footer>
  );
};

export default Footer;
