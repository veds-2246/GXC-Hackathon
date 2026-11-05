type HackathonTeamIllustrationProps = {
  className?: string;
};

export function HackathonTeamIllustration({ className = "" }: HackathonTeamIllustrationProps) {
  return (
    <svg
      viewBox="0 0 760 620"
      role="img"
      aria-label="A hackathon team collaborating around laptops at a table, with a hackathon whiteboard behind them"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="board" x1="420" y1="50" x2="690" y2="260" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF806D" />
          <stop offset="1" stopColor="#F65D4E" />
        </linearGradient>
        <linearGradient id="shirtTeal" x1="330" y1="230" x2="500" y2="460" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2BD0C9" />
          <stop offset="1" stopColor="#079A9E" />
        </linearGradient>
        <linearGradient id="tableTop" x1="120" y1="420" x2="650" y2="505" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF0BD" />
          <stop offset="1" stopColor="#EACB83" />
        </linearGradient>
      </defs>

      {/* Whiteboard */}
      <g stroke="#171313" strokeWidth="8" strokeLinejoin="round">
        <rect x="399" y="35" width="315" height="228" rx="8" fill="url(#board)" />
        <path d="M391 28H724V45H391z" fill="#F5F2EC" />
        <path d="M391 257H724V272H391z" fill="#F5F2EC" />
        <path d="M431 100H570" strokeWidth="5" strokeLinecap="round" />
        <path d="M600 104H635" strokeWidth="7" strokeLinecap="round" />
        <path d="M600 119H624" strokeWidth="7" strokeLinecap="round" />
      </g>
      <text x="438" y="88" fill="#171313" fontSize="34" fontWeight="900" fontStyle="italic" fontFamily="Arial, sans-serif">HACKATHON</text>
      <g stroke="#171313" strokeWidth="6" strokeLinecap="round">
        <path d="M611 145h36M611 162h29M611 179h36" />
        <path d="M550 180l45-24" />
        <path d="M586 205l-2-37" />
      </g>
      <path d="M632 126c25-39 66-33 67-10 1 15-18 34-43 38" stroke="#FFF4E7" strokeWidth="5" strokeLinecap="round" />
      <rect x="463" y="121" width="30" height="32" rx="4" fill="#FFE638" stroke="#171313" strokeWidth="6" />
      <path d="M470 132h15M470 141h11" stroke="#171313" strokeWidth="4" strokeLinecap="round" />

      {/* Back-left teammate */}
      <g stroke="#171313" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M137 295c-29 9-50 35-62 79l-24 91 104 16 43-112-8-63z" fill="#FF806D" />
        <path d="M113 286c-13-16-11-46 6-62 21-24 58-22 75 1 13 17 9 50-8 68-19 19-54 15-73-7z" fill="#F3B18E" />
        <path d="M108 253c-4-32 23-55 54-51 28 4 43 24 42 51l-13-6-7-21-22 10-28-4-17 24z" fill="#25202A" />
        <path d="M141 265h2M174 265h2" strokeWidth="6" />
        <path d="M150 286q12 10 23-1" strokeWidth="5" />
        <path d="M93 367l74 24" />
        <path d="M72 462l-11 87 51 8 22-93" fill="#F8F6EF" />
        <path d="M56 550l-13 23q-5 13 9 16l65 2q10-2 8-13l-12-17" fill="#F7F4EB" />
        <path d="M184 365l-8-64 59 28 24 72" fill="#F3B18E" />
        <path d="M203 319l81 14 18 74-90-15z" fill="#171B24" />
        <path d="M213 325l65 10 12 54-64-8z" fill="#E7E7E4" strokeWidth="5" />
        <path d="M230 341h42M230 352h32M230 363h36" stroke="#888A91" strokeWidth="4" />
      </g>

      {/* Central mentor */}
      <g stroke="#171313" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M321 255c-35 5-60 34-68 78l-10 112 195 1 17-126c-9-41-37-62-75-66z" fill="url(#shirtTeal)" />
        <path d="M324 234c-20-21-20-60 1-81 26-26 72-22 91 5 17 24 10 63-14 82-24 20-57 18-78-6z" fill="#EFB28F" />
        <path d="M317 184c-1-40 23-64 62-63 33 0 55 23 51 61l-17-12-6-24-30 15-29-10-16 34z" fill="#221C20" />
        <path d="M322 213c-8 27 6 59 29 67 26 10 56-7 64-32l4-27c-7 16-19 27-38 29-23 3-42-12-59-37z" fill="#49312A" />
        <path d="M351 213h2M391 213h2" strokeWidth="6" />
        <path d="M363 240q12 9 24-2" strokeWidth="5" />
        <path d="M296 299l-23 84 71 53 65-59 22-75" fill="url(#shirtTeal)" />
        <path d="M278 370l89 31 57-35" />
        <path d="M300 400l70 35 60-49" />
        <path d="M337 444l-8 88M410 444l22 87" />
        <path d="M322 528l-22 23q-5 10 8 13l59 0q12-4 7-15l-23-20" fill="#AE7650" />
        <path d="M417 528l-3 23q-1 11 12 13l55 0q12-5 3-15l-31-21" fill="#AE7650" />
        <path d="M286 291l-24 90 71 44M434 292l33 87-62 49" fill="url(#shirtTeal)" />
        <path d="M287 362l-40 40q-13 14 4 24l55 16q11 0 17-11l18-25" fill="#EFB28F" />
        <path d="M447 362l34 40q10 13-5 24l-58 16q-11-2-17-12l-17-24" fill="#EFB28F" />
      </g>
      <text x="338" y="353" fill="#E8FFFA" fontSize="18" fontWeight="800" fontFamily="Arial, sans-serif" transform="rotate(-7 338 353)">HACKATHON</text>
      <rect x="367" y="364" width="22" height="35" rx="4" fill="#E9E6DE" stroke="#171313" strokeWidth="5" />
      <path d="M372 375h12M372 382h12" stroke="#171313" strokeWidth="3" />

      {/* Seated builder in yellow */}
      <g stroke="#171313" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M228 357c-27 13-45 44-46 81l8 76 154 3 8-76c-2-48-33-83-72-88z" fill="#FFD92D" />
        <path d="M226 333c-5-25 6-52 30-63 27-13 59-1 71 22 12 25 1 53-21 65-26 14-67 3-80-24z" fill="#EFB28F" />
        <path d="M219 323c-5-27 12-51 42-55 34-5 57 13 59 39l-13-5-13-15-27 8-22-2-21 30z" fill="#171D2D" />
        <path d="M246 346h2M286 346h2" strokeWidth="6" />
        <path d="M253 365q15 8 28-2" strokeWidth="5" />
        <path d="M212 489l-4 63 47 4 20-74M309 489l13 63 43-7-10-69" fill="#F7F4EC" />
        <path d="M211 550l-20 31q-4 11 8 13l52 1q12-4 8-14l-16-27M321 551l-6 30q-1 11 12 14l47-3q11-5 3-15l-25-30" fill="#F7F4EC" />
      </g>

      {/* Right teammate */}
      <g stroke="#171313" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M493 352c-27 7-45 34-47 73l7 83 130-4 4-85c-9-40-42-68-94-67z" fill="#FF806D" />
        <path d="M500 332c-9-27 3-58 31-68 28-10 56 6 63 33 8 30-8 57-35 63-27 5-50-7-59-28z" fill="#EFB28F" />
        <path d="M498 321c-15-36 2-67 36-75 32-8 57 12 62 41l-16-5-13-19-24 10-24-3-17 32z" fill="#22202A" />
        <path d="M518 340h2M556 340h2" strokeWidth="6" />
        <path d="M526 359q13 8 27-3" strokeWidth="5" />
        <path d="M501 383l-40 50q-10 13 4 23l53 17q11 2 17-9l17-40" fill="#EFB28F" />
        <path d="M581 390l36 43q9 11-4 22l-46 20" fill="#EFB28F" />
        <path d="M481 497l-2 61 45 8 12-66M572 496l16 62 43-9-15-64" fill="#F8F5EE" />
        <path d="M477 557l-17 26q-4 12 10 13l51 0q12-3 7-14l-18-24M590 557l-7 25q-2 12 11 14l45-4q11-5 3-15l-23-26" fill="#F8F5EE" />
      </g>

      {/* Shared table, laptops and objects */}
      <g stroke="#171313" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M105 458l27 126M646 455l-23 130M382 470v142" />
        <path d="M84 443c7-34 119-57 296-56 177-1 289 20 298 56l-7 34c-14 27-125 42-291 43-167 0-275-17-291-43z" fill="url(#tableTop)" />
        <path d="M99 449c37 26 142 39 282 39 149 0 245-12 287-37" />
        <path d="M241 391l95-5 13 58-107 0z" fill="#E8E8E1" />
        <path d="M227 445h127l-8 12H221z" fill="#34363D" />
        <path d="M400 395l99-8 19 61-114 0z" fill="#E8E8E1" />
        <path d="M391 449h130l-4 11H387z" fill="#34363D" />
        <path d="M363 410l34-2 5 35-35 0z" fill="#FFE12D" />
        <path d="M176 430l51-2 16 13-69 6z" fill="#14B7B1" />
        <path d="M543 424l24-5 8 31-25 3z" fill="#F2574D" />
        <path d="M593 416l17-4 8 38-19 4z" fill="#14B7B1" />
        <path d="M626 419l22-6 8 42-24 5z" fill="#FFF3D0" />
        <path d="M573 412l19-3 4 35-19 4z" fill="#F7F4EB" />
        <path d="M146 419l18-2 7 28-19 3z" fill="#F45E51" />
      </g>
      <path d="M247 406l70-4" stroke="#A2A3A3" strokeWidth="4" strokeLinecap="round" />
      <path d="M411 410l67-5" stroke="#A2A3A3" strokeWidth="4" strokeLinecap="round" />
      <path d="M369 421h22" stroke="#171313" strokeWidth="4" strokeLinecap="round" />

      {/* Small idea cards and accents */}
      <g stroke="#171313" strokeWidth="5" strokeLinejoin="round">
        <rect x="282" y="300" width="30" height="35" rx="4" fill="#FFD92D" />
        <path d="M289 311h16M289 320h12" strokeWidth="3" />
        <path d="M98 597h73M596 600h77" strokeWidth="4" strokeLinecap="round" />
      </g>
      <path d="M615 573l25-14 23 5 13 15-11 19h-59z" fill="#FFD92D" stroke="#171313" strokeWidth="7" strokeLinejoin="round" />
      <text x="620" y="594" fill="#171313" fontSize="13" fontWeight="900" fontFamily="Arial, sans-serif">HACK</text>
    </svg>
  );
}
