"use client";

import ReactPlayerPackage from "react-player";
import { BaseReactPlayerProps } from "react-player/types/base";

export default function ReactPlayer(opts: BaseReactPlayerProps) {
  return <ReactPlayerPackage {...opts} />;
}
