import { useRouter } from "next/router";
import { NavigationProgress, nprogress } from "@mantine/nprogress";
import { useDidUpdate } from "@mantine/hooks";

export function RouterTransition() {
  const router = useRouter();

  useDidUpdate(() => {
    const handleStart = (url: string) =>
      url !== router.asPath && nprogress.start();
    const handleComplete = () => nprogress.complete();

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router.asPath]);

  return <NavigationProgress autoReset={true} />;
}
