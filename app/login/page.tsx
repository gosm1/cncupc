'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { LogIn, Mail, Lock, User } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [nomComplet, setNomComplet] = useState('');
  const [role, setRole] = useState<'CITIZEN' | 'SUPER_ADMIN' | 'REGIONAL_ADMIN'>('CITIZEN');
  const [region, setRegion] = useState('Casablanca-Settat');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!nomComplet.trim()) {
        toast.error('Veuillez entrer votre nom');
        setLoading(false);
        return;
      }
      
      login(nomComplet.trim(), role, role === 'REGIONAL_ADMIN' ? region : undefined);
      toast.success('Connexion réussie!');
      if (role === 'SUPER_ADMIN' || role === 'REGIONAL_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-red-50 px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative w-24 h-24">
              <Image
                src="/assets/logo.png"
                alt="Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Coordination des Urgences
          </h1>
          <p className="text-gray-600">Connectez-vous pour signaler une urgence</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion</h2>
            <p className="text-sm text-gray-600">Entrez vos informations pour continuer</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="nomComplet" className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Votre nom complet
              </label>
              <input
                id="nomComplet"
                type="text"
                value={nomComplet}
                onChange={(e) => setNomComplet(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-gray-900 placeholder-gray-400"
                placeholder="Ex: Ahmed Benali"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                Type de compte
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-gray-900"
              >
                <option value="CITIZEN">Citoyen</option>
                <option value="SUPER_ADMIN">Super Administrateur</option>
                <option value="REGIONAL_ADMIN">Administrateur Régional</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Sélectionnez votre type de compte pour accéder aux fonctionnalités appropriées
              </p>
            </div>

            {role === 'REGIONAL_ADMIN' && (
              <div>
                <label htmlFor="region" className="block text-sm font-semibold text-gray-700 mb-2">
                  Région
                </label>
                <select
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-gray-900"
                >
                  {['Casablanca-Settat', 'Rabat-Salé-Kénitra', 'Tanger-Tétouan-Al Hoceïma', 'Fès-Meknès', 'Marrakech-Safi', 'Oriental', 'Béni Mellal-Khénifra', 'Souss-Massa', 'Drâa-Tafilalet', 'Laâyoune-Sakia El Hamra', 'Dakhla-Oued Ed-Dahab', 'Guelmim-Oued Noun'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <LogIn className="w-5 h-5 mr-2" />
                  Se connecter
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Pas encore de compte?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          © 2024 Centre National de Coordination des Urgences
        </p>
      </div>
    </div>
  );
}
