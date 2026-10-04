export type TravelerKey = 'kate' | 'rob' | 'jules' | 'milo'

type TravelerAvatarProps = {
  name: string
  traveler: TravelerKey
  color: string
  compact?: boolean
  showName?: boolean
}

function Rob({ color }: { color: string }) {
  return (
    <g transform="translate(0 -6.4) scale(1.08)">
      <g className="avatar__leg avatar__leg--left">
        <rect x="-10" y="25" width="12" height="55" rx="6" fill="#303d40" />
      </g>
      <g className="avatar__leg avatar__leg--right">
        <rect x="8" y="25" width="12" height="55" rx="6" fill="#273538" />
      </g>
      <rect x="-18" y="-14" width="42" height="48" rx="12" fill={color} />
      <circle cx="3" cy="-35" r="18" fill="#e3a47f" />
      <path
        d="M-15 -38Q-17 -55 0 -57Q18 -55 21 -39Q11 -47 2 -47Q-7 -47 -15 -38Z"
        fill="#4e372e"
      />
      <path
        d="M-14 -32Q-13 -20 -7 -16Q-4 -14 -1 -14H7Q10 -14 13 -16Q19 -20 20 -32Q13 -25 3 -26Q-6 -25 -14 -32Z"
        fill="#4e372e"
      />
      <circle cx="-4" cy="-36" r="2.2" fill="#26383a" />
      <circle cx="10" cy="-36" r="2.2" fill="#26383a" />
      <g className="avatar__arm avatar__arm--left">
        <rect x="-27" y="-9" width="10" height="48" rx="5" fill={color} />
      </g>
      <g className="avatar__arm avatar__arm--right">
        <rect x="23" y="-9" width="10" height="48" rx="5" fill={color} />
      </g>
    </g>
  )
}

function Kate({ color }: { color: string }) {
  return (
    <g transform="translate(0 5.3) scale(.97)">
      <g className="avatar__leg avatar__leg--left">
        <rect x="-10" y="25" width="11" height="52" rx="5.5" fill="#303d40" />
      </g>
      <g className="avatar__leg avatar__leg--right">
        <rect x="7" y="25" width="11" height="52" rx="5.5" fill="#273538" />
      </g>
      <path d="M-20 -12Q3 -22 25 -12L21 33Q3 41 -16 33Z" fill={color} />
      <g transform="translate(0 4)">
        <path d="M-17 -40Q-17 -60 3 -62Q23 -60 24 -40V-11H-17Z" fill="#50352f" />
        <circle cx="3" cy="-40" r="17" fill="#e9ac89" />
        <path
          d="M-15 -42Q-11 -57 4 -57Q18 -55 22 -42Q11 -50 2 -50Q-7 -49 -15 -42Z"
          fill="#50352f"
        />
        <circle cx="-3" cy="-40" r="2.2" fill="#26383a" />
        <circle cx="9" cy="-40" r="2.2" fill="#26383a" />
      </g>
      <g className="avatar__arm avatar__arm--left">
        <rect x="-29" y="-8" width="9" height="45" rx="4.5" fill={color} />
      </g>
      <g className="avatar__arm avatar__arm--right">
        <rect x="24" y="-8" width="9" height="45" rx="4.5" fill={color} />
      </g>
    </g>
  )
}

function Jules({ color }: { color: string }) {
  return (
    <g transform="translate(0 10)">
      <g className="avatar__leg avatar__leg--left">
        <rect x="-9" y="23" width="10" height="47" rx="5" fill="#30383a" />
      </g>
      <g className="avatar__leg avatar__leg--right">
        <rect x="7" y="23" width="10" height="47" rx="5" fill="#263033" />
      </g>
      <rect x="-18" y="-10" width="40" height="43" rx="11" fill={color} />
      <circle cx="2" cy="-29" r="16" fill="#dda47f" />
      <path
        d="M-15 -30Q-18 -47 0 -51Q18 -51 22 -34Q23 -23 13 -19Q10 -36 -3 -37Q-12 -36 -15 -30Z"
        fill="#79583f"
      />
      <g fill="#79583f">
        <circle cx="25" cy="-42" r="8" />
        <circle cx="20" cy="-47" r="6" />
        <circle cx="26" cy="-50" r="6" />
        <circle cx="33" cy="-46" r="6" />
        <circle cx="35" cy="-40" r="6" />
        <circle cx="30" cy="-35" r="6" />
        <circle cx="22" cy="-35" r="6" />
      </g>
      <circle cx="-4" cy="-29" r="2.1" fill="#26383a" />
      <circle cx="8" cy="-29" r="2.1" fill="#26383a" />
      <g className="avatar__arm avatar__arm--left">
        <rect x="-27" y="-7" width="9" height="41" rx="4.5" fill={color} />
      </g>
      <g className="avatar__arm avatar__arm--right">
        <rect x="22" y="-7" width="9" height="41" rx="4.5" fill={color} />
      </g>
    </g>
  )
}

function Milo({ color }: { color: string }) {
  return (
    <g transform="translate(0 5.3) scale(.97)">
      <g className="avatar__leg avatar__leg--left">
        <rect x="-10" y="25" width="11" height="52" rx="5.5" fill="#303d40" />
      </g>
      <g className="avatar__leg avatar__leg--right">
        <rect x="7" y="25" width="11" height="52" rx="5.5" fill="#273538" />
      </g>
      <rect x="-20" y="-12" width="44" height="47" rx="12" fill={color} />
      <g transform="translate(0 4)">
        <circle cx="2" cy="-38" r="18" fill="#dca17e" />
        <path
          d="M-16 -39Q-17 -57 -3 -61Q8 -66 13 -57Q25 -55 22 -40Q11 -49 1 -49Q-9 -48 -16 -39Z"
          fill="#5b4338"
        />
        <path
          d="M-15 -33Q-14 -25 -9 -22Q-5 -20 -1 -20H5Q9 -20 13 -22Q18 -25 20 -33Q12 -26 2 -27Q-7 -26 -15 -33Z"
          fill="#5b4338"
          opacity=".68"
        />
        <circle cx="-6" cy="-39" r="8" fill="none" stroke="#26383a" strokeWidth="1.25" />
        <circle cx="11" cy="-39" r="8" fill="none" stroke="#26383a" strokeWidth="1.25" />
        <path d="M2 -39H3" stroke="#26383a" strokeWidth="1.25" />
        <circle cx="-6" cy="-39" r="2.2" fill="#26383a" />
        <circle cx="11" cy="-39" r="2.2" fill="#26383a" />
      </g>
      <g className="avatar__arm avatar__arm--left">
        <rect x="-29" y="-8" width="9" height="45" rx="4.5" fill={color} />
      </g>
      <g className="avatar__arm avatar__arm--right">
        <rect x="24" y="-8" width="9" height="45" rx="4.5" fill={color} />
      </g>
    </g>
  )
}

const figures = {
  rob: Rob,
  kate: Kate,
  jules: Jules,
  milo: Milo,
}

export function TravelerFigure({
  traveler,
  color,
}: {
  traveler: TravelerKey
  color: string
}) {
  const Figure = figures[traveler]
  return <Figure color={color} />
}

export type TravelerHeadVariant = 'head' | 'dressed' | 'bathing-bust'

export function TravelerHead({
  traveler,
  skinColor,
  variant = 'head',
}: {
  traveler: TravelerKey
  skinColor: string
  variant?: TravelerHeadVariant
}) {
  return (
    <g
      className={`traveler-head traveler-head--${traveler} traveler-head--${variant}`}
      data-traveler-head={traveler}
    >
      {traveler === 'jules' && (
        <>
          <circle className="traveler-head__face" cx="0" cy="-13" r="14" fill={skinColor} />
          <path
            className="traveler-head__hair"
            d="M-17 -14C-19 -28 -10 -34 1 -34C13 -34 18 -25 16 -11C10 -22 1 -23 -7 -21C-13 -20 -16 -17 -17 -14Z"
          />
          <g className="traveler-head__hair">
            <circle cx="18" cy="-27" r="7" />
            <circle cx="23" cy="-24" r="5" />
            <circle cx="22" cy="-31" r="5" />
          </g>
          <circle className="traveler-head__eye" cx="-5" cy="-13" r="1.8" />
          <circle className="traveler-head__eye" cx="6" cy="-13" r="1.8" />
        </>
      )}
      {traveler === 'milo' && (
        <>
          <circle className="traveler-head__face" cx="0" cy="-14" r="15" fill={skinColor} />
          <path
            className="traveler-head__hair"
            d="M-16 -17C-19 -29 -11 -36 0 -36C7 -36 12 -33 14 -28C20 -26 19 -19 16 -13C10 -23 1 -25 -8 -22C-12 -21 -15 -19 -16 -17Z"
          />
          <path
            className="traveler-head__beard"
            d="M-14 -9C-11 -2 -7 2 0 3C8 2 12 -2 14 -9C7 -5 -6 -5 -14 -9Z"
          />
          <circle className="traveler-head__glasses" cx="-6" cy="-14" r="6.5" />
          <circle className="traveler-head__glasses" cx="8" cy="-14" r="6.5" />
          <path className="traveler-head__glasses-bridge" d="M0 -14H2" />
          <circle className="traveler-head__eye" cx="-6" cy="-14" r="1.7" />
          <circle className="traveler-head__eye" cx="8" cy="-14" r="1.7" />
        </>
      )}
      {traveler === 'kate' && (
        <>
          <path
            className="traveler-head__hair"
            d="M-18 -14C-19 -29 -11 -37 1 -37C14 -37 20 -28 19 -13V5H-18Z"
          />
          <circle className="traveler-head__face" cx="1" cy="-14" r="14" fill={skinColor} />
          <path
            className="traveler-head__hair"
            d="M-15 -17C-11 -30 -4 -33 2 -33C11 -33 17 -27 17 -18C9 -24 1 -25 -6 -22C-10 -21 -13 -19 -15 -17Z"
          />
          <circle className="traveler-head__eye" cx="-4" cy="-14" r="1.8" />
          <circle className="traveler-head__eye" cx="7" cy="-14" r="1.8" />
        </>
      )}
      {traveler === 'rob' && (
        <>
          <circle className="traveler-head__face" cx="0" cy="-14" r="15" fill={skinColor} />
          <path
            className="traveler-head__hair"
            d="M-16 -17C-18 -30 -10 -36 1 -36C13 -36 19 -28 17 -15C9 -23 1 -24 -8 -21C-12 -20 -15 -18 -16 -17Z"
          />
          <path
            className="traveler-head__beard"
            d="M-14 -8C-12 0 -7 4 0 5C8 4 13 0 15 -8C8 -4 -6 -4 -14 -8Z"
          />
          <circle className="traveler-head__eye" cx="-5" cy="-14" r="1.8" />
          <circle className="traveler-head__eye" cx="7" cy="-14" r="1.8" />
        </>
      )}
    </g>
  )
}

export function TravelerShoulders({
  color,
  skinColor,
  bathing = false,
}: {
  color: string
  skinColor: string
  bathing?: boolean
}) {
  return (
    <path
      className={`traveler-head__shoulders ${
        bathing ? 'traveler-head__shoulders--bathing' : ''
      }`}
      d="M-22 28C-20 12 -10 5 0 5C11 5 20 12 22 28V36H-22Z"
      fill={bathing ? skinColor : color}
    />
  )
}

export function TravelerAvatar({
  name,
  traveler,
  color,
  compact = false,
  showName = !compact,
}: TravelerAvatarProps) {
  return (
    <span className={`avatar avatar--${traveler} ${compact ? 'avatar--compact' : ''}`}>
      <svg
        className="avatar__figure"
        viewBox="-40 -70 80 150"
        aria-hidden="true"
        focusable="false"
      >
        <TravelerFigure traveler={traveler} color={color} />
      </svg>
      {showName && <span className="avatar__name">{name}</span>}
    </span>
  )
}
