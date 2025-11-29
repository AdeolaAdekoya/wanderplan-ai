
import { UserProfile, SavedTrip, TravelItinerary } from "../types";

const USERS_KEY = "wp_users";
const CURRENT_USER_KEY = "wp_current_user";
const TRIPS_KEY = "wp_trips";

export const storageService = {
  // --- AUTH ---
  
  register: (name: string, email: string, password: string): UserProfile => {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: UserProfile[] = usersStr ? JSON.parse(usersStr) : [];

    if (users.find(u => u.email === email)) {
      throw new Error("User already exists");
    }

    // SECURITY WARNING: In production, passwords should be hashed using bcrypt/argon2
    // and stored on a secure backend server, not in localStorage
    const newUser: UserProfile = {
      name,
      email,
      password, // ⚠️ SECURITY: This is a demo app. In production, use proper authentication.
      tripsCount: 0,
      countriesVisited: []
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  login: (email: string, password: string): UserProfile => {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: UserProfile[] = usersStr ? JSON.parse(usersStr) : [];
    
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): UserProfile | null => {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  getUsersByEmails: (emails: string[]): UserProfile[] => {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: UserProfile[] = usersStr ? JSON.parse(usersStr) : [];
    // Return unique users found in the email list
    return users.filter(u => emails.includes(u.email));
  },

  updateUserAvatar: (email: string, avatarBase64: string): UserProfile => {
    const usersStr = localStorage.getItem(USERS_KEY);
    let users: UserProfile[] = usersStr ? JSON.parse(usersStr) : [];
    
    let updatedUser: UserProfile | null = null;

    users = users.map(u => {
      if (u.email === email) {
        updatedUser = { ...u, avatar: avatarBase64 };
        return updatedUser;
      }
      return u;
    });

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    if (updatedUser) {
       localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
       return updatedUser;
    }
    throw new Error("User not found");
  },

  updateUserStats: (email: string, country: string) => {
    // Update main users DB
    const usersStr = localStorage.getItem(USERS_KEY);
    let users: UserProfile[] = usersStr ? JSON.parse(usersStr) : [];
    
    users = users.map(u => {
      if (u.email === email) {
        const visited = new Set(u.countriesVisited);
        visited.add(country);
        return {
          ...u,
          tripsCount: u.tripsCount + 1,
          countriesVisited: Array.from(visited)
        };
      }
      return u;
    });

    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Update current session if applicable
    const currentUser = storageService.getCurrentUser();
    if (currentUser && currentUser.email === email) {
      const updatedUser = users.find(u => u.email === email);
      if (updatedUser) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      }
    }
  },

  // --- TRIPS ---

  saveTrip: (userEmail: string, itinerary: TravelItinerary, invitedEmails: string[] = []): SavedTrip => {
    const tripsStr = localStorage.getItem(TRIPS_KEY);
    const trips: SavedTrip[] = tripsStr ? JSON.parse(tripsStr) : [];
    const currentUser = storageService.getCurrentUser();

    const newTrip: SavedTrip = {
      id: crypto.randomUUID(),
      userEmail,
      organizerName: currentUser?.name || "Organizer",
      invitedEmails: invitedEmails,
      tripName: itinerary.tripName,
      city: itinerary.destinationCity || "Unknown",
      country: itinerary.destinationCountry || "Unknown",
      startDate: itinerary.startDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      data: itinerary
    };

    trips.unshift(newTrip); // Add to top
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
    
    // Update user stats
    storageService.updateUserStats(userEmail, newTrip.country);

    return newTrip;
  },

  updateTrip: (tripId: string, updatedData: TravelItinerary): void => {
    const tripsStr = localStorage.getItem(TRIPS_KEY);
    const trips: SavedTrip[] = tripsStr ? JSON.parse(tripsStr) : [];
    
    const index = trips.findIndex(t => t.id === tripId);
    if (index !== -1) {
      trips[index].data = updatedData;
      localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
    }
  },

  getUserTrips: (userEmail: string): SavedTrip[] => {
    const tripsStr = localStorage.getItem(TRIPS_KEY);
    const trips: SavedTrip[] = tripsStr ? JSON.parse(tripsStr) : [];
    
    // Return trips where user is the CREATOR or is INVITED
    return trips.filter(t => 
      t.userEmail === userEmail || 
      (t.invitedEmails && t.invitedEmails.includes(userEmail))
    );
  }
};
