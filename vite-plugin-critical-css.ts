import { Plugin } from 'vite';

export function criticalCSSPlugin(): Plugin {
  return {
    name: 'critical-css',
    transformIndexHtml(html) {
      // Define critical CSS for above-the-fold content
      const criticalCSS = `
        <style>
          /* Critical CSS for immediate rendering */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
              'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
              sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background: #0a0a0a;
            color: #ffffff;
            overflow-x: hidden;
          }
          
          #root {
            min-height: 100vh;
            position: relative;
          }
          
          /* Critical styles for performance - no splash screen styles */
          
          /* Mobile header critical styles */
          .mobile-header {
            position: sticky;
            top: 0;
            z-index: 100;
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(10px);
            padding: 12px 16px;
          }
          
          /* Prevent layout shift for images */
          img {
            max-width: 100%;
            height: auto;
            display: block;
          }
          
          /* Skeleton loading states */
          .skeleton {
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.05) 25%,
              rgba(255, 255, 255, 0.1) 50%,
              rgba(255, 255, 255, 0.05) 75%
            );
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
            border-radius: 8px;
          }
          
          @keyframes loading {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
          
          /* Prevent FOUC for Material-UI */
          .MuiPaper-root {
            background-color: rgba(255, 255, 255, 0.05);
          }
          
          .MuiButton-root {
            text-transform: none;
          }
          
          /* Smooth transitions */
          * {
            transition: color 0.2s, background-color 0.2s, border-color 0.2s;
          }
          
          /* Optimize font loading */
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: local('Inter'), local('Inter-Regular');
          }
        </style>
      `;

      // No splash screen HTML - we use our custom splash screen instead

      // Inject critical CSS in head
      html = html.replace('</head>', `${criticalCSS}</head>`);

      // Remove incorrect resource hints - they will be handled by Vite
      const resourceHints = ``;

      html = html.replace('</head>', `${resourceHints}</head>`);

      return html;
    },
  };
}
