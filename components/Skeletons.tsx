import React from "react";

export const CardSkeleton: React.FC = () => {
  return (
    <div className="glass-card rounded-[2rem] p-8 border border-white/5 flex flex-col relative overflow-hidden animate-pulse min-h-[300px]">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      
      {/* Category Tag & Featured */}
      <div className="flex justify-between items-center mb-6">
        <div className="bg-white/10 h-6 w-20 rounded-full"></div>
        <div className="bg-white/10 h-6 w-16 rounded-full"></div>
      </div>
      
      {/* Title */}
      <div className="h-8 bg-white/10 rounded-lg w-3/4 mb-4"></div>
      <div className="h-8 bg-white/10 rounded-lg w-1/2 mb-6"></div>
      
      {/* Content lines */}
      <div className="space-y-3 mb-8 flex-grow">
        <div className="h-4 bg-white/5 rounded w-full"></div>
        <div className="h-4 bg-white/5 rounded w-full"></div>
        <div className="h-4 bg-white/5 rounded w-5/6"></div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10"></div>
          <div>
            <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
            <div className="h-3 bg-white/5 rounded w-16"></div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="h-6 w-10 bg-white/10 rounded-lg"></div>
          <div className="h-6 w-10 bg-white/10 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export const StatsSkeleton: React.FC = () => {
  return (
    <div className="glass p-8 rounded-3xl border border-white/5 text-center relative overflow-hidden animate-pulse">
      <div className="w-16 h-16 bg-white/5 rounded-2xl mx-auto mb-4"></div>
      <div className="h-3 bg-white/20 w-20 mx-auto rounded mb-4"></div>
      <div className="h-8 bg-white/10 w-24 mx-auto rounded"></div>
    </div>
  );
};

export const TableRowSkeleton: React.FC = () => {
  return (
    <tr className="border-b border-white/5 bg-white/5 animate-pulse">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10"></div>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 bg-white/10 rounded"></div>
            <div className="h-3 w-40 bg-white/5 rounded"></div>
          </div>
        </div>
      </td>
      <td className="p-4"><div className="h-4 w-24 bg-white/10 rounded"></div></td>
      <td className="p-4 hidden md:table-cell"><div className="h-4 w-20 bg-white/10 rounded"></div></td>
      <td className="p-4 hidden lg:table-cell"><div className="h-4 w-16 bg-white/10 rounded"></div></td>
      <td className="p-4 text-left"><div className="h-8 w-8 bg-white/10 rounded-lg ml-auto"></div></td>
    </tr>
  );
};
