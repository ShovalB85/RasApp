import type { AppData } from '../types';
import { getAppData as getAppDataFromAPI, saveAppData as saveAppDataToAPI } from './apiService';

const DB_KEY = 'rassapp-data';
const USE_API = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';

const initialData: AppData = {
  misgerets: [
    {
      id: 'misgeret-1',
      name: 'מטה כללי',
      personnel: [
        {
          id: 'admin-1',
          name: 'שובל ברמלי',
          personalId: '8223283',
          password: 'P)O(I*q1w2e3',
          role: 'admin',
          assignedItems: [],
        },
      ],
    },
  ],
  taasukot: [],
  notifications: [],
};

/**
 * Fetches data from API or localStorage (fallback).
 * @returns A Promise that resolves with the AppData.
 */
export const getData = async (): Promise<AppData> => {
  // Try API first if enabled
  if (USE_API) {
    try {
      const token = localStorage.getItem('rassapp-token');
      if (token) {
        return await getAppDataFromAPI();
      }
    } catch (error) {
      console.warn("API unavailable, falling back to localStorage", error);
    }
  }

  // Fallback to localStorage
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const item = window.localStorage.getItem(DB_KEY);
        if (item) {
          resolve(JSON.parse(item));
        } else {
          window.localStorage.setItem(DB_KEY, JSON.stringify(initialData));
          resolve(initialData);
        }
      } catch (error) {
        console.error("Failed to load data from DB", error);
        resolve(initialData);
      }
    }, 500);
  });
};

/**
 * Saves data to API or localStorage (fallback).
 * @param data The AppData object to save.
 * @returns A Promise that resolves when saving is complete.
 */
export const saveData = async (data: AppData): Promise<void> => {
  // Try API first if enabled
  if (USE_API) {
    try {
      const token = localStorage.getItem('rassapp-token');
      if (token) {
        await saveAppDataToAPI(data);
        return;
      }
    } catch (error) {
      console.warn("API unavailable, falling back to localStorage", error);
    }
  }

  // Fallback to localStorage
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        window.localStorage.setItem(DB_KEY, JSON.stringify(data));
        resolve();
      } catch (error) {
        console.error("Failed to save data to DB", error);
        reject(error);
      }
    }, 250);
  });
};

/**
 * Exports the current database to a JSON string.
 */
export const exportDatabase = async (): Promise<string> => {
  const data = await getData();
  return JSON.stringify(data, null, 2);
};

/**
 * Imports a JSON string into the database, overwriting existing data.
 */
export const importDatabase = (jsonString: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      const parsedData = JSON.parse(jsonString);
      
      // Basic validation
      if (!parsedData.misgerets || !Array.isArray(parsedData.misgerets)) {
        throw new Error("Invalid data format: missing 'misgerets'");
      }
      if (!parsedData.taasukot || !Array.isArray(parsedData.taasukot)) {
        throw new Error("Invalid data format: missing 'taasukot'");
      }

      window.localStorage.setItem(DB_KEY, JSON.stringify(parsedData));
      resolve(true);
    } catch (error) {
      console.error("Failed to import data", error);
      reject(error);
    }
  });
};