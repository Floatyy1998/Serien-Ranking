import { useEffect, useState } from 'react';

export interface PrivacyData {
  title: string;
  lastUpdated: string;
  sections: {
    responsible: {
      title: string;
      text: string;
      name: string;
      address: string;
      city: string;
      email: string;
    };
    dataCollection: {
      title: string;
      subsections: {
        localData: {
          title: string;
          text: string;
        };
        noTracking: {
          title: string;
          text: string;
        };
      };
    };
    firebase: {
      title: string;
      intro: string;
      services: {
        auth: FirebaseService;
        database: FirebaseService;
        storage: FirebaseService;
        hosting: FirebaseService;
      };
      privacyLink: string;
      privacyUrl: string;
    };
    apiServices: {
      title: string;
      intro: string;
      services: Array<{
        name: string;
        purpose: string;
      }>;
      note: string;
    };
    rights: {
      title: string;
      intro: string;
      list: string[];
    };
    deletion: {
      title: string;
      text: string;
    };
    security: {
      title: string;
      text: string;
    };
    changes: {
      title: string;
      text: string;
    };
    contact: {
      title: string;
      text: string;
      email: string;
    };
  };
}

export interface FirebaseService {
  title: string;
  purpose: string;
  data: string[];
}

export const usePrivacyData = () => {
  const [data, setData] = useState<PrivacyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/legal/privacy.json')
      .then((res) => res.json())
      .then(setData)
      .catch(() => {
        console.error('Legal content file not found');
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
};
