import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({ open, title = 'Are you sure?', description = 'This action cannot be undone.', onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" data-testid="confirm-dialog">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 fade-in-up">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 bg-[#FFEBEE] text-[#E53935] rounded-xl flex items-center justify-center flex-shrink-0"><AlertTriangle size={20} /></span>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm text-[#555555] mt-1">{description}</p>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-[#FAFAFA] rounded" data-testid="confirm-close"><X size={16} /></button>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary" data-testid="confirm-cancel">Cancel</button>
          <button onClick={onConfirm} className="btn-primary" data-testid="confirm-delete">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
