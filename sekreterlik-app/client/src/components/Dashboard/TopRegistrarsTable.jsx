import React from 'react';

const TopRegistrarsTable = ({ topRegistrars }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">En Çok Üye Kaydı Yapanlar</h2>
      {topRegistrars.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Üye Adı
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kaydedilen Üye Sayısı
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {topRegistrars.map((item, index) => (
                <tr key={item.member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      <span className="mr-2">{index + 1}.</span>
                      {item.member.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {item.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Henüz kayıt bulunmamaktadır.</p>
      )}
    </div>
  );
};

export default TopRegistrarsTable;