interface HouseIllustrationProps {
  timeOfDay: "day" | "night";
}

export function HouseIllustration({ timeOfDay }: HouseIllustrationProps) {
  const isNight = timeOfDay === "night";

  return (
    <svg
      aria-hidden="true"
      className="house-illustration"
      viewBox="0 0 220 190"
    >
      <defs>
        <linearGradient id="wall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff2d5" />
          <stop offset="1" stopColor="#efd29f" />
        </linearGradient>
        <linearGradient id="roof" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#cf745d" />
          <stop offset="1" stopColor="#9d4d43" />
        </linearGradient>
        <filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow
            dx="0"
            dy="8"
            floodColor="#4a2b26"
            floodOpacity=".2"
            stdDeviation="7"
          />
        </filter>
      </defs>

      {isNight ? (
        <g className="sky-detail moon">
          <circle cx="176" cy="34" fill="#fff5c8" r="15" />
          <circle cx="183" cy="28" fill="#73809f" r="14" />
          <circle cx="34" cy="43" fill="#fff" r="2" />
          <circle cx="62" cy="25" fill="#fff" r="1.5" />
          <circle cx="194" cy="63" fill="#fff" r="1.5" />
        </g>
      ) : (
        <g className="sky-detail sun">
          <circle cx="179" cy="37" fill="#ffd773" r="17" />
          <g stroke="#ffd773" strokeLinecap="round" strokeWidth="3">
            <path d="M179 10v-8" />
            <path d="M179 72v-8" />
            <path d="m153 22-6-6" />
            <path d="m211 67-6-6" />
            <path d="M144 37h-8" />
            <path d="M222 37h-8" />
          </g>
        </g>
      )}

      <ellipse cx="110" cy="169" fill="#365548" opacity=".2" rx="86" ry="13" />

      <g filter="url(#soft-shadow)">
        <path d="M53 85h114v78H53z" fill="url(#wall)" />
        <path d="m37 91 72-61 74 61-15 12-59-48-58 48z" fill="url(#roof)" />
        <path d="M145 45h18v33h-18z" fill="#8b554a" />
        <path d="M141 40h26v8h-26z" fill="#6e403a" rx="2" />

        <path d="M92 113h36v50H92z" fill="#8f5e47" rx="5" />
        <path d="M99 120h22v43H99z" fill="#a96c50" rx="3" />
        <circle cx="116" cy="142" fill="#f4d58a" r="2.5" />

        <g className={isNight ? "window-glow" : undefined}>
          <rect
            x="61"
            y="108"
            width="25"
            height="29"
            fill={isNight ? "#ffd989" : "#a9d6d4"}
            rx="4"
          />
          <path
            d="M73.5 108v29M61 122.5h25"
            stroke="#fff5dd"
            strokeWidth="2.5"
          />
          <rect
            x="136"
            y="108"
            width="25"
            height="29"
            fill={isNight ? "#ffd989" : "#a9d6d4"}
            rx="4"
          />
          <path
            d="M148.5 108v29M136 122.5h25"
            stroke="#fff5dd"
            strokeWidth="2.5"
          />
        </g>

        <path
          d="M43 162h135"
          stroke="#6c8c64"
          strokeLinecap="round"
          strokeWidth="7"
        />
        <g fill="#6d9d68">
          <circle cx="47" cy="152" r="12" />
          <circle cx="58" cy="155" r="10" />
          <circle cx="165" cy="154" r="11" />
          <circle cx="178" cy="151" r="13" />
        </g>
        <g fill="#f4c3a7">
          <circle cx="49" cy="150" r="2.5" />
          <circle cx="58" cy="155" r="2" />
          <circle cx="171" cy="151" r="2.5" />
        </g>
      </g>
    </svg>
  );
}
