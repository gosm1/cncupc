'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Shield, AlertCircle, Bell, BookOpen, TrendingUp, Edit, CheckCircle, XCircle, Plus, Trash2, Save, Users, Search, Filter, MessageSquare, UserCheck, MapPin, Calendar } from 'lucide-react';
import { incidentStorage, alertStorage, guideStorage, regionalAdminStorage, REGIONS } from '@/lib/storage';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isRegionalAdmin = user?.role === 'REGIONAL_ADMIN';
  const userRegion = user?.centreRegional || 'Casablanca-Settat';

  const [activeTab, setActiveTab] = useState<'incidents' | 'alerts' | 'guides' | 'stats' | 'admins'>('incidents');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [regionalAdmins, setRegionalAdmins] = useState<any[]>([]);

  // Filters
  const [incidentFilters, setIncidentFilters] = useState({
    type: 'ALL',
    statut: 'ALL',
    region: 'ALL',
    search: '',
  });

  const [stats, setStats] = useState({
    totalIncidents: 0,
    activeIncidents: 0,
    resolvedIncidents: 0,
    totalAlerts: 0,
    activeAlerts: 0,
    totalGuides: 0,
    urgencesVitales: 0,
    problemesCivils: 0,
    totalAdmins: 0,
  });

  // Form states
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [showGuideForm, setShowGuideForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<any | null>(null);
  const [editingGuide, setEditingGuide] = useState<any | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [commentText, setCommentText] = useState('');

  const [alertForm, setAlertForm] = useState({
    titre: '',
    message: '',
    niveau: 'MOYEN' as 'CRITIQUE' | 'ELEVE' | 'MOYEN' | 'FAIBLE',
    actif: true,
    region: '',
    scope: 'GLOBAL' as 'GLOBAL' | 'REGIONAL',
  });

  const [guideForm, setGuideForm] = useState({
    titre: '',
    contenu: '',
    categorie: 'INCENDIE',
  });

  const [adminForm, setAdminForm] = useState({
    nomComplet: '',
    email: '',
    telephone: '',
    region: 'Casablanca-Settat',
    permissions: {
      lecture: true,
      edition: true,
      suppression: false,
    },
    notificationsActives: true,
    actif: true,
    role: 'REGIONAL_ADMIN' as 'REGIONAL_ADMIN',
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    } else if (user && !isSuperAdmin && !isRegionalAdmin) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, user, router, isSuperAdmin, isRegionalAdmin]);

  const loadData = useCallback(() => {
    try {
      let allIncidents = incidentStorage.getAll();
      const allAlerts = alertStorage.getAll();
      const allGuides = guideStorage.getAll();

      // Pour Regional Admin, filtrer par région
      if (isRegionalAdmin) {
        allIncidents = incidentStorage.getByRegion(userRegion);
      }

      setIncidents(allIncidents);
      setAlerts(isRegionalAdmin ? alertStorage.getByRegion(userRegion) : allAlerts);
      setGuides(allGuides);

      if (isSuperAdmin) {
        setRegionalAdmins(regionalAdminStorage.getAll());
      }

      setStats({
        totalIncidents: allIncidents.length,
        activeIncidents: allIncidents.filter(i => i.statut !== 'RESOLU').length,
        resolvedIncidents: allIncidents.filter(i => i.statut === 'RESOLU').length,
        totalAlerts: allAlerts.length,
        activeAlerts: allAlerts.filter(a => a.actif).length,
        totalGuides: allGuides.length,
        urgencesVitales: allIncidents.filter(i => i.type === 'URGENCE_VITALE').length,
        problemesCivils: allIncidents.filter(i => i.type === 'PROBLEME_CIVIL').length,
        totalAdmins: isSuperAdmin ? regionalAdminStorage.getAll().length : 0,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  }, [isRegionalAdmin, isSuperAdmin, userRegion]);

  const filterIncidents = useCallback(() => {
    let filtered = incidents;

    if (incidentFilters.type !== 'ALL') {
      filtered = filtered.filter(i => i.type === incidentFilters.type);
    }
    if (incidentFilters.statut !== 'ALL') {
      filtered = filtered.filter(i => i.statut === incidentFilters.statut);
    }
    if (incidentFilters.region !== 'ALL') {
      filtered = filtered.filter(i => i.region === incidentFilters.region);
    }
    if (incidentFilters.search) {
      const searchLower = incidentFilters.search.toLowerCase();
      filtered = filtered.filter(i =>
        i.description.toLowerCase().includes(searchLower) ||
        i.sousType.toLowerCase().includes(searchLower) ||
        i.adresse?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [incidents, incidentFilters]);

  useEffect(() => {
    if (isAuthenticated && (isSuperAdmin || isRegionalAdmin)) {
      loadData();
    }
  }, [isAuthenticated, isSuperAdmin, isRegionalAdmin, loadData]);

  useEffect(() => {
    filterIncidents();
  }, [filterIncidents]);

  const updateIncidentStatus = (id: string, newStatus: string) => {
    try {
      incidentStorage.updateStatus(id, newStatus as any);
      loadData();
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const addComment = (incidentId: string) => {
    if (!commentText.trim()) {
      toast.error('Veuillez entrer un commentaire');
      return;
    }
    try {
      incidentStorage.addComment(incidentId, {
        auteur: user?.nomComplet || 'Admin',
        message: commentText,
      });
      setCommentText('');
      setSelectedIncident(null);
      loadData();
      toast.success('Commentaire ajouté');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };

  const assignIncident = (incidentId: string, adminId: string) => {
    try {
      incidentStorage.assign(incidentId, adminId);
      loadData();
      toast.success('Incident assigné');
    } catch (error) {
      toast.error('Erreur lors de l\'assignation');
    }
  };

  const handleCreateAlert = () => {
    try {
      if (!alertForm.titre || !alertForm.message) {
        toast.error('Veuillez remplir tous les champs');
        return;
      }
      alertStorage.create({
        ...alertForm,
        region: alertForm.scope === 'REGIONAL' ? alertForm.region : undefined,
      });
      toast.success('Alerte créée avec succès');
      setShowAlertForm(false);
      setAlertForm({ titre: '', message: '', niveau: 'MOYEN', actif: true, region: '', scope: 'GLOBAL' });
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdateAlert = (id: string) => {
    try {
      alertStorage.update(id, {
        ...alertForm,
        region: alertForm.scope === 'REGIONAL' ? alertForm.region : undefined,
      });
      toast.success('Alerte mise à jour');
      setShowAlertForm(false);
      setEditingAlert(null);
      setAlertForm({ titre: '', message: '', niveau: 'MOYEN', actif: true, region: '', scope: 'GLOBAL' });
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteAlert = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette alerte?')) {
      try {
        alertStorage.delete(id);
        toast.success('Alerte supprimée');
        loadData();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleCreateGuide = () => {
    try {
      if (!guideForm.titre || !guideForm.contenu) {
        toast.error('Veuillez remplir tous les champs');
        return;
      }
      guideStorage.create(guideForm);
      toast.success('Guide créé avec succès');
      setShowGuideForm(false);
      setGuideForm({ titre: '', contenu: '', categorie: 'INCENDIE' });
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdateGuide = (id: string) => {
    try {
      const guide = guideStorage.getById(id);
      if (guide) {
        const allGuides = guideStorage.getAll();
        const filtered = allGuides.filter(g => g.id !== id);
        localStorage.setItem('urgences_guides', JSON.stringify(filtered));
        guideStorage.create(guideForm);
        toast.success('Guide mis à jour');
        setShowGuideForm(false);
        setEditingGuide(null);
        setGuideForm({ titre: '', contenu: '', categorie: 'INCENDIE' });
        loadData();
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteGuide = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce guide?')) {
      try {
        const allGuides = guideStorage.getAll();
        const filtered = allGuides.filter(g => g.id !== id);
        localStorage.setItem('urgences_guides', JSON.stringify(filtered));
        toast.success('Guide supprimé');
        loadData();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleCreateAdmin = () => {
    try {
      if (!adminForm.nomComplet || !adminForm.email || !adminForm.telephone) {
        toast.error('Veuillez remplir tous les champs');
        return;
      }
      regionalAdminStorage.create(adminForm);
      toast.success('Admin régional créé avec succès');
      setShowAdminForm(false);
      setAdminForm({
        nomComplet: '',
        email: '',
        telephone: '',
        region: 'Casablanca-Settat',
        permissions: { lecture: true, edition: true, suppression: false },
        notificationsActives: true,
        actif: true,
        role: 'REGIONAL_ADMIN' as 'REGIONAL_ADMIN',
      });
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdateAdmin = (id: string) => {
    try {
      regionalAdminStorage.update(id, adminForm);
      toast.success('Admin régional mis à jour');
      setShowAdminForm(false);
      setEditingAdmin(null);
      setAdminForm({
        nomComplet: '',
        email: '',
        telephone: '',
        region: 'Casablanca-Settat',
        permissions: { lecture: true, edition: true, suppression: false },
        notificationsActives: true,
        actif: true,
        role: 'REGIONAL_ADMIN',
      });
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteAdmin = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet admin régional?')) {
      try {
        regionalAdminStorage.delete(id);
        toast.success('Admin régional supprimé');
        loadData();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const openEditAlert = (alert: any) => {
    setEditingAlert(alert);
    setAlertForm({
      titre: alert.titre,
      message: alert.message,
      niveau: alert.niveau,
      actif: alert.actif,
      region: alert.region || '',
      scope: alert.scope || 'GLOBAL',
    });
    setShowAlertForm(true);
  };

  const openEditGuide = (guide: any) => {
    setEditingGuide(guide);
    setGuideForm({
      titre: guide.titre,
      contenu: guide.contenu,
      categorie: guide.categorie,
    });
    setShowGuideForm(true);
  };

  const openEditAdmin = (admin: any) => {
    setEditingAdmin(admin);
    setAdminForm({
      nomComplet: admin.nomComplet,
      email: admin.email,
      telephone: admin.telephone,
      region: admin.region,
      permissions: admin.permissions,
      notificationsActives: admin.notificationsActives,
      actif: admin.actif,
      role: admin.role || 'REGIONAL_ADMIN',
    });
    setShowAdminForm(true);
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user && !isSuperAdmin && !isRegionalAdmin) {
    return null;
  }

  const filteredIncidents = filterIncidents();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-primary-600" />
            Tableau de bord {isSuperAdmin ? 'Super Administrateur' : 'Administrateur Régional'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isSuperAdmin
              ? 'Gérez tous les incidents, alertes, guides et admins régionaux du système'
              : `Gérez les incidents et alertes de la région: ${userRegion}`
            }
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total incidents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalIncidents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Incidents actifs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeIncidents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Résolus</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolvedIncidents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Alertes actives</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeAlerts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'incidents', label: 'Gestion des incidents', icon: AlertCircle },
                { id: 'alerts', label: 'Alertes officielles', icon: Bell },
                { id: 'guides', label: 'Guides de prévention', icon: BookOpen },
                { id: 'stats', label: 'Statistiques', icon: TrendingUp },
                ...(isSuperAdmin ? [{ id: 'admins', label: 'Admins Régionaux', icon: Users }] : []),
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm ${activeTab === id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Incidents Tab */}
            {activeTab === 'incidents' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Gestion des incidents</h2>
                </div>

                {/* Filters */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={incidentFilters.search}
                          onChange={(e) => setIncidentFilters({ ...incidentFilters, search: e.target.value })}
                          placeholder="Rechercher..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={incidentFilters.type}
                        onChange={(e) => setIncidentFilters({ ...incidentFilters, type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                      >
                        <option value="ALL">Tous</option>
                        <option value="URGENCE_VITALE">Urgences vitales</option>
                        <option value="PROBLEME_CIVIL">Problèmes civils</option>
                      </select>
                    </div>
                    {isSuperAdmin && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Région</label>
                        <select
                          value={incidentFilters.region}
                          onChange={(e) => setIncidentFilters({ ...incidentFilters, region: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                        >
                          <option value="ALL">Toutes</option>
                          {REGIONS.map(region => (
                            <option key={region} value={region}>{region}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                      <select
                        value={incidentFilters.statut}
                        onChange={(e) => setIncidentFilters({ ...incidentFilters, statut: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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

                {filteredIncidents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucun incident trouvé</p>
                ) : (
                  <div className="space-y-4">
                    {filteredIncidents.map((incident) => (
                      <div key={incident.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className={`p-2 rounded-lg ${incident.type === 'URGENCE_VITALE' ? 'bg-red-100' : 'bg-yellow-100'
                                }`}>
                                <AlertCircle className={`w-5 h-5 ${incident.type === 'URGENCE_VITALE' ? 'text-red-600' : 'text-yellow-600'
                                  }`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-gray-900">{incident.sousType.replace(/_/g, ' ')}</h3>
                                  {incident.region && (
                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                      {incident.region}
                                    </span>
                                  )}
                                  {incident.assigne && (
                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded flex items-center">
                                      <UserCheck className="w-3 h-3 mr-1" />
                                      Assigné
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                                {incident.adresse && (
                                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {incident.adresse}
                                  </p>
                                )}
                                {incident.commentaires && incident.commentaires.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-gray-700">Commentaires ({incident.commentaires.length})</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(incident.dateCreation).toLocaleString('fr-FR')}
                            </p>
                          </div>
                          <div className="ml-4 flex flex-col space-y-2">
                            <select
                              value={incident.statut}
                              onChange={(e) => updateIncidentStatus(incident.id, e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-900"
                            >
                              <option value="ALERTE_RECUE">Alerte reçue</option>
                              <option value="SECOURS_EN_ROUTE">Secours en route</option>
                              <option value="EN_COURS">En cours</option>
                              <option value="RESOLU">Résolu</option>
                            </select>
                            <button
                              onClick={() => setSelectedIncident(incident)}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center justify-center"
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Commenter
                            </button>
                            {isSuperAdmin && (
                              <select
                                onChange={(e) => e.target.value && assignIncident(incident.id, e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-900"
                                defaultValue=""
                              >
                                <option value="">Assigner à...</option>
                                {regionalAdmins.filter(a => a.actif).map(admin => (
                                  <option key={admin.id} value={admin.id}>
                                    {admin.nomComplet} ({admin.region})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Alerts Tab - Continues in next part due to length */}
            {activeTab === 'alerts' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Alertes officielles</h2>
                  <button
                    onClick={() => {
                      setEditingAlert(null);
                      setAlertForm({ titre: '', message: '', niveau: 'MOYEN', actif: true, region: '', scope: isRegionalAdmin ? 'REGIONAL' : 'GLOBAL' });
                      setShowAlertForm(true);
                    }}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Créer une alerte
                  </button>
                </div>

                {showAlertForm && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {editingAlert ? "Modifier l'alerte" : "Nouvelle alerte"}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Portée</label>
                        <select
                          value={alertForm.scope}
                          onChange={(e) => setAlertForm({ ...alertForm, scope: e.target.value as any })}
                          disabled={isRegionalAdmin}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                        >
                          <option value="GLOBAL">Globale (toutes les régions)</option>
                          <option value="REGIONAL">Régionale</option>
                        </select>
                      </div>
                      {alertForm.scope === 'REGIONAL' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Région</label>
                          <select
                            value={alertForm.region}
                            onChange={(e) => setAlertForm({ ...alertForm, region: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                          >
                            {REGIONS.map(region => (
                              <option key={region} value={region}>{region}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                        <input
                          type="text"
                          value={alertForm.titre}
                          onChange={(e) => setAlertForm({ ...alertForm, titre: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                          placeholder="Titre de l'alerte"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                        <textarea
                          value={alertForm.message}
                          onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                          placeholder="Message de l'alerte"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
                          <select
                            value={alertForm.niveau}
                            onChange={(e) => setAlertForm({ ...alertForm, niveau: e.target.value as any })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                          >
                            <option value="CRITIQUE">Critique</option>
                            <option value="ELEVE">Élevé</option>
                            <option value="MOYEN">Moyen</option>
                            <option value="FAIBLE">Faible</option>
                          </select>
                        </div>
                        <div className="flex items-center pt-8">
                          <input
                            type="checkbox"
                            checked={alertForm.actif}
                            onChange={(e) => setAlertForm({ ...alertForm, actif: e.target.checked })}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                          />
                          <label className="ml-2 text-sm text-gray-700">Alerte active</label>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setShowAlertForm(false);
                            setEditingAlert(null);
                            setAlertForm({ titre: '', message: '', niveau: 'MOYEN', actif: true, region: '', scope: 'GLOBAL' });
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => editingAlert ? handleUpdateAlert(editingAlert.id) : handleCreateAlert()}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {editingAlert ? 'Mettre à jour' : 'Créer'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {alerts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucune alerte</p>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{alert.titre}</h3>
                              <span className={`px-2 py-1 text-xs rounded ${alert.niveau === 'CRITIQUE' ? 'bg-red-100 text-red-800' :
                                alert.niveau === 'ELEVE' ? 'bg-orange-100 text-orange-800' :
                                  alert.niveau === 'MOYEN' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                {alert.niveau}
                              </span>
                              {alert.scope === 'GLOBAL' ? (
                                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Globale</span>
                              ) : (
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{alert.region}</span>
                              )}
                              {alert.actif && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Actif</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{alert.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(alert.dateCreation).toLocaleString('fr-FR')}
                            </p>
                          </div>
                          <div className="ml-4 flex items-center space-x-2">
                            <button
                              onClick={() => openEditAlert(alert)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Guides Tab */}
            {activeTab === 'guides' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Guides de prévention</h2>
                  <button
                    onClick={() => {
                      setEditingGuide(null);
                      setGuideForm({ titre: '', contenu: '', categorie: 'INCENDIE' });
                      setShowGuideForm(true);
                    }}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Créer un guide
                  </button>
                </div>

                {showGuideForm && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {editingGuide ? "Modifier le guide" : "Nouveau guide"}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                        <input
                          type="text"
                          value={guideForm.titre}
                          onChange={(e) => setGuideForm({ ...guideForm, titre: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                          placeholder="Titre du guide"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                        <select
                          value={guideForm.categorie}
                          onChange={(e) => setGuideForm({ ...guideForm, categorie: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                        >
                          <option value="INCENDIE">Incendie</option>
                          <option value="SEISME">Séisme</option>
                          <option value="PREMIERS_SECOURS">Premiers secours</option>
                          <option value="INONDATION">Inondation</option>
                          <option value="AUTRE">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contenu *</label>
                        <textarea
                          value={guideForm.contenu}
                          onChange={(e) => setGuideForm({ ...guideForm, contenu: e.target.value })}
                          rows={8}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                          placeholder="Contenu du guide..."
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setShowGuideForm(false);
                            setEditingGuide(null);
                            setGuideForm({ titre: '', contenu: '', categorie: 'INCENDIE' });
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => editingGuide ? handleUpdateGuide(editingGuide.id) : handleCreateGuide()}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {editingGuide ? 'Mettre à jour' : 'Créer'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {guides.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucun guide</p>
                ) : (
                  <div className="space-y-4">
                    {guides.map((guide) => (
                      <div key={guide.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{guide.titre}</h3>
                            <p className="text-sm text-gray-500 mt-1">Catégorie: {guide.categorie.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{guide.contenu.substring(0, 200)}...</p>
                          </div>
                          <div className="ml-4 flex items-center space-x-2">
                            <button
                              onClick={() => openEditGuide(guide)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteGuide(guide.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistiques détaillées</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Répartition par type</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">Urgences vitales</span>
                          <span className="text-sm font-semibold text-gray-900">{stats.urgencesVitales}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${stats.totalIncidents > 0 ? (stats.urgencesVitales / stats.totalIncidents) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">Problèmes civils</span>
                          <span className="text-sm font-semibold text-gray-900">{stats.problemesCivils}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-600 h-2 rounded-full"
                            style={{ width: `${stats.totalIncidents > 0 ? (stats.problemesCivils / stats.totalIncidents) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Résumé</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total incidents</span>
                        <span className="text-sm font-semibold text-gray-900">{stats.totalIncidents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Incidents actifs</span>
                        <span className="text-sm font-semibold text-gray-900">{stats.activeIncidents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Incidents résolus</span>
                        <span className="text-sm font-semibold text-gray-900">{stats.resolvedIncidents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Alertes actives</span>
                        <span className="text-sm font-semibold text-gray-900">{stats.activeAlerts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Guides disponibles</span>
                        <span className="text-sm font-semibold text-gray-900">{stats.totalGuides}</span>
                      </div>
                      {isSuperAdmin && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Admins régionaux</span>
                          <span className="text-sm font-semibold text-gray-900">{stats.totalAdmins}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Regional Admins Tab - Only for Super Admin */}
            {activeTab === 'admins' && isSuperAdmin && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Gestion des Admins Régionaux</h2>
                  <button
                    onClick={() => {
                      setEditingAdmin(null);
                      setAdminForm({
                        nomComplet: '',
                        email: '',
                        telephone: '',
                        region: 'Casablanca-Settat',
                        permissions: { lecture: true, edition: true, suppression: false },
                        notificationsActives: true,
                        actif: true,
                        role: 'REGIONAL_ADMIN',
                      });
                      setShowAdminForm(true);
                    }}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Ajouter un admin régional
                  </button>
                </div>

                {showAdminForm && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {editingAdmin ? "Modifier l'admin régional" : "Nouvel admin régional"}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                        <input
                          type="text"
                          value={adminForm.nomComplet}
                          onChange={(e) => setAdminForm({ ...adminForm, nomComplet: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                          placeholder="Nom complet"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                          <input
                            type="email"
                            value={adminForm.email}
                            onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                            placeholder="email@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                          <input
                            type="tel"
                            value={adminForm.telephone}
                            onChange={(e) => setAdminForm({ ...adminForm, telephone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                            placeholder="+212 XX XXX XXXX"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Région *</label>
                        <select
                          value={adminForm.region}
                          onChange={(e) => setAdminForm({ ...adminForm, region: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                        >
                          {REGIONS.map(region => (
                            <option key={region} value={region}>{region}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={adminForm.permissions.lecture}
                              onChange={(e) => setAdminForm({
                                ...adminForm,
                                permissions: { ...adminForm.permissions, lecture: e.target.checked }
                              })}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Lecture</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={adminForm.permissions.edition}
                              onChange={(e) => setAdminForm({
                                ...adminForm,
                                permissions: { ...adminForm.permissions, edition: e.target.checked }
                              })}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Édition</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={adminForm.permissions.suppression}
                              onChange={(e) => setAdminForm({
                                ...adminForm,
                                permissions: { ...adminForm.permissions, suppression: e.target.checked }
                              })}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Suppression</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={adminForm.notificationsActives}
                          onChange={(e) => setAdminForm({ ...adminForm, notificationsActives: e.target.checked })}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">Notifications actives</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={adminForm.actif}
                          onChange={(e) => setAdminForm({ ...adminForm, actif: e.target.checked })}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">Compte actif</label>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setShowAdminForm(false);
                            setEditingAdmin(null);
                            setAdminForm({
                              nomComplet: '',
                              email: '',
                              telephone: '',
                              region: 'Casablanca-Settat',
                              permissions: { lecture: true, edition: true, suppression: false },
                              notificationsActives: true,
                              actif: true,
                              role: 'REGIONAL_ADMIN',
                            });
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => editingAdmin ? handleUpdateAdmin(editingAdmin.id) : handleCreateAdmin()}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {editingAdmin ? 'Mettre à jour' : 'Créer'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {regionalAdmins.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucun admin régional</p>
                ) : (
                  <div className="space-y-4">
                    {regionalAdmins.map((admin) => (
                      <div key={admin.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{admin.nomComplet}</h3>
                            <p className="text-sm text-gray-600 mt-1">{admin.email}</p>
                            <p className="text-sm text-gray-600">{admin.telephone}</p>
                            <div className="mt-2 flex items-center space-x-2">
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{admin.region}</span>
                              {admin.actif ? (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Actif</span>
                              ) : (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Inactif</span>
                              )}
                              {admin.notificationsActives && (
                                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Notifications ON</span>
                              )}
                            </div>
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700">Permissions:</p>
                              <div className="flex space-x-2 mt-1">
                                {admin.permissions.lecture && <span className="text-xs text-gray-600">✓ Lecture</span>}
                                {admin.permissions.edition && <span className="text-xs text-gray-600">✓ Édition</span>}
                                {admin.permissions.suppression && <span className="text-xs text-gray-600">✓ Suppression</span>}
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 flex items-center space-x-2">
                            <button
                              onClick={() => openEditAdmin(admin)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(admin.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Commentaires - {selectedIncident.sousType.replace(/_/g, ' ')}</h3>
            <div className="max-h-64 overflow-y-auto mb-4 space-y-2">
              {selectedIncident.commentaires && selectedIncident.commentaires.length > 0 ? (
                selectedIncident.commentaires.map((comment: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{comment.auteur}</span>
                      <span className="text-xs text-gray-500">{new Date(comment.date).toLocaleString('fr-FR')}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun commentaire</p>
              )}
            </div>
            <div className="space-y-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                placeholder="Ajouter un commentaire..."
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedIncident(null);
                    setCommentText('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Fermer
                </button>
                <button
                  onClick={() => addComment(selectedIncident.id)}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
