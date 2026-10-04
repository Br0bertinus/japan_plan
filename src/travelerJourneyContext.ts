import { createContext, useContext } from 'react'
import type { JourneyCheckpoint, JourneyPhase } from './travelerJourneyState'

export type TravelerJourneyContextValue = Readonly<{
  phase: JourneyPhase
  completedIndex: number
  generation: number
  reducedMotion: boolean
  progressByCheckpoint: Record<JourneyCheckpoint, number>
  journeyProgressing: boolean
  completeCheckpoint: (checkpoint: JourneyCheckpoint) => void
  replayJourney: () => void
}>

export const TravelerJourneyContext =
  createContext<TravelerJourneyContextValue | null>(null)

export function useTravelerJourney() {
  const value = useContext(TravelerJourneyContext)
  if (!value) {
    throw new Error('useTravelerJourney must be used inside TravelerJourneyProvider')
  }
  return value
}
