import { motion } from 'motion/react'
import { AirplaneSceneProp, BedsSceneProp, OnsenSceneProp } from './SceneProps'
import { scenePropModels, type ScenePropId } from './scenePropModel'
import {
  TravelerFigure,
  TravelerHead,
  TravelerShoulders,
  type TravelerHeadVariant,
  type TravelerKey,
} from './TravelerAvatar'
import { useTravelerJourney } from './travelerJourneyContext'
import {
  clothingLandings,
  finaleAssignments,
  finaleDanceTimeline,
  finaleViewBox,
  resolveOccupantPoint,
  travelerSettledPoseModel,
  travelerProfiles,
  travelerSceneAssignments,
  type SceneTravelerAssignment,
} from './travelerChoreography'
import {
  checkpointWasCompleted,
  isTravelingTo,
  type JourneyCheckpoint,
} from './travelerJourneyState'

const sceneCheckpoints = {
  airplane: 'dates',
  beds: 'hotels',
  onsen: 'middle',
} as const satisfies Record<ScenePropId, JourneyCheckpoint>

const sceneSettledPhases = {
  airplane: 'dates-settled',
  beds: 'hotels-settled',
  onsen: 'middle-settled',
} as const

function SceneTraveler({
  traveler,
  color,
  facing,
  className = '',
}: {
  traveler: TravelerKey
  color: string
  facing: 1 | -1
  className?: string
}) {
  return (
    <g
      className={`scene-traveler scene-traveler--${traveler} ${className}`}
      data-traveler={traveler}
      transform={`scale(${facing} 1)`}
    >
      <TravelerFigure traveler={traveler} color={color} />
    </g>
  )
}

function settledHeadTransform(
  scene: ScenePropId,
  assignment: SceneTravelerAssignment,
) {
  const point = resolveOccupantPoint(scene, assignment)
  const offset = travelerSettledPoseModel.offsets[scene][assignment.traveler]
  return {
    x: point.x + offset.x,
    y: point.y + offset.y,
    scale: travelerSettledPoseModel.headScales[scene],
    rotate: assignment.finalRotation,
  }
}

function SettledTravelerHead({
  scene,
  assignment,
  variant,
}: {
  scene: ScenePropId
  assignment: SceneTravelerAssignment
  variant: TravelerHeadVariant
}) {
  const profile = travelerProfiles[assignment.traveler]
  return (
    <g
      className={`scene-traveler-head scene-traveler-head--${scene}`}
      transform={`scale(${assignment.facing} 1)`}
    >
      <TravelerHead
        traveler={assignment.traveler}
        skinColor={profile.skinColor}
        variant={variant}
      />
    </g>
  )
}

function SettledTravelerBody({
  assignment,
  bathing = false,
}: {
  assignment: SceneTravelerAssignment
  bathing?: boolean
}) {
  const profile = travelerProfiles[assignment.traveler]
  return (
    <g
      className="scene-traveler-body"
      transform={`scale(${assignment.facing} 1)`}
    >
      <TravelerShoulders
        color={profile.color}
        skinColor={profile.skinColor}
        bathing={bathing}
      />
    </g>
  )
}

function LocalAirplaneTravelers({
  traveling,
  settled,
  generation,
  complete,
}: {
  traveling: boolean
  settled: boolean
  generation: number
  complete: () => void
}) {
  const entry = scenePropModels.airplane.anchors.entry
  const approach = travelerSceneAssignments.airplane.map((assignment, index) => (
    <motion.g
      className={traveling ? 'scene-traveler-motion is-running' : 'scene-traveler-motion'}
      data-scene-traveler-layer="boarding"
      data-traveler={assignment.traveler}
      initial={false}
      animate={
        traveling
          ? {
              x: [entry.x - 36 - index * 10, entry.x - 8, entry.x + 18],
              y: [entry.y + 54, entry.y + 24, entry.y + 6],
              scale: [0.55, 0.5, 0.42],
              opacity: [0, 1, 0],
            }
          : {
              x: entry.x - 36,
              y: entry.y + 54,
              scale: 0.55,
              opacity: 0,
            }
      }
      transition={
        traveling
          ? {
              duration: 0.64,
              delay: 0.54 + assignment.delay,
              ease: [0.42, 0, 0.2, 1],
              times: [0, 0.58, 1],
            }
          : { duration: 0.08 }
      }
      key={`${generation}-airplane-board-${assignment.traveler}`}
    >
      <SceneTraveler
        traveler={assignment.traveler}
        color={travelerProfiles[assignment.traveler].color}
        facing={assignment.facing}
      />
    </motion.g>
  ))

  const occupants = travelerSceneAssignments.airplane.map((assignment, index) => {
    const transform = settledHeadTransform('airplane', assignment)
    const finalTraveler = index === travelerSceneAssignments.airplane.length - 1
    return (
      <motion.g
        data-scene-traveler-layer="settled"
        data-traveler={assignment.traveler}
        initial={false}
        animate={{
          ...transform,
          opacity: traveling || settled ? 1 : 0,
        }}
        transition={
          traveling
            ? {
                duration: 0.2,
                delay: 0.78 + assignment.delay,
                ease: 'easeOut',
              }
            : { duration: settled ? 0 : 0.1 }
        }
        onAnimationComplete={
          traveling && finalTraveler ? complete : undefined
        }
        key={`${generation}-airplane-seat-${assignment.traveler}`}
      >
        <SettledTravelerHead
          scene="airplane"
          assignment={assignment}
          variant="head"
        />
      </motion.g>
    )
  })

  return { approach, occupants }
}

function LocalBedTravelers({
  traveling,
  settled,
  generation,
  complete,
}: {
  traveling: boolean
  settled: boolean
  generation: number
  complete: () => void
}) {
  const entry = scenePropModels.beds.anchors.entry
  const approach = travelerSceneAssignments.beds.map((assignment, index) => {
    const target = settledHeadTransform('beds', assignment)
    return (
      <motion.g
        className={traveling ? 'scene-traveler-motion is-running' : 'scene-traveler-motion'}
        data-scene-traveler-layer="jumping"
        data-traveler={assignment.traveler}
        initial={false}
        animate={
          traveling
            ? {
                x: [entry.x + index * 8, target.x - 34, target.x],
                y: [entry.y + 32, target.y + 68, target.y + 18],
                scale: [0.52, 0.5, travelerSettledPoseModel.bodyScale],
                rotate: [0, assignment.finalRotation * 1.7, assignment.finalRotation],
                opacity: [0, 1, 0],
              }
            : {
                x: entry.x,
                y: entry.y + 32,
                scale: 0.52,
                opacity: 0,
              }
        }
        transition={
          traveling
            ? {
                duration: 0.82,
                delay: 0.58 + assignment.delay,
                ease: [0.42, 0, 0.2, 1],
                times: [0, 0.58, 1],
              }
            : { duration: 0.08 }
        }
        key={`${generation}-bed-jump-${assignment.traveler}`}
      >
        <SceneTraveler
          traveler={assignment.traveler}
          color={travelerProfiles[assignment.traveler].color}
          facing={assignment.facing}
        />
      </motion.g>
    )
  })

  const bodies = travelerSceneAssignments.beds.map((assignment) => {
    const target = settledHeadTransform('beds', assignment)
    return (
      <motion.g
        data-scene-traveler-layer="body"
        data-traveler={assignment.traveler}
        initial={false}
        animate={{
          ...target,
          opacity: traveling || settled ? 1 : 0,
        }}
        transition={
          traveling
            ? {
                duration: 0.12,
                delay: 1.02 + assignment.delay,
                ease: 'easeOut',
              }
            : { duration: settled ? 0 : 0.1 }
        }
        key={`${generation}-bed-body-${assignment.traveler}`}
      >
        <SettledTravelerBody assignment={assignment} />
      </motion.g>
    )
  })

  const heads = travelerSceneAssignments.beds.map((assignment, index) => {
    const target = settledHeadTransform('beds', assignment)
    const finalTraveler = index === travelerSceneAssignments.beds.length - 1
    return (
      <motion.g
        data-scene-traveler-layer="settled"
        data-traveler={assignment.traveler}
        initial={false}
        animate={{
          ...target,
          opacity: traveling || settled ? 1 : 0,
        }}
        transition={
          traveling
            ? {
                duration: 0.18,
                delay: 1.08 + assignment.delay,
                ease: 'easeOut',
              }
            : { duration: settled ? 0 : 0.1 }
        }
        onAnimationComplete={traveling && finalTraveler ? complete : undefined}
        key={`${generation}-bed-head-${assignment.traveler}`}
      >
        <SettledTravelerHead
          scene="beds"
          assignment={assignment}
          variant="dressed"
        />
      </motion.g>
    )
  })

  return { approach, bodies, heads }
}

function LocalOnsenTravelers({
  traveling,
  settled,
  generation,
  complete,
}: {
  traveling: boolean
  settled: boolean
  generation: number
  complete: () => void
}) {
  const entry = scenePropModels.onsen.anchors.entry
  const approach = travelerSceneAssignments.onsen.map((assignment, index) => (
    <motion.g
      className={traveling ? 'scene-traveler-motion is-running' : 'scene-traveler-motion'}
      data-scene-traveler-layer="entering"
      data-traveler={assignment.traveler}
      initial={false}
      animate={
        traveling
          ? {
              x: [entry.x - 28 + index * 8, entry.x + 18, entry.x + 58],
              y: [entry.y + 52, entry.y + 20, entry.y - 2],
              scale: [0.54, 0.48, 0.4],
              opacity: [0, 1, 0],
            }
          : {
              x: entry.x - 28,
              y: entry.y + 52,
              scale: 0.54,
              opacity: 0,
            }
      }
      transition={
        traveling
          ? {
              duration: 0.62,
              delay: 0.5 + assignment.delay,
              ease: [0.42, 0, 0.2, 1],
              times: [0, 0.6, 1],
            }
          : { duration: 0.08 }
      }
      key={`${generation}-onsen-enter-${assignment.traveler}`}
    >
      <SceneTraveler
        traveler={assignment.traveler}
        color={travelerProfiles[assignment.traveler].color}
        facing={assignment.facing}
      />
    </motion.g>
  ))

  const onsenRenderOrder = [
    ...travelerSceneAssignments.onsen.filter(({ traveler }) =>
      traveler === 'milo' || traveler === 'rob',
    ),
    ...travelerSceneAssignments.onsen.filter(({ traveler }) =>
      traveler === 'jules' || traveler === 'kate',
    ),
  ]

  const bodies = onsenRenderOrder
    .filter(({ traveler }) => traveler === 'milo' || traveler === 'rob')
    .map((assignment) => {
      const transform = settledHeadTransform('onsen', assignment)
      return (
        <motion.g
          data-scene-traveler-layer="body"
          data-traveler={assignment.traveler}
          data-onsen-depth="rear-bust"
          initial={false}
          animate={{
            ...transform,
            opacity: traveling || settled ? 1 : 0,
          }}
          transition={
            traveling
              ? {
                  duration: 0.16,
                  delay: 0.68 + assignment.delay,
                  ease: 'easeOut',
                }
              : { duration: settled ? 0 : 0.1 }
          }
          key={`${generation}-onsen-body-${assignment.traveler}`}
        >
          <SettledTravelerBody assignment={assignment} bathing />
        </motion.g>
      )
    })

  const heads = onsenRenderOrder.map((assignment, index) => {
    const transform = settledHeadTransform('onsen', assignment)
    const finalTraveler = index === onsenRenderOrder.length - 1
    const rearBather =
      assignment.traveler === 'milo' || assignment.traveler === 'rob'
    return (
      <motion.g
        data-scene-traveler-layer="settled"
        data-traveler={assignment.traveler}
        data-onsen-depth={rearBather ? 'rear-bust' : 'foreground-head'}
        initial={false}
        animate={{
          ...transform,
          opacity: traveling || settled ? 1 : 0,
        }}
        transition={
          traveling
            ? {
                duration: 0.2,
                delay: 0.72 + assignment.delay,
                ease: 'easeOut',
              }
            : { duration: settled ? 0 : 0.1 }
        }
        onAnimationComplete={
          traveling && finalTraveler ? complete : undefined
        }
        key={`${generation}-onsen-bathe-${assignment.traveler}`}
      >
        <SettledTravelerHead
          scene="onsen"
          assignment={assignment}
          variant={rearBather ? 'bathing-bust' : 'head'}
        />
      </motion.g>
    )
  })

  return { approach, bodies, heads }
}

function ClothingBundle({ traveler }: { traveler: TravelerKey }) {
  return (
    <g
      className="scene-clothing-bundle"
      data-clothing-bundle={traveler}
    >
      <path d="M-15 -7C-13 -15 -2 -16 3 -10C8 -16 18 -13 18 -4C17 5 9 11 0 10C-9 12 -18 4 -15 -7Z" />
      <path d="M-8 -3C-3 0 2 1 8 -2M1 -9L0 7" />
    </g>
  )
}

function OnsenClothing({
  traveling,
  visible,
  generation,
}: {
  traveling: boolean
  visible: boolean
  generation: number
}) {
  return clothingLandings.map((landing) => {
    const assignment = travelerSceneAssignments.onsen.find(
      ({ traveler }) => traveler === landing.traveler,
    )!
    const source = resolveOccupantPoint('onsen', assignment)
    const arcY = Math.min(source.y, landing.point.y) - 96

    return (
      <motion.g
        data-clothing-state={visible ? 'landed' : traveling ? 'tossing' : 'hidden'}
        data-traveler={landing.traveler}
        initial={false}
        animate={
          traveling
            ? {
                x: [source.x, (source.x + landing.point.x) / 2, landing.point.x],
                y: [source.y + 18, arcY, landing.point.y],
                rotate: [0, landing.rotation * 2.2, landing.rotation],
                scale: [0.58, 1.08, 1.08],
                opacity: [0, 1, 1],
              }
            : {
                x: landing.point.x,
                y: landing.point.y,
                rotate: landing.rotation,
                scale: 1.08,
                opacity: visible ? 1 : 0,
              }
        }
        transition={
          traveling
            ? {
                duration: 0.56,
                delay: 0.68 + assignment.delay,
                ease: [0.35, 0.05, 0.25, 1],
                times: [0, 0.52, 1],
              }
            : { duration: visible ? 0 : 0.08 }
        }
        key={`${generation}-clothing-${landing.traveler}`}
      >
        <g style={{ color: travelerProfiles[landing.traveler].color }}>
          <ClothingBundle traveler={landing.traveler} />
        </g>
      </motion.g>
    )
  })
}

export function TravelerSceneStage({ scene }: { scene: ScenePropId }) {
  const {
    phase,
    completedIndex,
    generation,
    reducedMotion,
    progressByCheckpoint,
    completeCheckpoint,
  } = useTravelerJourney()
  const checkpoint = sceneCheckpoints[scene]
  const traveling = isTravelingTo(phase, checkpoint)
  const handoffActive = traveling && progressByCheckpoint[checkpoint] >= 0.995
  const settled = phase === sceneSettledPhases[scene]
  const completed = checkpointWasCompleted(completedIndex, checkpoint)
  const complete = () => completeCheckpoint(checkpoint)

  let prop
  if (scene === 'airplane') {
    const travelers = LocalAirplaneTravelers({
      traveling: handoffActive,
      settled,
      generation,
      complete,
    })
    prop = (
      <AirplaneSceneProp
        approach={reducedMotion ? null : travelers.approach}
        occupants={travelers.occupants}
      />
    )
  } else if (scene === 'beds') {
    const travelers = LocalBedTravelers({
      traveling: handoffActive,
      settled,
      generation,
      complete,
    })
    prop = (
      <BedsSceneProp
        approach={reducedMotion ? null : travelers.approach}
        occupants={travelers.bodies}
        heads={travelers.heads}
      />
    )
  } else {
    const travelers = LocalOnsenTravelers({
      traveling: handoffActive,
      settled,
      generation,
      complete,
    })
    prop = (
      <OnsenSceneProp
        approach={reducedMotion ? null : travelers.approach}
        occupants={travelers.bodies}
        heads={travelers.heads}
        effects={
          <OnsenClothing
            traveling={handoffActive && !reducedMotion}
            visible={completed}
            generation={generation}
          />
        }
      />
    )
  }

  return (
    <div
      className={`section-stage section-stage--${scene}`}
      data-section-stage={scene}
      data-journey-checkpoint={checkpoint}
      data-traveler-scene-state={
        handoffActive
          ? 'handoff'
          : traveling
            ? 'traveling'
            : settled
              ? 'settled'
              : completed
                ? 'visited'
                : 'waiting'
      }
      aria-hidden="true"
    >
      {prop}
    </div>
  )
}

function FinaleTraveler({
  traveler,
  dance,
  facing,
  reducedMotion,
}: {
  traveler: TravelerKey
  dance: string
  facing: 1 | -1
  reducedMotion: boolean
}) {
  return (
    <svg
      className={`traveler-finale__figure traveler-finale__figure--${traveler} ${
        reducedMotion ? 'is-reduced' : 'is-dancing'
      }`}
      viewBox="-40 -70 80 150"
      focusable="false"
      data-dance={dance}
    >
      <g transform={`scale(${facing} 1)`}>
        <TravelerFigure traveler={traveler} color={travelerProfiles[traveler].color} />
      </g>
    </svg>
  )
}

export function TravelerFinale() {
  const {
    phase,
    reducedMotion,
    replayJourney,
  } = useTravelerJourney()
  const visible = phase === 'dancing'

  return (
    <section
      className="traveler-finale"
      id="traveler-finale"
      data-note-section
      data-journey-checkpoint="finale"
      data-traveler-finale-state={visible ? 'dancing' : 'waiting'}
      aria-label="The four travelers celebrate at the end of the route"
    >
      <div className="traveler-finale__stage" aria-hidden="true">
        <svg
          className="traveler-finale__field"
          viewBox={finaleViewBox.join(' ')}
          preserveAspectRatio="xMidYMid meet"
          focusable="false"
        >
          <g className="traveler-finale__route">
            <circle cx="52" cy="22" r="7" />
            <circle cx="628" cy="180" r="7" />
          </g>
        </svg>
        {finaleAssignments.map((assignment) => (
          <motion.div
            className={`traveler-finale__slot ${visible ? 'is-visible' : ''}`}
            style={{
              left: `${(assignment.point.x / finaleViewBox[2]) * 100}%`,
              top: `${(assignment.point.y / finaleViewBox[3]) * 100}%`,
            }}
            animate={
              visible && !reducedMotion
                ? {
                    left: finaleDanceTimeline.tracks[assignment.traveler].points.map(
                      ({ x }) => `${(x / finaleViewBox[2]) * 100}%`,
                    ),
                    top: finaleDanceTimeline.tracks[assignment.traveler].points.map(
                      ({ y }) => `${(y / finaleViewBox[3]) * 100}%`,
                    ),
                    rotate:
                      [...finaleDanceTimeline.tracks[assignment.traveler].rotations],
                    scale:
                      [...finaleDanceTimeline.tracks[assignment.traveler].scales],
                  }
                : undefined
            }
            transition={
              visible && !reducedMotion
                ? {
                    duration: finaleDanceTimeline.duration,
                    times: [...finaleDanceTimeline.times],
                    ease: 'easeInOut',
                    repeat: Infinity,
                  }
                : undefined
            }
            data-finale-slot={assignment.traveler}
            data-finale-traveler={assignment.traveler}
            data-dance-timeline="groove-hands-spins-cross-regroup"
            key={assignment.traveler}
          >
            <FinaleTraveler
              traveler={assignment.traveler}
              dance={assignment.dance}
              facing={assignment.facing}
              reducedMotion={reducedMotion}
            />
          </motion.div>
        ))}
      </div>
      <button
        className="traveler-finale__replay"
        type="button"
        onClick={replayJourney}
      >
        Replay journey
      </button>
    </section>
  )
}
