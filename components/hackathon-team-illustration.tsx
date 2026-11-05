import Image from "next/image";

type HackathonTeamIllustrationProps = {
  className?: string;
};

export function HackathonTeamIllustration({ className = "" }: HackathonTeamIllustrationProps) {
  return (
    <Image
      src="/genxcode-hackathon-team.png"
      alt="Illustration of a hackathon team collaborating around laptops with a hackathon whiteboard"
      width={1536}
      height={1536}
      priority
      sizes="(max-width: 1024px) 90vw, 46vw"
      className={className}
    />
  );
}
