import { Container } from '@mui/material';
import { HeroSection } from './HeroSection';
import { FeaturesGrid } from './FeaturesGrid';
import { AdditionalFeatures } from './AdditionalFeatures';
import { FooterCTA } from './FooterCTA';
import { LegalFooter } from './LegalFooter';
import './StartPage.css';

export const StartPage = () => (
  <div
    className="start-page"
    style={{
      background:
        'linear-gradient(180deg, var(--bg-default, #0a0a0f) 0%, var(--bg-surface, #111118) 50%, var(--bg-default, #0a0a0f) 100%)',
    }}
  >
    <Container maxWidth="lg" className="start-container" sx={{ py: { xs: 6, sm: 8, md: 12 } }}>
      <HeroSection />
      <FeaturesGrid />
      <AdditionalFeatures />
      <FooterCTA />
      <LegalFooter />
    </Container>
  </div>
);
