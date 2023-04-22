/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

export default function OG(req: NextRequest) {
  const eBotoMoLogo =
    "https://raw.githubusercontent.com/bricesuazo/eboto-mo/main/public/images/eboto-mo-logo.png";
  const cvsuFront =
    "https://raw.githubusercontent.com/bricesuazo/eboto-mo/main/public/images/cvsu-front.jpg";
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") as
    | "candidate"
    | "election"
    | "website"
    | null;
  const NotFoundPage = () => {
    return new ImageResponse(<div>404</div>, {
      width: 1200,
      height: 600,
    });
  };
  if (!type) {
    return NotFoundPage();
  }

  if (type === "website") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            color: "white",
          }}
        >
          <img
            src={cvsuFront}
            alt=""
            style={{
              width: "100%",
              objectFit: "cover",
              objectPosition: "center",
              position: "absolute",
              top: 0,
              filter: "brightness(0.35)",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
              textAlign: "center",
            }}
          >
            <img
              src={eBotoMoLogo}
              alt={`eBoto Mo Logo`}
              style={{
                width: 164,
                height: 164,
              }}
            />
            <div
              style={{
                width: 550,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <p
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 60,
                  lineHeight: 0.25,
                }}
              >
                eBoto Mo
              </p>
              <p
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 20,
                }}
              >
                Empower your elections with eBoto Mo, the versatile and
                web-based voting platform that offers secure online elections
                for any type of organization.
              </p>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 600,
      }
    );
  } else if (type === "candidate") {
    const candidateName = searchParams.get("candidate_name");
    const candidateImg = searchParams.get("candidate_img");
    const candidatePosition = searchParams.get("candidate_position");
    if (!candidateName || !candidatePosition) {
      return NotFoundPage();
    }
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
          }}
        >
          <img
            src={cvsuFront}
            alt=""
            style={{
              width: "100%",
              objectFit: "cover",
              objectPosition: "center",
              position: "absolute",
              top: 0,
              filter: "brightness(0.35)",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
            }}
          >
            <img
              src={
                candidateImg ??
                "https://raw.githubusercontent.com/bricesuazo/eboto-mo/main/public/images/default-avatar.png"
              }
              alt={`${candidateName}'s photo`}
              style={{
                width: 256,
                height: 256,
                boxShadow: "1px -1px 76px 1px rgba(0,0,0,0.25)",
                marginRight: 32,
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                color: "white",
              }}
            >
              <p style={{ fontSize: 42, fontWeight: "bold", lineHeight: -2 }}>
                {candidateName}
              </p>
              <p
                style={{
                  fontSize: 24,
                  lineHeight: -2,
                }}
              >
                Running for {candidatePosition}
              </p>
              <p
                style={{
                  backgroundColor: "#459845",
                  color: "white",
                  fontFamily: "Inter Bold",
                  width: 156,
                  height: 38,
                  borderRadius: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                See credentials
              </p>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              position: "absolute",
              top: 18,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <p style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
              eBoto Mo
            </p>
            <img
              src="https://raw.githubusercontent.com/bricesuazo/eboto-mo/main/public/images/eboto-mo-logo-white.png"
              alt="eBoto Mo Logo"
              style={{
                width: 32,
                height: 32,
                marginLeft: 8,
              }}
            />
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 600,
      }
    );
  } else if (type === "election") {
    const electionName = searchParams.get("election_name");
    const electionDate = searchParams.get("election_date");
    const electionLogoUrl = searchParams.get("election_logo");
    if (!electionName || !electionDate) {
      return NotFoundPage();
    }
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            color: "white",
          }}
        >
          <img
            src={cvsuFront}
            alt=""
            style={{
              width: "100%",
              objectFit: "cover",
              objectPosition: "center",
              position: "absolute",
              top: 0,
              filter: "brightness(0.35)",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
              marginTop: 16,
            }}
          >
            <img
              src={electionLogoUrl ?? eBotoMoLogo}
              alt={`${electionName}'s photo`}
              style={{
                width: 164,
                height: 164,
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: 48,
                lineHeight: -3.5,
              }}
            >
              <p style={{ fontSize: 42, fontWeight: "bolder" }}>
                {electionName}
              </p>
              <p
                style={{
                  fontSize: 20,
                }}
              >
                {electionDate}
              </p>
              <p
                style={{
                  backgroundColor: "#2f9e44",
                  color: "white",
                  width: 156,
                  height: 38,
                  borderRadius: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                See information
              </p>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              position: "absolute",
              top: 18,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <p style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
              eBoto Mo
            </p>
            <img
              src="https://raw.githubusercontent.com/bricesuazo/eboto-mo/main/public/images/eboto-mo-logo-white.png"
              alt="eBoto Mo Logo"
              style={{
                width: 32,
                height: 32,
                marginLeft: 8,
              }}
            />
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 600,
      }
    );
  }
}
