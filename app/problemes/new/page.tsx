'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Camera, Video, Mic, MapPin, Loader2, X, Sparkles, TrafficCone, AlertTriangle, CircleDot, Lightbulb, Trash2, Trees, Droplets, PawPrint, HelpCircle } from 'lucide-react';
import { incidentStorage } from '@/lib/storage';
import { detectIncidentFromImage, fileToBase64 } from '@/lib/aiVision';

const PROBLEME_TYPES = {
  'FEU_ROUGE_CASSE': { icon: TrafficCone, label: 'Feu rouge cassé' },
  'PANNEAU_SIGNALISATION': { icon: AlertTriangle, label: 'Panneau signalisation' },
  'NID_DE_POULE': { icon: CircleDot, label: 'Nid de poule' },
  'ECLAIRAGE_PUBLIC': { icon: Lightbulb, label: 'Éclairage public' },
  'DECHETS_ABANDONNES': { icon: Trash2, label: 'Déchets abandonnés' },
  'PLAQUE_EGOUT': { icon: CircleDot, label: "Plaque d'égout" },
  'ARBRE_MENACANT': { icon: Trees, label: 'Arbre menaçant' },
  'FUITEAU': { icon: Droplets, label: "Fuite d'eau" },
  'ANIMAL_DANGEREUX': { icon: PawPrint, label: 'Animal dangereux' },
  'AUTRE_PROBLEME': { icon: HelpCircle, label: 'Autre problème' },
};

export default function NewProblemePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [formData, setFormData] = useState({
    sousType: '',
    latitude: 33.5731,
    longitude: -7.5898,
    adresse: '',
    description: '',
  });
  const [attachments, setAttachments] = useState<Array<{ file: File; preview: string; type: 'image' | 'video' | 'audio' }>>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
    getCurrentLocation();
  }, [isAuthenticated, loading, router]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setGettingLocation(false);
      },
      () => setGettingLocation(false)
    );
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const fileType = file.type.split('/')[0];
      if (!['image', 'video', 'audio'].includes(fileType)) continue;
      if (file.size > 10 * 1024 * 1024) continue;

      const preview = fileType === 'image' || fileType === 'video' ? URL.createObjectURL(file) : '';
      setAttachments(prev => [...prev, { file, preview, type: fileType as 'image' | 'video' | 'audio' }]);

      if (fileType === 'image') {
        setAiProcessing(true);
        try {
          const detection = await detectIncidentFromImage(file);
          if (detection.type === 'PROBLEME_CIVIL' && detection.confidence > 0.6) {
            setFormData(prev => ({
              ...prev,
              sousType: detection.sousType,
              description: prev.description || detection.description,
            }));
            toast.success(`Problème détecté: ${detection.sousType}`);
          }
        } catch (error) {
          console.error('Erreur AI:', error);
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

    if (!formData.sousType) {
      toast.error('Veuillez sélectionner un type de problème');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Veuillez fournir une description');
      return;
    }

    setSubmitting(true);
    try {
      const piecesJointes: string[] = [];
      for (const attachment of attachments) {
        const base64 = await fileToBase64(attachment.file);
        piecesJointes.push(base64);
      }

      // Déterminer la région basée sur les coordonnées (simplifié - Casablanca par défaut)
      const region = 'Casablanca-Settat'; // En production, utiliser une API de géocodage inverse

      const newIncident = incidentStorage.create({
        type: 'PROBLEME_CIVIL',
        sousType: formData.sousType,
        latitude: formData.latitude,
        longitude: formData.longitude,
        adresse: formData.adresse || undefined,
        description: formData.description,
        utilisateurId: user?.id?.toString(),
        piecesJointes: piecesJointes.length > 0 ? piecesJointes : undefined,
        region: region,
      });

      toast.success("Problème signalé avec succès!");
      router.push('/incidents');
    } catch (error) {
      toast.error('Erreur lors de la création');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Signaler un problème civil</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* AI Vision */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Détection automatique par IA</span>
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
                    <span>Analyse...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Prendre une photo</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de problème *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(PROBLEME_TYPES).map(([key, { icon: Icon, label }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, sousType: key }))}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center group ${formData.sousType === key
                    ? 'bg-[#0E5035] text-white border-transparent shadow-lg scale-105'
                    : 'bg-white border-gray-200 text-black hover:border-[#0E5035] hover:text-[#0E5035] hover:bg-green-50'
                    }`}
                >
                  <Icon className={`w-8 h-8 mb-2 transition-colors ${formData.sousType === key ? 'text-white' : 'text-black group-hover:text-[#0E5035]'
                    }`} />
                  <div className="text-sm font-medium">{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos, vidéos ou audio
            </label>
            <div className="flex space-x-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors flex items-center justify-center space-x-2">
                <Camera className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Photo</span>
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors flex items-center justify-center space-x-2">
                <Video className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Vidéo</span>
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors flex items-center justify-center space-x-2">
                <Mic className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Audio</span>
              </button>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,audio/*" onChange={handleFileSelect} className="hidden" />

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
                    {attachment.type === 'video' && <video src={attachment.preview} className="w-full h-24 object-cover rounded-lg" />}
                    {attachment.type === 'audio' && <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center"><Mic className="w-8 h-8 text-gray-400" /></div>}
                    <button type="button" onClick={() => removeAttachment(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              placeholder="Décrivez le problème en détail..."
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localisation
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={`${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}`}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {gettingLocation ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                <span>GPS</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="adresse" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse complète
            </label>
            <input
              id="adresse"
              type="text"
              value={formData.adresse}
              onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              placeholder="Ex: Rue Mohammed V, Casablanca"
            />
          </div>

          <div className="flex space-x-4">
            <button type="button" onClick={() => router.back()} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {submitting ? 'Envoi...' : 'Signaler le problème'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

