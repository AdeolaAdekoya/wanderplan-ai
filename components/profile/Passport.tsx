import React from 'react';
import { UserProfile } from '../../types';
import { TrophyIcon, GlobeIcon, StampIcon } from '../ui/Icons';
import { RANKS } from '../../constants';

interface PassportProps {
  user: UserProfile;
}

export const Passport: React.FC<PassportProps> = ({ user }) => {
  const currentRank = [...RANKS].reverse().find(r => user.tripsCount >= r.minTrips) || RANKS[0];
  const nextRank = RANKS.find(r => r.minTrips > user.tripsCount);
  const progress = nextRank 
    ? Math.min(100, (user.tripsCount / nextRank.minTrips) * 100)
    : 100;

  const getRotation = (str: string) => {
    const val = str.length % 3 === 0 ? -12 : str.length % 2 === 0 ? 6 : 15;
    return `rotate-[${val}deg]`;
  };

  return (
    <div className="bg-[#1c1917] rounded-xl shadow-xl overflow-hidden relative text-white max-w-3xl">
      {/* Texture */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1h2v2H1V1zm4 4h2v2H5V5zm4 4h2v2H9V9z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}>
      </div>

      <div className="flex flex-col md:flex-row">
          {/* Left Panel: ID */}
          <div className="p-8 md:w-1/3 border-b md:border-b-0 md:border-r border-stone-800 bg-stone-900/50">
             <div className="mb-6">
                <div className="w-12 h-12 border-2 border-stone-700 rounded-full flex items-center justify-center mb-4">
                    <GlobeIcon className="w-6 h-6 text-stone-500" />
                </div>
                <h2 className="text-xl font-playfair font-bold tracking-wide">Passport</h2>
                <p className="text-stone-500 text-xs font-mono uppercase mt-1">Republic of WanderPlan</p>
             </div>
             
             <div>
                 <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Holder Rank</div>
                 <div className="text-lg font-bold text-white mb-4">{currentRank.name}</div>
                 
                 {nextRank && (
                    <div>
                        <div className="flex justify-between text-[10px] text-stone-500 mb-1 font-mono">
                            <span>PROGRESS</span>
                            <span>{user.tripsCount}/{nextRank.minTrips}</span>
                        </div>
                        <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                            <div className="h-full bg-white transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}
             </div>
          </div>

          {/* Right Panel: Stamps */}
          <div className="p-8 md:w-2/3 bg-[#1c1917]">
             <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-4 font-mono">Visa Stamps</div>
             
             <div className="min-h-[160px]">
                {user.countriesVisited.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-stone-700 py-4 text-center border-2 border-dashed border-stone-800 rounded-lg">
                        <p className="text-xs font-mono">NO STAMPS RECORDED</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        {user.countriesVisited.map((country, idx) => (
                            <div key={idx} className={`group relative flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 border-stone-700 text-stone-400 opacity-80 hover:opacity-100 hover:bg-stone-800 transition-all cursor-default ${getRotation(country)}`}>
                                <div className="absolute inset-0 rounded-full border border-stone-800 m-0.5"></div>
                                <span className="text-[8px] font-bold uppercase tracking-tighter text-center leading-none px-1">{country.slice(0, 10)}</span>
                                <div className="text-[6px] mt-0.5 font-mono opacity-50">{new Date().getFullYear()}</div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          </div>
      </div>
    </div>
  );
};