import { useId, type ReactNode } from 'react'
import { scenePropModels, type ScenePropId } from './scenePropModel'

type ScenePropSvgProps = {
  scene: ScenePropId
  children: ReactNode
}

type ScenePropProps = {
  approach?: ReactNode
  occupants?: ReactNode
  effects?: ReactNode
  heads?: ReactNode
}

function ScenePropSvg({ scene, children }: ScenePropSvgProps) {
  const model = scenePropModels[scene]
  const anchorList = model.anchors.occupants.map(({ x, y }) => `${x},${y}`).join(' ')

  return (
    <svg
      className={`scene-prop scene-prop--${scene}`}
      viewBox={model.viewBox.join(' ')}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      data-scene-prop={scene}
      data-anchor-approach={`${model.anchors.approach.x},${model.anchors.approach.y}`}
      data-anchor-entry={`${model.anchors.entry.x},${model.anchors.entry.y}`}
      data-anchor-occupants={anchorList}
      data-anchor-occlusion-y={model.anchors.occlusionY}
      data-anchor-exit={`${model.anchors.exit.x},${model.anchors.exit.y}`}
    >
      {children}
    </svg>
  )
}

export function AirplaneSceneProp({ approach, occupants, effects }: ScenePropProps) {
  const clipId = `airplane-cabin-${useId().replace(/:/g, '')}`
  const cabinCenters = [340, 390, 440, 490]

  return (
    <ScenePropSvg scene="airplane">
      <defs>
        <clipPath id={clipId}>
          {cabinCenters.map((x) => (
            <rect key={x} x={x - 24} y="126" width="48" height="53" rx="16" />
          ))}
        </clipPath>
      </defs>
      <g data-scene-layer="motion-accents" className="scene-prop__motion-accents">
        <path d="M42 154H126" />
        <path d="M26 180H104" />
        <path d="M62 206H148" />
        <circle cx="34" cy="154" r="4" />
        <circle cx="54" cy="206" r="4" />
      </g>
      <g data-scene-layer="rear-wing-tail" className="scene-prop__rear">
        <path className="scene-prop__accent-coral" d="M160 140L121 62L171 70L226 141Z" />
        <path className="scene-prop__paper" d="M194 151L128 112L159 107L267 145Z" />
        <path className="scene-prop__accent-blue" d="M303 142L247 69L291 74L391 139Z" />
      </g>
      <g className="scene-prop__approach-plane">{approach}</g>
      <g data-scene-layer="fuselage" className="scene-prop__fuselage">
        <path
          className="scene-prop__paper"
          d="M113 175C136 150 160 134 191 123C244 104 320 98 431 98H545C585 98 619 114 649 142L680 171C690 181 685 196 672 200C613 218 538 226 446 226H236C191 226 153 217 123 199L103 187C98 184 102 178 113 175Z"
        />
        <path className="scene-prop__fuselage-rule" d="M115 188C228 204 426 210 661 184" />
        <path className="scene-prop__accent-coral" d="M110 175L179 169L193 199L121 199L103 187Z" />
        <g className="scene-prop__landing-gear">
          <path d="M245 222V251M564 219V251" />
          <circle cx="245" cy="263" r="12" />
          <circle cx="564" cy="263" r="12" />
        </g>
      </g>
      <g data-scene-layer="cabin" className="scene-prop__cabin">
        {cabinCenters.map((x) => (
          <g key={x}>
            <rect
              className="scene-prop__cabin-opening"
              x={x - 27}
              y="123"
              width="54"
              height="58"
              rx="18"
            />
            <path d={`M${x - 13} 137H${x + 13}`} />
          </g>
        ))}
        <path className="scene-prop__cockpit" d="M587 139L622 147L647 170H594Z" />
      </g>
      <g
        data-scene-layer="traveler-plane"
        className="scene-prop__traveler-plane"
        clipPath={`url(#${clipId})`}
      >
        {occupants}
      </g>
      <g className="scene-prop__cabin-frames">
        {cabinCenters.map((x) => (
          <rect
            key={x}
            x={x - 27}
            y="123"
            width="54"
            height="58"
            rx="18"
          />
        ))}
      </g>
      <g data-scene-layer="foreground-wing" className="scene-prop__foreground-wing">
        <path className="scene-prop__accent-blue" d="M397 204L309 303L361 305L503 213Z" />
        <path className="scene-prop__accent-yellow" d="M397 204L449 210L385 249Z" />
      </g>
      <g data-scene-layer="entry-door" className="scene-prop__entry">
        <rect x="515" y="132" width="40" height="69" rx="12" />
        <path d="M522 190H548M525 209L500 244H558" />
        <circle cx="543" cy="166" r="3.5" />
      </g>
      <g className="scene-prop__effects-plane">{effects}</g>
    </ScenePropSvg>
  )
}

export function BedsSceneProp({ approach, occupants, effects, heads }: ScenePropProps) {
  return (
    <ScenePropSvg scene="beds">
      <g data-scene-layer="room-ground" className="scene-prop__room-ground">
        <path className="scene-prop__ground" d="M38 282L176 94H682L570 326H78Z" />
        <path d="M176 94L238 282M346 94L362 282M514 94L486 282M74 282H603" />
        <path className="scene-prop__wall-mark" d="M214 82H508M236 61H486" />
        <circle className="scene-prop__accent-yellow" cx="530" cy="76" r="18" />
      </g>
      <g data-scene-layer="bed-frames" className="scene-prop__bed-frames">
        <path className="scene-prop__frame" d="M70 238L104 126H330L344 238L310 271H84Z" />
        <path className="scene-prop__frame" d="M376 238L410 126H636L650 238L616 271H390Z" />
        <path d="M90 270V292M306 270V292M396 270V292M612 270V292" />
      </g>
      <g data-scene-layer="mattresses" className="scene-prop__mattresses">
        <path className="scene-prop__paper" d="M88 218L113 137H316L327 218L299 239H100Z" />
        <path className="scene-prop__paper" d="M394 218L419 137H622L633 218L605 239H406Z" />
      </g>
      <g data-scene-layer="pillows" className="scene-prop__pillows">
        <rect x="120" y="124" width="74" height="63" rx="16" />
        <rect x="220" y="124" width="74" height="63" rx="16" />
        <rect x="426" y="124" width="74" height="63" rx="16" />
        <rect x="526" y="124" width="74" height="63" rx="16" />
      </g>
      <g data-scene-layer="traveler-plane" className="scene-prop__traveler-plane">
        {approach}
        {occupants}
      </g>
      <g className="scene-prop__pillow-seams">
        <path d="M135 166H179M235 166H279M441 166H485M541 166H585" />
      </g>
      <g data-scene-layer="duvets" className="scene-prop__duvets">
        <path className="scene-prop__duvet" d="M99 182H304L319 220L294 241H105L85 222Z" />
        <path className="scene-prop__duvet" d="M405 182H610L625 220L600 241H411L391 222Z" />
        <path className="scene-prop__textile" d="M116 195L139 232M168 188L191 238M222 188L245 238M274 189L296 231" />
        <path className="scene-prop__textile" d="M422 195L445 232M474 188L497 238M528 188L551 238M580 189L602 231" />
      </g>
      <g data-scene-layer="foreground" className="scene-prop__foreground">
        <path className="scene-prop__accent-green" d="M42 292H678L658 318H62Z" />
        <path className="scene-prop__approach-line" d="M38 316H116L142 278" />
        <path className="scene-prop__accent-coral" d="M326 256H394V276H326Z" />
      </g>
      <g className="scene-prop__effects-plane">{effects}</g>
      <g
        data-scene-layer="traveler-heads-front"
        className="scene-prop__traveler-heads-front"
      >
        {heads}
      </g>
    </ScenePropSvg>
  )
}

export function OnsenSceneProp({
  approach,
  occupants,
  effects,
  heads,
}: ScenePropProps) {
  const basinClipId = `onsen-basin-${useId().replace(/:/g, '')}`
  const basinPath =
    'M119 202C146 169 228 151 344 153C474 149 569 164 611 198C638 220 626 253 591 270C538 294 448 299 354 296C255 300 168 290 128 265C98 246 96 222 119 202Z'

  return (
    <ScenePropSvg scene="onsen">
      <defs>
        <clipPath id={basinClipId}>
          <path d={basinPath} />
        </clipPath>
      </defs>
      <g data-scene-layer="environment-back" className="scene-prop__environment">
        <path
          className="scene-prop__contact-shadow"
          d="M93 286C160 273 245 276 337 281C431 272 536 274 626 291C592 317 486 325 358 321C226 326 130 315 93 286Z"
        />
        <path
          className="scene-prop__environment-contour"
          d="M46 195C103 161 160 158 216 178C269 145 333 143 389 173C444 145 516 151 563 181C608 160 654 168 682 193"
        />
        <g className="scene-prop__timber-spout">
          <rect x="555" y="75" width="24" height="119" rx="3" />
          <rect x="486" y="80" width="92" height="22" rx="3" />
          <path d="M486 91H461L476 110H500Z" />
          <path className="scene-prop__spout-stream" d="M478 108C480 128 475 144 479 164" />
        </g>
        <g className="scene-prop__grass scene-prop__grass--left">
          <path d="M72 229C70 207 65 190 55 174M74 229C82 205 91 188 104 176M73 229C73 202 77 182 84 165" />
        </g>
        <g className="scene-prop__grass scene-prop__grass--right">
          <path d="M630 230C629 207 635 187 648 168M631 230C642 207 654 194 670 185M632 230C622 209 618 193 620 177" />
        </g>
      </g>
      <g className="scene-prop__approach-plane">{approach}</g>
      <g data-scene-layer="rim-back" className="scene-prop__rim-back">
        <path className="scene-prop__stone scene-prop__stone--mid" d="M95 211C91 189 104 169 128 163C149 158 169 169 176 189C181 207 165 220 139 222C117 224 99 221 95 211Z" />
        <path className="scene-prop__stone" d="M151 188C152 163 171 145 198 144C225 143 242 160 241 184C240 205 222 215 194 214C168 214 150 207 151 188Z" />
        <path className="scene-prop__stone scene-prop__stone--dark" d="M220 178C225 151 247 133 276 136C304 139 318 158 312 182C306 203 285 211 257 207C232 204 217 195 220 178Z" />
        <path className="scene-prop__stone scene-prop__stone--mid" d="M293 171C300 144 323 128 352 131C381 134 395 154 388 179C382 200 359 207 332 203C307 199 289 189 293 171Z" />
        <path className="scene-prop__stone" d="M372 179C377 151 400 136 429 139C457 142 471 162 465 186C459 207 438 214 410 210C385 207 369 197 372 179Z" />
        <path className="scene-prop__stone scene-prop__stone--dark" d="M449 188C452 162 473 148 501 151C527 154 542 173 537 196C532 215 511 222 485 218C461 215 447 205 449 188Z" />
        <path className="scene-prop__stone scene-prop__stone--mid" d="M522 202C521 179 539 163 565 163C591 163 610 180 611 202C612 221 593 232 566 232C541 231 523 222 522 202Z" />
      </g>
      <g data-scene-layer="water-back-steam" className="scene-prop__water-back">
        <path className="scene-prop__water" d={basinPath} />
        <g className="scene-prop__steam">
          <path d="M235 159C215 142 242 128 229 111C220 98 230 87 242 79" />
          <path d="M365 148C346 130 374 116 360 98C350 85 361 72 374 64" />
          <path d="M496 160C477 142 505 127 491 109C481 96 492 84 505 76" />
        </g>
      </g>
      <g
        data-scene-layer="traveler-plane"
        className="scene-prop__traveler-plane"
        clipPath={`url(#${basinClipId})`}
      >
        {occupants}
      </g>
      <g
        data-scene-layer="water-front"
        className="scene-prop__water-front"
        clipPath={`url(#${basinClipId})`}
      >
        <path className="scene-prop__water-edge" d="M132 244C209 262 281 264 356 259C438 268 520 259 596 239C584 271 496 288 360 286C229 289 150 273 132 244Z" />
        <path className="scene-prop__ripple" d="M176 207C194 198 216 198 234 207M277 193C299 182 328 182 350 194M387 206C410 195 439 195 462 207M489 194C511 183 539 184 558 196" />
      </g>
      <g data-scene-layer="rim-front" className="scene-prop__rim-front">
        <path className="scene-prop__stone scene-prop__stone--mid" d="M86 250C88 225 108 210 136 213C163 216 180 235 175 259C171 282 149 294 121 291C96 288 84 272 86 250Z" />
        <path className="scene-prop__stone" d="M148 270C151 243 174 226 204 229C235 232 252 252 247 278C242 302 217 313 188 308C161 304 146 291 148 270Z" />
        <path className="scene-prop__stone scene-prop__stone--dark" d="M224 278C228 250 252 234 284 238C315 242 332 263 326 289C321 312 294 322 263 316C236 311 221 297 224 278Z" />
        <path className="scene-prop__stone scene-prop__stone--mid" d="M306 282C310 253 337 237 369 241C402 245 419 267 412 293C406 316 378 326 346 320C318 315 303 301 306 282Z" />
        <path className="scene-prop__stone" d="M393 278C398 249 423 233 455 237C487 241 504 262 497 288C491 312 464 322 432 316C405 311 390 297 393 278Z" />
        <path className="scene-prop__stone scene-prop__stone--dark" d="M476 267C482 239 506 225 536 229C566 233 581 254 574 280C568 302 542 311 514 305C488 300 473 286 476 267Z" />
        <path className="scene-prop__stone scene-prop__stone--mid" d="M552 249C558 224 580 211 607 215C634 219 649 239 643 263C637 284 614 293 588 288C564 283 549 268 552 249Z" />
        <path className="scene-prop__approach-line" d="M28 309H92L126 274" />
      </g>
      <g className="scene-prop__effects-plane">{effects}</g>
      <g
        data-scene-layer="traveler-heads-front"
        className="scene-prop__traveler-heads-front"
      >
        {heads}
      </g>
    </ScenePropSvg>
  )
}
