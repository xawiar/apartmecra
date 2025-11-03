import React from 'react';

const MemberRegistrationDetails = ({ member, registrations }) => {
  // Calculate total registered members
  const totalRegistrations = registrations.reduce((sum, reg) => sum + reg.count, 0);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 shadow-lg">
        <h3 className="text-lg font-medium text-white mb-2">Toplam Kayıtlı Üye</h3>
        <p className="text-3xl font-bold text-white">{totalRegistrations}</p>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Üye Kayıt Geçmişi</h3>
        {registrations.length === 0 ? (
          <p className="text-gray-500 italic">Henüz üye kaydı bulunmamaktadır.</p>
        ) : (
          <div className="overflow-hidden shadow-lg rounded-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-500 to-purple-600">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">
                    Tarih
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                    Üye Sayısı
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {registrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {registration.date}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {registration.count}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                    Toplam
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    {totalRegistrations}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberRegistrationDetails;