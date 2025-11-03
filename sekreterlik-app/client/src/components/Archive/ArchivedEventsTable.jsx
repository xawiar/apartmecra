import React from 'react';

const ArchivedEventsTable = ({ archivedEvents, onDeleteEvent }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ad</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarih</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Yer</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlemler</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {archivedEvents.map((ev) => (
            <tr key={ev.id} className="hover:bg-gray-50 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ev.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ev.date}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ev.location}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onDeleteEvent(ev.id)}
                  className="text-red-600 hover:text-red-900 transition-colors p-1 rounded-full hover:bg-red-50"
                  title="Sil"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
          {archivedEvents.length === 0 && (
            <tr>
              <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">Arşivlenmiş etkinlik yok</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ArchivedEventsTable;


