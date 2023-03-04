import { useCallback, useRef, useContext, createContext } from "react";
import ReactCanvasConfetti from "react-canvas-confetti";

const confettiContext = createContext(
  {} as ReturnType<typeof useProvideConfetti>
);

export function ConfettiProvider({ children }: { children: React.ReactNode }) {
  const confetti = useProvideConfetti();
  return (
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
        }}
      />
      {children}
    </confettiContext.Provider>
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
      }
    ) => {
      refAnimationInstance.current &&
        (await refAnimationInstance.current({
          ...opts,
          origin: { y: 0.7 },
          particleCount: Math.floor(200 * particleRatio),
        }));
    },
    []
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
