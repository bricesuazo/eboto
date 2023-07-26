"use client";

import ReactPlayerPackage from "react-player/lazy";
import type { ReactPlayerProps } from "react-player/lazy";

export default function ReactPlayer(opts: ReactPlayerProps) {
  return <ReactPlayerPackage {...opts} />;
}
