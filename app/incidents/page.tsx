'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { AlertCircle, Plus, MapPin } from 'lucide-react';
import Link from 'next/link';
import { incidentStorage } from '@/lib/storage';

interface Incident {
  id: string;
  type: string;
  sousType: string;
  latitude: number;
  longitude: number;
  adresse?: string;
  description: string;
  statut: string;
  dateCreation: string;
  niveauDanger?: number;
}

export default function IncidentsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'URGENCE_VITALE' | 'PROBLEME_CIVIL'>('ALL');
  const [loadingIncidents, setLoadingIncidents] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const loadIncidents = useCallback(() => {
    setLoadingIncidents(true);
    try {
      let allIncidents = incidentStorage.getAll();

      // Filter nach Typ
      if (filter !== 'ALL') {
        allIncidents = allIncidents.filter(i => i.type === filter);
      }

      // Sortiere nach Datum (neueste zuerst)
      allIncidents.sort((a, b) =>
        new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
      );

      setIncidents(allIncidents as unknown as Incident[]);
    } catch (error) {
      console.error('Erreur lors du chargement des incidents:', error);
    } finally {
      setLoadingIncidents(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isAuthenticated) {
      loadIncidents();
    }
  }, [isAuthenticated, loadIncidents]);

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Incidents</h1>
            <p className="mt-2 text-gray-600">Gérer et suivre les signalements</p>
          </div>
          <div className="flex space-x-2">
            <Link
              href="/urgences/new"
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Urgence vitale
            </Link>
            <Link
              href="/problemes/new"
              className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Problème civil
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'ALL'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter('URGENCE_VITALE')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'URGENCE_VITALE'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Urgences vitales
            </button>
            <button
              onClick={() => setFilter('PROBLEME_CIVIL')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'PROBLEME_CIVIL'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Problèmes civils
            </button>
          </div>
        </div>

        {/* Incidents List */}
        <div className="bg-white rounded-lg shadow">
          {loadingIncidents ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : incidents.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun incident trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/incidents/${incident.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${incident.type === 'URGENCE_VITALE' ? 'bg-red-100' : 'bg-yellow-100'
                          }`}>
                          <AlertCircle className={`w-5 h-5 ${incident.type === 'URGENCE_VITALE' ? 'text-red-600' : 'text-yellow-600'
                            }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{incident.sousType}</h3>
                          <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                        {incident.adresse && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {incident.adresse}
                          </div>
                        )}
                        <span>{new Date(incident.dateCreation).toLocaleString('fr-FR')}</span>
                        {incident.niveauDanger && (
                          <span className="text-red-600 font-medium">
                            Danger: {incident.niveauDanger}/5
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${incident.statut === 'ALERTE_RECUE' ? 'bg-yellow-100 text-yellow-800' :
                        incident.statut === 'SECOURS_EN_ROUTE' ? 'bg-blue-100 text-blue-800' :
                          incident.statut === 'RESOLU' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {incident.statut}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

