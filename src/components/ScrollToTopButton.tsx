import { Affix, Button, Transition, rem } from "@mantine/core";
import { useWindowScroll } from "@mantine/hooks";
import { IconArrowUp } from "@tabler/icons-react";

const ScrollToTopButton = () => {
  const [scroll, scrollTo] = useWindowScroll();
  return (
    <Affix position={{ bottom: rem(80), right: rem(20) }}>
      <Transition transition="slide-up" mounted={scroll.y > 128}>
        {(transitionStyles) => (
          <Button
            leftIcon={<IconArrowUp size="1rem" />}
            style={transitionStyles}
            onClick={() => scrollTo({ y: 0 })}
          >
            Scroll to top
          </Button>
        )}
      </Transition>
    </Affix>
  );
};

export default ScrollToTopButton;
