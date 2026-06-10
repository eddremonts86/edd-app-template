import {
  OpeningScene,
  FrictionScene,
  FirstMinuteScene,
  FirstHourScene,
  FiveDaysScene,
  ManifestoScene,
  ClosingScene,
} from './scenes'

export function HomePage() {
  return (
    <div>
      <OpeningScene />
      <FrictionScene />
      <FirstMinuteScene />
      <FirstHourScene />
      <FiveDaysScene />
      <ManifestoScene />
      <ClosingScene />
    </div>
  )
}
