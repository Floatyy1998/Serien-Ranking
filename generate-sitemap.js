const SitemapGenerator = require('sitemap-generator');

// Erstellen Sie einen Generator
const generator = SitemapGenerator('https://tv-rank.de', {
  stripQuerystring: false,
  filepath: './public/sitemap.xml',
});

// Registrieren Sie Ereignisse
generator.on('done', () => {
  console.log('Sitemap wurde erfolgreich erstellt!');
});

// Starten Sie den Generator
generator.start();
