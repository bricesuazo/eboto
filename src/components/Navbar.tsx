import { Navbar } from "@mantine/core";

const NavbarComponent = ({ opened }: { opened: boolean }) => {
  return (
    <Navbar width={{ sm: 200, lg: 300 }} hidden={!opened} hiddenBreakpoint="sm">
      NavbarComponentdd
    </Navbar>
  );
};

export default NavbarComponent;
