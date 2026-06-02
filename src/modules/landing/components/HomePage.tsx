import {
  GlowyWavesHero,
  ComparisonBlock,
  FeatureCardsBlock,
  OurServicesSection,
  FiveDayPlanBlock,
  ContactBlock,
} from '@/modules/landing'

export function HomePage() {
  return (
    <div id="home">
      <GlowyWavesHero />
      <ComparisonBlock />
      <FeatureCardsBlock />
      <div id="services">
        <OurServicesSection />
      </div>
      <div id="timeline">
        <FiveDayPlanBlock />
      </div>
      <div id="contact">
        <ContactBlock />
      </div>
    </div>
  )
}
