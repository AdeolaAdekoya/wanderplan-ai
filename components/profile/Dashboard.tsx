import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, SavedTrip } from '../../types';
import { storageService } from '../../services/storageService';
import { Passport } from './Passport';
import { Button } from '../ui/Button';
import { LogOutIcon, PlusIcon, CalendarIcon, MapPinIcon, CameraIcon, UserIcon, ShareIcon } from '../ui/Icons';
import { MAX_AVATAR_SIZE } from '../../constants';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
  onNewTrip: () => void;
  onViewTrip: (trip: SavedTrip) => void;
}

interface TripCardProps {
  trip: SavedTrip;
  isShared?: boolean;
  onViewTrip: (trip: SavedTrip) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, isShared, onViewTrip }) => (
  <div 
    onClick={() => onViewTrip(trip)}
    className="bg-white rounded-lg border border-stone-200 hover:border-stone-400 transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col"
  >
      {isShared && (
        <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur border border-stone-200 text-stone-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
           <ShareIcon className="w-3 h-3" /> Shared
        </div>
      )}

      <div className="h-40 bg-stone-100 relative overflow-hidden">
         {/* Minimal abstract pattern or solid color instead of gradient */}
         <div className={`absolute inset-0 ${isShared ? 'bg-stone-200' : 'bg-stone-800'}`}></div>
         <div className="absolute inset-0 flex items-center justify-center opacity-10">
             <MapPinIcon className="w-20 h-20 text-white" />
         </div>
         
         <div className="absolute bottom-4 left-4 text-white">
            <h3 className="font-playfair font-bold text-2xl leading-none">{trip.city}</h3>
            <p className="text-xs uppercase tracking-widest opacity-80 mt-1">{trip.country}</p>
         </div>
      </div>
      
      <div className="p-5 flex-grow flex flex-col justify-between">
         <div>
            <h4 className="font-bold text-stone-900 mb-1 truncate text-sm">{trip.tripName}</h4>
            <div className="flex items-center text-xs text-stone-500 font-mono">
                <CalendarIcon className="w-3 h-3 mr-1.5" />
                {new Date(trip.startDate).toLocaleDateString()}
            </div>
         </div>
         <div className="mt-4 pt-4 border-t border-stone-100 flex justify-end">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 group-hover:text-stone-900 transition-colors">Open Plan &rarr;</span>
         </div>
      </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onNewTrip, onViewTrip }) => {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTrips(storageService.getUserTrips(user.email));
  }, [user.email]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_AVATAR_SIZE) { 
        alert("Image is too large. Please use an image under 500kb.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        try {
          const updated = storageService.updateUserAvatar(user.email, base64);
          setCurrentUser(updated);
        } catch (err) {
          console.error("Failed to save avatar", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const myTrips = trips.filter(t => t.userEmail === user.email);
  const sharedTrips = trips.filter(t => t.userEmail !== user.email);

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans pb-20 text-stone-900">
       <header className="bg-white border-b border-stone-200 px-6 py-5 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
             <div className="font-playfair font-bold text-xl text-stone-900 tracking-tight">WanderPlan</div>
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                   <div className="text-right hidden sm:block">
                      <div className="text-sm font-bold text-stone-900">{currentUser.name}</div>
                      <div className="text-[10px] text-stone-500 uppercase tracking-wide">{currentUser.email}</div>
                   </div>
                   
                   <div 
                     className="relative w-10 h-10 rounded-full overflow-hidden border border-stone-200 group cursor-pointer bg-stone-100"
                     onClick={() => fileInputRef.current?.click()}
                     title="Change Avatar"
                   >
                      {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                           <UserIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center text-white">
                         <CameraIcon className="w-4 h-4" />
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                   </div>
                </div>
                
                <div className="w-px h-6 bg-stone-200"></div>

                <button 
                  onClick={onLogout}
                  className="text-stone-400 hover:text-stone-900 transition-colors text-xs font-bold uppercase tracking-wider"
                >
                   Sign Out
                </button>
             </div>
          </div>
       </header>

       <main className="max-w-6xl mx-auto px-6 py-12 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 pb-8 border-b border-stone-200">
             <div>
                <h1 className="text-4xl md:text-5xl font-playfair font-bold text-stone-900 mb-2">
                   Hello, {currentUser.name.split(' ')[0]}.
                </h1>
                <p className="text-stone-500 text-lg">Where to next?</p>
             </div>
             <Button onClick={onNewTrip} className="shadow-none py-3 px-6 text-sm">
                <PlusIcon className="w-4 h-4 mr-2" /> Plan New Trip
             </Button>
          </div>

          <Passport user={currentUser} />

          <div>
             <div className="flex items-center gap-3 mb-8">
                <h2 className="text-2xl font-playfair font-bold text-stone-900">Travel Journal</h2>
                <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded-full border border-stone-200">
                    {trips.length}
                </span>
             </div>

             {trips.length === 0 ? (
                <div className="bg-white rounded-lg border border-dashed border-stone-300 p-16 text-center">
                   <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPinIcon className="w-8 h-8 text-stone-300" />
                   </div>
                   <h3 className="text-lg font-bold text-stone-900 mb-1">Your journal is empty</h3>
                   <p className="text-stone-500 mb-6 max-w-sm mx-auto">Start planning your first adventure to build your collection.</p>
                   <Button variant="outline" onClick={onNewTrip}>Create Itinerary</Button>
                </div>
             ) : (
                <div className="space-y-12">
                   {myTrips.length > 0 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {myTrips.map(trip => <TripCard key={trip.id} trip={trip} onViewTrip={onViewTrip} />)}
                     </div>
                   )}

                   {sharedTrips.length > 0 && (
                      <div className="bg-white p-8 rounded-xl border border-stone-200">
                          <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                             <ShareIcon className="w-4 h-4" /> Shared with You
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                             {sharedTrips.map(trip => <TripCard key={trip.id} trip={trip} isShared onViewTrip={onViewTrip} />)}
                          </div>
                      </div>
                   )}
                </div>
             )}
          </div>

       </main>
    </div>
  );
};