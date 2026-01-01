// AI Vision Modul für automatische Incident-Erkennung aus Fotos

export interface AIDetectionResult {
  type: 'URGENCE_VITALE' | 'PROBLEME_CIVIL' | 'UNKNOWN';
  sousType: string;
  confidence: number;
  description: string;
}

// Mock AI Vision - In einer echten Implementierung würde dies eine echte ML-API aufrufen
export const detectIncidentFromImage = async (imageFile: File): Promise<AIDetectionResult> => {
  // Simuliere eine API-Anfrage
  await new Promise(resolve => setTimeout(resolve, 1500));

  // In einer echten Implementierung würde hier ein ML-Modell das Bild analysieren
  // Für jetzt verwenden wir einfache Heuristiken basierend auf Dateinamen und Größe
  
  const fileName = imageFile.name.toLowerCase();
  const fileSize = imageFile.size;

  // Einfache Erkennungslogik (Mock)
  if (fileName.includes('fire') || fileName.includes('incendie') || fileName.includes('flamme')) {
    return {
      type: 'URGENCE_VITALE',
      sousType: 'INCENDIE',
      confidence: 0.85,
      description: 'Incendie détecté sur l\'image',
    };
  }

  if (fileName.includes('accident') || fileName.includes('crash') || fileName.includes('voiture')) {
    return {
      type: 'URGENCE_VITALE',
      sousType: 'ACCIDENT_ROUTIER',
      confidence: 0.80,
      description: 'Accident de la route détecté',
    };
  }

  if (fileName.includes('blessure') || fileName.includes('person') || fileName.includes('sol')) {
    return {
      type: 'URGENCE_VITALE',
      sousType: 'BLESSURE',
      confidence: 0.75,
      description: 'Personne blessée ou au sol détectée',
    };
  }

  if (fileName.includes('trou') || fileName.includes('hole') || fileName.includes('route')) {
    return {
      type: 'PROBLEME_CIVIL',
      sousType: 'NID_DE_POULE',
      confidence: 0.70,
      description: 'Trou dans la route détecté',
    };
  }

  if (fileName.includes('feu') && fileName.includes('rouge')) {
    return {
      type: 'PROBLEME_CIVIL',
      sousType: 'FEU_ROUGE_CASSE',
      confidence: 0.75,
      description: 'Feu rouge cassé détecté',
    };
  }

  if (fileName.includes('panneau') || fileName.includes('signalisation')) {
    return {
      type: 'PROBLEME_CIVIL',
      sousType: 'PANNEAU_SIGNALISATION',
      confidence: 0.65,
      description: 'Panneau de signalisation manquant ou endommagé',
    };
  }

  // Fallback: Unbekannt
  return {
    type: 'UNKNOWN',
    sousType: 'AUTRE',
    confidence: 0.30,
    description: 'Type d\'incident non identifié automatiquement. Veuillez sélectionner manuellement.',
  };
};

// Hilfsfunktion zum Konvertieren von File zu Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

