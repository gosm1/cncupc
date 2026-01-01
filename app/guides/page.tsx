'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { BookOpen, Shield, AlertTriangle, Heart } from 'lucide-react';
import { guideStorage, initializeStorage } from '@/lib/storage';

export default function GuidesPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [guides, setGuides] = useState<any[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<any | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const loadGuides = useCallback(() => {
    try {
      const allGuides = guideStorage.getAll();
      setGuides(allGuides);
    } catch (error) {
      console.error('Erreur lors du chargement des guides:', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // Initialisiere Storage beim ersten Laden
      initializeStorage();
      loadGuides();
    }
  }, [isAuthenticated, loadGuides]);

  const getCategoryIcon = (categorie: string) => {
    switch (categorie) {
      case 'INCENDIE':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'SEISME':
        return <Shield className="w-6 h-6 text-orange-600" />;
      case 'PREMIERS_SECOURS':
        return <Heart className="w-6 h-6 text-red-600" />;
      default:
        return <BookOpen className="w-6 h-6 text-blue-600" />;
    }
  };

  const getCategoryColor = (categorie: string) => {
    switch (categorie) {
      case 'INCENDIE':
        return 'bg-red-50 border-red-200';
      case 'SEISME':
        return 'bg-orange-50 border-orange-200';
      case 'PREMIERS_SECOURS':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BookOpen className="w-8 h-8 mr-3" />
            Guides de prévention et premiers secours
          </h1>
          <p className="mt-2 text-gray-600">Consultez les guides pour savoir comment réagir en cas d&apos;urgence</p>
        </div>

        {selectedGuide ? (
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={() => setSelectedGuide(null)}
              className="mb-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Retour aux guides
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedGuide.titre}</h2>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                {selectedGuide.contenu}
              </pre>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Catégorie: {selectedGuide.categorie.replace(/_/g, ' ')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun guide disponible pour le moment</p>
              </div>
            ) : (
              guides.map((guide) => (
                <div
                  key={guide.id}
                  onClick={() => setSelectedGuide(guide)}
                  className={`${getCategoryColor(guide.categorie)} border-2 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getCategoryIcon(guide.categorie)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {guide.titre}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {guide.contenu.substring(0, 100)}...
                      </p>
                      <span className="text-xs text-gray-500">
                        {guide.categorie.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

