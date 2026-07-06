// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

vi.mock('../ui', () => ({
  HorizontalScrollContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { PersonDetailsView } from './PersonDetailsView';
import type { PersonDetailsData } from './CastCrew.types';

afterEach(() => {
  cleanup();
  navigateMock.mockReset();
});

const personDetails: PersonDetailsData = {
  name: 'Jane Doe',
  known_for_department: 'Acting',
  birthday: '1990-01-15',
  profile_path: '/jane.png',
  credits: [
    {
      id: 5,
      title: 'Movie A',
      media_type: 'movie',
      vote_average: 8,
      poster_path: '/a.png',
      character: 'Lead',
      release_date: '2020-01-01',
    },
  ],
};

describe('PersonDetailsView', () => {
  it('renders the person name, department and credits', () => {
    render(<PersonDetailsView personDetails={personDetails} onBack={vi.fn()} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Acting')).toBeInTheDocument();
    expect(screen.getByText('Bekannt aus')).toBeInTheDocument();
    expect(screen.getByText('Movie A')).toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', () => {
    const onBack = vi.fn();
    render(<PersonDetailsView personDetails={personDetails} onBack={onBack} />);
    fireEvent.click(screen.getByText('← Zurück'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('navigates to the movie route when a credit is clicked', () => {
    render(<PersonDetailsView personDetails={personDetails} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Movie A'));
    expect(navigateMock).toHaveBeenCalledWith('/movie/5');
  });
});
