'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Camera, Video, Mic, MapPin, Loader2, X, Sparkles } from 'lucide-react';
import { incidentStorage } from '@/lib/storage';
import { detectIncidentFromImage, fileToBase64 } from '@/lib/aiVision';

const INCIDENT_TYPES = {
  URGENCE_VITALE: {
    label: 'Urgence vitale',
    sousTypes: [
      'ACCIDENT_ROUTIER',
      'INCENDIE',
      'INONDATION',
      'SEISME',
      'BLESSURE',
      'AUTRE_URGENCE',
    ],
  },
  PROBLEME_CIVIL: {
    label: 'Problème civil',
    sousTypes: [
      'FEU_ROUGE_CASSE',
      'PANNEAU_SIGNALISATION',
      'NID_DE_POULE',
      'ECLAIRAGE_PUBLIC',
      'DECHETS_ABANDONNES',
      'PLAQUE_EGOUT',
      'ARBRE_MENACANT',
      'FUITEAU',
      'ANIMAL_DANGEREUX',
      'AUTRE_PROBLEME',
    ],
  },
};

export default function NewIncidentPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [formData, setFormData] = useState({
    type: 'URGENCE_VITALE' as 'URGENCE_VITALE' | 'PROBLEME_CIVIL',
    sousType: 'ACCIDENT_ROUTIER',
    latitude: 36.8065,
    longitude: 10.1815,
    adresse: '',
    description: '',
    nombreVictimes: 0,
    niveauDanger: 1,
  });
  const [attachments, setAttachments] = useState<Array<{ file: File; preview: string; type: 'image' | 'video' | 'audio' }>>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
    // Automatische GPS-Lokalisierung beim Laden
    getCurrentLocation();
  }, [isAuthenticated, loading, router]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setGettingLocation(false);
        toast.success('Localisation obtenue avec succès');
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        toast.error('Impossible d\'obtenir votre localisation');
        setGettingLocation(false);
      }
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'nombreVictimes' || name === 'niveauDanger' ? parseInt(value) || 0 : value,
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      const fileType = file.type.split('/')[0];
      if (!['image', 'video', 'audio'].includes(fileType)) {
        toast.error(`Type de fichier non supporté: ${file.name}`);
        continue;
      }

      // Limite de taille: 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Fichier trop volumineux: ${file.name} (max 10MB)`);
        continue;
      }

      const preview = fileType === 'image'
        ? URL.createObjectURL(file)
        : fileType === 'video'
          ? URL.createObjectURL(file)
          : '';

      setAttachments(prev => [...prev, { file, preview, type: fileType as 'image' | 'video' | 'audio' }]);

      // AI-Vision: Wenn es ein Bild ist, analysiere es automatisch
      if (fileType === 'image') {
        setAiProcessing(true);
        try {
          const detection = await detectIncidentFromImage(file);
          if (detection.type !== 'UNKNOWN' && detection.confidence > 0.6) {
            toast.success(`Incident détecté: ${detection.sousType} (${Math.round(detection.confidence * 100)}% de confiance)`, {
              icon: '🤖',
            });
            setFormData(prev => ({
              ...prev,
              type: detection.type as "URGENCE_VITALE" | "PROBLEME_CIVIL",
              sousType: detection.sousType,
              description: prev.description || detection.description,
            }));
          }
        } catch (error) {
          console.error("Erreur lors de l'analyse AI:", error);
        } finally {
          setAiProcessing(false);
        }
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      if (newAttachments[index].preview) {
        URL.revokeObjectURL(newAttachments[index].preview);
      }
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      toast.error('Veuillez fournir une description');
      return;
    }

    setSubmitting(true);

    try {
      // Konvertiere Anhänge zu Base64
      const piecesJointes: string[] = [];
      for (const attachment of attachments) {
        const base64 = await fileToBase64(attachment.file);
        piecesJointes.push(base64);
      }

      // Erstelle den Incident
      const newIncident = incidentStorage.create({
        type: formData.type,
        sousType: formData.sousType,
        latitude: formData.latitude,
        longitude: formData.longitude,
        adresse: formData.adresse || undefined,
        description: formData.description,
        nombreVictimes: formData.type === 'URGENCE_VITALE' ? formData.nombreVictimes : undefined,
        niveauDanger: formData.type === 'URGENCE_VITALE' ? formData.niveauDanger : undefined,
        utilisateurId: user?.id?.toString(),
        piecesJointes: piecesJointes.length > 0 ? piecesJointes : undefined,
      });

      toast.success('Incident signalé avec succès!');

      // Simuliere Status-Updates (nach 2 Sekunden: "Secours en route")
      setTimeout(() => {
        incidentStorage.updateStatus(newIncident.id, 'SECOURS_EN_ROUTE');
        toast('Statut mis à jour: Secours en route', { duration: 5000, icon: 'ℹ️' });
      }, 2000);

      router.push('/incidents');
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création de l\'incident');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Signaler un incident</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* AI-Vision Button */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">
                  Détection automatique par IA
                </span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={aiProcessing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium flex items-center space-x-2"
              >
                {aiProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyse en cours...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Prendre une photo</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Prenez une photo et l&apos;IA remplira automatiquement le formulaire
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos, vidéos ou audio
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors flex items-center justify-center space-x-2"
              >
                <Camera className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Photo</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors flex items-center justify-center space-x-2"
              >
                <Video className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Vidéo</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors flex items-center justify-center space-x-2"
              >
                <Mic className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Audio</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {attachments.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {attachments.map((attachment, index) => (
                  <div key={index} className="relative">
                    {attachment.type === 'image' && (
                      <div className="relative w-full h-24">
                        <Image
                          src={attachment.preview}
                          alt={`Attachment ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                          unoptimized
                        />
                      </div>
                    )}
                    {attachment.type === 'video' && (
                      <video
                        src={attachment.preview}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    )}
                    {attachment.type === 'audio' && (
                      <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Mic className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Type d&apos;incident *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {Object.entries(INCIDENT_TYPES).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sousType" className="block text-sm font-medium text-gray-700 mb-2">
              Sous-type *
            </label>
            <select
              id="sousType"
              name="sousType"
              value={formData.sousType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {INCIDENT_TYPES[formData.type].sousTypes.map((st) => (
                <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Décrivez l&apos;incident en détail..."
            />
          </div>

          {/* GPS Location */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Localisation GPS
              </label>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1 disabled:opacity-50"
              >
                {gettingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Obtention...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span>Obtenir ma position</span>
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Latitude"
                />
              </div>
              <div>
                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Longitude"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="adresse" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            <input
              id="adresse"
              name="adresse"
              type="text"
              value={formData.adresse}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Adresse de l&apos;incident"
            />
          </div>

          {formData.type === 'URGENCE_VITALE' && (
            <>
              <div>
                <label htmlFor="nombreVictimes" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de victimes
                </label>
                <input
                  id="nombreVictimes"
                  name="nombreVictimes"
                  type="number"
                  min="0"
                  value={formData.nombreVictimes}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="niveauDanger" className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau de danger (1-5)
                </label>
                <input
                  id="niveauDanger"
                  name="niveauDanger"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.niveauDanger}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Envoi...' : "Signaler l'incident"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
