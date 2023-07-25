"use client";

import ReactPlayerPackage, { ReactPlayerProps } from "react-player/lazy";

export default function ReactPlayer(opts: ReactPlayerProps) {
  return <ReactPlayerPackage {...opts} />;
}
