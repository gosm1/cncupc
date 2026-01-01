'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';
import { Save, Phone, MapPin, User, Bell } from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, loading, updateUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nomComplet: '',
    email: '',
    telephone: '',
    adresse: '',
    contactUrgence: '',
    telephoneUrgence: '',
    notificationsActives: true,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        nomComplet: user.nomComplet || '',
        email: user.email || '',
        telephone: user.telephone || '',
        adresse: user.adresse || '',
        contactUrgence: user.contactUrgence || '',
        telephoneUrgence: user.telephoneUrgence || '',
        notificationsActives: user.notificationsActives !== false,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSave = () => {
    try {
      updateUser({
        nomComplet: formData.nomComplet,
        email: formData.email,
        telephone: formData.telephone,
        adresse: formData.adresse || undefined,
        contactUrgence: formData.contactUrgence || undefined,
        telephoneUrgence: formData.telephoneUrgence || undefined,
        notificationsActives: formData.notificationsActives,
      });
      setIsEditing(false);
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil');
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mon profil</h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Modifier
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  if (user) {
                    setFormData({
                      nomComplet: user.nomComplet || '',
                      email: user.email || '',
                      telephone: user.telephone || '',
                      adresse: user.adresse || '',
                      contactUrgence: user.contactUrgence || '',
                      telephoneUrgence: user.telephoneUrgence || '',
                      notificationsActives: user.notificationsActives !== false,
                    });
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer</span>
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 mr-2" />
              Nom complet
            </label>
            {isEditing ? (
              <input
                type="text"
                name="nomComplet"
                value={formData.nomComplet}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{user?.nomComplet || ''}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{user?.email || ''}</p>
            )}
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 mr-2" />
              Téléphone
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{user?.telephone || ''}</p>
            )}
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 mr-2" />
              Adresse
            </label>
            {isEditing ? (
              <input
                type="text"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Votre adresse complète"
              />
            ) : (
              <p className="text-gray-900">{user?.adresse || 'Non renseignée'}</p>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact en cas d'urgence</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du contact
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="contactUrgence"
                  value={formData.contactUrgence}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nom de la personne à contacter"
                />
              ) : (
                <p className="text-gray-900">{user?.contactUrgence || 'Non renseigné'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone du contact
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="telephoneUrgence"
                  value={formData.telephoneUrgence}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+216 XX XXX XXX"
                />
              ) : (
                <p className="text-gray-900">{user?.telephoneUrgence || 'Non renseigné'}</p>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Paramètres de notification
            </h3>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="notificationsActives"
                checked={formData.notificationsActives}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label className="ml-2 text-sm text-gray-700">
                Recevoir les notifications de statut des incidents
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rôle
            </label>
            <p className="text-gray-900">{user?.role || ''}</p>
          </div>

          {user?.centreRegional && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Centre régional
              </label>
              <p className="text-gray-900">{user.centreRegional}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
