"use client";

import { createContext, useContext, useState } from "react";
import { Poppins } from "next/font/google";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Center,
  Combobox,
  createTheme,
  Input,
  InputBase,
  NumberInput,
  rem,
  Select,
  Textarea,
  TextInput,
} from "@mantine/core";
import {
  DateInput,
  DatePickerInput,
  DateTimePicker,
  MonthPickerInput,
  TimeInput,
  YearPickerInput,
} from "@mantine/dates";
import { Spotlight } from "@mantine/spotlight";
import { IconLayoutDashboard, IconSearch } from "@tabler/icons-react";
import { env } from "env.mjs";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import Realistic from "react-canvas-confetti/dist/presets/realistic";
import type { TConductorInstance } from "react-canvas-confetti/dist/types";

import { SPOTLIGHT_DATA } from "~/config/site";
import { api } from "~/trpc/client";

const font = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const theme = createTheme({
  components: {
    Input: Input.extend({
      defaultProps: {
        size: "md",
      },
    }),
    InputBase: InputBase.extend({
      defaultProps: {
        size: "md",
      },
    }),
    TextInput: TextInput.extend({
      defaultProps: {
        size: "md",
      },
    }),
    Textarea: Textarea.extend({
      defaultProps: {
        size: "md",
      },
    }),
    Select: Select.extend({
      defaultProps: {
        size: "md",
      },
    }),
    Combobox: Combobox.extend({
      defaultProps: {
        size: "md",
      },
    }),

    NumberInput: NumberInput.extend({
      defaultProps: {
        size: "md",
      },
    }),

    DateInput: DateInput.extend({
      defaultProps: {
        size: "md",
      },
    }),
    DateTimePicker: DateTimePicker.extend({
      defaultProps: {
        size: "md",
      },
    }),
    DatePickerInput: DatePickerInput.extend({
      defaultProps: {
        size: "md",
      },
    }),
    MonthPickerInput: MonthPickerInput.extend({
      defaultProps: {
        size: "md",
      },
    }),
    YearPickerInput: YearPickerInput.extend({
      defaultProps: {
        size: "md",
      },
    }),
    TimeInput: TimeInput.extend({
      defaultProps: {
        size: "md",
      },
    }),
  },
  primaryColor: "green",
  fontFamily: font.style.fontFamily,
  defaultGradient: {
    from: "green",
    to: "#6BD731",
    deg: 5,
  },
  colors: {
    dark: [
      "#C1C2C5",
      "#A6A7AB",
      "#909296",
      "#5c5f66",
      "#373A40",
      "#2C2E33",
      "#25262b",
      "#1A1B1E",
      "#141517",
      "#101113",
    ],
    // Old dark mode. Changed in mantine@7.3.0
  },
});

const confettiContext = createContext(
  {} as ReturnType<typeof useProvideConfetti>,
);

if (typeof window !== "undefined") {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const userQuery = api.auth.getUser.useQuery();
  const router = useRouter();

  const getAllMyElectionsQuery = api.election.getAllMyElections.useQuery(
    undefined,
    {
      enabled: !!userQuery.data,
    },
  );

  const elections = getAllMyElectionsQuery.data?.map(({ election }) => ({
    id: election.id,
    label: election.name,
    description:
      election.description && election.description.length > 0
        ? election.description
        : "No description",
    link: "/dashboard/" + election.slug,
    leftSection: election.logo_url ? (
      <Center>
        <Image
          src={election.logo_url}
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
    <PostHogProvider client={posthog}>
      <Spotlight
        shortcut={["mod + K", "mod + P", "/"]}
        actions={[
          {
            group: "Pages",
            actions: SPOTLIGHT_DATA.map((action) => ({
              ...action,
              // id: action.id,
              onClick: () => router.push(action.link),
            })),
          },
          {
            group: "Elections",
            actions: (elections ?? []).map((action) => ({
              ...action,
              // id: action.id,
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
        {children}
        <Realistic onInit={confetti.onInit} />
      </confettiContext.Provider>
    </PostHogProvider>
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
