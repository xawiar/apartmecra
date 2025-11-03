import React from 'react';
import ExcelImportButton from './Members/ExcelImportButton';
import ExcelExportButton from './Members/ExcelExportButton';

const ExcelImportExport = ({ onImport, onExport }) => {
  return (
    <div className="flex space-x-2">
      <ExcelImportButton onImport={onImport} />
      <ExcelExportButton onExport={onExport} />
    </div>
  );
};

export default ExcelImportExport;