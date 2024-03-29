"use client";

import { createContext, useContext, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SPOTLIGHT_DATA } from "@/config/site";
import { api } from "@/trpc/client";
import { Center, rem } from "@mantine/core";
import { Spotlight } from "@mantine/spotlight";
import { IconLayoutDashboard, IconSearch } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import Realistic from "react-canvas-confetti/dist/presets/realistic";
import type { TConductorInstance } from "react-canvas-confetti/dist/types";

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
        <Realistic onInit={confetti.onInit} />
        {children}
      </confettiContext.Provider>
    </>
  );
}

export const useConfetti = () => {
  return useContext(confettiContext);
};

function useProvideConfetti() {
  const [conductor, setConductor] = useState<TConductorInstance>();

  const fireConfetti = () => {
    conductor?.shoot();
  };
  const onInit = ({ conductor }: { conductor: TConductorInstance }) => {
    setConductor(conductor);
  };

  return { fireConfetti, onInit };
}
