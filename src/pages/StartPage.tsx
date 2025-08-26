import { motion } from 'framer-motion';
import { styled, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import logoSvg from '../assets/logo.svg?raw';
import { ArrowRight, Film, Star, Users, TrendingUp, Play, Award } from 'lucide-react';
import { colors } from '../theme/colors';

const PageContainer = styled(Box)`
  min-height: 100vh;
  width: 100%;
  background: ${colors.background.default};
  position: relative;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const HeroSection = styled(Box)`
  width: 100%;
  max-width: 1200px;
  padding: 60px 20px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 1;
`;

const LogoContainer = styled(motion.div)`
  width: 160px;
  height: 160px;
  margin-bottom: 25px;
  position: relative;
`;

const LogoWrapper = styled('div')`
  width: 100%;
  height: 100%;
  
  svg {
    width: 100%;
    height: 100%;
    
    path {
      fill: ${colors.text.primary};
    }
  }
`;

const Subtitle = styled(motion.p)`
  font-size: 1.3rem;
  color: ${colors.text.muted};
  margin-bottom: 30px;
  letter-spacing: 2px;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    letter-spacing: 1px;
  }
`;

const ButtonContainer = styled(motion.div)`
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
  justify-content: center;
`;

const StyledButton = styled(Link)`
  padding: 12px 30px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-decoration: none;
  color: ${colors.background.default};
  background: ${colors.primary};
  border: none;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    background: ${colors.primaryHover};
    box-shadow: ${colors.shadow.buttonHover};
  }
  
  &.secondary {
    background: transparent;
    color: ${colors.text.primary};
    border: 2px solid ${colors.border.primary};
    
    &:hover {
      background: ${colors.overlay.light};
    }
  }
`;

const FeatureGrid = styled(Box)`
  width: 100%;
  max-width: 1200px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
  padding: 0 20px 40px;
`;

const FeatureCard = styled(motion.div)`
  background: ${colors.background.cardGradient};
  border: 1px solid ${colors.border.subtle};
  border-radius: 12px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    border-color: ${colors.border.primary};
    box-shadow: ${colors.shadow.hover};
    background: ${colors.background.cardHover};
  }
`;

const FeatureIcon = styled(Box)`
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  background: ${colors.overlay.light};
  border-radius: 10px;
  
  svg {
    width: 22px;
    height: 22px;
    color: ${colors.text.primary};
  }
`;

const FeatureTitle = styled('h3')`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${colors.text.secondary};
`;

const FeatureDescription = styled('p')`
  color: ${colors.text.muted};
  line-height: 1.5;
  font-size: 0.85rem;
`;


const StartPage = () => {
  // Process SVG string to remove fill attribute and set viewBox
  const processedSvg = logoSvg
    .replace(/fill="#[0-9a-fA-F]{6}"/g, '')
    .replace('<svg', '<svg fill="currentColor"');
  
  const features = [
    {
      icon: <Star />,
      title: 'Bewerte & Ranke',
      description: 'Bewerte deine Lieblingsserien und Filme mit unserem detaillierten Bewertungssystem.'
    },
    {
      icon: <Film />,
      title: 'Tracke alles',
      description: 'Behalte den Überblick über alle deine Serien, Staffeln und Episoden.'
    },
    {
      icon: <Users />,
      title: 'Teile mit Freunden',
      description: 'Vergleiche deine Rankings mit Freunden und entdecke neue Empfehlungen.'
    },
    {
      icon: <TrendingUp />,
      title: 'Statistiken',
      description: 'Detaillierte Statistiken über deine Sehgewohnheiten und Bewertungen.'
    },
    {
      icon: <Award />,
      title: 'Sammle Badges',
      description: 'Schalte Achievements frei und sammle Badges für deine Aktivitäten.'
    },
    {
      icon: <Play />,
      title: 'Streaming Info',
      description: 'Finde heraus wo deine Serien und Filme verfügbar sind.'
    }
  ];

  return (
    <PageContainer>
      <HeroSection>
        <LogoContainer
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <LogoWrapper dangerouslySetInnerHTML={{ __html: processedSvg }} />
        </LogoContainer>

        <Subtitle
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Dein Entertainment Hub
        </Subtitle>

        <ButtonContainer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <StyledButton to="/register">
            Jetzt Starten
            <ArrowRight style={{ display: 'inline', marginLeft: '8px', verticalAlign: 'middle' }} size={18} />
          </StyledButton>
          <StyledButton to="/login" className="secondary">
            Anmelden
          </StyledButton>
        </ButtonContainer>
      </HeroSection>

      <FeatureGrid>
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
          >
            <FeatureIcon>{feature.icon}</FeatureIcon>
            <FeatureTitle>{feature.title}</FeatureTitle>
            <FeatureDescription>{feature.description}</FeatureDescription>
          </FeatureCard>
        ))}
      </FeatureGrid>
    </PageContainer>
  );
};

export default StartPage;