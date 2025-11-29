import React, { useState, useEffect } from 'react';
import { generateItinerary } from './services/geminiService';
import { UserPreferences, TimePreference, TravelItinerary, UserProfile } from './types';
import { Button } from './components/ui/Button';
import { Autocomplete } from './components/ui/Autocomplete';
import { AutocompleteWithAPI } from './components/ui/AutocompleteWithAPI';
import { DatePickerInput } from './components/ui/DatePicker';
import { WizardStep } from './components/wizard/WizardStep';
import { ItineraryDisplay } from './components/ItineraryDisplay';
import { COUNTRIES } from './data/countries';
import { CITIES } from './data/cities';
import { INTEREST_OPTIONS, CURRENCIES, LOADING_MESSAGE_INTERVAL } from './constants';
import { formatDate, getTomorrow, getDaysFromDate, calculateDuration } from './utils/dateUtils';
import { getErrorMessage, isQuotaError } from './utils/errorHandling';
import { 
  GlobeIcon, 
  UserIcon, 
  UsersIcon, 
  HeartIcon, 
  BedIcon, 
  HomeIcon, 
  PlaneOutlineIcon, 
  LuggageIcon,
  AlertTriangleIcon,
  XIcon
} from './components/ui/Icons';

// Default to tomorrow and 3 days later for initial state
const tomorrow = getTomorrow();
const threeDaysLater = getDaysFromDate(tomorrow, 3);

const INITIAL_PREFS: UserPreferences = {
  name: '',
  travelParty: 'Solo',
  destinationCountry: '',
  destinationCity: '',
  startDate: formatDate(tomorrow),
  endDate: formatDate(threeDaysLater),
  timePreference: TimePreference.BALANCED,
  interests: [],
  needsAccommodation: false,
  currency: 'USD',
  totalBudget: '',
  budgetFlexibility: 'Flexible',
};

const LoadingOverlay = ({ city }: { city: string }) => {
  const [msgIndex, setMsgIndex] = useState(0);
  const messages = [
    `Scouting the best spots in ${city}...`,
    "Comparing hotel ratings...",
    "Curating local culinary gems...",
    "Optimizing travel routes...",
    "Checking upcoming events...",
    "Polishing your itinerary..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % messages.length);
    }, LOADING_MESSAGE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#FAFAF9] z-50 flex flex-col items-center justify-center p-4">
       <div className="w-24 h-24 mb-10 relative flex items-center justify-center">
          <div className="absolute inset-0 border border-stone-200 rounded-full"></div>
          <div className="absolute inset-0 border border-stone-900 rounded-full border-t-transparent animate-spin"></div>
          <LuggageIcon className="w-8 h-8 text-stone-900 animate-pulse" />
       </div>
       <h2 className="text-2xl font-playfair font-bold text-stone-900 mb-3 text-center animate-in fade-in zoom-in duration-500 key-{msgIndex}">
          {messages[msgIndex]}
       </h2>
       <p className="text-stone-500 text-sm font-medium tracking-wide">AI IS GENERATING YOUR TRIP</p>
    </div>
  );
};

type ViewState = 'WIZARD' | 'ITINERARY';

function App() {
  const [view, setView] = useState<ViewState>('WIZARD');
  
  // Wizard State
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<UserPreferences>(INITIAL_PREFS);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TravelItinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Invite System State
  const [inviteEmail, setInviteEmail] = useState(""); 
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [travelParty, setTravelParty] = useState<UserProfile[]>([]);

  // Auto-dismiss error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // --- Navigation Handlers ---
  const handleBackToWizard = () => {
    setResult(null);
    setPrefs(INITIAL_PREFS);
    setStep(0);
    setTravelParty([]);
    setInvitedEmails([]);
    setView('WIZARD');
  };

  const handleTripUpdate = (updatedItinerary: TravelItinerary) => {
    setResult(updatedItinerary);
  };

  // --- Wizard Logic ---

  const updatePref = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPrefs(prev => {
      if (key === 'destinationCountry' && value !== prev.destinationCountry) {
         return { ...prev, [key]: value, destinationCity: '' };
      }
      return { ...prev, [key]: value };
    });
  };

  const handleInterestToggle = (interest: string) => {
    setPrefs(prev => {
      const exists = prev.interests.includes(interest);
      if (exists) {
        return { ...prev, interests: prev.interests.filter(i => i !== interest) };
      }
      return { ...prev, interests: [...prev.interests, interest] };
    });
  };

  const handleSendInvite = () => {
    if (inviteEmail && !invitedEmails.includes(inviteEmail)) {
      setInvitedEmails([...invitedEmails, inviteEmail]);
      setInviteEmail("");
    }
  };

  const handleRemoveInvite = (emailToRemove: string) => {
    setInvitedEmails(invitedEmails.filter(email => email !== emailToRemove));
  };

  const getDuration = () => {
    return calculateDuration(prefs.startDate, prefs.endDate);
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateItinerary(prefs);
      
      data.destinationCity = prefs.destinationCity;
      data.destinationCountry = prefs.destinationCountry;
      data.startDate = prefs.startDate;
      data.endDate = prefs.endDate;

      setResult(data);
      setView('ITINERARY');
    } catch (err: unknown) {
      console.error('Error generating itinerary:', err);
      if (isQuotaError(err)) {
         setError("We are experiencing high traffic volume. Please wait a moment and try again.");
      } else {
         const errorMessage = getErrorMessage(err);
         setError(errorMessage || "We encountered an issue creating your itinerary. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER ---

  if (isLoading) {
    return <LoadingOverlay city={prefs.destinationCity} />;
  }

  if (view === 'ITINERARY' && result) {
    return (
      <ItineraryDisplay 
        data={result} 
        onReset={handleBackToWizard} 
        city={prefs.destinationCity} 
        interests={prefs.interests}
        travelParty={travelParty}
        onItineraryChange={handleTripUpdate}
      />
    );
  }

  // WIZARD VIEW
  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col font-sans text-stone-900">
      
      {/* Header */}
      <header className="px-6 py-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={handleBackToWizard}>
           <GlobeIcon className="w-6 h-6 text-stone-900 group-hover:rotate-12 transition-transform" />
           <span className="font-playfair font-bold text-xl tracking-tight">WanderPlan</span>
        </div>
        <div className="flex items-center gap-6">
           {step > 0 && (
             <div className="text-xs font-bold tracking-widest text-stone-400 uppercase hidden sm:block">
               Step {step} / 6
             </div>
           )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center px-6 pb-20">
        
        {error && (
          <div className="max-w-2xl mx-auto w-full mb-8 p-4 bg-red-50 text-red-900 rounded-lg border border-red-100 flex items-center justify-center text-sm font-medium">
            <AlertTriangleIcon className="w-5 h-5 mr-2 text-red-500" /> {error}
          </div>
        )}

        {/* STEP 0: Name */}
        {step === 0 && (
           <WizardStep title="Let's start with your name." subtitle="So we can personalize your journey.">
              <input 
                type="text"
                className="w-full text-3xl md:text-5xl font-playfair font-bold border-b border-stone-300 focus:border-stone-900 outline-none bg-transparent py-4 text-stone-900 placeholder:text-stone-300 transition-colors"
                placeholder="Type your name..."
                value={prefs.name}
                onChange={(e) => updatePref('name', e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && prefs.name && nextStep()}
              />
               <div className="flex justify-between pt-12">
                <div />
                <Button onClick={nextStep} disabled={!prefs.name}>Next</Button>
              </div>
           </WizardStep>
        )}

        {/* STEP 1: Destination */}
        {step === 1 && (
          <WizardStep title={`Hi ${prefs.name.split(' ')[0]}, where to?`} subtitle="Focus on a specific city or region for the best plan.">
            <div className="grid gap-8">
              <Autocomplete 
                label="Country"
                placeholder="Search for a country..."
                options={COUNTRIES}
                value={prefs.destinationCountry}
                onChange={(val) => updatePref('destinationCountry', val)}
              />
              
              <Autocomplete
                label="City or Region"
                placeholder={prefs.destinationCountry ? `Search cities in ${prefs.destinationCountry}...` : "Select a country first"}
                options={CITIES[prefs.destinationCountry] || []}
                value={prefs.destinationCity}
                onChange={(val) => updatePref('destinationCity', val)}
                className={!prefs.destinationCountry ? "opacity-50 pointer-events-none" : ""}
              />
            </div>
            <div className="flex justify-between pt-12">
              <Button variant="ghost" onClick={prevStep}>Back</Button>
              <Button 
                onClick={nextStep} 
                disabled={!prefs.destinationCountry || !prefs.destinationCity}
              >
                Next
              </Button>
            </div>
          </WizardStep>
        )}

         {/* STEP 2: Travel Party */}
         {step === 2 && (
          <WizardStep title="Who is traveling?" subtitle="We'll adjust the vibe based on your group.">
            <div className="grid grid-cols-2 gap-4">
              {['Solo', 'Couple', 'Family', 'Friends'].map((type) => (
                <button
                  key={type}
                  onClick={() => updatePref('travelParty', type)}
                  className={`p-6 rounded-xl border transition-all flex flex-col items-center justify-center ${
                    prefs.travelParty === type
                      ? 'border-stone-900 bg-stone-100 text-stone-900 shadow-sm ring-1 ring-stone-900'
                      : 'border-stone-200 bg-white text-stone-500 hover:border-stone-400 hover:text-stone-800'
                  }`}
                >
                  {type === 'Solo' && <UserIcon className="w-8 h-8 mb-3" />}
                  {type === 'Couple' && <HeartIcon className="w-8 h-8 mb-3" />}
                  {type === 'Family' && <UsersIcon className="w-8 h-8 mb-3" />}
                  {type === 'Friends' && <UsersIcon className="w-8 h-8 mb-3" />}
                  <div className="font-bold">{type}</div>
                </button>
              ))}
            </div>
            
            {/* Show invite for Couple, Friends, and Family */}
            {(prefs.travelParty !== 'Solo') && (
              <div className="mt-8 pt-8 border-t border-stone-200 animate-in fade-in">
                 <h3 className="text-lg font-bold text-stone-900 mb-2">
                    {prefs.travelParty === 'Couple' ? 'Invite your partner' : 'Invite your travel buddies'}
                 </h3>
                 <p className="text-sm text-stone-500 mb-4">Planning is better together.</p>
                 <div className="flex gap-2 mb-4">
                    <input 
                      type="email" 
                      placeholder={prefs.travelParty === 'Couple' ? "partner@example.com" : "friend@example.com"}
                      className="flex-1 px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 bg-white text-stone-900 placeholder:text-stone-400"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                    />
                    <Button 
                      variant="secondary" 
                      className="whitespace-nowrap"
                      onClick={handleSendInvite}
                      disabled={!inviteEmail}
                    >
                      Add
                    </Button>
                 </div>

                 {/* Invite List */}
                 {invitedEmails.length > 0 && (
                   <div className="space-y-2 max-h-48 overflow-y-auto">
                      {invitedEmails.map(email => (
                         <div key={email} className="flex items-center justify-between bg-white p-3 rounded-lg border border-stone-200 shadow-sm animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-stone-100 flex items-center justify-center text-stone-900 font-bold text-xs border border-stone-200">
                                    {email[0].toUpperCase()}
                                </div>
                                <span className="text-stone-700 font-medium text-sm truncate">{email}</span>
                            </div>
                            <button 
                              onClick={() => handleRemoveInvite(email)} 
                              className="text-stone-400 hover:text-red-500 p-1 rounded-full hover:bg-stone-50 transition-colors"
                              title="Remove invite"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                         </div>
                      ))}
                   </div>
                 )}
              </div>
            )}

            <div className="flex justify-between pt-8">
              <Button variant="ghost" onClick={prevStep}>Back</Button>
              <Button onClick={nextStep}>Next</Button>
            </div>
          </WizardStep>
        )}

        {/* STEP 3: Duration & Budget */}
        {step === 3 && (
          <WizardStep title="When and how much?" subtitle="We'll help you plan within your means.">
            <div className="space-y-10">
              
              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-6">
                <DatePickerInput
                  label="Start Date"
                  value={prefs.startDate}
                  onChange={(value) => updatePref('startDate', value)}
                  placeholder="Select start date"
                />
                <DatePickerInput
                  label="End Date"
                  value={prefs.endDate}
                  onChange={(value) => updatePref('endDate', value)}
                  minDate={prefs.startDate}
                  placeholder="Select end date"
                />
              </div>

              <div className="bg-stone-100 p-4 rounded-lg flex items-center justify-center text-stone-600 font-mono text-xs uppercase tracking-wider">
                 Total Duration: {getDuration()} Days
              </div>

              {/* Budget Selection */}
              <div className="pt-6 border-t border-stone-200">
                <h3 className="text-lg font-bold text-stone-900 mb-6 font-playfair">Trip Budget</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">Currency</label>
                    <select
                      className="w-full px-3 py-3 rounded-lg border border-stone-200 bg-white text-stone-900 focus:border-stone-900 outline-none"
                      value={prefs.currency}
                      onChange={(e) => updatePref('currency', e.target.value)}
                    >
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">Amount</label>
                    <input
                      type="number"
                      placeholder="e.g. 10000"
                      className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white text-stone-900 placeholder:text-stone-300 focus:border-stone-900 outline-none shadow-sm"
                      value={prefs.totalBudget}
                      onChange={(e) => updatePref('totalBudget', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name="flexibility" 
                      className="peer sr-only"
                      checked={prefs.budgetFlexibility === 'Strict'}
                      onChange={() => updatePref('budgetFlexibility', 'Strict')}
                    />
                    <div className="p-4 rounded-lg border border-stone-200 peer-checked:border-stone-900 peer-checked:bg-stone-100 peer-checked:text-stone-900 hover:bg-stone-50 transition-all text-center">
                      <div className="font-bold text-sm">Strict</div>
                      <div className="text-xs text-stone-500 mt-1">Don't exceed limit</div>
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name="flexibility" 
                      className="peer sr-only"
                      checked={prefs.budgetFlexibility === 'Flexible'}
                      onChange={() => updatePref('budgetFlexibility', 'Flexible')}
                    />
                    <div className="p-4 rounded-lg border border-stone-200 peer-checked:border-stone-900 peer-checked:bg-stone-100 peer-checked:text-stone-900 hover:bg-stone-50 transition-all text-center">
                      <div className="font-bold text-sm">Flexible</div>
                      <div className="text-xs text-stone-500 mt-1">Can spend more</div>
                    </div>
                  </label>
                </div>
              </div>

            </div>
            <div className="flex justify-between pt-8">
              <Button variant="ghost" onClick={prevStep}>Back</Button>
              <Button 
                onClick={nextStep}
                disabled={!prefs.totalBudget}
              >
                Next
              </Button>
            </div>
          </WizardStep>
        )}

        {/* STEP 4: Accommodation */}
        {step === 4 && (
          <WizardStep title="Accommodation" subtitle="Need help finding a place?">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => updatePref('needsAccommodation', true)}
                className={`p-10 rounded-xl border transition-all flex flex-col items-center justify-center text-center ${
                  prefs.needsAccommodation 
                    ? 'border-stone-900 bg-stone-100 text-stone-900 shadow-sm ring-1 ring-stone-900' 
                    : 'border-stone-200 hover:border-stone-400 bg-white text-stone-500'
                }`}
              >
                <BedIcon className="w-12 h-12 mb-4" />
                <span className="block font-bold text-lg mb-1">Yes, suggest places</span>
                <span className="block text-xs opacity-70">I need hotels/rentals</span>
              </button>
              
              <button
                onClick={() => updatePref('needsAccommodation', false)}
                className={`p-10 rounded-xl border transition-all flex flex-col items-center justify-center text-center ${
                  !prefs.needsAccommodation 
                    ? 'border-stone-900 bg-stone-100 text-stone-900 shadow-sm ring-1 ring-stone-900' 
                    : 'border-stone-200 hover:border-stone-400 bg-white text-stone-500'
                }`}
              >
                <HomeIcon className="w-12 h-12 mb-4" />
                <span className="block font-bold text-lg mb-1">No, I'm sorted</span>
                <span className="block text-xs opacity-70">I have a booking</span>
              </button>
            </div>
            <div className="flex justify-between pt-8">
              <Button variant="ghost" onClick={prevStep}>Back</Button>
              <Button onClick={nextStep}>Next</Button>
            </div>
          </WizardStep>
        )}

        {/* STEP 5: Interests */}
        {step === 5 && (
          <WizardStep title="Trip Vibe" subtitle="Select what interests you.">
             <div className="mb-8">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">Daily Rhythm</label>
                <select 
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white text-stone-900 outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 shadow-sm"
                  value={prefs.timePreference}
                  onChange={(e) => updatePref('timePreference', e.target.value)}
                >
                  {Object.values(TimePreference).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
             </div>

             <div className="mb-2">
               <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 block">Interests (Pick at least 1)</label>
               <div className="flex flex-wrap gap-3">
                 {INTEREST_OPTIONS.map(interest => (
                   <button
                    key={interest}
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                      prefs.interests.includes(interest)
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                   >
                     {interest}
                   </button>
                 ))}
               </div>
             </div>

             <div className="flex justify-between pt-8">
              <Button variant="ghost" onClick={prevStep}>Back</Button>
              <Button 
                onClick={nextStep}
                disabled={prefs.interests.length === 0}
              >
                Next
              </Button>
            </div>
          </WizardStep>
        )}

        {/* STEP 6: Review */}
        {step === 6 && (
          <div className="max-w-2xl mx-auto text-center animate-in zoom-in-95 duration-500 pt-8">
             <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
               <PlaneOutlineIcon className="w-10 h-10 text-stone-900" />
             </div>
             <h2 className="text-4xl font-bold font-playfair text-stone-900 mb-3">Ready?</h2>
             <p className="text-stone-500 mb-10 text-lg">We're about to generate a {getDuration()}-day {prefs.travelParty.toLowerCase()} trip to {prefs.destinationCity}.</p>
             
             <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200 text-left mb-10 max-w-lg mx-auto">
                <ul className="space-y-4 text-sm text-stone-700">
                  <li className="flex justify-between border-b border-stone-100 pb-2"><span className="text-stone-400 uppercase text-xs tracking-wider font-bold mt-1">Destination</span> <span className="font-semibold text-base">{prefs.destinationCity}</span></li>
                  <li className="flex justify-between border-b border-stone-100 pb-2"><span className="text-stone-400 uppercase text-xs tracking-wider font-bold mt-1">Dates</span> <span className="font-semibold text-base">{prefs.startDate} - {prefs.endDate}</span></li>
                  <li className="flex justify-between border-b border-stone-100 pb-2"><span className="text-stone-400 uppercase text-xs tracking-wider font-bold mt-1">Budget</span> <span className="font-semibold text-base">{prefs.currency} {Number(prefs.totalBudget).toLocaleString()}</span></li>
                  {invitedEmails.length > 0 && (
                     <li className="flex justify-between border-t border-stone-100 pt-2"><span className="text-stone-400 uppercase text-xs tracking-wider font-bold mt-1">Invited</span> <span className="font-semibold text-base">{invitedEmails.length} people</span></li>
                  )}
                </ul>
             </div>

             <div className="flex flex-col gap-4 max-w-xs mx-auto">
               <Button 
                 onClick={handleGenerate} 
                 isLoading={isLoading}
                 className="w-full text-lg py-4"
               >
                 Generate Plan
               </Button>
               <Button variant="ghost" onClick={prevStep} disabled={isLoading} className="text-xs uppercase tracking-widest text-stone-400">
                 Make Changes
               </Button>
             </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;