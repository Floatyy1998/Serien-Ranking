import { Close, NavigateBefore, NavigateNext } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { colors } from '../../theme';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disableBeacon?: boolean;
  spotlightPadding?: number;
}

interface TourSystemProps {
  steps: TourStep[];
  run: boolean;
  onTourEnd: () => void;
  onTourSkip: () => void;
  onStepChange?: (stepIndex: number) => void;
}

export const TourSystem: React.FC<TourSystemProps> = ({
  steps,
  run,
  onTourEnd,
  onTourSkip,
  onStepChange,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!run) {
      setIsVisible(false);
      return;
    }

    const updateTargetPosition = () => {
      if (currentStep >= steps.length) return;

      const targetElement = document.querySelector(steps[currentStep].target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
        setIsVisible(true);

        // Element sichtbar unter dem Header positionieren
        setTimeout(() => {
          const elementRect = targetElement.getBoundingClientRect();
          
          // Prüfe ob es ein MockCard-related target ist (aber nicht series-grid!)
          const currentTarget = steps[currentStep]?.target || '';
          const isMockCardStep = currentTarget.includes('series-providers') || 
                                currentTarget.includes('series-watchlist-button') || 
                                currentTarget.includes('series-rating') || 
                                currentTarget.includes('series-menu');
          
          // Bei MockCard steps nicht scrollen, da MockCard bereits richtig positioniert ist
          // series-grid wird normal gescrollt, da dort noch keine MockCard ist
          if (isMockCardStep) {
            return;
          }
          
          // Moderatere Offset-Werte - direkt unter Header aber sichtbar
          const isMobile = window.innerWidth < 768;
          const headerOffset = isMobile ? 160 : 160;
          
          const newScrollTop = window.pageYOffset + elementRect.top - headerOffset;
          
          window.scrollTo({
            top: Math.max(0, newScrollTop),
            behavior: 'auto'
          });
        }, 50);
      } else {
        // Retry after 500ms if element not found
        timeoutRef.current = setTimeout(updateTargetPosition, 500);
      }
    };

    updateTargetPosition();

    const handleResize = () => updateTargetPosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentStep, steps, run]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    } else {
      onTourEnd();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const getSpotlightStyle = () => {
    if (!targetRect) return {};

    const padding = steps[currentStep].spotlightPadding || 8;
    return {
      top: targetRect.top - padding,
      left: targetRect.left - padding,
      width: targetRect.width + padding * 2,
      height: targetRect.height + padding * 2,
    };
  };

  if (!run || !isVisible || currentStep >= steps.length) {
    return null;
  }

  const spotlightStyle = getSpotlightStyle();

  return (
    <Dialog
      open={true}
      maxWidth={false}
      fullScreen
      sx={{
        '& .MuiDialog-paper': {
          background: 'transparent',
          boxShadow: 'none',
          overflow: 'visible',
        },
      }}
      hideBackdrop
    >
      {/* Overlay */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.overlay.dark,
          zIndex: 9998,
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Spotlight */}
      <AnimatePresence>
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              zIndex: 10002, // Höher als Mock-Card
              backgroundColor: 'transparent',
              border: '3px solid var(--theme-primary)',
              borderRadius: '8px',
              boxShadow: `0 0 20px ${colors.overlay.medium}`,
              pointerEvents: 'none',
              ...spotlightStyle,
            }}
          />
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{
              position: 'fixed',
              zIndex: 9999, // Niedriger als Spotlight
              left: '10px',
              right: '10px',
              bottom: '20px',
              top: 'auto',
              transform: 'none',
              margin: 0,
              maxHeight: '50vh', // Weniger Platz nehmen
              overflow: 'visible',
            }}
          >
            <Card
              sx={{
                background: colors.background.surface,
                backdropFilter: 'blur(10px)',
                border: '2px solid var(--theme-primary)',
                borderRadius: '12px',
                boxShadow: `0 10px 30px ${colors.overlay.dark}`,
                width: '100%',
                height: 'fit-content',
                maxHeight: '50vh',
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent
                sx={{
                  p: { xs: 1.5, md: 3 },
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                }}
              >
                <Box
                  display='flex'
                  justifyContent='space-between'
                  alignItems='flex-start'
                  mb={{ xs: 1, md: 2 }}
                >
                  <Typography
                    variant='h6'
                    sx={{
                      color: 'var(--theme-primary)',
                      fontWeight: 'bold',
                      fontSize: { xs: '1.125rem', md: '1.25rem' },
                      lineHeight: 1.2,
                      pr: 1,
                    }}
                  >
                    {steps[currentStep].title}
                  </Typography>
                  <IconButton
                    size='small'
                    onClick={() => setShowSkipDialog(true)}
                    sx={{
                      color: colors.text.muted,
                      ml: 1,
                      '&:hover': {
                        color: colors.text.secondary,
                        backgroundColor: colors.overlay.medium,
                      },
                    }}
                  >
                    <Close fontSize='small' />
                  </IconButton>
                </Box>

                <Typography
                  variant='body2'
                  sx={{
                    color: colors.text.secondary,
                    lineHeight: 1.5,
                    mb: { xs: 2, md: 3 },
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    flex: 1,
                    overflowY: 'auto',
                  }}
                >
                  {steps[currentStep].content}
                </Typography>

                <Box
                  display='flex'
                  justifyContent='space-between'
                  alignItems='center'
                  flexDirection={{ xs: 'column', sm: 'row' }}
                  gap={{ xs: 1.5, sm: 0 }}
                  sx={{ flexShrink: 0 }}
                >
                  <Typography
                    variant='caption'
                    sx={{
                      color: colors.text.muted,
                      fontSize: { xs: '0.7rem', md: '0.75rem' },
                      order: { xs: 2, sm: 1 },
                    }}
                  >
                    {currentStep + 1} von {steps.length}
                  </Typography>

                  <Box
                    display='flex'
                    gap={{ xs: 2, sm: 1 }}
                    sx={{ order: { xs: 1, sm: 2 } }}
                  >
                    <Button
                      size='small'
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      startIcon={<NavigateBefore />}
                      sx={{
                        color: currentStep === 0 ? colors.text.muted : 'var(--theme-primary)',
                        borderColor: currentStep === 0 ? colors.text.muted : 'var(--theme-primary)',
                        '&:hover': {
                          backgroundColor: colors.overlay.medium,
                        },
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        minWidth: { xs: '80px', md: 'auto' },
                      }}
                      variant='outlined'
                    >
                      Zurück
                    </Button>
                    <Button
                      size='small'
                      onClick={nextStep}
                      endIcon={<NavigateNext />}
                      variant='contained'
                      sx={{
                        backgroundColor: 'var(--theme-primary)',
                        color: colors.background.default,
                        fontWeight: 'bold',
                        '&:hover': {
                          backgroundColor: 'var(--theme-accent)',
                        },
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        minWidth: { xs: '80px', md: 'auto' },
                      }}
                    >
                      {currentStep === steps.length - 1 ? 'Fertig' : 'Weiter'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Confirmation Dialog */}
      <Dialog
        open={showSkipDialog}
        onClose={() => setShowSkipDialog(false)}
        fullWidth
        maxWidth='sm'
        sx={{
          '& .MuiDialog-paper': {
            background: `linear-gradient(135deg, ${colors.background.default} 100%, ${colors.background.surface} 100%)`,
            border: `2px solid var(--theme-primary)`,
            borderRadius: '12px',
            margin: { xs: 2, md: 3 },
            width: { xs: 'calc(100% - 32px)', md: 'auto' },
            maxWidth: { xs: 'none', md: '600px' },
            opacity: 1,
          },
          '& .MuiBackdrop-root': {
            backgroundColor: colors.overlay.light,
          },
        }}
      >
        <DialogTitle
          sx={{
            color: 'var(--theme-primary)',
            fontWeight: 'bold',
            fontSize: { xs: '1.1rem', md: '1.25rem' },
            background: colors.background.surface,
            pb: { xs: 1, md: 2 },
          }}
        >
          Tour beenden?
        </DialogTitle>
        <DialogContent
          sx={{ pb: { xs: 2, md: 3 }, background: colors.background.surface }}
        >
          <Typography
            sx={{
              color: colors.text.secondary,
              fontSize: { xs: '0.875rem', md: '1rem' },
              lineHeight: 1.5,
            }}
          >
            Möchtest du die geführte Tour wirklich beenden? Du kannst sie später
            nicht mehr wiederholen.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            p: { xs: 2, md: 3 },
            display: 'flex',
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            gap: { xs: 1.5, sm: 1 },
            justifyContent: { sm: 'space-between' },
            background: colors.background.surface,
            '& .MuiButton-root': {
              margin: 0,
            },
          }}
        >
          <Button
            onClick={() => setShowSkipDialog(false)}
            sx={{
              color: 'var(--theme-primary)',
              borderColor: 'var(--theme-primary)',
              '&:hover': {
                backgroundColor: colors.overlay.medium,
              },
              flex: { xs: 'none', sm: 1 },
              width: { xs: '100%', sm: 'auto' },
              maxWidth: { sm: '200px' },
            }}
            variant='outlined'
          >
            Tour fortsetzen
          </Button>
          <Button
            onClick={() => {
              setShowSkipDialog(false);
              onTourSkip();
            }}
            variant='contained'
            sx={{
              backgroundColor: colors.status.error,
              '&:hover': {
                backgroundColor: colors.status.errorDark,
              },
              flex: { xs: 'none', sm: 1 },
              width: { xs: '100%', sm: 'auto' },
              maxWidth: { sm: '200px' },
            }}
          >
            Tour beenden
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};
