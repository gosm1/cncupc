'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import dynamic from 'next/dynamic';
import { AlertCircle } from 'lucide-react';
import { incidentStorage } from '@/lib/storage';

// Dynamically import Map component to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/IncidentMap'), {
  ssr: false,
  loading: () => <div className="h-[600px] bg-gray-200 animate-pulse rounded-lg" />,
});

interface Incident {
  id: number;
  type: string;
  sousType: string;
  latitude: number;
  longitude: number;
  description: string;
  statut: string;
}

export default function MapPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const loadIncidents = useCallback(() => {
    setLoadingIncidents(true);
    try {
      const allIncidents = incidentStorage.getAll();
      setIncidents(allIncidents as unknown as Incident[]);
    } catch (error) {
      console.error('Error loading incidents:', error);
    } finally {
      setLoadingIncidents(false);
    }
  }, []);

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Carte des incidents</h1>
          <p className="mt-2 text-gray-600">
            {incidents.length} incident(s) affiché(s) sur la carte (Casablanca)
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span>Urgence vitale</span>
            </div>
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <span>Problème civil</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loadingIncidents ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <MapComponent incidents={incidents} />
          )}
        </div>
      </div>
    </Layout>
  );
}

