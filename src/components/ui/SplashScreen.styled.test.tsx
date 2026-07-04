// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  BackgroundMesh,
  CornerAccent,
  LoadingText,
  LogoContainer,
  Particle,
  ProgressBar,
  SplashContainer,
  Subtitle,
  Title,
} from './SplashScreen.styled';

afterEach(cleanup);

describe('SplashScreen.styled', () => {
  it('renders the container and text primitives (smoke)', () => {
    render(
      <SplashContainer isHiding={false}>
        <Title>TV-RANK</Title>
        <Subtitle>Untertitel</Subtitle>
        <LoadingText>Lade</LoadingText>
      </SplashContainer>
    );
    expect(screen.getByText('TV-RANK')).toBeInTheDocument();
    expect(screen.getByText('Untertitel')).toBeInTheDocument();
    expect(screen.getByText('Lade')).toBeInTheDocument();
  });

  it('renders decorative primitives with transient props', () => {
    const { container } = render(
      <div>
        <BackgroundMesh />
        <LogoContainer />
        <Particle delay={2} left="20%" />
        <ProgressBar progress={0.5} />
        <CornerAccent cornerPos="top-left" />
      </div>
    );
    // 5 decorative children rendered without throwing
    expect(container.firstChild?.childNodes.length).toBe(5);
  });

  it('renders the hiding state variant', () => {
    render(
      <SplashContainer isHiding>
        <Title>Hidden</Title>
      </SplashContainer>
    );
    expect(screen.getByText('Hidden')).toBeInTheDocument();
  });
});
