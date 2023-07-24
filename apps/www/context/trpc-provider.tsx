"use client";

import { api } from "@/lib/api/client";
import type { PropsWithChildren } from "react";

const TRPCProvider = ({ children }: PropsWithChildren) => {
  return <api.Provider>{children}</api.Provider>;
};

export default TRPCProvider;
