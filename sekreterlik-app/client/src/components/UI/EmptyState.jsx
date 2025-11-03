import React from 'react';
import Card from './Card';

const EmptyState = ({ title = 'Kayıt bulunamadı', subtitle = 'Filtreleri değiştirerek tekrar deneyin.', action, card = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center text-center text-gray-500 py-10">
      <div className="text-lg font-medium text-gray-700">{title}</div>
      <div className="text-sm mt-1">{subtitle}</div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );

  if (card) {
    return <Card className="border border-gray-100">{content}</Card>;
  }
  return content;
};

export default EmptyState;


