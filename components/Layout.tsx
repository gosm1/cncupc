'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Home, AlertCircle, Bell, User, Map, Clock, BookOpen } from 'lucide-react';
import Image from 'next/image';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'REGIONAL_ADMIN';
  const isCitizen = user?.role === 'CITIZEN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isRegionalAdmin = user?.role === 'REGIONAL_ADMIN';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-3 px-2 py-2">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <Image
                    src="/assets/logo.png"
                    alt="Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                
              </Link>
              <div className="hidden md:ml-6 md:flex md:space-x-6">
                <Link
                  href="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    pathname === '/dashboard'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Tableau de bord
                </Link>
                
                {/* Links für Admins */}
                {isAdmin && (
                  <>
                    <Link
                      href="/incidents"
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        pathname === '/incidents'
                          ? 'text-primary-600 border-b-2 border-primary-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Incidents
                    </Link>
                    <Link
                      href="/admin"
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        pathname === '/admin'
                          ? 'text-primary-600 border-b-2 border-primary-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Administration
                    </Link>
                  </>
                )}

                {/* Links für Citoyens */}
                {isCitizen && (
                  <>
                    <Link
                      href="/urgences/new"
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        pathname === '/urgences/new'
                          ? 'text-red-600 border-b-2 border-red-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      🚨 Urgence
                    </Link>
                    <Link
                      href="/problemes/new"
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        pathname === '/problemes/new'
                          ? 'text-yellow-600 border-b-2 border-yellow-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      ⚠️ Problème
                    </Link>
                    <Link
                      href="/historique"
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        pathname === '/historique'
                          ? 'text-primary-600 border-b-2 border-primary-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Historique
                    </Link>
                  </>
                )}

                {/* Links communs */}
                <Link
                  href="/map"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    pathname === '/map'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Map className="w-4 h-4 mr-2" />
                  Carte
                </Link>
                <Link
                  href="/notifications"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    pathname === '/notifications'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Alertes
                </Link>
                <Link
                  href="/guides"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    pathname === '/guides'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Guides
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user?.nomComplet}</span>
                <span className="ml-2 text-xs text-gray-500">({user?.role})</span>
              </div>
              <Link
                href="/profile"
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <User className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

