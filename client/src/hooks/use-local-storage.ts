import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((val: T) => T)) => void] {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item);
      }
      return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for changes to localStorage (e.g., from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage value for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

// Utility hook for managing backup/restore functionality
export function useDataBackup() {
  const exportData = (data: any, filename: string = 'ladder-backup.json') => {
    try {
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error exporting data:', error);
      return false;
    }
  };

  const importData = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  };

  return { exportData, importData };
}

// Hook for managing birthday notifications
export function useBirthdayNotifications() {
  const [lastChecked, setLastChecked] = useLocalStorage('birthday-last-checked', '');
  
  const checkBirthdays = (players: any[]) => {
    const today = new Date();
    const todayString = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Only check once per day
    if (lastChecked === todayString) {
      return [];
    }
    
    const birthdayPlayers = players.filter(player => 
      player.birthday === todayString
    );
    
    setLastChecked(todayString);
    return birthdayPlayers;
  };

  return { checkBirthdays };
}

// Hook for managing app preferences
export function useAppPreferences() {
  const [preferences, setPreferences] = useLocalStorage('app-preferences', {
    theme: 'dark',
    soundEnabled: true,
    notificationsEnabled: true,
    autoRefresh: true,
    favoriteCity: 'Seguin',
  });

  const updatePreference = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return { preferences, updatePreference };
}

// Hook for managing recent activity cache
export function useRecentActivity() {
  const [recentActivity, setRecentActivity] = useLocalStorage('recent-activity', []);
  
  const addActivity = (activity: {
    id: string;
    type: 'match' | 'tournament' | 'kelly-pool' | 'bounty' | 'charity';
    description: string;
    timestamp: number;
    data?: any;
  }) => {
    setRecentActivity(prev => {
      const newActivity = [activity, ...prev.slice(0, 49)]; // Keep last 50 activities
      return newActivity;
    });
  };

  const clearActivity = () => {
    setRecentActivity([]);
  };

  return { recentActivity, addActivity, clearActivity };
}
