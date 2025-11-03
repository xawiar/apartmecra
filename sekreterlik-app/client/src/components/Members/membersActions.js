// Members page actions handler
export const membersActions = {
  handleAddMember: (setFormMode, setSelectedMember, setIsFormModalOpen) => {
    return () => {
      setFormMode('create');
      setSelectedMember(null);
      setIsFormModalOpen(true);
    };
  },

  handleEditMember: (members, setFormMode, setSelectedMember, setIsFormModalOpen) => {
    return (id) => {
      const member = members.find(m => m.id === id);
      if (member) {
        setFormMode('edit');
        setSelectedMember(member);
        setIsFormModalOpen(true);
      }
    };
  },

  handleArchiveMember: (ApiService, fetchMembers) => {
    return async (id) => {
      if (window.confirm('Bu üyeyi arşivlemek istediğinize emin misiniz?')) {
        try {
          await ApiService.archiveMember(id);
          fetchMembers(); // Refresh the list
          alert('Üye başarıyla arşivlendi');
        } catch (error) {
          console.error('Error archiving member:', error);
          alert('Üye arşivlenirken hata oluştu: ' + error.message);
        }
      }
    };
  },

  handleShowMember: (ApiService, setSelectedMember, setIsDetailModalOpen) => {
    return async (id) => {
      try {
        const member = await ApiService.getMemberById(id);
        setSelectedMember(member);
        setIsDetailModalOpen(true);
      } catch (error) {
        console.error('Error fetching member details:', error);
      }
    };
  },

  handleImportExcel: (ApiService, fetchMembers) => {
    return async (file) => {
      try {
        // Send the file to the server
        const result = await ApiService.importMembersFromExcel(file);
        fetchMembers(); // Refresh the list
        console.log('Members imported from Excel:', result);
        alert(`${result.count} üye başarıyla içe aktarıldı.`);
        if (result.errors && result.errors.length > 0) {
          alert('Hatalar oluştu:\n' + result.errors.join('\n'));
        }
      } catch (error) {
        console.error('Error importing members from Excel:', error);
        alert('Excel içe aktarımı sırasında bir hata oluştu: ' + error.message);
      }
    };
  },

  handleExportExcel: (members, meetings, calculateMeetingStats) => {
    return async () => {
      try {
        // Create a CSV string from the current members data
        let csvContent = "TC,İsim Soyisim,Telefon,Görev,Bölge,İlçe,Toplantı Sayısı,Katıldığı, Katılım %\n";
        
        members.forEach(member => {
          const stats = calculateMeetingStats(member, meetings);
          csvContent += `${member.tc},${member.name},${member.phone},${member.position},${member.region},${member.district},${stats.totalMeetings},${stats.attendedMeetings},${stats.attendancePercentage}%\n`;
        });
        
        // Create a Blob with the CSV content
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Create a download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'uyeler.csv');
        link.style.visibility = 'hidden';
        
        // Append to the document, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Members exported to Excel');
      } catch (error) {
        console.error('Error exporting members to Excel:', error);
        alert('Excel dışa aktarımı sırasında bir hata oluştu');
      }
    };
  },

  closeDetailModal: (setIsDetailModalOpen, setSelectedMember) => {
    return () => {
      setIsDetailModalOpen(false);
      setSelectedMember(null);
    };
  },

  closeFormModal: (setIsFormModalOpen, setSelectedMember) => {
    return () => {
      setIsFormModalOpen(false);
      setSelectedMember(null);
    };
  },

  handleMemberSaved: (fetchMembers, closeFormModal) => {
    return () => {
      fetchMembers(); // Refresh the members list
      closeFormModal();
    };
  },

  handleSort: (sortConfig, setSortConfig) => {
    return (key) => {
      let direction = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      setSortConfig({ key, direction });
    };
  }
};