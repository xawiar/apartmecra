import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../utils/ApiService';
import { decryptData } from '../utils/crypto';
import Footer from '../components/Footer';

const TownPresidentDashboardPage = () => {
  const { user, logout } = useAuth();
  const [town, setTown] = useState(null);
  const [managementMembers, setManagementMembers] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [villages, setVillages] = useState([]);
  const [neighborhoodRepresentatives, setNeighborhoodRepresentatives] = useState([]);
  const [villageRepresentatives, setVillageRepresentatives] = useState([]);
  const [ballotBoxes, setBallotBoxes] = useState([]);
  const [observers, setObservers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Management Members
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberFormData, setMemberFormData] = useState({
    tc: '',
    name: '',
    region: '',
    position: '',
    phone: '',
    address: '',
    email: ''
  });

  // Neighborhoods/Villages
  const [showAddNeighborhoodForm, setShowAddNeighborhoodForm] = useState(false);
  const [showAddVillageForm, setShowAddVillageForm] = useState(false);
  const [editingNeighborhood, setEditingNeighborhood] = useState(null);
  const [editingVillage, setEditingVillage] = useState(null);
  const [neighborhoodFormData, setNeighborhoodFormData] = useState({
    name: '',
    group_no: ''
  });
  const [villageFormData, setVillageFormData] = useState({
    name: '',
    group_no: ''
  });

  // Representatives
  const [showAddRepresentativeForm, setShowAddRepresentativeForm] = useState(false);
  const [editingRepresentative, setEditingRepresentative] = useState(null);
  const [representativeType, setRepresentativeType] = useState('neighborhood'); // 'neighborhood' or 'village'
  const [representativeFormData, setRepresentativeFormData] = useState({
    name: '',
    tc: '',
    phone: '',
    neighborhood_id: '',
    village_id: '',
    member_id: ''
  });

  // Ballot Boxes
  const [showAddBallotBoxForm, setShowAddBallotBoxForm] = useState(false);
  const [editingBallotBox, setEditingBallotBox] = useState(null);
  const [ballotBoxFormData, setBallotBoxFormData] = useState({
    ballot_number: '',
    institution_name: '',
    neighborhood_id: '',
    village_id: ''
  });

  // Observers
  const [showAddObserverForm, setShowAddObserverForm] = useState(false);
  const [editingObserver, setEditingObserver] = useState(null);
  const [observerFormData, setObserverFormData] = useState({
    tc: '',
    name: '',
    phone: '',
    ballot_box_id: '',
    is_chief_observer: false
  });

  const fetchTownData = useCallback(async () => {
    try {
      setLoading(true);
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      let response;
      
      if (USE_FIREBASE) {
        const townData = await ApiService.getTownById(user.townId);
        if (townData && townData.success) {
          response = townData;
        } else if (townData && !townData.success) {
          const towns = await ApiService.getTowns();
          const town = towns.find(t => String(t.id) === String(user.townId));
          if (town) {
            const districts = await ApiService.getDistricts();
            const district = districts.find(d => String(d.id) === String(town.district_id));
            response = {
              success: true,
              town: {
                ...town,
                districtName: district?.name || ''
              }
            };
          } else {
            setError('Belde bilgileri alınamadı');
            return;
          }
        } else {
          response = {
            success: true,
            town: townData
          };
        }
      } else {
        response = await ApiService.getTownById(user.townId);
      }
      
      if (response && response.success) {
        setTown(response.town);
      } else if (response && !response.success) {
        setError('Belde bilgileri alınamadı');
      }
    } catch (error) {
      console.error('Error fetching town data:', error);
      setError('Belde bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [user.townId]);

  useEffect(() => {
    fetchTownData();
  }, [fetchTownData]);

  useEffect(() => {
    if (town && user?.townId) {
      fetchAllData();
    }
  }, [town, user?.townId]);

  const fetchAllData = async () => {
    try {
      const [
        managementMembersData,
        neighborhoodsData,
        villagesData,
        representativesData,
        villageRepsData,
        ballotBoxesData,
        observersData,
        membersData
      ] = await Promise.all([
        ApiService.getTownManagementMembers(user.townId),
        ApiService.getNeighborhoods(),
        ApiService.getVillages(),
        ApiService.getNeighborhoodRepresentatives(),
        ApiService.getVillageRepresentatives(),
        ApiService.getBallotBoxes(),
        ApiService.getBallotBoxObservers(),
        ApiService.getMembers()
      ]);

      // Filter neighborhoods and villages by town
      const townNeighborhoods = neighborhoodsData.filter(n => 
        n.town_id && String(n.town_id) === String(user.townId)
      );
      const townVillages = villagesData.filter(v => 
        v.town_id && String(v.town_id) === String(user.townId)
      );

      // Filter representatives by town neighborhoods/villages
      const townNeighborhoodIds = new Set(townNeighborhoods.map(n => String(n.id)));
      const townVillageIds = new Set(townVillages.map(v => String(v.id)));
      
      const townNeighborhoodReps = representativesData.filter(rep =>
        rep.neighborhood_id && townNeighborhoodIds.has(String(rep.neighborhood_id))
      );
      const townVillageReps = villageRepsData.filter(rep =>
        rep.village_id && townVillageIds.has(String(rep.village_id))
      );

      // Filter ballot boxes by town neighborhoods/villages
      const townBallotBoxes = ballotBoxesData.filter(bb => {
        if (bb.neighborhood_id && townNeighborhoodIds.has(String(bb.neighborhood_id))) return true;
        if (bb.village_id && townVillageIds.has(String(bb.village_id))) return true;
        return false;
      });

      // Filter observers by town ballot boxes
      const townBallotBoxIds = new Set(townBallotBoxes.map(bb => String(bb.id)));
      const townObservers = observersData.filter(obs =>
        obs.ballot_box_id && townBallotBoxIds.has(String(obs.ballot_box_id))
      );

      setManagementMembers(Array.isArray(managementMembersData) ? managementMembersData : []);
      setNeighborhoods(townNeighborhoods);
      setVillages(townVillages);
      setNeighborhoodRepresentatives(townNeighborhoodReps);
      setVillageRepresentatives(townVillageReps);
      setBallotBoxes(townBallotBoxes);
      setObservers(townObservers);
      setMembers(membersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Veriler yüklenirken hata oluştu');
    }
  };

  // Management Members handlers
  const handleMemberInputChange = (e) => {
    const { name, value } = e.target;
    setMemberFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await ApiService.updateTownManagementMember(editingMember.id, memberFormData);
        setMessage('Üye başarıyla güncellendi');
      } else {
        await ApiService.createTownManagementMember({
          ...memberFormData,
          town_id: user.townId
        });
        setMessage('Üye başarıyla eklendi');
      }
      setShowAddMemberForm(false);
      setEditingMember(null);
      setMemberFormData({
        tc: '',
        name: '',
        region: '',
        position: '',
        phone: '',
        address: '',
        email: ''
      });
      setTimeout(() => {
        fetchAllData();
      }, 100);
      setMessageType('success');
    } catch (error) {
      console.error('Error saving member:', error);
      setMessage('Üye kaydedilirken hata oluştu: ' + error.message);
      setMessageType('error');
    }
  };

  const handleMemberEdit = (member) => {
    setEditingMember(member);
    setMemberFormData({
      tc: member.tc || '',
      name: member.name || '',
      region: member.region || '',
      position: member.position || '',
      phone: member.phone || '',
      address: member.address || '',
      email: member.email || ''
    });
    setShowAddMemberForm(true);
  };

  const handleMemberDelete = async (memberId) => {
    if (!window.confirm('Bu üyeyi silmek istediğinizden emin misiniz?')) {
      return;
    }
    try {
      await ApiService.deleteTownManagementMember(memberId);
      fetchAllData();
      setMessage('Üye başarıyla silindi');
      setMessageType('success');
    } catch (error) {
      console.error('Error deleting member:', error);
      setMessage('Üye silinirken hata oluştu');
      setMessageType('error');
    }
  };

  // Neighborhood handlers
  const handleNeighborhoodInputChange = (e) => {
    const { name, value } = e.target;
    setNeighborhoodFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNeighborhoodSubmit = async (e) => {
    e.preventDefault();
    try {
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      const neighborhoodData = {
        name: neighborhoodFormData.name.trim(),
        district_id: town?.district_id || '',
        town_id: user.townId,
        group_no: neighborhoodFormData.group_no || null
      };

      if (editingNeighborhood) {
        await ApiService.updateNeighborhood(editingNeighborhood.id, neighborhoodData);
        setMessage('Mahalle başarıyla güncellendi');
      } else {
        await ApiService.createNeighborhood(neighborhoodData);
        setMessage('Mahalle başarıyla eklendi');
      }
      setShowAddNeighborhoodForm(false);
      setEditingNeighborhood(null);
      setNeighborhoodFormData({ name: '', group_no: '' });
      fetchAllData();
      setMessageType('success');
    } catch (error) {
      console.error('Error saving neighborhood:', error);
      setMessage('Mahalle kaydedilirken hata oluştu: ' + error.message);
      setMessageType('error');
    }
  };

  const handleNeighborhoodEdit = (neighborhood) => {
    setEditingNeighborhood(neighborhood);
    setNeighborhoodFormData({
      name: neighborhood.name || '',
      group_no: neighborhood.group_no || ''
    });
    setShowAddNeighborhoodForm(true);
  };

  const handleNeighborhoodDelete = async (neighborhoodId) => {
    if (!window.confirm('Bu mahalleyi silmek istediğinizden emin misiniz?')) {
      return;
    }
    try {
      await ApiService.deleteNeighborhood(neighborhoodId);
      fetchAllData();
      setMessage('Mahalle başarıyla silindi');
      setMessageType('success');
    } catch (error) {
      console.error('Error deleting neighborhood:', error);
      setMessage('Mahalle silinirken hata oluştu');
      setMessageType('error');
    }
  };

  // Village handlers
  const handleVillageInputChange = (e) => {
    const { name, value } = e.target;
    setVillageFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVillageSubmit = async (e) => {
    e.preventDefault();
    try {
      const villageData = {
        name: villageFormData.name.trim(),
        district_id: town?.district_id || '',
        town_id: user.townId,
        group_no: villageFormData.group_no || null
      };

      if (editingVillage) {
        await ApiService.updateVillage(editingVillage.id, villageData);
        setMessage('Köy başarıyla güncellendi');
      } else {
        await ApiService.createVillage(villageData);
        setMessage('Köy başarıyla eklendi');
      }
      setShowAddVillageForm(false);
      setEditingVillage(null);
      setVillageFormData({ name: '', group_no: '' });
      fetchAllData();
      setMessageType('success');
    } catch (error) {
      console.error('Error saving village:', error);
      setMessage('Köy kaydedilirken hata oluştu: ' + error.message);
      setMessageType('error');
    }
  };

  const handleVillageEdit = (village) => {
    setEditingVillage(village);
    setVillageFormData({
      name: village.name || '',
      group_no: village.group_no || ''
    });
    setShowAddVillageForm(true);
  };

  const handleVillageDelete = async (villageId) => {
    if (!window.confirm('Bu köyü silmek istediğinizden emin misiniz?')) {
      return;
    }
    try {
      await ApiService.deleteVillage(villageId);
      fetchAllData();
      setMessage('Köy başarıyla silindi');
      setMessageType('success');
    } catch (error) {
      console.error('Error deleting village:', error);
      setMessage('Köy silinirken hata oluştu');
      setMessageType('error');
    }
  };

  // Representative handlers
  const handleRepresentativeInputChange = (e) => {
    const { name, value } = e.target;
    setRepresentativeFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRepresentativeSubmit = async (e) => {
    e.preventDefault();
    try {
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      
      if (representativeType === 'neighborhood') {
        if (!representativeFormData.neighborhood_id) {
          setMessage('Mahalle seçimi gereklidir');
          setMessageType('error');
          return;
        }
        
        const representativeData = {
          name: representativeFormData.name.trim(),
          tc: representativeFormData.tc.trim(),
          phone: representativeFormData.phone.trim() || null,
          neighborhood_id: USE_FIREBASE ? String(representativeFormData.neighborhood_id) : parseInt(representativeFormData.neighborhood_id),
          member_id: representativeFormData.member_id || null
        };

        if (editingRepresentative) {
          await ApiService.updateNeighborhoodRepresentative(editingRepresentative.id, representativeData);
          setMessage('Mahalle temsilcisi başarıyla güncellendi');
        } else {
          await ApiService.createNeighborhoodRepresentative(representativeData);
          setMessage('Mahalle temsilcisi başarıyla eklendi');
        }
      } else {
        if (!representativeFormData.village_id) {
          setMessage('Köy seçimi gereklidir');
          setMessageType('error');
          return;
        }
        
        const representativeData = {
          name: representativeFormData.name.trim(),
          tc: representativeFormData.tc.trim(),
          phone: representativeFormData.phone.trim() || null,
          village_id: USE_FIREBASE ? String(representativeFormData.village_id) : parseInt(representativeFormData.village_id),
          member_id: representativeFormData.member_id || null
        };

        if (editingRepresentative) {
          await ApiService.updateVillageRepresentative(editingRepresentative.id, representativeData);
          setMessage('Köy temsilcisi başarıyla güncellendi');
        } else {
          await ApiService.createVillageRepresentative(representativeData);
          setMessage('Köy temsilcisi başarıyla eklendi');
        }
      }
      
      setShowAddRepresentativeForm(false);
      setEditingRepresentative(null);
      setRepresentativeFormData({
        name: '',
        tc: '',
        phone: '',
        neighborhood_id: '',
        village_id: '',
        member_id: ''
      });
      fetchAllData();
      setMessageType('success');
    } catch (error) {
      console.error('Error saving representative:', error);
      setMessage('Temsilci kaydedilirken hata oluştu: ' + error.message);
      setMessageType('error');
    }
  };

  const handleRepresentativeEdit = (representative, type) => {
    setEditingRepresentative(representative);
    setRepresentativeType(type);
    setRepresentativeFormData({
      name: representative.name || '',
      tc: representative.tc || '',
      phone: representative.phone || '',
      neighborhood_id: type === 'neighborhood' ? representative.neighborhood_id : '',
      village_id: type === 'village' ? representative.village_id : '',
      member_id: representative.member_id || ''
    });
    setShowAddRepresentativeForm(true);
  };

  const handleRepresentativeDelete = async (representativeId, type) => {
    if (!window.confirm('Bu temsilciyi silmek istediğinizden emin misiniz?')) {
      return;
    }
    try {
      if (type === 'neighborhood') {
        await ApiService.deleteNeighborhoodRepresentative(representativeId);
      } else {
        await ApiService.deleteVillageRepresentative(representativeId);
      }
      fetchAllData();
      setMessage('Temsilci başarıyla silindi');
      setMessageType('success');
    } catch (error) {
      console.error('Error deleting representative:', error);
      setMessage('Temsilci silinirken hata oluştu');
      setMessageType('error');
    }
  };

  // Ballot Box handlers
  const handleBallotBoxInputChange = (e) => {
    const { name, value } = e.target;
    setBallotBoxFormData(prev => {
      const newData = { ...prev, [name]: value };
      // If neighborhood selected, clear village and vice versa
      if (name === 'neighborhood_id') {
        newData.village_id = '';
      } else if (name === 'village_id') {
        newData.neighborhood_id = '';
      }
      return newData;
    });
  };

  const handleBallotBoxSubmit = async (e) => {
    e.preventDefault();
    try {
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      
      if (!ballotBoxFormData.neighborhood_id && !ballotBoxFormData.village_id) {
        setMessage('Mahalle veya köy seçimi gereklidir');
        setMessageType('error');
        return;
      }

      const ballotBoxData = {
        ballot_number: ballotBoxFormData.ballot_number.trim(),
        institution_name: ballotBoxFormData.institution_name.trim(),
        district_id: town?.district_id || null,
        town_id: user.townId,
        neighborhood_id: ballotBoxFormData.neighborhood_id ? (USE_FIREBASE ? String(ballotBoxFormData.neighborhood_id) : parseInt(ballotBoxFormData.neighborhood_id)) : null,
        village_id: ballotBoxFormData.village_id ? (USE_FIREBASE ? String(ballotBoxFormData.village_id) : parseInt(ballotBoxFormData.village_id)) : null
      };

      if (editingBallotBox) {
        await ApiService.updateBallotBox(editingBallotBox.id, ballotBoxData);
        setMessage('Sandık başarıyla güncellendi');
      } else {
        await ApiService.createBallotBox(ballotBoxData);
        setMessage('Sandık başarıyla eklendi');
      }
      
      setShowAddBallotBoxForm(false);
      setEditingBallotBox(null);
      setBallotBoxFormData({
        ballot_number: '',
        institution_name: '',
        neighborhood_id: '',
        village_id: ''
      });
      fetchAllData();
      setMessageType('success');
    } catch (error) {
      console.error('Error saving ballot box:', error);
      setMessage('Sandık kaydedilirken hata oluştu: ' + error.message);
      setMessageType('error');
    }
  };

  const handleBallotBoxEdit = (ballotBox) => {
    setEditingBallotBox(ballotBox);
    setBallotBoxFormData({
      ballot_number: ballotBox.ballot_number || '',
      institution_name: ballotBox.institution_name || '',
      neighborhood_id: ballotBox.neighborhood_id ? String(ballotBox.neighborhood_id) : '',
      village_id: ballotBox.village_id ? String(ballotBox.village_id) : ''
    });
    setShowAddBallotBoxForm(true);
  };

  const handleBallotBoxDelete = async (ballotBoxId) => {
    if (!window.confirm('Bu sandığı silmek istediğinizden emin misiniz?')) {
      return;
    }
    try {
      await ApiService.deleteBallotBox(ballotBoxId);
      fetchAllData();
      setMessage('Sandık başarıyla silindi');
      setMessageType('success');
    } catch (error) {
      console.error('Error deleting ballot box:', error);
      setMessage('Sandık silinirken hata oluştu');
      setMessageType('error');
    }
  };

  // Observer handlers
  const handleObserverInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setObserverFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleObserverSubmit = async (e) => {
    e.preventDefault();
    try {
      const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
      
      if (!observerFormData.ballot_box_id) {
        setMessage('Sandık seçimi gereklidir');
        setMessageType('error');
        return;
      }

      // Get ballot box to get location info
      const selectedBallotBox = ballotBoxes.find(bb => String(bb.id) === String(observerFormData.ballot_box_id));
      
      const observerData = {
        tc: observerFormData.tc.trim(),
        name: observerFormData.name.trim(),
        phone: observerFormData.phone.trim(),
        ballot_box_id: USE_FIREBASE ? String(observerFormData.ballot_box_id) : parseInt(observerFormData.ballot_box_id),
        district_id: selectedBallotBox?.district_id || town?.district_id || null,
        town_id: user.townId,
        neighborhood_id: selectedBallotBox?.neighborhood_id || null,
        village_id: selectedBallotBox?.village_id || null,
        is_chief_observer: observerFormData.is_chief_observer || false
      };

      if (editingObserver) {
        await ApiService.updateBallotBoxObserver(editingObserver.id, observerData);
        setMessage('Müşahit başarıyla güncellendi');
      } else {
        await ApiService.createBallotBoxObserver(observerData);
        setMessage('Müşahit başarıyla eklendi');
      }
      
      setShowAddObserverForm(false);
      setEditingObserver(null);
      setObserverFormData({
        tc: '',
        name: '',
        phone: '',
        ballot_box_id: '',
        is_chief_observer: false
      });
      fetchAllData();
      setMessageType('success');
    } catch (error) {
      console.error('Error saving observer:', error);
      setMessage('Müşahit kaydedilirken hata oluştu: ' + error.message);
      setMessageType('error');
    }
  };

  const handleObserverEdit = (observer) => {
    setEditingObserver(observer);
    setObserverFormData({
      tc: observer.tc || '',
      name: observer.name || '',
      phone: observer.phone || '',
      ballot_box_id: observer.ballot_box_id ? String(observer.ballot_box_id) : '',
      is_chief_observer: observer.is_chief_observer || false
    });
    setShowAddObserverForm(true);
  };

  const handleObserverDelete = async (observerId) => {
    if (!window.confirm('Bu müşahidi silmek istediğinizden emin misiniz?')) {
      return;
    }
    try {
      await ApiService.deleteBallotBoxObserver(observerId);
      fetchAllData();
      setMessage('Müşahit başarıyla silindi');
      setMessageType('success');
    } catch (error) {
      console.error('Error deleting observer:', error);
      setMessage('Müşahit silinirken hata oluştu');
      setMessageType('error');
    }
  };

  const filteredMembers = managementMembers.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.tc?.includes(searchTerm) ||
    member.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Belde bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hata</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchTownData}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 lg:py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {user.chairmanName}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    {town?.name} Belde Başkanı
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                currentView === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Yönetim Kurulu
            </button>
            <button
              onClick={() => setCurrentView('neighborhoods')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                currentView === 'neighborhoods'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mahalleler
            </button>
            <button
              onClick={() => setCurrentView('villages')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                currentView === 'villages'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Köyler
            </button>
            <button
              onClick={() => setCurrentView('representatives')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                currentView === 'representatives'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Temsilciler
            </button>
            <button
              onClick={() => setCurrentView('ballotBoxes')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                currentView === 'ballotBoxes'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sandıklar
            </button>
            <button
              onClick={() => setCurrentView('observers')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                currentView === 'observers'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Müşahitler
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 ${
          messageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="p-3 rounded-lg">
            {message}
            <button
              onClick={() => setMessage('')}
              className="ml-4 text-sm underline"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Town Info Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600">
            <h2 className="text-xl font-bold text-white">Belde Bilgileri</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Belde Adı</h3>
                <p className="text-gray-600">{town?.name}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bağlı Olduğu İlçe</h3>
                <p className="text-gray-600">{town?.districtName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard View - Management Members */}
        {currentView === 'dashboard' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h2 className="text-xl font-bold text-white">Yönetim Kurulu Üyeleri</h2>
                <button
                  onClick={() => setShowAddMemberForm(true)}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Yeni Üye Ekle
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Üye ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TC</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Görev</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.tc}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.position}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleMemberEdit(member)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleMemberDelete(member.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Neighborhoods View */}
        {currentView === 'neighborhoods' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h2 className="text-xl font-bold text-white">Mahalleler</h2>
                <button
                  onClick={() => setShowAddNeighborhoodForm(true)}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Yeni Mahalle Ekle
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mahalle Adı</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grup No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temsilci</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {neighborhoods.map((neighborhood) => {
                      const rep = neighborhoodRepresentatives.find(r => String(r.neighborhood_id) === String(neighborhood.id));
                      return (
                        <tr key={neighborhood.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{neighborhood.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{neighborhood.group_no || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rep?.name || 'Atanmamış'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleNeighborhoodEdit(neighborhood)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => handleNeighborhoodDelete(neighborhood.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Villages View */}
        {currentView === 'villages' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h2 className="text-xl font-bold text-white">Köyler</h2>
                <button
                  onClick={() => setShowAddVillageForm(true)}
                  className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Yeni Köy Ekle
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Köy Adı</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grup No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temsilci</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {villages.map((village) => {
                      const rep = villageRepresentatives.find(r => String(r.village_id) === String(village.id));
                      return (
                        <tr key={village.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{village.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{village.group_no || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rep?.name || 'Atanmamış'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleVillageEdit(village)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => handleVillageDelete(village.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Representatives View */}
        {currentView === 'representatives' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h2 className="text-xl font-bold text-white">Temsilciler</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setRepresentativeType('neighborhood');
                      setShowAddRepresentativeForm(true);
                    }}
                    className="px-4 py-2 bg-white text-yellow-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Mahalle Temsilcisi Ekle
                  </button>
                  <button
                    onClick={() => {
                      setRepresentativeType('village');
                      setShowAddRepresentativeForm(true);
                    }}
                    className="px-4 py-2 bg-white text-yellow-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Köy Temsilcisi Ekle
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setRepresentativeType('neighborhood')}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      representativeType === 'neighborhood'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Mahalle Temsilcileri
                  </button>
                  <button
                    onClick={() => setRepresentativeType('village')}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      representativeType === 'village'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Köy Temsilcileri
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TC</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {representativeType === 'neighborhood' ? 'Mahalle' : 'Köy'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(representativeType === 'neighborhood' ? neighborhoodRepresentatives : villageRepresentatives).map((rep) => (
                      <tr key={rep.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rep.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rep.tc}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rep.phone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {representativeType === 'neighborhood' ? rep.neighborhood_name : rep.village_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleRepresentativeEdit(rep, representativeType)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleRepresentativeDelete(rep.id, representativeType)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Ballot Boxes View */}
        {currentView === 'ballotBoxes' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-red-500 to-pink-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h2 className="text-xl font-bold text-white">Sandıklar</h2>
                <button
                  onClick={() => setShowAddBallotBoxForm(true)}
                  className="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Yeni Sandık Ekle
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sandık No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kurum Adı</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mahalle/Köy</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başmüşahit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ballotBoxes.map((ballotBox) => {
                      const chiefObserver = observers.find(obs => 
                        String(obs.ballot_box_id) === String(ballotBox.id) && obs.is_chief_observer
                      );
                      const location = ballotBox.neighborhood_id 
                        ? neighborhoods.find(n => String(n.id) === String(ballotBox.neighborhood_id))?.name
                        : ballotBox.village_id
                        ? villages.find(v => String(v.id) === String(ballotBox.village_id))?.name
                        : '-';
                      
                      return (
                        <tr key={ballotBox.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ballotBox.ballot_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ballotBox.institution_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{location}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chiefObserver?.name || 'Atanmamış'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleBallotBoxEdit(ballotBox)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => handleBallotBoxDelete(ballotBox.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Observers View */}
        {currentView === 'observers' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h2 className="text-xl font-bold text-white">Müşahitler</h2>
                <button
                  onClick={() => setShowAddObserverForm(true)}
                  className="px-4 py-2 bg-white text-teal-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Yeni Müşahit Ekle
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TC</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sandık</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tip</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {observers.map((observer) => {
                      const ballotBox = ballotBoxes.find(bb => String(bb.id) === String(observer.ballot_box_id));
                      return (
                        <tr key={observer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{observer.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{observer.tc}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{observer.phone || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ballotBox ? `${ballotBox.ballot_number} - ${ballotBox.institution_name}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {observer.is_chief_observer ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Başmüşahit
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                Müşahit
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleObserverEdit(observer)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => handleObserverDelete(observer.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Management Member Modal */}
      {showAddMemberForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingMember ? 'Üye Düzenle' : 'Yeni Üye Ekle'}
              </h3>
            </div>
            
            <form onSubmit={handleMemberSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No *</label>
                  <input
                    type="text"
                    name="tc"
                    value={memberFormData.tc}
                    onChange={handleMemberInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                  <input
                    type="text"
                    name="name"
                    value={memberFormData.name}
                    onChange={handleMemberInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bölge *</label>
                  <input
                    type="text"
                    name="region"
                    value={memberFormData.region}
                    onChange={handleMemberInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Görev *</label>
                  <input
                    type="text"
                    name="position"
                    value={memberFormData.position}
                    onChange={handleMemberInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    name="phone"
                    value={memberFormData.phone}
                    onChange={handleMemberInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    name="email"
                    value={memberFormData.email}
                    onChange={handleMemberInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <textarea
                  name="address"
                  value={memberFormData.address}
                  onChange={handleMemberInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberForm(false);
                    setEditingMember(null);
                    setMemberFormData({
                      tc: '',
                      name: '',
                      region: '',
                      position: '',
                      phone: '',
                      address: '',
                      email: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingMember ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Neighborhood Modal */}
      {showAddNeighborhoodForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingNeighborhood ? 'Mahalle Düzenle' : 'Yeni Mahalle Ekle'}
              </h3>
            </div>
            
            <form onSubmit={handleNeighborhoodSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mahalle Adı *</label>
                <input
                  type="text"
                  name="name"
                  value={neighborhoodFormData.name}
                  onChange={handleNeighborhoodInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grup No</label>
                <input
                  type="number"
                  name="group_no"
                  value={neighborhoodFormData.group_no}
                  onChange={handleNeighborhoodInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddNeighborhoodForm(false);
                    setEditingNeighborhood(null);
                    setNeighborhoodFormData({ name: '', group_no: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingNeighborhood ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Village Modal */}
      {showAddVillageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingVillage ? 'Köy Düzenle' : 'Yeni Köy Ekle'}
              </h3>
            </div>
            
            <form onSubmit={handleVillageSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Köy Adı *</label>
                <input
                  type="text"
                  name="name"
                  value={villageFormData.name}
                  onChange={handleVillageInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grup No</label>
                <input
                  type="number"
                  name="group_no"
                  value={villageFormData.group_no}
                  onChange={handleVillageInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddVillageForm(false);
                    setEditingVillage(null);
                    setVillageFormData({ name: '', group_no: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingVillage ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Representative Modal */}
      {showAddRepresentativeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingRepresentative ? `${representativeType === 'neighborhood' ? 'Mahalle' : 'Köy'} Temsilcisi Düzenle` : `Yeni ${representativeType === 'neighborhood' ? 'Mahalle' : 'Köy'} Temsilcisi Ekle`}
              </h3>
            </div>
            
            <form onSubmit={handleRepresentativeSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                  <input
                    type="text"
                    name="name"
                    value={representativeFormData.name}
                    onChange={handleRepresentativeInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No *</label>
                  <input
                    type="text"
                    name="tc"
                    value={representativeFormData.tc}
                    onChange={handleRepresentativeInputChange}
                    required
                    maxLength={11}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    name="phone"
                    value={representativeFormData.phone}
                    onChange={handleRepresentativeInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                {representativeType === 'neighborhood' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mahalle *</label>
                    <select
                      name="neighborhood_id"
                      value={representativeFormData.neighborhood_id}
                      onChange={handleRepresentativeInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Mahalle Seçin</option>
                      {neighborhoods.map(n => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Köy *</label>
                    <select
                      name="village_id"
                      value={representativeFormData.village_id}
                      onChange={handleRepresentativeInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Köy Seçin</option>
                      {villages.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Üye (Opsiyonel)</label>
                  <select
                    name="member_id"
                    value={representativeFormData.member_id}
                    onChange={handleRepresentativeInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Üye Seçin</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} - {m.tc}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRepresentativeForm(false);
                    setEditingRepresentative(null);
                    setRepresentativeFormData({
                      name: '',
                      tc: '',
                      phone: '',
                      neighborhood_id: '',
                      village_id: '',
                      member_id: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingRepresentative ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Ballot Box Modal */}
      {showAddBallotBoxForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingBallotBox ? 'Sandık Düzenle' : 'Yeni Sandık Ekle'}
              </h3>
            </div>
            
            <form onSubmit={handleBallotBoxSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sandık Numarası *</label>
                  <input
                    type="text"
                    name="ballot_number"
                    value={ballotBoxFormData.ballot_number}
                    onChange={handleBallotBoxInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kurum Adı *</label>
                  <input
                    type="text"
                    name="institution_name"
                    value={ballotBoxFormData.institution_name}
                    onChange={handleBallotBoxInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mahalle</label>
                  <select
                    name="neighborhood_id"
                    value={ballotBoxFormData.neighborhood_id}
                    onChange={handleBallotBoxInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Mahalle Seçin</option>
                    {neighborhoods.map(n => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Köy</label>
                  <select
                    name="village_id"
                    value={ballotBoxFormData.village_id}
                    onChange={handleBallotBoxInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Köy Seçin</option>
                    {villages.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-500">Not: Mahalle veya köy seçimi gereklidir.</p>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBallotBoxForm(false);
                    setEditingBallotBox(null);
                    setBallotBoxFormData({
                      ballot_number: '',
                      institution_name: '',
                      neighborhood_id: '',
                      village_id: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingBallotBox ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Observer Modal */}
      {showAddObserverForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingObserver ? 'Müşahit Düzenle' : 'Yeni Müşahit Ekle'}
              </h3>
            </div>
            
            <form onSubmit={handleObserverSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                  <input
                    type="text"
                    name="name"
                    value={observerFormData.name}
                    onChange={handleObserverInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No *</label>
                  <input
                    type="text"
                    name="tc"
                    value={observerFormData.tc}
                    onChange={handleObserverInputChange}
                    required
                    maxLength={11}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                  <input
                    type="text"
                    name="phone"
                    value={observerFormData.phone}
                    onChange={handleObserverInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sandık *</label>
                  <select
                    name="ballot_box_id"
                    value={observerFormData.ballot_box_id}
                    onChange={handleObserverInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Sandık Seçin</option>
                    {ballotBoxes.map(bb => (
                      <option key={bb.id} value={bb.id}>
                        {bb.ballot_number} - {bb.institution_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="is_chief_observer"
                      checked={observerFormData.is_chief_observer}
                      onChange={handleObserverInputChange}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Başmüşahit</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddObserverForm(false);
                    setEditingObserver(null);
                    setObserverFormData({
                      tc: '',
                      name: '',
                      phone: '',
                      ballot_box_id: '',
                      is_chief_observer: false
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingObserver ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default TownPresidentDashboardPage;
