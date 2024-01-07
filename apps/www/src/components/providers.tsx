"use client";

import { createContext, useCallback, useContext, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SPOTLIGHT_DATA } from "@/config/site";
import { api } from "@/trpc/client";
import { Center, rem } from "@mantine/core";
import { Spotlight } from "@mantine/spotlight";
import { IconLayoutDashboard, IconSearch } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import ReactCanvasConfetti from "react-canvas-confetti";

const confettiContext = createContext(
  {} as ReturnType<typeof useProvideConfetti>,
);

export function Providers({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();

  const getAllMyElectionsQuery = api.election.getAllMyElections.useQuery(
    undefined,
    {
      enabled: session.status === "authenticated",
    },
  );

  const elections = getAllMyElectionsQuery.data?.map(({ election }) => ({
    id: election.id,
    label: election.name,
    description:
      election.description.length > 0 ? election.description : "No description",
    link: "/dashboard/" + election.slug,
    leftSection: election.logo ? (
      <Center>
        <Image
          src={election.logo.url}
          alt={`${election.name} logo`}
          width={24}
          height={24}
          style={{
            borderRadius: "50%",
          }}
        />
      </Center>
    ) : (
      <IconLayoutDashboard />
    ),
  }));

  const confetti = useProvideConfetti();

  return (
    <>
      <Spotlight
        shortcut={["mod + K", "mod + P", "/"]}
        actions={[
          {
            group: "Pages",
            actions: SPOTLIGHT_DATA.map((action) => ({
              ...action,
              onClick: () => router.push(action.link),
            })),
          },
          {
            group: "Elections",
            actions: (elections ?? []).map((action) => ({
              ...action,
              onClick: () => router.push(action.link),
            })),
          },
        ]}
        nothingFound="Nothing found..."
        highlightQuery
        scrollable
        searchProps={{
          leftSection: (
            <IconSearch
              style={{ width: rem(20), height: rem(20) }}
              stroke={1.5}
            />
          ),
          placeholder: "Search...",
        }}
      />
      <confettiContext.Provider value={confetti}>
        <ReactCanvasConfetti
          refConfetti={confetti.instance}
          style={{
            position: "fixed",
            pointerEvents: "none",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            zIndex: 999999,
          }}
        />
        {children}
      </confettiContext.Provider>
    </>
  );
}

export const useConfetti = () => {
  return useContext(confettiContext);
};

function useProvideConfetti() {
  const refAnimationInstance = useRef<confetti.CreateTypes | null>(null);

  const getInstance = useCallback((instance: confetti.CreateTypes | null) => {
    refAnimationInstance.current = instance;
  }, []);

  const makeShot = useCallback(
    async (
      particleRatio: number,
      opts: {
        spread: number;
        startVelocity?: number;
        decay?: number;
        scalar?: number;
        origin?: { x: number; y: number };
        particleCount?: number;
      },
    ) => {
      refAnimationInstance.current &&
        (await refAnimationInstance.current({
          ...opts,
          origin: { y: 0.7 },
          particleCount: Math.floor(200 * particleRatio),
        }));
    },
    [],
  );

  const fireConfetti = useCallback(async () => {
    await Promise.all([
      makeShot(0.25, {
        spread: 26,
        startVelocity: 55,
      }),
      makeShot(0.2, {
        spread: 60,
      }),
      makeShot(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      }),
      makeShot(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      }),
      makeShot(0.1, {
        spread: 120,
        startVelocity: 45,
      }),
    ]);
  }, [makeShot]);

  return {
    instance: getInstance,
    fireConfetti,
  };
}
