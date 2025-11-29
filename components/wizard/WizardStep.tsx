import React from 'react';

interface WizardStepProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const WizardStep: React.FC<WizardStepProps> = ({ title, subtitle, children }) => {
  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">{title}</h2>
      {subtitle && <p className="text-stone-500 text-lg mb-8">{subtitle}</p>}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};