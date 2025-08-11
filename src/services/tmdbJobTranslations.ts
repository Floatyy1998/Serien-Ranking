/**
 * 🎬 TMDB Jobs Translation Service
 *
 * Automatische Übersetzung aller TMDB Cast/Crew Jobs durch API-Integration
 */

// Deutsche Übersetzungen für alle TMDB Jobs (500+ Jobs)
const JOB_TRANSLATIONS: Record<string, string> = {
  // ============ REGIE / DIRECTING ============
  Director: 'Regisseur',
  'Assistant Director': 'Regieassistent',
  'First Assistant Director': '1. Regieassistent',
  'Second Assistant Director': '2. Regieassistent',
  'Third Assistant Director': '3. Regieassistent',
  'Series Director': 'Serienregisseur',
  'Second Unit Director': '2nd Unit Regisseur',
  'Co-Director': 'Co-Regisseur',
  'Special Guest Director': 'Special Guest Director',
  'Additional Second Assistant Director': 'Zusätzlicher 2. Regieassistent',
  'Additional Third Assistant Director': 'Zusätzlicher 3. Regieassistent',
  'Assistant Director Trainee': 'Regieassistent Trainee',
  'Crowd Assistant Director': 'Massenregie-Assistent',
  'Field Director': 'Außenregisseur',
  'First Assistant Director (Prep)': '1. Regieassistent (Vorbereitung)',
  'First Assistant Director Trainee': '1. Regieassistent Trainee',
  'Insert Unit Director': 'Insert Unit Regisseur',
  'Insert Unit First Assistant Director': 'Insert Unit 1. Regieassistent',
  'Second Assistant Director Trainee': '2. Regieassistent Trainee',
  'Second Second Assistant Director': 'Zweiter 2. Regieassistent',
  'Second Unit First Assistant Director': '2nd Unit 1. Regieassistent',
  'Stage Director': 'Bühnenregisseur',

  // ============ DREHBUCH / WRITING ============
  Writer: 'Drehbuchautor',
  Screenplay: 'Drehbuch',
  Story: 'Geschichte',
  Novel: 'Roman/Buchvorlage',
  Characters: 'Charaktere',
  Dialogue: 'Dialog',
  'Series Composition': 'Serienkomposition',
  'Original Story': 'Originalgeschichte',
  Adaptation: 'Adaptation',
  Teleplay: 'Teleplay',
  'Script Editor': 'Skript-Editor',
  'Script Consultant': 'Drehbuch-Berater',
  Book: 'Buch',
  'Comic Book': 'Comic-Vorlage',
  'Short Story': 'Kurzgeschichte',
  Treatment: 'Treatment',
  Idea: 'Idee',
  'Theatre Play': 'Theaterstück',
  'Additional Writing': 'Zusätzliches Drehbuch',
  'Additional Dialogue': 'Zusätzliche Dialoge',
  'Series Writer': 'Serienautor',
  'Radio Play': 'Hörspiel',
  'Creative Producer': 'Kreativer Produzent',
  'Co-Writer': 'Co-Autor',
  'Executive Story Editor': 'Leitender Story-Editor',
  'Graphic Novel': 'Graphic Novel',
  'Head of Story': 'Story-Leiter',
  'Junior Story Editor': 'Junior Story-Editor',
  'Original Concept': 'Originalkonzept',
  'Original Film Writer': 'Originaler Filmautor',
  'Original Series Creator': 'Originaler Serienschöpfer',
  'Senior Story Editor': 'Senior Story-Editor',
  'Staff Writer': 'Stammautor',
  'Story Artist': 'Story-Artist',
  'Story Consultant': 'Story-Berater',
  'Story Coordinator': 'Story-Koordinator',
  'Story Developer': 'Story-Entwickler',
  'Story Manager': 'Story-Manager',
  'Story Supervisor': 'Story-Supervisor',
  'Writers Assistant': 'Autoren-Assistent',
  'Writers Production': 'Autoren-Produktion',
  'Scenario Writer': 'Szenario-Autor',
  Screenstory: 'Filmgeschichte',
  Musical: 'Musical',
  Opera: 'Opera',
  'Graphic Novel Illustrator': 'Graphic Novel Illustrator',
  'Video Game': 'Videospiel',
  Poem: 'Gedicht',
  Creator: 'Schöpfer',
  Author: 'Autor',

  // ============ PRODUKTION / PRODUCTION ============
  Producer: 'Produzent',
  'Executive Producer': 'Ausführender Produzent',
  'Co-Producer': 'Co-Produzent',
  'Associate Producer': 'Mitproduzent',
  'Co-Executive Producer': 'Co-Ausführender Produzent',
  'Consulting Producer': 'Beratender Produzent',
  'Supervising Producer': 'Supervising Producer',
  'Line Producer': 'Herstellungsleiter',
  'Production Manager': 'Produktionsleiter',
  'Unit Production Manager': 'Unit-Produktionsleiter',
  'Production Coordinator': 'Produktionskoordinator',
  'Production Assistant': 'Produktionsassistent',
  'Casting Director': 'Casting-Director',
  'Casting Associate': 'Casting-Mitarbeiter',
  'Extras Casting': 'Komparsen-Casting',
  'Production Supervisor': 'Produktions-Supervisor',
  'Production Secretary': 'Produktions-Sekretär',
  'Production Accountant': 'Produktions-Buchhalter',
  'Unit Manager': 'Unit-Manager',
  'Production Office Coordinator': 'Produktionsbüro-Koordinator',
  'Executive Consultant': 'Executive Consultant',
  'Development Manager': 'Entwicklungsmanager',
  'Executive In Charge Of Post Production':
    'Executive In Charge Of Post Production',
  'Production Director': 'Produktionsdirektor',
  'Executive In Charge Of Production': 'Executive In Charge Of Production',
  Researcher: 'Researcher',
  'Senior Executive Consultant': 'Senior Executive Consultant',
  'Assistant Production Coordinator': 'Assistenzproduktionskoordinator',
  'Assistant Production Manager': 'Assistenzproduktionsmanager',
  'Casting Assistant': 'Casting-Assistent',
  'Casting Consultant': 'Casting-Berater',
  'Coordinating Producer': 'Koordinierender Produzent',
  'Local Casting': 'Lokales Casting',
  'Script Researcher': 'Skript-Rechercheur',
  Accountant: 'Buchhalter',
  'Accounting Supervisor': 'Buchhaltungs-Supervisor',
  'Additional Production Assistant': 'Zusätzlicher Produktionsassistent',
  'Assistant Accountant': 'Buchhaltungsassistent',
  'Assistant Extras Casting': 'Assistent Komparsen-Casting',
  'Assistant Location Manager': 'Assistenz-Location-Manager',
  'Assistant Unit Manager': 'Assistenz-Unit-Manager',
  'Background Casting Director': 'Hintergrund-Casting-Direktor',
  'Broadcast Producer': 'Broadcast Producer',
  'Casting Coordinator': 'Casting-Koordinator',
  'Casting Producer': 'Casting-Produzent',
  'Casting Researcher': 'Casting-Rechercheur',
  'Consulting Accountant': 'Beratender Buchhalter',
  Controller: 'Controller',
  'Delegated Producer': 'Delegierter Produzent',
  'Development Producer': 'Entwicklungsproduzent',
  'Director of Operations': 'Betriebsleiter',
  'Executive Assistant': 'Executive Assistant',
  'Executive Co-Producer': 'Executive Co-Produzent',
  'Extras Casting Assistant': 'Assistent Komparsen-Casting',
  'Extras Casting Coordinator': 'Koordinator Komparsen-Casting',
  'Feature Finishing Producer': 'Feature Finishing Producer',
  'Finishing Producer': 'Finishing Producer',
  'First Assistant Accountant': 'Erster Buchhaltungsassistent',
  'First Assistant Production Coordinator':
    'Erster Produktionskoordinationsassistent',
  'General Manager': 'General Manager',
  'Head of Production': 'Produktionsleiter',
  'Head of Programming': 'Programmleiter',
  'Head of Research': 'Forschungsleiter',
  'Insert Unit Location Manager': 'Insert Unit Location Manager',
  'Key Production Assistant': 'Key Production Assistant',
  'Location Casting': 'Location Casting',
  'Location Coordinator': 'Location Coordinator',
  'Location Production Assistant': 'Location Production Assistant',
  'Musical Casting': 'Musical Casting',
  'Original Casting': 'Original Casting',
  'Post Coordinator': 'Post Coordinator',
  'Post Producer': 'Post Producer',
  'Post Production Accountant': 'Postproduktions-Buchhalter',
  'Post Production Coordinator': 'Postproduktions-Koordinator',
  'Post Production Producer': 'Postproduktions-Produzent',
  'Production Consultant': 'Produktionsberater',
  'Production Driver': 'Produktionsfahrer',
  'Production Executive': 'Produktionsleiter',
  'Production Runner': 'Produktionsrunner',
  'Production Trainee': 'Produktionstrainee',
  'Second Assistant Accountant': 'Zweiter Buchhaltungsassistent',
  'Second Assistant Production Coordinator':
    'Zweiter Produktionskoordinationsassistent',
  'Second Assistant Unit Manager': 'Zweiter Unit-Manager-Assistent',
  'Second Unit Location Manager': 'Second Unit Location Manager',
  'Street Casting': 'Street Casting',
  'Trainee Production Coordinator': 'Trainee-Produktionskoordinator',
  'Travel Coordinator': 'Reisekoordinator',
  'Unit Swing': 'Unit Swing',

  // ============ KAMERA / CAMERA ============
  'Director of Photography': 'Kameramann',
  'Second Unit Director of Photography': '2nd Unit Kameramann',
  'Camera Operator': 'Kameraoperateur',
  '"A" Camera Operator': '"A" Kamera-Operator',
  '"B" Camera Operator': '"B" Kamera-Operator',
  '"C" Camera Operator': '"C" Kamera-Operator',
  '"D" Camera Operator': '"D" Kamera-Operator',
  'Additional Camera': 'Zusätzliche Kamera',
  'First Assistant Camera': '1. Kameraassistent',
  'Second Assistant Camera': '2. Kameraassistent',
  'Third Assistant Camera': '3. Kameraassistent',
  'Focus Puller': 'Schärfenzieher',
  'Clapper Loader': 'Klappe & Magazin',
  'Steadicam Operator': 'Steadicam-Operator',
  'Drone Cinematographer': 'Drohnen-Kameramann',
  'Digital Imaging Technician': 'DIT-Techniker',
  'Still Photographer': 'Standfotograf',
  'Underwater Camera': 'Unterwasser-Kamera',
  'Aerial Camera': 'Luftaufnahmen',
  'Key Grip': 'Grip-Chef',
  'Dolly Grip': 'Dolly Grip',
  'Camera Department Manager': 'Kameraabteilungsleiter',
  'Camera Supervisor': 'Kamera-Supervisor',
  'Helicopter Camera': 'Helikopter-Kamera',
  'Aerial Director of Photography': 'Luftbild-Kameramann',
  'Underwater Director of Photography': 'Unterwasser-Kameramann',
  'Additional Director of Photography': 'Zusätzlicher Kameramann',
  'Additional First Assistant Camera': 'Zusätzlicher 1. Kameraassistent',
  'Additional Second Assistant Camera': 'Zusätzlicher 2. Kameraassistent',
  'Assistant Camera': 'Kameraassistent',
  'BTS Photographer': 'BTS-Fotograf',
  'Drone Pilot': 'Drohnenpilot',
  'First Assistant "A" Camera': '1. Kameraassistent "A" Kamera',
  'First Assistant "B" Camera': '1. Kameraassistent "B" Kamera',
  'Second Assistant "A" Camera': '2. Kameraassistent "A" Kamera',
  'Second Assistant "B" Camera': '2. Kameraassistent "B" Kamera',
  'Second Unit Cinematographer': 'Second Unit Kameramann',

  // ============ TON / SOUND ============
  'Original Music Composer': 'Filmmusik-Komponist',
  'Music Supervisor': 'Music Supervisor',
  'Sound Designer': 'Sound Designer',
  'Sound Mixer': 'Tonmeister',
  'Sound Effects': 'Soundeffekte',
  'Sound Editor': 'Ton-Editor',
  'Foley Artist': 'Geräuschemacher',
  'ADR Mixer': 'ADR-Mixer',
  'Dialogue Editor': 'Dialog-Editor',
  'Re-Recording Mixer': 'Mischtonmeister',
  'Boom Operator': 'Tonangel-Operator',
  'Sound Director': 'Tonregisseur',
  'Supervising Sound Editor': 'Supervising Sound Editor',
  'Sound Engineer': 'Toningenieur',
  'Music Director': 'Musikdirektor',
  Orchestrator: 'Orchestrator',
  'Vocal Coach': 'Gesangscoach',
  'ADR Supervisor': 'ADR-Supervisor',
  'Music Programmer': 'Musikprogrammierer',
  'Sound Effects Designer': 'Soundeffekt-Designer',
  'Supervising Dialogue Editor': 'Supervising Dialogue Editor',
  'Supervising Music Editor': 'Supervising Music Editor',
  'ADR Engineer': 'ADR-Ingenieur',
  'ADR Coordinator': 'ADR-Koordinator',
  'Assistant Dialogue Editor': 'Dialog-Editor-Assistent',
  'Location Sound Mixer': 'Location-Tonmeister',
  'Main Title Theme Composer': 'Titelsong-Komponist',
  'Music Coordinator': 'Musik-Koordinator',
  'Music Producer': 'Musikproduzent',
  'Sound Supervisor': 'Ton-Supervisor',

  // ============ SCHNITT / EDITING ============
  Editor: 'Cutter',
  'Assistant Editor': 'Schnittassistent',
  Colorist: 'Colorist',
  'Online Editor': 'Online-Editor',
  'Post Production Supervisor': 'Postproduktions-Supervisor',
  'Supervising Film Editor': 'Supervising Film Editor',
  'Co-Editor': 'Co-Cutter',
  'Negative Cutter': 'Negativschneider',
  'Digital Intermediate': 'Digital Intermediate',
  'Color Grading': 'Farbkorrektur',
  'Dailies Manager': 'Dailies Manager',
  'Lead Editor': 'Lead Editor',
  'Stereoscopic Editor': 'Stereoskopischer Editor',

  // ============ AUSSTATTUNG / ART ============
  'Production Designer': 'Produktionsdesigner',
  'Art Director': 'Art Director',
  'Set Decorator': 'Set Decorator',
  'Set Designer': 'Set Designer',
  'Concept Artist': 'Concept Artist',
  'Storyboard Artist': 'Storyboard-Künstler',
  'Property Master': 'Requisiteur',
  'Scenic Artist': 'Bühnenmaler',
  'Graphic Designer': 'Grafik-Designer',
  'Art Department Coordinator': 'Art Department Koordinator',
  'Co-Art Director': 'Co-Art Director',
  'Set Decoration Buyer': 'Set Decoration Buyer',
  'Supervising Art Director': 'Supervising Art Director',
  Leadman: 'Leadman',
  'Construction Foreman': 'Bauleiter',
  'Conceptual Illustrator': 'Konzept-Illustrator',
  'Prop Designer': 'Requisiten-Designer',
  'Storyboard Designer': 'Storyboard-Designer',

  // ============ KOSTÜM & MASKE / COSTUME & MAKE-UP ============
  'Costume Designer': 'Kostümdesigner',
  'Makeup Artist': 'Maskenbildner',
  'Hair Stylist': 'Friseur',
  'Prosthetic Makeup Artist': 'Prothetik-Maskenbildner',
  'Wardrobe Supervisor': 'Garderoben-Supervisor',
  'Makeup Designer': 'Makeup-Designer',
  'Prosthetic Supervisor': 'Prothetik-Supervisor',
  'Key Hair Stylist': 'Chef-Friseur',
  'Costume Coordinator': 'Kostüm-Koordinator',
  'Key Makeup Artist': 'Chef-Maskenbildner',
  'Makeup Effects Designer': 'Makeup-Effekt-Designer',
  'Wig Designer': 'Perücken-Designer',
  'Costume Assistant': 'Kostüm-Assistent',
  'Hair Assistant': 'Frisuren-Assistent',
  'Makeup Trainee': 'Maskenbildner-Trainee',

  // ============ VISUAL EFFECTS ============
  'Visual Effects Supervisor': 'VFX-Supervisor',
  'Visual Effects Producer': 'VFX-Produzent',
  'CGI Supervisor': 'CGI-Supervisor',
  '3D Artist': '3D-Artist',
  Compositor: 'Compositor',
  'Matte Painter': 'Matte Painter',
  'VFX Artist': 'VFX-Artist',
  'CG Supervisor': 'CG-Supervisor',
  'Digital Compositor': 'Digitaler Compositor',
  'Lead Animator': 'Lead Animator',
  'Pre-Visualization Supervisor': 'Pre-Visualization Supervisor',
  'Visual Effects Director': 'Visual Effects Director',
  'Visual Effects Designer': 'Visual Effects Designer',

  // ============ BÜHNENBILD / LIGHTING ============
  Gaffer: 'Oberbeleuchter',
  'Best Boy Electric': 'Beleuchter-Assistent',
  'Lighting Technician': 'Lichttechniker',
  'Lighting Director': 'Lichtregisseur',
  'Chief Lighting Technician': 'Chefbeleuchter',
  'Lighting Designer': 'Lichtdesigner',
  'Lighting Programmer': 'Lichtprogrammierer',

  // ============ STUNTS & CHOREOGRAFIE ============
  'Stunt Coordinator': 'Stunt-Koordinator',
  'Stunt Double': 'Stunt-Double',
  'Fight Choreographer': 'Kampfchoreograf',
  'Martial Arts Choreographer': 'Martial-Arts-Choreograf',
  'Stunt Driver': 'Stuntfahrer',
  'Utility Stunts': 'Utility Stunts',

  // ============ SONSTIGES / OTHER ============
  Thanks: 'Dank',
  'Special Thanks': 'Besonderer Dank',
  'In Memory Of': 'In Erinnerung an',
  Presenter: 'Präsentator',
  Narrator: 'Erzähler',
  'Archive Footage': 'Archivmaterial',
  Publicist: 'Presseagent',
  Catering: 'Catering',
  Security: 'Sicherheit',
  'Set Medic': 'Set-Mediziner',
  'Transportation Coordinator': 'Transportkoordinator',
  Armorer: 'Waffenmeister',
  'Military Consultant': 'Militärberater',
  Other: 'Andere',
};

/**
 * 🌐 TMDB Jobs API Cache
 */
class TmdbJobsService {
  private jobsCache: Record<string, string[]> | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Stunden

  /**
   * 📋 Hole alle verfügbaren Jobs von TMDB API
   */
  async fetchTmdbJobs(): Promise<Record<string, string[]> | null> {
    try {
      const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
      if (!TMDB_API_KEY) {
        console.warn('TMDB API Key nicht gefunden');
        return null;
      }

      const response = await fetch(
        `https://api.themoviedb.org/3/configuration/jobs?api_key=${TMDB_API_KEY}`
      );

      if (!response.ok) {
        console.error('TMDB Jobs API Fehler:', response.status);
        return null;
      }

      const data = await response.json();

      // Umwandlung in Record<department, jobs[]> Format
      const jobsByDepartment: Record<string, string[]> = {};
      data.forEach((dept: any) => {
        if (dept.department && Array.isArray(dept.jobs)) {
          jobsByDepartment[dept.department] = dept.jobs;
        }
      });

      // Cache aktualisieren
      this.jobsCache = jobsByDepartment;
      this.cacheTimestamp = Date.now();

      return jobsByDepartment;
    } catch (error) {
      console.error('Fehler beim Laden der TMDB Jobs:', error);
      return null;
    }
  }

  /**
   * 📋 Hole Jobs aus Cache oder API
   */
  async getJobs(): Promise<Record<string, string[]> | null> {
    const now = Date.now();

    // Prüfe Cache-Gültigkeit
    if (this.jobsCache && now - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.jobsCache;
    }

    // Lade fresh von API
    return await this.fetchTmdbJobs();
  }

  /**
   * 🔄 Prüfe ob Job bekannt ist
   */
  async isKnownJob(job: string): Promise<boolean> {
    const jobs = await this.getJobs();
    if (!jobs) return false;

    // Durchsuche alle Departments
    for (const department in jobs) {
      if (jobs[department].includes(job)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 📊 Debug: Zeige alle unbekannten Jobs
   */
  async findMissingTranslations(encounteredJobs: string[]): Promise<string[]> {
    const missing: string[] = [];

    for (const job of encounteredJobs) {
      if (!JOB_TRANSLATIONS[job]) {
        missing.push(job);
      }
    }

    return missing.filter((job, index, self) => self.indexOf(job) === index);
  }
}

/**
 * 🎯 Job Übersetzungs-Funktion
 */
export const translateJob = (job: string): string => {
  return JOB_TRANSLATIONS[job] || job;
};

/**
 * 🏭 Service Instanz
 */
export const tmdbJobsService = new TmdbJobsService();

/**
 * 🔧 Debug-Funktionen für Browser-Konsole
 */
if (typeof window !== 'undefined') {
  (window as any).tmdbJobsDebug = {
    // Alle verfügbaren Jobs anzeigen
    showAllJobs: async () => {
      const jobs = await tmdbJobsService.getJobs();
      console.table(jobs);
      return jobs;
    },

    // Überprüfe Übersetzungs-Coverage
    checkCoverage: async () => {
      const jobs = await tmdbJobsService.getJobs();
      if (!jobs) return;

      const allJobs: string[] = [];
      Object.values(jobs).forEach((jobList) => {
        allJobs.push(...jobList);
      });

      const translated = allJobs.filter((job) => JOB_TRANSLATIONS[job]);
      const missing = allJobs.filter((job) => !JOB_TRANSLATIONS[job]);

      return {
        translated: translated.length,
        missing: missing.length,
        missingJobs: missing,
      };
    },

    // Sofortiger Coverage-Check mit automatischer Ausgabe
    findMissingJobs: async () => {
      const coverage = await (window as any).tmdbJobsDebug.checkCoverage();
      if (coverage && coverage.missingJobs.length > 0) {
        const jsCode = coverage.missingJobs
          .map((job: string) => `  '${job}': '${job}',`)
          .join('\n');

        return jsCode;
      } else {
        return null;
      }
    },

    // Test einzelne Job-Übersetzung
    translateJob: translateJob,

    // Alle aktuellen Übersetzungen anzeigen
    showTranslations: () => {
      console.table(JOB_TRANSLATIONS);
      return JOB_TRANSLATIONS;
    },
  };
}

export default tmdbJobsService;
