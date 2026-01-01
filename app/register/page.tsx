'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { UserPlus, User, Mail, Phone, Lock, Eye, EyeOff, Image as ImageIcon, X, MapPin } from 'lucide-react';
import { REGIONS } from '@/lib/storage';
import { fileToBase64 } from '@/lib/aiVision';
import Image from 'next/image';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    telephone: '',
    nomComplet: '',
    region: 'Casablanca-Settat',
    cin: '',
  });
  const [cinPreview, setCinPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const cinInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCinUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Limite de taille: 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image est trop volumineuse (max 5MB)');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setFormData({ ...formData, cin: base64 });
      setCinPreview(base64);
      toast.success('Photo CIN téléchargée avec succès');
    } catch (error) {
      toast.error('Erreur lors du téléchargement de l\'image');
    }
  };

  const removeCin = () => {
    setFormData({ ...formData, cin: '' });
    setCinPreview(null);
    if (cinInputRef.current) {
      cinInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.nomComplet.trim()) {
        toast.error('Veuillez entrer votre nom complet');
        setLoading(false);
        return;
      }
      if (!formData.email.trim()) {
        toast.error('Veuillez entrer votre email');
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Le mot de passe doit contenir au moins 6 caractères');
        setLoading(false);
        return;
      }
      if (!formData.cin) {
        toast.error('Veuillez télécharger une photo de votre CIN');
        setLoading(false);
        return;
      }

      register(formData);
      toast.success('Inscription réussie!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error('Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-red-50 px-4 py-12">
      <div className="max-w-2xl w-full">
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
            Créer un compte
          </h1>
          <p className="text-gray-600">Rejoignez le système de coordination des urgences</p>
        </div>

        {/* Register Card - Rectangular */}
        <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Inscription</h2>
            <p className="text-sm text-gray-600">Remplissez le formulaire pour créer votre compte</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="nomComplet" className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nom complet *
                </label>
                <input
                  id="nomComplet"
                  name="nomComplet"
                  type="text"
                  value={formData.nomComplet}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-gray-900 placeholder-gray-400"
                  placeholder="Ex: Ahmed Benali"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-gray-900 placeholder-gray-400"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="telephone" className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Téléphone *
                </label>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-gray-900 placeholder-gray-400"
                  placeholder="+212 XX XXX XXXX"
                />
              </div>

              <div>
                <label htmlFor="region" className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Région *
                </label>
                <select
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-gray-900"
                >
                  {REGIONS.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Mot de passe *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Minimum 6 caractères</p>
            </div>

            {/* CIN Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Photo de la CIN (Carte d&apos;Identité Nationale) *
              </label>
              {cinPreview ? (
                <div className="relative">
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="relative w-full h-48">
                      <Image
                        src={cinPreview}
                        alt="CIN Preview"
                        fill
                        className="object-contain rounded-lg"
                        unoptimized
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCin}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="mt-2 text-xs text-green-600">✓ Photo CIN téléchargée</p>
                </div>
              ) : (
                <div
                  onClick={() => cinInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Cliquez pour télécharger la photo de votre CIN
                  </p>
                  <p className="text-xs text-gray-500">
                    Formats acceptés: JPG, PNG (max 5MB)
                  </p>
                  <input
                    ref={cinInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCinUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !formData.cin}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Inscription...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Créer mon compte
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Déjà un compte?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                Se connecter
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
