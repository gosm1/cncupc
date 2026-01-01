'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Bell, AlertTriangle, Info } from 'lucide-react';
import { alertStorage } from '@/lib/storage';

interface Alert {
  id: number;
  titre: string;
  message: string;
  niveau: string;
  actif: boolean;
  dateCreation?: string;
}

export default function NotificationsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const loadAlerts = useCallback(() => {
    setLoadingAlerts(true);
    try {
      const alertsData = alertStorage.getAll(true);
      setAlerts(alertsData as unknown as Alert[]);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAlerts();
    }
  }, [isAuthenticated, loadAlerts]);

  const getLevelColor = (niveau: string) => {
    switch (niveau) {
      case 'CRITIQUE':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'ELEVE':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MOYEN':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getLevelIcon = (niveau: string) => {
    if (niveau === 'CRITIQUE' || niveau === 'ELEVE') {
      return <AlertTriangle className="w-6 h-6" />;
    }
    return <Info className="w-6 h-6" />;
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
          <h1 className="text-3xl font-bold text-gray-900">Alertes officielles</h1>
          <p className="mt-2 text-gray-600">Consultez les alertes et guides de prévention</p>
        </div>

        {loadingAlerts ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucune alerte active</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-lg shadow border-2 p-6 ${getLevelColor(alert.niveau)}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {getLevelIcon(alert.niveau)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold">{alert.titre}</h3>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/50">
                        {alert.niveau}
                      </span>
                    </div>
                    <p className="text-sm opacity-90">{alert.message}</p>
                    {alert.dateCreation && (
                      <p className="text-xs opacity-75 mt-2">
                        {new Date(alert.dateCreation).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

