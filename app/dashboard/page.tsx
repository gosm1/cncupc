'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { AlertCircle, MapPin, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { incidentStorage, alertStorage } from '@/lib/storage';

interface Incident {
  id: string;
  type: string;
  sousType: string;
  latitude: number;
  longitude: number;
  description: string;
  statut: string;
  dateCreation: string;
}

interface Alert {
  id: string;
  titre: string;
  message: string;
  niveau: string;
  actif: boolean;
}

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState({
    totalIncidents: 0,
    activeIncidents: 0,
    myIncidents: 0,
  });

  const loadData = useCallback(() => {
    try {
      const allIncidents = incidentStorage.getAll();
      const alertsData = alertStorage.getAll(true);

      // Filtere nach Benutzer, wenn Citizen
      const myIncidents = user?.role === 'CITIZEN' && user.id
        ? incidentStorage.getByUserId(user.id.toString())
        : [];

      setIncidents(allIncidents.slice(0, 5) as unknown as Incident[]);
      setAlerts(alertsData.slice(0, 3) as unknown as Alert[]);
      setStats({
        totalIncidents: allIncidents.length,
        activeIncidents: allIncidents.filter(i => i.statut !== 'RESOLU').length,
        myIncidents: myIncidents.length,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
    }
  }, [isAuthenticated, user, loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="mt-2 text-gray-600">
            Bienvenue, {user?.nomComplet}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Incidents actifs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeIncidents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total incidents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalIncidents}</p>
              </div>
            </div>
          </div>

          {user?.role === 'CITIZEN' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Mes signalements</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.myIncidents}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/urgences/new"
              className="flex items-center p-4 border-2 border-dashed border-red-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
            >
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Signaler une urgence vitale</p>
                <p className="text-sm text-gray-500">Accident, incendie, blessure...</p>
              </div>
            </Link>
            <Link
              href="/problemes/new"
              className="flex items-center p-4 border-2 border-dashed border-yellow-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
            >
              <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Signaler un problème civil</p>
                <p className="text-sm text-gray-500">Feu rouge, nid de poule, éclairage...</p>
              </div>
            </Link>
            <Link
              href="/map"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <MapPin className="w-6 h-6 text-primary-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Voir la carte</p>
                <p className="text-sm text-gray-500">Visualiser les incidents sur la carte</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Incidents récents</h2>
              <Link href="/incidents" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Voir tout
              </Link>
            </div>
          </div>
          <div className="p-6">
            {incidents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun incident récent</p>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      <AlertCircle className={`w-6 h-6 ${incident.type === 'URGENCE_VITALE' ? 'text-red-600' : 'text-yellow-600'
                        }`} />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium text-gray-900">{incident.sousType}</p>
                        <span className={`px-2 py-1 text-xs rounded ${incident.statut === 'ALERTE_RECUE' ? 'bg-yellow-100 text-yellow-800' :
                          incident.statut === 'SECOURS_EN_ROUTE' ? 'bg-blue-100 text-blue-800' :
                            incident.statut === 'RESOLU' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {incident.statut}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(incident.dateCreation).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Alertes actives</h2>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-white rounded-lg p-4 border border-yellow-300">
                  <p className="font-medium text-gray-900">{alert.titre}</p>
                  <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

