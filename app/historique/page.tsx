'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { AlertCircle, MapPin, Clock, Filter } from 'lucide-react';
import { incidentStorage } from '@/lib/storage';
import Link from 'next/link';

export default function HistoriquePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'URGENCE_VITALE' | 'PROBLEME_CIVIL'>('ALL');
  const [statutFilter, setStatutFilter] = useState<'ALL' | 'ALERTE_RECUE' | 'SECOURS_EN_ROUTE' | 'EN_COURS' | 'RESOLU'>('ALL');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const loadIncidents = useCallback(() => {
    try {
      let userIncidents = user?.id
        ? incidentStorage.getByUserId(user.id.toString())
        : [];

      // Filter nach Typ
      if (filter !== 'ALL') {
        userIncidents = userIncidents.filter(i => i.type === filter);
      }

      // Filter nach Statut
      if (statutFilter !== 'ALL') {
        userIncidents = userIncidents.filter(i => i.statut === statutFilter);
      }

      // Sortiere nach Datum (neueste zuerst)
      userIncidents.sort((a, b) =>
        new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
      );

      setIncidents(userIncidents);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
  }, [user, filter, statutFilter]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadIncidents();
    }
  }, [isAuthenticated, user, loadIncidents]);

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'ALERTE_RECUE':
        return 'bg-yellow-100 text-yellow-800';
      case 'SECOURS_EN_ROUTE':
        return 'bg-blue-100 text-blue-800';
      case 'EN_COURS':
        return 'bg-purple-100 text-purple-800';
      case 'RESOLU':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold text-gray-900">Historique des signalements</h1>
          <p className="mt-2 text-gray-600">Consultez tous vos signalements précédents</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Type:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="ALL">Tous</option>
                <option value="URGENCE_VITALE">Urgences vitales</option>
                <option value="PROBLEME_CIVIL">Problèmes civils</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Statut:</span>
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="ALL">Tous</option>
                <option value="ALERTE_RECUE">Alerte reçue</option>
                <option value="SECOURS_EN_ROUTE">Secours en route</option>
                <option value="EN_COURS">En cours</option>
                <option value="RESOLU">Résolu</option>
              </select>
            </div>
          </div>
        </div>

        {/* Incidents List */}
        <div className="bg-white rounded-lg shadow">
          {incidents.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun signalement dans votre historique</p>
              <Link
                href="/incidents/new"
                className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium"
              >
                Créer un nouveau signalement
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-lg ${incident.type === 'URGENCE_VITALE' ? 'bg-red-100' : 'bg-yellow-100'
                          }`}>
                          <AlertCircle className={`w-5 h-5 ${incident.type === 'URGENCE_VITALE' ? 'text-red-600' : 'text-yellow-600'
                            }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{incident.sousType.replace(/_/g, ' ')}</h3>
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
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(incident.dateCreation).toLocaleString('fr-FR')}
                        </div>
                        {incident.niveauDanger && (
                          <span className="text-red-600 font-medium">
                            Danger: {incident.niveauDanger}/5
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatutColor(incident.statut)}`}>
                        {incident.statut.replace(/_/g, ' ')}
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

