/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

export const runtime = "edge";

const eBotoLogo =
  "https://raw.githubusercontent.com/bricesuazo/eboto/main/apps/www/public/images/logo.png";
const cvsuFront =
  "https://raw.githubusercontent.com/bricesuazo/eboto/main/apps/www/public/images/cvsu-front.jpg";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as
    | "candidate"
    | "election"
    | "website"
    | null;
  const NotFoundPage = () => {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
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
          <h1
            style={{
              color: "#fff",
              fontSize: 180,
              lineHeight: 1,
              fontWeight: 800,
            }}
          >
            404
          </h1>
          <p
            style={{
              color: "#fff",
              textAlign: "center",
              width: 600,
            }}
          >
            You have found a secret place. Unfortunately, this is only a 404
            page. You may have mistyped the address, or the page has been moved
            to another URL.
          </p>
          <Header />
        </div>
      ),
      {
        width: 1200,

        height: 600,
      },
    );
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
              src={eBotoLogo}
              alt={`eBoto Logo`}
              style={{
                width: 164,
                height: 164,
              }}
            />
            <Header />
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 600,
      },
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
                "https://raw.githubusercontent.com/bricesuazo/eboto/main/public/images/default-avatar.png"
              }
              alt={candidateName}
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
          <Header />
        </div>
      ),
      {
        width: 1200,
        height: 600,
      },
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
            width={1200}
            height={600}
            style={{
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
              src={electionLogoUrl ?? eBotoLogo}
              alt={electionName}
              width={164}
              height={164}
              style={{
                objectFit: "cover",
                objectPosition: "center",
                boxShadow: "0px 0px 76px 0px rgba(0,0,0,0.25)",
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
              <p style={{ fontSize: 42, fontWeight: "bold" }}>{electionName}</p>
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

          <Header />
        </div>
      ),
      {
        width: 1200,
        height: 600,
      },
    );
  }
}

function Header() {
  return (
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
      <img
        src={eBotoLogo}
        alt="eBoto Logo"
        width={32}
        height={32}
        style={{
          marginRight: 4,
        }}
      />
      <p style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>eBoto</p>
    </div>
  );
}
