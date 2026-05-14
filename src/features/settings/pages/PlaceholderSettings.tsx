import React from 'react';

interface PlaceholderSettingsProps {
  title: string;
}

export const PlaceholderSettings: React.FC<PlaceholderSettingsProps> = ({ title }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="glass-card p-6 rounded-2xl border border-white/10 bg-white/5">
        <p className="text-gray-400">هذه الميزة قيد التطوير حالياً.</p>
      </div>
    </div>
  );
};
