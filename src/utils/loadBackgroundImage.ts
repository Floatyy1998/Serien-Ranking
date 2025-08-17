export const loadBackgroundImage = () => {
  try {
    const savedTheme = localStorage.getItem('customTheme');
    if (savedTheme) {
      const theme = JSON.parse(savedTheme);
      const root = document.documentElement;
      
      if (theme.backgroundImage) {
        root.style.setProperty('--background-image', `url(${theme.backgroundImage})`);
        root.style.setProperty('--background-image-opacity', String(theme.backgroundImageOpacity || 0.5));
        root.style.setProperty('--background-image-blur', `${theme.backgroundImageBlur || 0}px`);
        document.body.classList.add('has-background-image');
      } else {
        root.style.removeProperty('--background-image');
        root.style.removeProperty('--background-image-opacity');
        root.style.removeProperty('--background-image-blur');
        document.body.classList.remove('has-background-image');
      }
    }
  } catch (error) {
    console.error('Error loading background image:', error);
  }
};