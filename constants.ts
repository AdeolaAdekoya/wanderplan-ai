export const INTEREST_OPTIONS = [
  "Museums & History", 
  "Nature & Hiking", 
  "Food & Dining", 
  "Nightlife & Clubbing",
  "Beach & Relaxation", 
  "Shopping", 
  "Art & Culture", 
  "Adventure Sports"
] as const;

export const CURRENCIES = [
  "USD", "EUR", "GBP", "NGN", "JPY", "AUD", "CAD", "CNY", "INR"
] as const;

export const ACCOMMODATION_IMAGES: Record<string, string[]> = {
  resort: [
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80", 
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80", 
    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
  ],
  hostel: [
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1520277739336-7bf67edfa768?auto=format&fit=crop&w=800&q=80",
  ],
  airbnb: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80", 
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80", 
    "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?auto=format&fit=crop&w=800&q=80",
  ],
  hotel: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80",
  ]
};

export const RANKS = [
  { name: "Armchair Dreamer", minTrips: 0 },
  { name: "Baby Traveller", minTrips: 1 },
  { name: "Explorer", minTrips: 3 },
  { name: "World Citizen", minTrips: 6 },
  { name: "Globetrotter Legend", minTrips: 10 }
] as const;

// API Configuration
export const MAX_RETRIES = 3;
export const INITIAL_RETRY_DELAY = 2000;

// File Upload Limits
export const MAX_AVATAR_SIZE = 500000; // 500KB

// UI Constants
export const LOADING_MESSAGE_INTERVAL = 2000; // 2 seconds

