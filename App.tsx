import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { AppData, Taasuka, Misgeret, Soldier, InventoryItem, Task, AssignedItem, Team, Notification, Toast } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { generateTaasukaEquipmentPdf } from './services/pdfService';
import { generateIcsFile } from './services/calendarService';
import { getData, saveData, exportDatabase, importDatabase } from './services/databaseService';
import { authApi, setToken, taasukaApi, misgeretApi, taskApi, teamApi, soldierApi } from './services/apiService';
import {
  BoxIcon, UsersIcon, ClipboardListIcon, PlusIcon, XIcon,
  ChevronRightIcon, ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, TrashIcon, ArrowRightIcon, HomeIcon,
  FileDownloadIcon, UserAddIcon, UserIcon, LogoutIcon, ShieldCheckIcon, BellIcon,
  CalendarIcon, RefreshIcon, EditIcon, KeyIcon, SaveIcon, CogIcon,
  CloudDownloadIcon, CloudUploadIcon
} from './components/icons';

const ToastNotifications = ({ toasts, setToasts }: { toasts: Toast[]; setToasts: React.Dispatch<React.SetStateAction<Toast[]>> }) => {
    const removeToast = (id: string) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    };

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-20 right-4 z-50 space-y-2" aria-live="polite">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`animate-fade-in-right flex items-center justify-between max-w-sm w-full p-4 rounded-lg shadow-lg text-white ${
                        toast.type === 'success' ? 'bg-emerald-600' : 
                        toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
                    }`}
                    role="status"
                >
                    <p className="flex-1">{toast.message}</p>
                    <button onClick={() => removeToast(toast.id)} className="ml-4 p-1 rounded-full hover:bg-black/20 flex-shrink-0" aria-label="סגור התראה">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};

const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-emerald-500"></div>
        <p className="text-white absolute">טוען נתונים...</p>
    </div>
);


const App: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dataLoadedRef = useRef(false);
  const [currentUser, setCurrentUser] = useLocalStorage<Soldier | null>('rassapp-currentUser', null);
  const [loginStage, setLoginStage] = useState<'id' | 'password' | 'set_password'>('id');
  const [loginPersonalId, setLoginPersonalId] = useState<string>('');
  
  const [activeView, setActiveView] = useState<'home' | 'taasuka' | 'misgeret' | 'soldierProfile' | 'taskDetail' | 'soldierTaasuka'>('home');
  const [selectedTaasukaId, setSelectedTaasukaId] = useState<string | null>(null);
  const [selectedMisgeretId, setSelectedMisgeretId] = useState<string | null>(null);
  const [selectedSoldierId, setSelectedSoldierId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modal states
  const [isNewTaasukaModalOpen, setNewTaasukaModalOpen] = useState(false);
  const [isNewMisgeretModalOpen, setNewMisgeretModalOpen] = useState(false);
  const [isAddItemModalOpen, setAddItemModalOpen] = useState(false);
  const [isUpdateItemModalOpen, setUpdateItemModalOpen] = useState(false);
  const [isAddFromImageModalOpen, setAddFromImageModalOpen] = useState(false);
  const [isAddPersonnelModalOpen, setAddPersonnelModalOpen] = useState(false);
  const [isAssignItemModalOpen, setAssignItemModalOpen] = useState(false);
  const [isAddTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [isBulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);
  const [isAddExternalItemModalOpen, setAddExternalItemModalOpen] = useState(false);
  const [isAddToTaasukaModalOpen, setAddToTaasukaModalOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isManageTeamModalOpen, setManageTeamModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [isUpdateAssignedItemModalOpen, setUpdateAssignedItemModalOpen] = useState(false);
  const [selectedAssignedItemForUpdate, setSelectedAssignedItemForUpdate] = useState<{ soldierId: string; item: AssignedItem } | null>(null);
  const [isSystemModalOpen, setSystemModalOpen] = useState(false);
  const [isSelectSoldierModalOpen, setSelectSoldierModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [taskCreationForTeam, setTaskCreationForTeam] = useState<Team | null>(null);

  const [selectedSoldierForAssignment, setSelectedSoldierForAssignment] = useState<Soldier | null>(null);
  const [selectedItemForUpdate, setSelectedItemForUpdate] = useState<InventoryItem | null>(null);
  const [selectedItemAssignedQuantity, setSelectedItemAssignedQuantity] = useState<number>(0);
  const [selectedSerialNumberForAssignment, setSelectedSerialNumberForAssignment] = useState<{ inventoryItemId: string; serialNumber: string; itemName: string } | null>(null);

  // Load initial data
  useEffect(() => {
    getData().then(initialData => {
        setData(initialData);
        setIsLoading(false);
        // Use a ref to indicate that the initial data has been loaded.
        // This prevents the save effect from running on the first render.
        setTimeout(() => { dataLoadedRef.current = true; }, 0);
    }).catch(error => {
        console.error("Failed to load app data:", error);
        addToast("שגיאה בטעינת הנתונים", "error");
        setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    // Only save if initial data has been loaded and data object exists
    if (dataLoadedRef.current && data) {
        saveData(data).catch(error => {
            console.error("Failed to save data:", error);
            addToast("שגיאה בשמירת הנתונים", "error");
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, 5000); // 5 seconds
  };

  const currentUserMisgeret = useMemo(() => {
    if (!currentUser || !data) return null;
    return data.misgerets.find(m => m.personnel.some(p => p.id === currentUser.id));
  }, [data, currentUser]);

  const selectedTaasuka = useMemo(() =>
    data?.taasukot.find(t => t.id === selectedTaasukaId),
    [data, selectedTaasukaId]
  );

  const selectedMisgeret = useMemo(() =>
    data?.misgerets.find(m => m.id === selectedMisgeretId || m.id === selectedTaasuka?.misgeretId),
    [data, selectedMisgeretId, selectedTaasuka]
  );
  
  const handleCreateMisgeret = async (name: string) => {
    // Check if API mode is enabled
    const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
    
    if (useAPI) {
      // Use API to create misgeret
      try {
        setIsLoading(true);
        const misgeret = await misgeretApi.create(name);
        // Reload data from API
        const apiData = await getData();
        setData(apiData);
        addToast(`${name} נוצר בהצלחה`, 'success');
        setNewMisgeretModalOpen(false);
      } catch (error: any) {
        console.error('Failed to create misgeret:', error);
        addToast(error.message || 'שגיאה ביצירת המסגרת', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Use local storage (old method)
      const newMisgeret: Misgeret = { id: Date.now().toString(), name, personnel: [] };
      setData(prev => prev ? ({ ...prev, misgerets: [...prev.misgerets, newMisgeret] }) : null);
      setNewMisgeretModalOpen(false);
    }
  };
  
  const handleCreateTaasuka = async (name: string, misgeretId: string) => {
    if (!misgeretId) {
      alert("יש לבחור מסגרת");
      return;
    }
    
    // Check if API mode is enabled
    const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
    
    if (useAPI) {
      try {
        setIsLoading(true);
        const newTaasuka = await taasukaApi.create(name, misgeretId);
        // Reload data to get the new taasuka
        const updatedData = await getData();
        setData(updatedData);
        addToast('תעסוקה נוצרה בהצלחה', 'success');
        setNewTaasukaModalOpen(false);
      } catch (error: any) {
        console.error('Error creating taasuka:', error);
        addToast(error.message || 'שגיאה ביצירת תעסוקה', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Use local storage (old method)
      const newTaasuka: Taasuka = {
        id: Date.now().toString(),
        name,
        misgeretId,
        inventory: [],
        tasks: [],
        personnelIds: [],
        teams: []
      };
      setData(prev => prev ? ({ ...prev, taasukot: [...prev.taasukot, newTaasuka] }) : null);
      setNewTaasukaModalOpen(false);
    }
  };
  
  const handleAddSoldier = async (name: string, personalId: string, role: 'soldier' | 'rassap' | 'admin') => {
    if (!selectedMisgeretId) return;
    
    // Check if API mode is enabled
    const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
    
    if (useAPI) {
      // Use API to add soldier
      try {
        setIsLoading(true);
        const soldier = await misgeretApi.addPersonnel(selectedMisgeretId, name, personalId, role);
        // Reload data from API
        const apiData = await getData();
        setData(apiData);
        addToast(`${name} נוסף בהצלחה`, 'success');
        setAddPersonnelModalOpen(false);
      } catch (error: any) {
        console.error('Failed to add soldier:', error);
        addToast(error.message || 'שגיאה בהוספת החייל', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Use local storage (old method)
      const newSoldier: Soldier = { id: Date.now().toString(), name, personalId, assignedItems: [], role, password: '' };
      setData(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          misgerets: prev.misgerets.map(m =>
            m.id === selectedMisgeretId ? { ...m, personnel: [...m.personnel, newSoldier] } : m
          )
        };
        // Save to localStorage
        saveData(updated).catch(error => {
          console.error('Failed to save data:', error);
          addToast('שגיאה בשמירת הנתונים', 'error');
        });
        return updated;
      });
      setAddPersonnelModalOpen(false);
    }
  };
  
  const handleAddItem = async (name: string, serialNumbers: string[], quantityForNoSN: number, hasSerialNumber: boolean) => {
    if (!selectedTaasuka) return;
    
    // Check if API mode is enabled
    const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
    
    if (useAPI) {
      try {
        setIsLoading(true);
        // Check if item exists
        const existingItem = selectedTaasuka.inventory.find(i => 
          i.name.trim().toLowerCase() === name.trim().toLowerCase() && 
          i.hasSerialNumber === hasSerialNumber
        );
        
        if (existingItem) {
          if (hasSerialNumber) {
            // Check for duplicate serial numbers
            const existingSerialNumbers = existingItem.serialNumbers || [];
            const duplicates = serialNumbers.filter(sn => sn.trim() && existingSerialNumbers.includes(sn.trim()));
            if (duplicates.length > 0) {
              addToast(`מס"דים כבר קיימים: ${duplicates.join(', ')}`, 'error');
              setIsLoading(false);
              return;
            }
            
            // Check for duplicates within new serial numbers
            const uniqueNewSNs = Array.from(new Set(serialNumbers.filter(sn => sn.trim())));
            if (uniqueNewSNs.length !== serialNumbers.filter(sn => sn.trim()).length) {
              addToast('אין להזין מס"דים זהים', 'error');
              setIsLoading(false);
              return;
            }
            
            // For צל"ם items: merge serial numbers and update quantity
            const updatedSerialNumbers = [...(existingItem.serialNumbers || []), ...serialNumbers];
            const updatedQuantity = (existingItem.quantity || 0) + quantityForNoSN;
            
            // If total becomes 0, delete the item
            if (updatedSerialNumbers.length === 0 && updatedQuantity <= 0) {
              await taasukaApi.deleteInventoryItem(selectedTaasuka.id, existingItem.id);
              addToast('פריט נמחק (סה"כ = 0)', 'success');
            } else {
              await taasukaApi.updateInventoryItem(selectedTaasuka.id, existingItem.id, updatedQuantity, updatedSerialNumbers);
            }
          } else {
            // Regular item: just add quantity
            const newQuantity = existingItem.quantity + quantityForNoSN;
            // If quantity becomes 0, delete the item
            if (newQuantity <= 0) {
              await taasukaApi.deleteInventoryItem(selectedTaasuka.id, existingItem.id);
              addToast('פריט נמחק (כמות = 0)', 'success');
            } else {
              await taasukaApi.updateInventoryItem(selectedTaasuka.id, existingItem.id, newQuantity);
            }
          }
        } else {
          // Create new item
          await taasukaApi.addInventory(selectedTaasuka.id, [{ 
            name, 
            quantity: quantityForNoSN, 
            hasSerialNumber,
            serialNumbers: hasSerialNumber ? serialNumbers : []
          }]);
        }
        // Reload data
        const updatedData = await getData();
        setData(updatedData);
        addToast('פריט נוסף בהצלחה', 'success');
        setAddItemModalOpen(false);
      } catch (error: any) {
        console.error('Error adding item:', error);
        addToast(error.message || 'שגיאה בהוספת פריט', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Use local storage (old method)
      setData(prev => {
        if (!prev) return null;
        const newTaasukot = prev.taasukot.map(t => {
          if (t.id === selectedTaasuka.id) {
            const existingItem = t.inventory.find(i => 
              i.name.trim().toLowerCase() === name.trim().toLowerCase() && 
              i.hasSerialNumber === hasSerialNumber
            );
            if (existingItem) {
              if (hasSerialNumber) {
                // Add serial numbers to existing
                const updatedSerialNumbers = [...(existingItem.serialNumbers || []), ...serialNumbers];
                const updatedQuantity = (existingItem.quantity || 0) + quantityForNoSN;
                const updatedInventory = t.inventory.map(i => 
                  i.id === existingItem.id ? { 
                    ...i, 
                    serialNumbers: updatedSerialNumbers, 
                    quantity: updatedQuantity 
                  } : i
                );
                return { ...t, inventory: updatedInventory };
              } else {
                const updatedInventory = t.inventory.map(i => 
                  i.id === existingItem.id ? { ...i, quantity: i.quantity + quantityForNoSN } : i
                );
                return { ...t, inventory: updatedInventory };
              }
            } else {
              const newItem: InventoryItem = { 
                id: Date.now().toString(), 
                name, 
                quantity: quantityForNoSN, 
                hasSerialNumber,
                serialNumbers: hasSerialNumber ? serialNumbers : []
              };
              return { ...t, inventory: [...t.inventory, newItem] };
            }
          }
          return t;
        });
        return { ...prev, taasukot: newTaasukot };
      });
      setAddItemModalOpen(false);
    }
  };

  const handleAddItemsBatch = async (items: Omit<InventoryItem, 'id'>[]) => {
    if (!selectedTaasuka) return;

    // Check if API mode is enabled
    const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
    
    if (useAPI) {
      try {
        setIsLoading(true);
        // Process items - update existing or add new
        const itemsToAdd: Omit<InventoryItem, 'id'>[] = [];
        const updatePromises: Promise<any>[] = [];
        
        for (const itemToAdd of items) {
          const existingItem = selectedTaasuka.inventory.find(i => i.name.trim().toLowerCase() === itemToAdd.name.trim().toLowerCase());
          if (existingItem) {
            // Update existing item
            updatePromises.push(taasukaApi.updateInventoryItem(selectedTaasuka.id, existingItem.id, existingItem.quantity + itemToAdd.quantity));
          } else {
            // Add new item
            itemsToAdd.push(itemToAdd);
          }
        }
        
        // Execute updates and adds
        await Promise.all(updatePromises);
        if (itemsToAdd.length > 0) {
          await taasukaApi.addInventory(selectedTaasuka.id, itemsToAdd);
        }
        
        // Reload data
        const updatedData = await getData();
        setData(updatedData);
        addToast('פריטים נוספו בהצלחה', 'success');
        setAddFromImageModalOpen(false);
      } catch (error: any) {
        console.error('Error adding items batch:', error);
        addToast(error.message || 'שגיאה בהוספת פריטים', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Use local storage (old method)
      setData(prev => {
        if (!prev) return null;
        const newTaasukot = prev.taasukot.map(t => {
          if (t.id === selectedTaasuka.id) {
            const updatedInventory = [...t.inventory]; // Create a mutable copy
            items.forEach(itemToAdd => {
              const existingItemIndex = updatedInventory.findIndex(i => i.name.trim().toLowerCase() === itemToAdd.name.trim().toLowerCase());
              if (existingItemIndex > -1) {
                updatedInventory[existingItemIndex].quantity += itemToAdd.quantity;
              } else {
                updatedInventory.push({ ...itemToAdd, id: Date.now().toString() + itemToAdd.name });
              }
            });
            return { ...t, inventory: updatedInventory };
          }
          return t;
        });
        return { ...prev, taasukot: newTaasukot };
      });
      setAddFromImageModalOpen(false);
    }
  };

  const handleRemoveSerialNumber = async (itemId: string, serialNumber: string) => {
    if (!selectedTaasuka || !currentUser || currentUser.role !== 'admin') {
      addToast('רק מנהלים יכולים להסיר מס"דים', 'error');
      return;
    }

    const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';

    if (useAPI) {
      try {
        setIsLoading(true);
        
        // Find the inventory item
        const inventoryItem = selectedTaasuka.inventory.find((i: InventoryItem) => i.id === itemId);
        if (!inventoryItem || !inventoryItem.hasSerialNumber) {
          addToast('פריט לא נמצא או אינו פריט צל"ם', 'error');
          return;
        }

        // Remove the serial number from the array
        const updatedSerialNumbers = (inventoryItem.serialNumbers || []).filter(sn => sn !== serialNumber);
        const noSNQuantity = inventoryItem.quantity || 0;
        
        // If total becomes 0 (no SNs and no לל"צ), delete the item
        if (updatedSerialNumbers.length === 0 && noSNQuantity <= 0) {
          await taasukaApi.deleteInventoryItem(selectedTaasuka.id, itemId);
          addToast('פריט נמחק (סה"כ = 0)', 'success');
        } else {
          await taasukaApi.updateInventoryItem(selectedTaasuka.id, itemId, noSNQuantity, updatedSerialNumbers);
          addToast('מס"ד הוסר בהצלחה', 'success');
        }

        // Reload data
        const updatedData = await getData();
        setData(updatedData);
      } catch (error: any) {
        console.error('Error removing serial number:', error);
        addToast(error.message || 'שגיאה בהסרת מס"ד', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local storage
      setData(prev => {
        if (!prev) return null;
        const newTaasukot = prev.taasukot.map(t => {
          if (t.id === selectedTaasuka.id) {
            const inventoryItem = t.inventory.find((i: InventoryItem) => i.id === itemId);
            if (!inventoryItem || !inventoryItem.hasSerialNumber) return t;
            
            const updatedSerialNumbers = (inventoryItem.serialNumbers || []).filter(sn => sn !== serialNumber);
            const noSNQuantity = inventoryItem.quantity || 0;
            
            // If total becomes 0, delete the item
            if (updatedSerialNumbers.length === 0 && noSNQuantity <= 0) {
              return { ...t, inventory: t.inventory.filter(i => i.id !== itemId) };
            } else {
              return {
                ...t,
                inventory: t.inventory.map(i =>
                  i.id === itemId ? { ...i, serialNumbers: updatedSerialNumbers } : i
                ),
              };
            }
          }
          return t;
        });
        return { ...prev, taasukot: newTaasukot };
      });
      addToast('מס"ד הוסר בהצלחה', 'success');
    }
  };

  const handleUpdateItemQuantity = async (itemId: string, newQuantity: number) => {
    if (!selectedTaasuka || !currentUser) {
      addToast('נדרש משתמש מחובר', 'error');
      return;
    }

    const isAdmin = currentUser.role === 'admin';
    const isRassap = currentUser.role === 'rassap';
    
    if (!isAdmin && !isRassap) {
      addToast('רק רס"פים ומנהלים יכולים לערוך כמות פריטים', 'error');
      return;
    }

    const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';

    if (useAPI) {
      try {
        setIsLoading(true);
        
        // Find the current item to check if it has serial numbers
        const currentItem = selectedTaasuka.inventory.find((i: InventoryItem) => i.id === itemId);
        if (!currentItem) {
          addToast('פריט לא נמצא', 'error');
          return;
        }

        // Check if rassap is trying to decrease quantity (not allowed)
        if (isRassap && !currentItem.hasSerialNumber) {
          const currentQuantity = currentItem.quantity || 0;
          if (newQuantity < currentQuantity) {
            addToast('רספ"ים יכולים רק להגדיל כמות, לא להקטין. רק מנהלים יכולים להקטין כמות.', 'error');
            setIsLoading(false);
            return;
          }
        }
        
        if (isRassap && currentItem.hasSerialNumber) {
          // For צל"ם items, rassaps can only add serial numbers, not remove
          // We'll handle this in the modal/UI - they can only increase
        }

        // For צל"ם items, we need to preserve serialNumbers when updating quantity
        if (currentItem.hasSerialNumber) {
          const hasSerialNumbers = (currentItem.serialNumbers || []).length > 0;
          const totalSNs = (currentItem.serialNumbers || []).length;
          const totalIsZero = totalSNs === 0 && newQuantity <= 0;
          
          if (totalIsZero) {
            // Delete only if both quantity is 0 AND no serial numbers (סה"כ = 0)
            await taasukaApi.deleteInventoryItem(selectedTaasuka.id, itemId);
            addToast('פריט נמחק מהמלאי (סה"כ = 0)', 'success');
          } else {
            // Update quantity but preserve serialNumbers (even if quantity is 0)
            await taasukaApi.updateInventoryItem(
              selectedTaasuka.id, 
              itemId, 
              newQuantity, 
              currentItem.serialNumbers // Preserve existing serial numbers
            );
            if (newQuantity <= 0 && hasSerialNumbers) {
              addToast('לל"צ הוסר, הפריט נשאר עם מס"דים', 'success');
            } else {
              addToast('כמות עודכנה בהצלחה', 'success');
            }
          }
        } else {
          // Regular item - validate that quantity is not below assigned
          // Calculate assigned quantity
          const assignedItemsForThis = data?.misgerets
            .flatMap(m => m.personnel)
            .flatMap(s => s.assignedItems)
            .filter(ai => ai.inventoryItemId === itemId && !ai.serialNumber) || [];
          const assignedQuantity = assignedItemsForThis.reduce((sum, ai) => sum + (ai.quantity || 1), 0);
          const minimumQuantity = assignedQuantity;
          
          if (newQuantity < minimumQuantity) {
            addToast(`לא ניתן להגדיר כמות נמוכה מ-${minimumQuantity} (כמות ששויכה)`, 'error');
            setIsLoading(false);
            return;
          }
          
          if (newQuantity <= 0) {
            // Only admins can delete items
            if (!isAdmin) {
              addToast('רק מנהלים יכולים למחוק פריטים מהמלאי', 'error');
              setIsLoading(false);
              return;
            }
            await taasukaApi.deleteInventoryItem(selectedTaasuka.id, itemId);
            addToast('פריט נמחק מהמלאי', 'success');
          } else {
            // Update quantity (this is the total, which should be >= assigned)
            await taasukaApi.updateInventoryItem(selectedTaasuka.id, itemId, newQuantity);
            addToast('כמות עודכנה בהצלחה', 'success');
          }
        }

        // Reload data
        const updatedData = await getData();
        setData(updatedData);
        setUpdateItemModalOpen(false);
        setSelectedItemForUpdate(null);
      } catch (error: any) {
        console.error('Error updating item quantity:', error);
        addToast(error.message || 'שגיאה בעדכון כמות', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local storage
      setData(prev => {
        if (!prev) return null;
        const newTaasukot = prev.taasukot.map(t => {
          if (t.id === selectedTaasuka.id) {
            const currentItem = t.inventory.find((i: InventoryItem) => i.id === itemId);
            if (!currentItem) return t;
            
            // For צל"ם items, check if we should delete (only if סה"כ = 0)
            if (currentItem.hasSerialNumber) {
              const totalSNs = (currentItem.serialNumbers || []).length;
              const totalIsZero = totalSNs === 0 && newQuantity <= 0;
              
              if (totalIsZero) {
                // Delete only if both quantity is 0 AND no serial numbers (סה"כ = 0)
                return { ...t, inventory: t.inventory.filter(item => item.id !== itemId) };
              } else {
                // Update quantity but preserve serialNumbers (even if quantity is 0)
                return {
                  ...t,
                  inventory: t.inventory.map(item =>
                    item.id === itemId 
                      ? { ...item, quantity: newQuantity, serialNumbers: item.serialNumbers || [] }
                      : item
                  ),
                };
              }
            } else {
              // Regular item - delete if quantity is 0 (סה"כ = 0)
              if (newQuantity <= 0) {
                return { ...t, inventory: t.inventory.filter(item => item.id !== itemId) };
              } else {
                // Update quantity
                return {
                  ...t,
                  inventory: t.inventory.map(item =>
                    item.id === itemId ? { ...item, quantity: newQuantity } : item
                  ),
                };
              }
            }
          }
          return t;
        });
        return { ...prev, taasukot: newTaasukot };
      });
      setUpdateItemModalOpen(false);
      setSelectedItemForUpdate(null);
    }
  };
  
  const handleAssignItem = async (soldierId: string, itemId: string, quantity: number, serialNumber?: string | null) => {
    if (!selectedTaasuka || !selectedMisgeret) return;

    // Check if API mode is enabled
    const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
    
    if (useAPI) {
      try {
        setIsLoading(true);
        // Find the inventory item to get its details
        const inventoryItem = selectedTaasuka.inventory.find((i: InventoryItem) => i.id === itemId);
        if (!inventoryItem) {
          alert("פריט לא נמצא במלאי");
          return;
        }

        // For serial number items, check if serial number is available
        if (serialNumber && inventoryItem.hasSerialNumber) {
          const availableSerialNumbers = inventoryItem.serialNumbers || [];
          // Check if this serial number exists and is not already assigned
          const isSerialNumberAvailable = availableSerialNumbers.includes(serialNumber);
          if (!isSerialNumberAvailable) {
            alert("מס\"ד זה לא זמין במלאי או כבר משויך");
            return;
          }
        } else if (!serialNumber && inventoryItem.hasSerialNumber) {
          // Trying to assign צל"ם item without serial number
          alert("יש לבחור מס\"ד עבור פריטי צל\"ם");
          return;
        } else if (!inventoryItem.hasSerialNumber && inventoryItem.quantity < quantity) {
          // Regular item - check quantity
          alert("כמות לא מספקת במלאי");
          return;
        }

        // Assign item to soldier via API
        await soldierApi.assignItem(soldierId, {
          name: inventoryItem.name,
          quantity,
          serialNumber: serialNumber || null,
          provider: selectedTaasuka.name,
          inventoryItemId: inventoryItem.id,
          taasukaId: selectedTaasuka.id,
        });

        // Inventory update is handled automatically by the backend assignment endpoint
        // No need to update inventory separately - backend removes serial number from inventory when assigning

        // Reload data from API
        const updatedData = await getData();
        setData(updatedData);
        addToast('פריט שויך בהצלחה', 'success');
        setAssignItemModalOpen(false);
      } catch (error: any) {
        console.error('Error assigning item:', error);
        addToast(error.message || 'שגיאה בשיוך פריט', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Use local storage (old method)
      setData(prev => {
        if (!prev) return null;
        const newData = JSON.parse(JSON.stringify(prev));
        const taasuka = newData.taasukot.find((t: Taasuka) => t.id === selectedTaasuka.id);
        const misgeret = newData.misgerets.find((m: Misgeret) => m.id === selectedMisgeret.id);
        if (!taasuka || !misgeret) return prev;

        const inventoryItem = taasuka.inventory.find((i: InventoryItem) => i.id === itemId);
        if (!inventoryItem) {
          alert("פריט לא נמצא במלאי");
          return prev;
        }
        
        // Check available quantity (for regular items)
        if (!inventoryItem.hasSerialNumber) {
          // Calculate assigned quantity
          const assignedItemsForThis = newData.misgerets
            .flatMap((m: Misgeret) => m.personnel)
            .flatMap((s: Soldier) => s.assignedItems)
            .filter((ai: AssignedItem) => ai.inventoryItemId === itemId && !ai.serialNumber);
          const assignedQuantity = assignedItemsForThis.reduce((sum: number, ai: AssignedItem) => sum + (ai.quantity || 1), 0);
          const availableQuantity = (inventoryItem.quantity || 0) - assignedQuantity;
          
          if (availableQuantity < quantity) {
            alert(`כמות לא מספקת במלאי. זמינים: ${availableQuantity}`);
            return prev;
          }
        }
        
        // DO NOT reduce quantity - it represents total capacity
        // Available is calculated as (total - assigned), not stored

        const soldier = misgeret.personnel.find((p: Soldier) => p.id === soldierId);
        if (soldier) {
          const newAssignedItem: AssignedItem = {
            id: Date.now().toString(),
            name: inventoryItem.name,
            quantity,
            serialNumber: serialNumber || null,
            provider: taasuka.name,
            inventoryItemId: inventoryItem.id,
            taasukaId: taasuka.id,
          };
          soldier.assignedItems.push(newAssignedItem);
        }
        return newData;
      });
      setAssignItemModalOpen(false);
    }
  };
  
  const handleAddExternalItem = async (soldierId: string, name: string, quantity: number, provider: string) => {
    if (!selectedMisgeret) return;
    
    // If we're in a Taasuka view, link the external item to that Taasuka
    const taasukaId = selectedTaasuka?.id || null;
    
    // Check if API mode is enabled
    const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
    
    if (useAPI) {
      try {
        setIsLoading(true);
        // Assign external item to soldier via API
        await soldierApi.assignItem(soldierId, {
          name,
          quantity,
          provider,
          inventoryItemId: undefined,
          taasukaId: taasukaId || undefined,
        });

        // Reload data from API
        const updatedData = await getData();
        setData(updatedData);
        addToast('פריט חיצוני נוסף בהצלחה', 'success');
        setAddExternalItemModalOpen(false);
      } catch (error: any) {
        console.error('Error adding external item:', error);
        addToast(error.message || 'שגיאה בהוספת פריט חיצוני', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Use local storage (old method)
      setData(prev => {
        if (!prev) return null;
        const newData = JSON.parse(JSON.stringify(prev));
        const misgeret = newData.misgerets.find((m: Misgeret) => m.id === selectedMisgeret.id);
        if(!misgeret) return prev;
        
        const soldier = misgeret.personnel.find((p: Soldier) => p.id === soldierId);
        if (soldier) {
          const newAssignedItem: AssignedItem = {
            id: Date.now().toString(),
            name,
            quantity,
            provider,
            inventoryItemId: null,
            taasukaId: taasukaId,
          };
          soldier.assignedItems.push(newAssignedItem);
        }
        return newData;
      });
      setAddExternalItemModalOpen(false);
    }
  };
  
  const handleUpdateAssignedItemQuantity = async (soldierId: string, itemId: string, newQuantity: number) => {
    if (!currentUser || !data) return;

    // Get the item to check its taasuka
    const soldier = data.misgerets.flatMap(m => m.personnel).find(p => p.id === soldierId);
    if (!soldier) return;
    
    const item = soldier.assignedItems.find(ai => ai.id === itemId);
    if (!item) return;

    // Check permissions based on whether item is from taasuka or external
    const isAdmin = currentUser.role === 'admin';
    const isRassap = currentUser.role === 'rassap' || currentUser.role === 'admin';
    
    if (item.taasukaId) {
      // Item from taasuka - check taasuka permissions
      const taasuka = data.taasukot.find(t => t.id === item.taasukaId);
      if (!taasuka) return;
      
      const isAssignedToTaasuka = taasuka.personnelIds.includes(currentUser.id);
      if (!isAdmin && !(isRassap && isAssignedToTaasuka)) {
        addToast('רק רס"פ המשויך לתעסוקה או מנהל יכולים לערוך ציוד', 'error');
        return;
      }
    } else {
      // External item - only admin/rassap can edit
      if (!isAdmin && !isRassap) {
        addToast('רק רס"פ או מנהל יכולים לערוך ציוד חיצוני', 'error');
        return;
      }
    }

    const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';

    if (useAPI) {
      try {
        setIsLoading(true);
        
        // Update quantity via API (if quantity is 0, item will be deleted)
        await soldierApi.updateAssignedItemQuantity(soldierId, itemId, newQuantity);

        // Reload data from API
        const updatedData = await getData();
        setData(updatedData);
        addToast(newQuantity === 0 ? 'פריט הוסר בהצלחה' : 'כמות עודכנה בהצלחה', 'success');
        setUpdateAssignedItemModalOpen(false);
        setSelectedAssignedItemForUpdate(null);
      } catch (error: any) {
        console.error('Error updating assigned item quantity:', error);
        addToast(error.message || 'שגיאה בעדכון כמות', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local storage
      setData(prev => {
        if (!prev) return null;
        const newData = JSON.parse(JSON.stringify(prev));
        const misgeret = newData.misgerets.find((m: Misgeret) => m.id === selectedMisgeret.id);
        if (!misgeret) return prev;
        
        const soldier = misgeret.personnel.find((p: Soldier) => p.id === soldierId);
        if (!soldier) return prev;
        
        const assignedItem = soldier.assignedItems.find((ai: AssignedItem) => ai.id === itemId);
        if (!assignedItem) return prev;

        if (newQuantity === 0) {
          // Remove item if quantity is 0
          soldier.assignedItems = soldier.assignedItems.filter((ai: AssignedItem) => ai.id !== itemId);
          
          // Return to inventory if from inventory
          if (assignedItem.inventoryItemId && assignedItem.taasukaId) {
            const taasuka = newData.taasukot.find((t: Taasuka) => t.id === assignedItem.taasukaId);
            if (taasuka) {
              const inventoryItem = taasuka.inventory.find((i: InventoryItem) => i.id === assignedItem.inventoryItemId);
              if (inventoryItem) {
                // If item has a serial number, return it to serialNumbers array
                if (assignedItem.serialNumber && inventoryItem.hasSerialNumber) {
                  const currentSerialNumbers = inventoryItem.serialNumbers || [];
                  if (!currentSerialNumbers.includes(assignedItem.serialNumber)) {
                    inventoryItem.serialNumbers = [...currentSerialNumbers, assignedItem.serialNumber];
                  }
                } else {
                  // Regular item - DO NOT add quantity back (total stays fixed)
                }
              }
            }
          }
          addToast('פריט הוסר בהצלחה', 'success');
        } else {
          // Update quantity
          assignedItem.quantity = newQuantity;
          addToast('כמות עודכנה בהצלחה', 'success');
        }
        
        return newData;
      });
      setUpdateAssignedItemModalOpen(false);
      setSelectedAssignedItemForUpdate(null);
    }
  };

  const handleUnassignItem = async (soldierId: string, itemId: string, item: AssignedItem) => {
    if (!currentUser || !selectedTaasuka || !selectedMisgeret) return;

    // Check permissions: only rassap/admin assigned to taasuka can unassign items
    const isAdmin = currentUser.role === 'admin';
    const isRassap = currentUser.role === 'rassap' || currentUser.role === 'admin';
    const isAssignedToTaasuka = selectedTaasuka.personnelIds.includes(currentUser.id);

    if (!isAdmin && !(isRassap && isAssignedToTaasuka)) {
      addToast('רק רס"פ המשויך לתעסוקה או מנהל יכולים להסיר ציוד', 'error');
      return;
    }

    // Confirm action
    if (!window.confirm(`האם אתה בטוח שברצונך להסיר את הפריט "${item.name}" מ${data?.misgerets.flatMap(m => m.personnel).find(p => p.id === soldierId)?.name || 'החייל'}?`)) {
      return;
    }

    const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';

    if (useAPI) {
      try {
        setIsLoading(true);
        
        // Remove via API (backend handles returning to inventory if needed)
        await soldierApi.removeAssignedItem(soldierId, itemId);

        // Reload data from API
        const updatedData = await getData();
        setData(updatedData);
        addToast('פריט הוסר בהצלחה', 'success');
      } catch (error: any) {
        console.error('Error unassigning item:', error);
        addToast(error.message || 'שגיאה בהסרת פריט', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local storage handling
      setData(prev => {
        if (!prev) return null;
        const newData = JSON.parse(JSON.stringify(prev));
        
        // Find the soldier
        const misgeret = newData.misgerets.find((m: Misgeret) => m.id === selectedMisgeret.id);
        if (!misgeret) return prev;
        
        const soldier = misgeret.personnel.find((p: Soldier) => p.id === soldierId);
        if (!soldier) return prev;

        // Remove item from soldier's assigned items
        soldier.assignedItems = soldier.assignedItems.filter((ai: AssignedItem) => ai.id !== itemId);

        // If item is from inventory, add it back to taasuka inventory
        if (item.inventoryItemId && item.taasukaId === selectedTaasuka.id) {
          const taasuka = newData.taasukot.find((t: Taasuka) => t.id === item.taasukaId);
          if (taasuka) {
            const inventoryItem = taasuka.inventory.find((i: InventoryItem) => i.id === item.inventoryItemId);
            if (inventoryItem) {
              // If item has a serial number, return it to serialNumbers array
              if (item.serialNumber && inventoryItem.hasSerialNumber) {
                const currentSerialNumbers = inventoryItem.serialNumbers || [];
                if (!currentSerialNumbers.includes(item.serialNumber)) {
                  inventoryItem.serialNumbers = [...currentSerialNumbers, item.serialNumber];
                }
              } else {
                // Regular item or לל"צ - add quantity back
                inventoryItem.quantity = (inventoryItem.quantity || 0) + item.quantity;
              }
            }
          }
        }

        return newData;
      });
      addToast('פריט הוסר בהצלחה', 'success');
    }
  };

  const handleBulkAssign = async (itemQuantities: { [itemId: string]: number }, soldierIds: string[]) => {
    if (!selectedTaasuka || !selectedMisgeret || soldierIds.length === 0 || Object.keys(itemQuantities).length === 0) return;
    
    // Check if API mode is enabled
    const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
    
    if (useAPI) {
      try {
        setIsLoading(true);
        
        // Validate quantities
        for (const itemId in itemQuantities) {
          const item = selectedTaasuka.inventory.find((i: InventoryItem) => i.id === itemId);
          const requiredQty = itemQuantities[itemId] * soldierIds.length;
          if (!item || item.quantity < requiredQty) {
            alert(`כמות לא מספקת עבור "${item?.name}". נדרש: ${requiredQty}, במלאי: ${item?.quantity || 0}`);
            return;
          }
        }
        
        // Assign items to all soldiers
        const assignPromises: Promise<any>[] = [];
        for (const itemId in itemQuantities) {
          const item = selectedTaasuka.inventory.find((i: InventoryItem) => i.id === itemId);
          if (item) {
            const quantityPerSoldier = itemQuantities[itemId];
            
            // Assign to each soldier
            soldierIds.forEach(soldierId => {
              assignPromises.push(
                soldierApi.assignItem(soldierId, {
                  name: item.name,
                  quantity: quantityPerSoldier,
                  provider: selectedTaasuka.name,
                  inventoryItemId: item.id,
                  taasukaId: selectedTaasuka.id,
                })
              );
            });
            
            // Update inventory quantity
            const totalQuantity = quantityPerSoldier * soldierIds.length;
            assignPromises.push(
              taasukaApi.updateInventoryItem(selectedTaasuka.id, itemId, item.quantity - totalQuantity)
            );
          }
        }
        
        // Execute all assignments
        await Promise.all(assignPromises);
        
        // Reload data from API
        const updatedData = await getData();
        setData(updatedData);
        addToast('פריטים שויכו בהצלחה', 'success');
        setBulkAssignModalOpen(false);
      } catch (error: any) {
        console.error('Error bulk assigning items:', error);
        addToast(error.message || 'שגיאה בשיוך פריטים', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Use local storage (old method)
      setData(prev => {
        if (!prev) return null;
        const newData = JSON.parse(JSON.stringify(prev));
        const taasuka = newData.taasukot.find((t: Taasuka) => t.id === selectedTaasuka.id);
        const misgeret = newData.misgerets.find((m: Misgeret) => m.id === selectedMisgeret.id);
        if (!taasuka || !misgeret) return prev;
        
        for (const itemId in itemQuantities) {
          const item = taasuka.inventory.find((i: InventoryItem) => i.id === itemId);
          const requiredQty = itemQuantities[itemId] * soldierIds.length;
          if (!item || item.quantity < requiredQty) {
            alert(`כמות לא מספקת עבור "${item?.name}". נדרש: ${requiredQty}, במלאי: ${item?.quantity || 0}`);
            return prev;
          }
        }
        
        for (const itemId in itemQuantities) {
          const item = taasuka.inventory.find((i: InventoryItem) => i.id === itemId);
          if(item) {
            item.quantity -= itemQuantities[itemId] * soldierIds.length;
            
            soldierIds.forEach(soldierId => {
              const soldier = misgeret.personnel.find((p: Soldier) => p.id === soldierId);
              if (soldier) {
                const newAssignedItem: AssignedItem = {
                  id: `${Date.now()}-${soldierId}-${itemId}`,
                  name: item.name,
                  quantity: itemQuantities[itemId],
                  provider: taasuka.name,
                  inventoryItemId: item.id,
                  taasukaId: taasuka.id,
                };
                soldier.assignedItems.push(newAssignedItem);
              }
            });
          }
        }
        return newData;
      });
      setBulkAssignModalOpen(false);
    }
  };
    
    const createNotification = useCallback((userIds: string[], message: string, taskId?: string) => {
        const newNotifications: Notification[] = userIds.map(userId => ({
            id: `${Date.now()}-${userId}`,
            userId,
            message,
            isRead: false,
            createdAt: new Date().toISOString(),
            taskId,
        }));
        setData(prev => prev ? ({ ...prev, notifications: [...prev.notifications, ...newNotifications] }) : null);
    }, [setData]);

    const handleAddTask = async (taskData: Omit<Task, 'id' | 'isComplete' | 'creatorId'>) => {
        if (!selectedTaasuka || !currentUser) return;
        
        // Check if API mode is enabled
        const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
        
        if (useAPI) {
          try {
            setIsLoading(true);
            const newTask = await taskApi.create({
              ...taskData,
              isComplete: false,
              creatorId: currentUser.id,
            });
            
            // Reload data to get the new task
            const updatedData = await getData();
            setData(updatedData);
            
            // Create notifications
            let assignedUserIds: string[] = [];
            if (newTask.assignedToType === 'soldier') {
              assignedUserIds = newTask.assignedToIds;
            } else {
              const taasuka = updatedData.taasukot.find(t => t.id === selectedTaasuka.id);
              const team = taasuka?.teams.find(t => t.id === newTask.assignedToIds[0]);
              if (team) assignedUserIds = team.memberIds;
            }
            
            createNotification(assignedUserIds, `הוקצתה לך משימה חדשה: ${newTask.title}`, newTask.id);
            addToast('משימה נוצרה בהצלחה', 'success');
            setAddTaskModalOpen(false);
          } catch (error: any) {
            console.error('Error creating task:', error);
            addToast(error.message || 'שגיאה ביצירת משימה', 'error');
          } finally {
            setIsLoading(false);
          }
        } else {
          // Use local storage (old method)
          const newTask: Task = {
            ...taskData,
            id: Date.now().toString(),
            isComplete: false,
            creatorId: currentUser.id,
          };
          setData(prev => {
            if (!prev) return null;
            return {
              ...prev,
              taasukot: prev.taasukot.map(t =>
                t.id === selectedTaasuka.id ? { ...t, tasks: [...t.tasks, newTask] } : t
              )
            }
          });

          let assignedUserIds: string[] = [];
          if (newTask.assignedToType === 'soldier') {
            assignedUserIds = newTask.assignedToIds;
          } else {
            const team = selectedTaasuka.teams.find(t => t.id === newTask.assignedToIds[0]);
            if (team) assignedUserIds = team.memberIds;
          }
          
          createNotification(assignedUserIds, `הוקצתה לך משימה חדשה: ${newTask.title}`, newTask.id);
          setAddTaskModalOpen(false);
        }
    };

    const toggleTaskComplete = (taskId: string) => {
        if (!currentUser || !data) return;
        
        const taskForToast = data.taasukot.flatMap(t => t.tasks).find(t => t.id === taskId);
        if (taskForToast && !taskForToast.isComplete) {
            addToast(`משימה "${taskForToast.title}" הושלמה.`, 'success');
        }

        setData(prev => {
            if (!prev) return null;
            let completedTask: Task | null = null;
            let parentTaasuka: Taasuka | null = null;
            let nextTask: Task | null = null;
    
            const newTaasukot = prev.taasukot.map(t => {
                const taskIndex = t.tasks.findIndex(task => task.id === taskId);
                if (taskIndex > -1) {
                    parentTaasuka = t;
                    const updatedTasks = [...t.tasks];
                    const taskToUpdate = updatedTasks[taskIndex];
                    completedTask = { ...taskToUpdate, isComplete: !taskToUpdate.isComplete };
                    updatedTasks[taskIndex] = completedTask;
    
                    // Handle recurring task
                    if (completedTask.isComplete && completedTask.isRecurring) {
                        const nextDate = new Date(completedTask.startDate);
                        if (completedTask.recurrence === 'daily') nextDate.setDate(nextDate.getDate() + 1);
                        else if (completedTask.recurrence === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
                        else if (completedTask.recurrence === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
                        nextTask = { ...completedTask, id: Date.now().toString(), isComplete: false, startDate: nextDate.toISOString() };
                        updatedTasks.push(nextTask);
                    }
                    return { ...t, tasks: updatedTasks };
                }
                return t;
            });
    
            // Create notification outside map
            if (completedTask && completedTask.isComplete && parentTaasuka) {
                let notifyUserIds: string[] = [];
                if (completedTask.notifyOnComplete === 'creator') {
                    notifyUserIds = [completedTask.creatorId];
                } else { // all_rassaps
                    const misgeret = prev.misgerets.find(m => m.id === parentTaasuka!.misgeretId);
                    if (misgeret) {
                        notifyUserIds = misgeret.personnel.filter(p => p.role === 'rassap' || p.role === 'admin').map(p => p.id);
                    }
                }
                const completer = prev.misgerets.flatMap(m => m.personnel).find(p => p.id === currentUser.id);
                createNotification(notifyUserIds, `משימה הושלמה: "${completedTask.title}" על ידי ${completer?.name || 'לא ידוע'}.`, completedTask.id);
            }
            return { ...prev, taasukot: newTaasukot };
        });
    };

    const handleDeleteTask = (taskId: string) => {
        if (!window.confirm("האם למחוק את המשימה?")) return;
        setData(prev => {
            if (!prev) return null;
            const newTaasukot = prev.taasukot.map(t => ({
                ...t,
                tasks: t.tasks.filter(task => task.id !== taskId)
            }));
            return { ...prev, taasukot: newTaasukot };
        });
        // After deleting, navigate away from detail view
        goHome();
    };
    
    const handleSaveTeam = async (teamData: { id?: string; name: string; memberIds: string[], leaderId: string }) => {
        if (!selectedTaasuka) return;
        
        // Check if API mode is enabled
        const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
        
        if (useAPI) {
          try {
            setIsLoading(true);
            const updatedTaasuka = await teamApi.createOrUpdate(selectedTaasuka.id, teamData);
            // Reload data to get updated taasuka with teams
            const updatedData = await getData();
            setData(updatedData);
            addToast('צוות נשמר בהצלחה', 'success');
            setManageTeamModalOpen(false);
            setEditingTeam(null);
          } catch (error: any) {
            console.error('Error saving team:', error);
            addToast(error.message || 'שגיאה בשמירת צוות', 'error');
          } finally {
            setIsLoading(false);
          }
        } else {
          // Use local storage (old method)
          setData(prev => {
            if (!prev) return null;
            return {
              ...prev,
              taasukot: prev.taasukot.map(t => {
                if (t.id === selectedTaasuka.id) {
                  const newTeams = [...t.teams];
                  const existingIndex = newTeams.findIndex(team => team.id === teamData.id);
                  if (existingIndex > -1) { // Update
                    newTeams[existingIndex] = { ...newTeams[existingIndex], ...teamData } as Team;
                  } else { // Create
                    const newTeam: Team = {
                      id: Date.now().toString(),
                      name: teamData.name,
                      taasukaId: t.id,
                      memberIds: teamData.memberIds,
                      leaderId: teamData.leaderId
                    };
                    newTeams.push(newTeam);
                  }
                  return { ...t, teams: newTeams };
                }
                return t;
              })
            }
          });
          setManageTeamModalOpen(false);
          setEditingTeam(null);
        }
    };

    const handleDeleteTeam = (teamId: string) => {
        if (!selectedTaasuka || !window.confirm("האם למחוק את הצוות?")) return;
        setData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                taasukot: prev.taasukot.map(t => 
                    t.id === selectedTaasuka.id ? { ...t, teams: t.teams.filter(team => team.id !== teamId) } : t
                )
            }
        });
    };

    const markNotificationsAsRead = () => {
        setData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                notifications: prev.notifications.map(n =>
                    n.userId === currentUser?.id ? { ...n, isRead: true } : n
                )
            }
        });
    };
    
    const handleLogin = async (user: any) => {
        // Ensure user has all required Soldier fields
        const soldier: Soldier = {
            id: user.id,
            name: user.name,
            personalId: user.personalId,
            role: user.role,
            assignedItems: user.assignedItems || [],
            password: user.password
        };
        
        setCurrentUser(soldier);
        setSelectedSoldierId(soldier.id);
        setActiveView('soldierProfile');
        
        // Reload data from API after login if using API mode
        const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
        if (useAPI) {
            try {
                setIsLoading(true);
                const apiData = await getData();
                setData(apiData);
            } catch (error) {
                console.error("Failed to reload data after login:", error);
                // Continue anyway - user is logged in
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    };
    
    const handleSetPassword = (soldierId: string, newPass: string) => {
      const user = data?.misgerets.flatMap(m => m.personnel).find(p => p.id === soldierId);
      if (!user) return;

      const updatedUser = { ...user, password: newPass };

      setData(prev => {
          if (!prev) return null;
          return {
              ...prev,
              misgerets: prev.misgerets.map(m => ({
                  ...m,
                  personnel: m.personnel.map(p => p.id === soldierId ? updatedUser : p)
              }))
          }
      });

      handleLogin(updatedUser);
    };
    
    const handleChangePassword = (soldierId: string, oldPass: string, newPass: string): boolean => {
      const user = data?.misgerets.flatMap(m => m.personnel).find(p => p.id === soldierId);
    
      if (!user || user.password !== oldPass) {
          return false;
      }

      const updatedUser = { ...user, password: newPass };

      setData(prev => {
          if (!prev) return null;
          return {
              ...prev,
              misgerets: prev.misgerets.map(m => ({
                  ...m,
                  personnel: m.personnel.map(p => p.id === soldierId ? updatedUser : p)
              }))
          }
      });

      if (currentUser?.id === soldierId) {
          setCurrentUser(updatedUser);
      }

      setChangePasswordModalOpen(false);
      addToast('הסיסמה שונתה בהצלחה', 'success');
      return true;
    };

    const handleUpdateSoldierName = (soldierId: string, newName: string) => {
        setData(prev => {
            if (!prev) return null;
            const newData = JSON.parse(JSON.stringify(prev));
            for (const misgeret of newData.misgerets) {
                const soldier = misgeret.personnel.find((p: Soldier) => p.id === soldierId);
                if (soldier) {
                    soldier.name = newName;
                    if (currentUser?.id === soldierId) {
                        setCurrentUser(soldier);
                    }
                    break;
                }
            }
            return newData;
        });
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setActiveView('home');
        setSelectedMisgeretId(null);
        setSelectedTaasukaId(null);
        setSelectedSoldierId(null);
        setSelectedTaskId(null);
    };

    const handleAddSoldiersToTaasuka = async (soldierIds: string[]) => {
        if(!selectedTaasuka) return;
        
        // Check if API mode is enabled
        const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
        
        if (useAPI) {
          try {
            setIsLoading(true);
            // Get current personnelIds and add new ones
            const updatedPersonnelIds = [...new Set([...selectedTaasuka.personnelIds, ...soldierIds])];
            await taasukaApi.update(selectedTaasuka.id, { personnelIds: updatedPersonnelIds });
            // Reload data
            const updatedData = await getData();
            setData(updatedData);
            addToast('חיילים נוספו לתעסוקה בהצלחה', 'success');
            setAddToTaasukaModalOpen(false);
          } catch (error: any) {
            console.error('Error adding soldiers to taasuka:', error);
            addToast(error.message || 'שגיאה בהוספת חיילים לתעסוקה', 'error');
          } finally {
            setIsLoading(false);
          }
        } else {
          // Use local storage (old method)
          setData(prev => {
            if (!prev) return null;
            return {
              ...prev,
              taasukot: prev.taasukot.map(t => 
                t.id === selectedTaasuka.id ? {...t, personnelIds: [...new Set([...t.personnelIds, ...soldierIds])]} : t
              )
            }
          });
          setAddToTaasukaModalOpen(false);
        }
    };

    const handleReleaseFromTaasuka = async (soldierId: string, taasukaId: string) => {
        const soldier = data?.misgerets.flatMap(m => m.personnel).find(p => p.id === soldierId);
        if(!soldier || !currentUser) return;
        
        // Prevent users from removing themselves
        if (currentUser.id === soldierId) {
            addToast('לא ניתן להסיר את עצמך מהתעסוקה', 'error');
            return;
        }
        
        // Check permissions:
        // - Only rassaps/admins can remove soldiers
        // - Only admins can remove rassaps
        const isRassap = soldier.role === 'rassap';
        const isAdmin = soldier.role === 'admin';
        const userIsAdmin = currentUser.role === 'admin';
        const userIsRassap = currentUser.role === 'rassap' || currentUser.role === 'admin';
        
        if (isAdmin && !userIsAdmin) {
            addToast('רק מנהל יכול להסיר מנהל מהתעסוקה', 'error');
            return;
        }
        
        if (isRassap && !userIsAdmin) {
            addToast('רק מנהל יכול להסיר רס"פ מהתעסוקה', 'error');
            return;
        }
        
        if (!userIsRassap) {
            addToast('רק רס"פ ומנהל יכולים להסיר חיילים מהתעסוקה', 'error');
            return;
        }
        
        const itemsInTaasuka = soldier.assignedItems.filter(item => item.taasukaId === taasukaId);
        if (itemsInTaasuka.length > 0) {
            alert("לא ניתן לשחרר חייל עם ציוד משויך מהתעסוקה.");
            return;
        }
        
        // Check if API mode is enabled
        const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
        
        if (useAPI) {
            try {
                await taasukaApi.removeSoldier(taasukaId, soldierId);
                // Reload data from API
                const apiData = await getData();
                setData(apiData);
                addToast(`${soldier.name} הוסר מהתעסוקה בהצלחה`, 'success');
            } catch (error: any) {
                console.error('Failed to remove soldier from taasuka:', error);
                addToast('שגיאה בהסרת החייל מהתעסוקה', 'error');
            }
        } else {
            // Use local data (old method)
            setData(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    taasukot: prev.taasukot.map(t => 
                        t.id === taasukaId ? {...t, personnelIds: t.personnelIds.filter(id => id !== soldierId)} : t
                    )
                }
            });
            addToast(`${soldier.name} הוסר מהתעסוקה בהצלחה`, 'success');
        }
    };

    const handleRemoveFromMisgeret = async (soldierId: string, misgeretId: string) => {
        const soldier = data?.misgerets.flatMap(m => m.personnel).find(p => p.id === soldierId);
        if (!soldier) return;

        const isInTaasuka = data?.taasukot.some(t => t.personnelIds.includes(soldierId));
        if(isInTaasuka) {
            alert("לא ניתן למחוק חייל המשויך לתעסוקה פעילה.");
            return;
        }
        
        if (!window.confirm("האם אתה בטוח שברצונך למחוק את החייל מהמסגרת לצמיתות?")) {
            return;
        }

        const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';

        if (useAPI) {
            try {
                setIsLoading(true);
                // Delete soldier via API
                await soldierApi.delete(soldierId);
                // Reload data from API
                const apiData = await getData();
                setData(apiData);
                addToast(`${soldier.name} נמחק בהצלחה`, 'success');
                goHome();
            } catch (error: any) {
                console.error('Failed to delete soldier:', error);
                addToast(error.message || 'שגיאה במחיקת החייל', 'error');
            } finally {
                setIsLoading(false);
            }
        } else {
            // Use local storage (old method)
            setData(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    misgerets: prev.misgerets.map(m => 
                        m.id === misgeretId ? {...m, personnel: m.personnel.filter(p => p.id !== soldierId)} : m
                    )
                }
            });
            addToast(`${soldier.name} נמחק בהצלחה`, 'success');
            goHome();
        }
    };
    
    const handleChangeRole = async (soldierId: string, newRole: 'rassap' | 'soldier' | 'admin') => {
        // Check if API mode is enabled
        const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
        
        if (useAPI) {
          try {
            setIsLoading(true);
            await soldierApi.updateRole(soldierId, newRole);
            // Reload data from API
            const updatedData = await getData();
            setData(updatedData);
            // If the current user's role is changed, update currentUser state as well
            if (currentUser?.id === soldierId) {
              const updatedSoldier = updatedData?.misgerets.flatMap(m => m.personnel).find(p => p.id === soldierId);
              if (updatedSoldier) {
                setCurrentUser(updatedSoldier);
              }
            }
            addToast('תפקיד עודכן בהצלחה', 'success');
          } catch (error: any) {
            console.error('Error updating role:', error);
            addToast(error.message || 'שגיאה בעדכון התפקיד', 'error');
          } finally {
            setIsLoading(false);
          }
        } else {
          // Use local storage (old method)
          setData(prev => {
            if (!prev) return null;
            const newData = {...prev};
            newData.misgerets = newData.misgerets.map(m => ({
              ...m,
              personnel: m.personnel.map(p => p.id === soldierId ? {...p, role: newRole} : p)
            }));
            // If the new role is admin, add them to all taasukot
            if (newRole === 'admin') {
              newData.taasukot = newData.taasukot.map(t => ({
                ...t,
                personnelIds: t.personnelIds.includes(soldierId) ? t.personnelIds : [...t.personnelIds, soldierId]
              }));
            }
            // If the current user's role is changed, update currentUser state as well
            if (currentUser?.id === soldierId) {
              setCurrentUser({...currentUser, role: newRole});
            }
            return newData;
          });
        }
    };

  const selectTaasuka = (id: string) => {
    // Check permissions before allowing access to taasuka
    if (!currentUser || !data) {
      addToast('נדרש משתמש מחובר', 'error');
      return;
    }

    const taasuka = data.taasukot.find(t => t.id === id);
    if (!taasuka) {
      addToast('תעסוקה לא נמצאה', 'error');
      return;
    }

    const isAdmin = currentUser.role === 'admin';
    const isAssignedToTaasuka = taasuka.personnelIds.includes(currentUser.id);

    if (!isAdmin && !isAssignedToTaasuka) {
      addToast('אין לך הרשאה לצפות בתעסוקה זו. רק מנהלים או משתמשים המשויכים לתעסוקה יכולים לגשת אליה.', 'error');
      return;
    }

    setSelectedTaasukaId(id);
    setActiveView('taasuka');
  };
  
  const selectMisgeret = (id: string) => {
    setSelectedMisgeretId(id);
    setActiveView('misgeret');
  };

    const selectSoldierProfile = (id: string) => {
        setSelectedSoldierId(id);
        setActiveView('soldierProfile');
    };

    const selectTask = (taskId: string) => {
      const parentTaasuka = data?.taasukot.find(t => t.tasks.some(task => task.id === taskId));
      if (parentTaasuka) {
          setSelectedTaasukaId(parentTaasuka.id);
      }
      setSelectedTaskId(taskId);
      setActiveView('taskDetail');
    };

  const goHome = () => {
    setActiveView('home');
    setSelectedMisgeretId(null);
    setSelectedTaasukaId(null);
    setSelectedSoldierId(null);
    setSelectedTaskId(null);
  };

  const openAssignModal = (soldier: Soldier, type: 'inventory' | 'external') => {
    setSelectedSoldierForAssignment(soldier);
    if (type === 'inventory') setAssignItemModalOpen(true);
    else setAddExternalItemModalOpen(true);
  };
  
  const openUpdateItemModal = (item: InventoryItem, assignedQuantity: number = 0) => {
    setSelectedItemForUpdate(item);
    setSelectedItemAssignedQuantity(assignedQuantity);
    setUpdateItemModalOpen(true);
  };
  
  const getRoleName = (role: Soldier['role']) => {
    if (role === 'admin') return 'מנהל';
    if (role === 'rassap') return 'רס"פ';
    return 'חייל';
  }

  const getAssigneeName = useCallback((task: Task, taasuka: Taasuka): string => {
    const misgeret = data?.misgerets.find(m => m.id === taasuka.misgeretId);
    if (!misgeret) return 'לא ידוע';
    if (task.assignedToType === 'soldier') {
        const soldiers = task.assignedToIds.map(id => misgeret.personnel.find(p => p.id === id)?.name).filter(Boolean);
        return soldiers.join(', ');
    } else {
        const team = taasuka.teams.find(t => t.id === task.assignedToIds[0]);
        return team?.name || 'צוות לא ידוע';
    }
  }, [data]);

  const Header = () => {
    const unreadNotifications = useMemo(() => 
        data?.notifications.filter(n => n.userId === currentUser?.id && !n.isRead),
        [data, currentUser]
    );

    const toggleNotifications = () => {
        setNotificationsOpen(prev => {
            if (!prev) markNotificationsAsRead();
            return !prev;
        });
    }

    return (
        <header className="bg-gray-800 p-4 shadow-md sticky top-0 z-20">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold text-emerald-400">RasApp</h1>
                <div className="flex items-center gap-4">
                    {currentUser && <span className="text-sm text-gray-300">מחובר כ: {currentUser.name} ({getRoleName(currentUser.role)})</span>}
                    {currentUser &&
                        <div className="relative">
                            <button onClick={toggleNotifications} className="p-2 rounded-md hover:bg-gray-700 relative">
                                <BellIcon className="w-7 h-7" />
                                {unreadNotifications && unreadNotifications.length > 0 && (
                                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{unreadNotifications.length}</span>
                                )}
                            </button>
                            {isNotificationsOpen && <NotificationsPanel />}
                        </div>
                    }
                    {currentUser?.role === 'admin' && (
                        <button onClick={() => setSystemModalOpen(true)} className="p-2 rounded-md hover:bg-gray-700" title="ניהול מערכת">
                            <CogIcon className="w-7 h-7" />
                        </button>
                    )}
                    {currentUser && (
                        <button 
                            onClick={() => {
                                setSelectedSoldierId(null);
                                setActiveView('soldierProfile');
                            }} 
                            className="p-2 rounded-md hover:bg-gray-700" 
                            title="פרופיל משתמש"
                        >
                            <UserIcon className="w-7 h-7" />
                        </button>
                    )}
                    {currentUser?.role !== 'soldier' && <button onClick={goHome} className="p-2 rounded-md hover:bg-gray-700"><HomeIcon className="w-7 h-7" /></button>}
                    {currentUser && <button onClick={handleLogout} className="p-2 rounded-md hover:bg-gray-700 text-red-400"><LogoutIcon className="w-7 h-7" /></button>}
                </div>
            </div>
        </header>
    );
  };
    
    const NotificationsPanel = () => {
        const userNotifications = useMemo(() => 
            data?.notifications
                .filter(n => n.userId === currentUser?.id)
                .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
            [data, currentUser]
        );

        return (
            <div className="absolute left-0 mt-2 w-80 bg-gray-700 rounded-lg shadow-xl z-30 border border-gray-600">
                <div className="p-3 font-bold border-b border-gray-600">התראות</div>
                <div className="max-h-96 overflow-y-auto">
                    {userNotifications && userNotifications.length > 0 ? (
                        userNotifications.map(n => {
                            const isCompletion = n.message.includes("הושלמה");
                            return (
                                <button
                                    key={n.id}
                                    onClick={() => {
                                        if (n.taskId) {
                                            selectTask(n.taskId);
                                            setNotificationsOpen(false);
                                        }
                                    }}
                                    className="block w-full text-right p-3 border-b border-gray-800 hover:bg-gray-600 disabled:hover:bg-gray-700 disabled:cursor-default"
                                    disabled={!n.taskId}
                                >
                                    <div className="flex items-start gap-3">
                                        {isCompletion ? (
                                            <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" title="משימה הושלמה"/>
                                        ) : (
                                            <ClipboardListIcon className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" title="משימה חדשה"/>
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm">{n.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('he-IL')}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <p className="p-3 text-sm text-gray-400">אין התראות חדשות.</p>
                    )}
                </div>
            </div>
        );
    };

  const LoginView = () => {
        // Use loginStage and loginPersonalId from parent App component instead of local state
        const stage = loginStage;
        const personalId = loginPersonalId;
        const setPersonalId = setLoginPersonalId;
        const [password, setPassword] = useState('');
        const [newPassword, setNewPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [userForLogin, setUserForLogin] = useState<Soldier | null>(null);
        const [error, setError] = useState('');
        const [isLoggingIn, setIsLoggingIn] = useState(false);

        const passwordChecks = useMemo(() => {
            const checks = {
                length: newPassword.length >= 8,
                lower: /[a-z]/.test(newPassword),
                upper: /[A-Z]/.test(newPassword),
                number: /\d/.test(newPassword),
                special: /[^a-zA-Z0-9]/.test(newPassword),
            };
            return checks;
        }, [newPassword]);

        const isPasswordStrong = Object.values(passwordChecks).every(Boolean);

        const handleIdSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            
            // Simple validation - just check personal ID is not empty
            if (!personalId || personalId.trim() === '') {
                setError('נא להזין מספר אישי');
                return;
            }
            
            // Check if API mode is enabled
            const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
            
            if (useAPI) {
                // Call API to check if user exists and needs password setup
                try {
                    setIsLoggingIn(true);
                    setIsLoading(true);
                    const response = await authApi.login(personalId);
                    
                    if (response.needsPassword) {
                        // User exists but has no password - go directly to password setup
                        if (response.personalId) {
                            setPersonalId(response.personalId);
                        }
                        if (response.user) {
                            setUserForLogin(response.user as Soldier);
                        }
                        setLoginStage('set_password');
                        setIsLoggingIn(false);
                        setIsLoading(false);
                    } else if (response.needsPasswordEntry) {
                        // User has password - go to password entry screen
                        if (response.personalId) {
                            setPersonalId(response.personalId);
                        }
                        if (response.user) {
                            setUserForLogin(response.user as Soldier);
                            if (!response.personalId && response.user.personalId) {
                                setPersonalId(response.user.personalId);
                            }
                        }
                        setLoginStage('password');
                        setIsLoggingIn(false);
                        setIsLoading(false);
                    } else if (response.token && response.user) {
                        // User already logged in (shouldn't happen, but handle it)
                        setToken(response.token);
                        await handleLogin(response.user as Soldier);
                        setIsLoggingIn(false);
                        setIsLoading(false);
                    } else {
                        setError('מספר אישי לא נמצא');
                        setIsLoggingIn(false);
                        setIsLoading(false);
                    }
                } catch (error: any) {
                    console.error('Error calling API:', error);
                    let errorMessage = 'שגיאה בהתחברות';
                    if (error.message) {
                        errorMessage = error.message;
                    } else if (error.status === 0 || error.message?.includes('fetch')) {
                        errorMessage = 'השרת לא זמין. בדוק שהשרת רץ על פורט 3001.';
                    }
                    setError(errorMessage);
                    setIsLoggingIn(false);
                    setIsLoading(false);
                }
            } else {
                // Use local data (old method)
                // Ensure data is loaded
                if (!data) {
                    setIsLoading(true);
                    try {
                        const loadedData = await getData();
                        setData(loadedData);
                        const allPersonnel = loadedData?.misgerets.flatMap(m => m.personnel);
                        const user = allPersonnel?.find(p => p.personalId === personalId);
                        
                        if (!user) {
                            setError('מספר אישי לא נמצא');
                            setIsLoading(false);
                            return;
                        }
                        
                        setUserForLogin(user);
                        
                        if (!user.password || user.password.trim() === '') {
                            setLoginStage('set_password');
                        } else {
                            setLoginStage('password');
                        }
                        setIsLoading(false);
                    } catch (error) {
                        setError('שגיאה בטעינת הנתונים');
                        setIsLoading(false);
                    }
                    return;
                }
                
                const allPersonnel = data.misgerets.flatMap(m => m.personnel);
                const user = allPersonnel.find(p => p.personalId === personalId);
                
                if (!user) {
                    setError('מספר אישי לא נמצא');
                    return;
                }
                
                setUserForLogin(user);
                
                if (!user.password || user.password.trim() === '') {
                    setLoginStage('set_password');
                } else {
                    setLoginStage('password');
                }
            }
        };

        const handlePasswordSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            
            // Check if API mode is enabled
            const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
            
            if (useAPI) {
                // If password is empty, check if user needs to set password
                if (!password || password.trim() === '') {
                    try {
                        setIsLoading(true);
                        // Check if user exists and needs password setup
                        const response = await authApi.login(personalId);
                        
                        if (response.needsPassword) {
                            // User exists but has no password - need to set one
                            setLoginStage('set_password');
                            if (response.user) {
                                setUserForLogin(response.user as Soldier);
                            }
                            setIsLoading(false);
                        } else if (response.needsPasswordEntry) {
                            // User has password but didn't provide one
                            setError('נא להזין סיסמה');
                            setIsLoading(false);
                        } else {
                            setError('מספר אישי לא נמצא');
                            setIsLoading(false);
                        }
                    } catch (error: any) {
                        setError(error.message || 'שגיאה בהתחברות');
                        setIsLoading(false);
                    }
                    return;
                }
                
                // Send BOTH personalId and password together for secure authentication
                try {
                    setIsLoading(true);
                    // Get personalId from userForLogin if not in state (fallback)
                    const finalPersonalId = personalId || userForLogin?.personalId || '';
                    if (!finalPersonalId || finalPersonalId.trim() === '') {
                        setError('מספר אישי חסר. נא להתחיל מחדש.');
                        setIsLoading(false);
                        return;
                    }
                    const response = await authApi.login(finalPersonalId, password);
                    
                    if (response.needsPassword) {
                        // User exists but has no password - need to set one
                        setLoginStage('set_password');
                        if (response.user) {
                            setUserForLogin(response.user as Soldier);
                        }
                        setIsLoading(false);
                    } else if (response.token && response.user) {
                        // Successful login - store token and login
                        setToken(response.token);
                        await handleLogin(response.user as Soldier);
                        setIsLoading(false);
                    } else {
                        setError('מספר אישי או סיסמה שגויים');
                        setIsLoading(false);
                    }
                } catch (error: any) {
                    setError(error.message || 'מספר אישי או סיסמה שגויים');
                } finally {
                    setIsLoading(false);
                }
            } else {
                // Use local data (old method)
                if (userForLogin && userForLogin.password === password) {
                    handleLogin(userForLogin);
                } else {
                    setError('מספר אישי או סיסמה שגויים');
                }
            }
        };
        
        const handleSetPasswordSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            
            if (newPassword !== confirmPassword) {
                setError('הסיסמאות אינן תואמות');
                return;
            }
            if (!isPasswordStrong) {
                setError('הסיסמה אינה חזקה מספיק');
                return;
            }
            
            // Check if API mode is enabled
            const useAPI = import.meta.env.VITE_USE_API === 'true' || localStorage.getItem('rassapp-use-api') === 'true';
            
            // Get personalId - use from state, userForLogin, or response
            const finalPersonalId = personalId || userForLogin?.personalId || '';
            
            if (!finalPersonalId) {
                setError('מספר אישי חסר. נא להתחיל מחדש.');
                return;
            }
            
            if (useAPI) {
                // Use API to set password
                try {
                    setIsLoading(true);
                    const response = await authApi.setPassword(finalPersonalId, newPassword);
                    
                    if (response.token && response.user) {
                        // Store token and login
                        setToken(response.token);
                        await handleLogin(response.user as Soldier);
                        setIsLoading(false);
                    } else {
                        setError('שגיאה בהגדרת הסיסמה');
                        setIsLoading(false);
                    }
                } catch (error: any) {
                    console.error('Error setting password:', error);
                    setError(error.message || 'שגיאה בהגדרת הסיסמה');
                    setIsLoading(false);
                }
            } else {
                // Use local data (old method)
                if (userForLogin) {
                    handleSetPassword(userForLogin.id, newPassword);
                } else {
                    setError('פרטי משתמש חסרים. נא להתחיל מחדש.');
                }
            }
        };
        
        const resetLogin = () => {
            setLoginStage('id');
            setLoginPersonalId('');
            setPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setUserForLogin(null);
            setError('');
        }

        return (
            <div className="p-4 flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
                <div className="w-full max-w-sm">
                    <h2 className="text-3xl font-bold text-emerald-400 mb-6 text-center">RasApp | התחברות</h2>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        {stage === 'id' && (
                            <form onSubmit={handleIdSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="personalId" className="block text-sm font-medium text-gray-300 mb-1">מספר אישי</label>
                                    <input
                                        id="personalId"
                                        type="text"
                                        value={personalId}
                                        onChange={(e) => setPersonalId(e.target.value)}
                                        required
                                        className="w-full bg-gray-700 border-gray-600 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isLoggingIn}
                                    className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoggingIn ? 'מתחבר...' : 'המשך'}
                                </button>
                            </form>
                        )}
                        
                        {stage === 'password' && (
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <p className="text-center text-gray-300">הזן את סיסמתך</p>
                                {/* Hidden field to preserve personalId */}
                                {personalId && <input type="hidden" value={personalId} />}
                                {userForLogin?.personalId && !personalId && (
                                    <input type="hidden" value={userForLogin.personalId} onChange={() => {}} />
                                )}
                                <div>
                                    <label htmlFor="password"className="block text-sm font-medium text-gray-300 mb-1">סיסמה</label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoFocus
                                        className="w-full bg-gray-700 border-gray-600 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <button type="submit" className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600 transition-colors">התחבר</button>
                                <button type="button" onClick={resetLogin} className="w-full text-sm text-gray-400 hover:text-gray-200 mt-2">חזור</button>
                            </form>
                        )}
                        
                        {stage === 'set_password' && (
                             <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
                                {!userForLogin && (
                                    <p className="text-red-400 text-sm text-center mb-2">טוען פרטי משתמש...</p>
                                )}
                                <p className="text-center text-gray-300">זוהי כניסתך הראשונה, יש להגדיר סיסמה.</p>
                                {userForLogin && (
                                    <p className="text-center text-gray-400 text-sm">משתמש: {userForLogin.name} ({userForLogin.personalId})</p>
                                )}
                                <div>
                                    <label htmlFor="newPassword"className="block text-sm font-medium text-gray-300 mb-1">סיסמה חדשה</label>
                                    <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full bg-gray-700 border-gray-600 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword"className="block text-sm font-medium text-gray-300 mb-1">אימות סיסמה</label>
                                    <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full bg-gray-700 border-gray-600 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500" />
                                </div>
                                <div className="text-xs text-gray-400 space-y-1">
                                    <p className={passwordChecks.length ? 'text-green-400' : ''}>✓ לפחות 8 תווים</p>
                                    <p className={passwordChecks.lower ? 'text-green-400' : ''}>✓ אות קטנה אחת לפחות</p>
                                    <p className={passwordChecks.upper ? 'text-green-400' : ''}>✓ אות גדולה אחת לפחות</p>
                                    <p className={passwordChecks.number ? 'text-green-400' : ''}>✓ מספר אחד לפחות</p>
                                    <p className={passwordChecks.special ? 'text-green-400' : ''}>✓ תו מיוחד אחד לפחות (!@#)</p>
                                </div>
                                <button type="submit" disabled={!isPasswordStrong || newPassword !== confirmPassword} className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600 disabled:bg-gray-500 transition-colors">הגדר סיסמה והתחבר</button>
                                <button type="button" onClick={resetLogin} className="w-full text-sm text-gray-400 hover:text-gray-200 mt-2">חזור</button>
                            </form>
                        )}

                        
                        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
                    </div>
                </div>
            </div>
        );
  };

  const HomeView = () => {
    const misgeretsToShow = currentUser?.role === 'admin'
        ? data?.misgerets
        : (currentUserMisgeret ? [currentUserMisgeret] : []);

    const taasukotToShow = currentUser?.role === 'admin'
        ? data?.taasukot
        : data?.taasukot.filter(t => t.misgeretId === currentUserMisgeret?.id);
      
    return (
    <div className="p-4 space-y-6">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-emerald-400">מסגרות</h2>
          {currentUser?.role === 'admin' && (
            <button onClick={() => setNewMisgeretModalOpen(true)} className="bg-emerald-500 text-white p-2 rounded-full hover:bg-emerald-600 shadow-lg"><PlusIcon/></button>
          )}
        </div>
        {misgeretsToShow && misgeretsToShow.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {misgeretsToShow.map(m => (
              <div key={m.id} onClick={() => selectMisgeret(m.id)} className="bg-gray-800 p-4 rounded-lg shadow-md hover:bg-gray-700 cursor-pointer transition-all flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{m.name}</h3>
                  <p className="text-sm text-gray-400">{m.personnel.length} אנשי צוות</p>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-500 transform scale-x-[-1]"/>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-400">אין מסגרות להצגה.</p>}
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-emerald-400">תעסוקות</h2>
          <button onClick={() => setNewTaasukaModalOpen(true)} className="bg-emerald-500 text-white p-2 rounded-full hover:bg-emerald-600 shadow-lg"><PlusIcon/></button>
        </div>
        {taasukotToShow && taasukotToShow.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {taasukotToShow.map(t => (
              <div key={t.id} onClick={() => selectTaasuka(t.id)} className="bg-gray-800 p-4 rounded-lg shadow-md hover:bg-gray-700 cursor-pointer transition-all flex justify-between items-center">
                 <div>
                  <h3 className="font-bold text-lg">{t.name}</h3>
                  <p className="text-sm text-gray-400">מסגרת: {data?.misgerets.find(m => m.id === t.misgeretId)?.name || 'לא ידוע'}</p>
                </div>
                 <ChevronRightIcon className="w-5 h-5 text-gray-500 transform scale-x-[-1]"/>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-400">אין תעסוקות להצגה.</p>}
      </div>
    </div>
  );
  }

  const MisgeretView = () => {
    if (!selectedMisgeret) return <p>טוען מסגרת...</p>;
    return (
      <div className="p-4 space-y-8">
        <h2 className="text-2xl font-bold mb-4 text-emerald-400">{selectedMisgeret.name}</h2>
        
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">אנשי צוות</h3>
                <button onClick={() => setAddPersonnelModalOpen(true)} className="bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 flex items-center gap-2">
                  <UserAddIcon className="w-5 h-5"/> הוסף איש צוות
                </button>
            </div>
            <div className="space-y-3">
              {selectedMisgeret.personnel.map(p => (
                <div key={p.id} onClick={() => selectSoldierProfile(p.id)} className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700">
                  <p className="font-bold">{p.name} - ({p.personalId})</p>
                   <p className={`text-sm mt-1 ${p.role === 'admin' ? 'text-red-400' : p.role === 'rassap' ? 'text-amber-400' : 'text-gray-400'}`}>תפקיד: {getRoleName(p.role)}</p>
                  <p className="text-sm text-gray-400 mt-1">ציוד משויך: {p.assignedItems.length}</p>
                </div>
              ))}
               {selectedMisgeret.personnel.length === 0 && <p className="text-gray-400">אין אנשי צוות במסגרת זו.</p>}
            </div>
        </div>
      </div>
    );
  };
  
    const SoldierProfileView = () => {
    const soldierId = selectedSoldierId || currentUser?.id;
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');

    const soldier = useMemo(() => data?.misgerets.flatMap(m => m.personnel).find(p => p.id === soldierId), [data, soldierId]);
    const misgeret = useMemo(() => data?.misgerets.find(m => m.personnel.some(p => p.id === soldierId)), [data, soldierId]);
    
    if(!soldier || !misgeret || !data) return <p>חייל לא נמצא</p>;

    // If the soldier is an admin, show all taasukot. Otherwise, only show taasukot they're assigned to
    const soldierTaasukot = soldier.role === 'admin' 
      ? data.taasukot 
      : data.taasukot.filter(t => t.personnelIds.includes(soldier.id));
    const ledTeams = data.taasukot.flatMap(t => t.teams).filter(team => team.leaderId === soldier.id);
    const assignedItemsByTaasuka = soldier.assignedItems.reduce((acc, item) => {
        const key = item.taasukaId || 'external';
        if(!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {} as Record<string, AssignedItem[]>);
    
    const assignedTasks = useMemo(() => {
        if (!data) return [];
        const tasks: {task: Task, taasuka: Taasuka}[] = [];
        data.taasukot.forEach(taasuka => {
            const soldierTeams = taasuka.teams.filter(team => team.memberIds.includes(soldier.id));
            const soldierTeamIds = soldierTeams.map(t => t.id);

            taasuka.tasks.forEach(task => {
                const isDirectlyAssigned = task.assignedToType === 'soldier' && task.assignedToIds.includes(soldier.id);
                const isTeamAssigned = task.assignedToType === 'team' && task.assignedToIds.some(teamId => soldierTeamIds.includes(teamId));
                const isCreator = task.creatorId === soldier.id;
                if (isDirectlyAssigned || isTeamAssigned || isCreator) {
                    tasks.push({ task, taasuka });
                }
            });
        });
        const uniqueTasks = Array.from(new Map(tasks.map(item => [item.task.id, item])).values());
        return uniqueTasks.sort((a,b) => new Date(a.task.startDate).getTime() - new Date(b.task.startDate).getTime());
    }, [data, soldier]);
    
    const selectTaasukaForSoldier = (taasukaId: string) => {
        setSelectedTaasukaId(taasukaId);
        setActiveView('soldierTaasuka');
    };

    const canBeRemoved = !data.taasukot.some(t => t.personnelIds.includes(soldier.id));
    const isManager = currentUser?.role === 'rassap' || currentUser?.role === 'admin';
    const isAdmin = currentUser?.role === 'admin';
    const isOwnProfile = currentUser?.id === soldier.id;
    
    // Check if current user can remove this soldier from taasuka
    const canRemoveFromTaasuka = (targetSoldier: Soldier): boolean => {
        if (!currentUser || currentUser.id === targetSoldier.id) return false; // Can't remove yourself
        const userIsAdmin = currentUser.role === 'admin';
        const userIsRassap = currentUser.role === 'rassap' || currentUser.role === 'admin';
        const targetIsAdmin = targetSoldier.role === 'admin';
        const targetIsRassap = targetSoldier.role === 'rassap';
        
        // Only admins can remove admins
        if (targetIsAdmin && !userIsAdmin) return false;
        // Only admins can remove rassaps
        if (targetIsRassap && !userIsAdmin) return false;
        // Only rassaps/admins can remove soldiers
        if (!userIsRassap) return false;
        
        return true;
    };

    const startEditName = () => {
        setEditedName(soldier.name);
        setIsEditingName(true);
    };

    const cancelEditName = () => {
        setIsEditingName(false);
    };

    const saveEditName = () => {
        if(editedName.trim()){
            handleUpdateSoldierName(soldier.id, editedName.trim());
            setIsEditingName(false);
        }
    };
    
    const RoleSelector = () => {
        if (isOwnProfile || (!isAdmin && currentUser?.role !== 'rassap')) return null;
        if(soldier.id === 'admin-1') return null; // Prevent changing main admin role

        const rassapOptions = [
            <option key="soldier" value="soldier">חייל</option>,
            <option key="rassap" value="rassap">רס"פ</option>,
        ];

        const adminOptions = [ ...rassapOptions, <option key="admin" value="admin">מנהל</option> ];

        return (
            <select 
                value={soldier.role} 
                onChange={(e) => handleChangeRole(soldier.id, e.target.value as Soldier['role'])}
                className="bg-gray-700 border-gray-600 rounded-md p-1 text-sm"
            >
                {isAdmin ? adminOptions : rassapOptions}
            </select>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                          {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="bg-gray-700 border-gray-600 rounded-md p-2 text-2xl font-bold" autoFocus/>
                                <button onClick={saveEditName} className="p-1 text-green-400 hover:text-green-300"><SaveIcon className="w-6 h-6"/></button>
                                <button onClick={cancelEditName} className="p-1 text-red-400 hover:text-red-300"><XIcon className="w-6 h-6"/></button>
                            </div>
                          ) : (
                            <h2 className="text-2xl font-bold text-emerald-400">{soldier.name}</h2>
                          )}
                          {isManager && !isOwnProfile && !isEditingName && (
                              <button onClick={startEditName} className="text-gray-400 hover:text-white"><EditIcon className="w-5 h-5"/></button>
                          )}
                        </div>
                        <p className="text-gray-400">מ.א: {soldier.personalId}</p>
                        <p className="text-gray-400">מסגרת: {misgeret.name}</p>
                        <p className={`font-bold mt-1 ${soldier.role === 'admin' ? 'text-red-400' : soldier.role === 'rassap' ? 'text-amber-400' : 'text-gray-300'}`}>
                            תפקיד: {getRoleName(soldier.role)}
                        </p>
                    </div>
                     <div className="flex flex-col items-end gap-2">
                        {isOwnProfile && 
                          <button onClick={() => setChangePasswordModalOpen(true)} className="text-amber-400 hover:text-amber-300 text-sm flex items-center gap-1">
                              <KeyIcon className="w-4 h-4" /> שנה סיסמה
                          </button>
                        }
                        <RoleSelector />
                    </div>
                </div>
            </div>

            {isOwnProfile && (
                <>
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">התעסוקות שלי</h3>
                        {soldierTaasukot.length > 0 ? (
                            <div className="space-y-3">
                                {soldierTaasukot.map(t => {
                                    const itemsInTaasuka = soldier.assignedItems.filter(item => item.taasukaId === t.id);
                                    const hasItems = itemsInTaasuka.length > 0;
                                    
                                    return (
                                    <div key={t.id} className="bg-gray-800 p-4 rounded-lg shadow-md hover:bg-gray-700 transition-all">
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1 cursor-pointer" onClick={() => selectTaasukaForSoldier(t.id)}>
                                                <h4 className="font-bold text-lg">{t.name}</h4>
                                                <p className="text-sm text-gray-400">מסגרת: {data.misgerets.find(m => m.id === t.misgeretId)?.name || 'לא ידוע'}</p>
                                                {hasItems && (
                                                    <p className="text-xs text-emerald-400 mt-1">
                                                        {itemsInTaasuka.length} פריט{itemsInTaasuka.length > 1 ? 'ים' : ''} משויך{itemsInTaasuka.length > 1 ? 'ים' : ''}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <ChevronRightIcon className="w-5 h-5 text-gray-500 transform scale-x-[-1]"/>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        ) : <p className="text-gray-400">אינך משויך לאף תעסוקה.</p>}
                    </div>

                    {ledTeams.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">צוותים בניהולי</h3>
                        <div className="space-y-2">
                            {ledTeams.map(team => {
                                const teamTaasuka = data.taasukot.find(t => t.id === team.taasukaId);
                                return (
                                    <div key={team.id} className="bg-gray-800/50 p-3 rounded-lg">
                                        <p className="font-bold">{team.name}</p>
                                        <p className="text-sm text-gray-400">תעסוקה: {teamTaasuka?.name || 'לא ידוע'}</p>
                                    </div>
                                );
                            })}
                        </div>
                      </div>
                    )}
                </>
            )}
            
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">כלל המשימות שלי</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {assignedTasks.map(({ task, taasuka }) => (
                      <button 
                        key={task.id}
                        onClick={() => selectTask(task.id)}
                        className={`w-full text-right bg-gray-800 p-3 rounded-lg flex items-center gap-4 ${task.isComplete ? 'opacity-50' : ''} hover:bg-gray-700 transition-colors`}
                      >
                          <div className="flex-1">
                            <p className={`font-bold ${task.isComplete ? 'line-through' : ''}`}>{task.title}</p>
                            <p className="text-xs text-gray-500">{taasuka.name}</p>
                            <div className="text-xs text-gray-400 mt-2">
                                <span>תאריך: {new Date(task.startDate).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short'})}</span>
                            </div>
                          </div>
                          {task.isComplete && <CheckCircleIcon className="w-6 h-6 text-green-500" />}
                      </button>
                    ))}
                    {assignedTasks.length === 0 && <p className="text-gray-400">אין לך משימות משויכות.</p>}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-2">כלל הציוד שברשותי</h3>
                <div className="space-y-4">
                    {/* Show taasukot the soldier is in, with their items */}
                    {soldierTaasukot.map(taasuka => {
                        const itemsInThisTaasuka = soldier.assignedItems.filter(item => item.taasukaId === taasuka.id);
                        const hasItems = itemsInThisTaasuka.length > 0;
                        
                        return (
                            <div key={taasuka.id} className="bg-gray-800 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-lg text-emerald-300">
                                        {taasuka.name}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        {hasItems && (
                                            <button
                                                onClick={async () => await generateTaasukaEquipmentPdf(soldier, misgeret.name, taasuka)}
                                                className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
                                            >
                                                <FileDownloadIcon className="w-4 h-4" /> טופס 1008
                                            </button>
                                        )}
                                        {canRemoveFromTaasuka(soldier) && !hasItems && (
                                            <button 
                                                onClick={() => {
                                                    if (window.confirm(`האם אתה בטוח שברצונך להסיר את ${soldier.name} מהתעסוקה ${taasuka.name}?`)) {
                                                        handleReleaseFromTaasuka(soldier.id, taasuka.id);
                                                    }
                                                }} 
                                                className="text-xs bg-red-600 text-white py-1 px-2 rounded-full hover:bg-red-700"
                                            >
                                                הסר מהתעסוקה
                                            </button>
                                        )}
                                        {canRemoveFromTaasuka(soldier) && hasItems && (
                                            <p className="text-xs text-yellow-400">לא ניתן להסיר - יש ציוד משויך</p>
                                        )}
                                    </div>
                                </div>
                                {hasItems ? (
                                    <ul className="text-gray-300 text-sm space-y-1">
                                        {itemsInThisTaasuka.map(item => {
                                            // Check if current user can unassign items from this taasuka
                                            const canUnassign = (() => {
                                                if (!currentUser || !data) return false;
                                                const targetTaasuka = data.taasukot.find(t => t.id === taasuka.id);
                                                if (!targetTaasuka) return false;
                                                const isAdmin = currentUser.role === 'admin';
                                                const isRassap = currentUser.role === 'rassap' || currentUser.role === 'admin';
                                                const isAssignedToTaasuka = targetTaasuka.personnelIds.includes(currentUser.id);
                                                return isAdmin || (isRassap && isAssignedToTaasuka);
                                            })();
                                            const isFromInventory = item.inventoryItemId !== null;
                                            return (
                                            <li key={item.id} className="flex justify-between items-center gap-2">
                                                <span className="flex-1">
                                                    {item.name} - <span className="font-mono">{item.serialNumber || item.quantity}</span>
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${isFromInventory ? 'bg-blue-700 text-gray-200' : 'bg-purple-700 text-gray-200'}`}>
                                                    {isFromInventory ? 'רספייה' : `${item.provider} (ספק חיצוני)`}
                                                </span>
                                                {canUnassign && (
                                                    <button
                                                        onClick={() => handleUnassignItem(soldier.id, item.id, item)}
                                                        className="text-red-400 hover:text-red-300 p-1"
                                                        title="הסר פריט"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="text-gray-400 text-sm">אין ציוד משויך בתעסוקה זו</p>
                                )}
                            </div>
                        );
                    })}
                    
                    {/* Show external items (items not in any taasuka) */}
                    {soldier.assignedItems.filter(item => !item.taasukaId).length > 0 && (
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h4 className="font-bold text-lg text-purple-300 mb-2">ציוד חיצוני</h4>
                            <ul className="text-gray-300 text-sm space-y-1">
                                {soldier.assignedItems.filter(item => !item.taasukaId).map(item => {
                                    const canEdit = isManager;
                                    return (
                                    <li key={item.id} className="flex justify-between items-center gap-2">
                                        <span className="flex-1">
                                            {item.name} - {item.serialNumber ? (
                                                <span className="font-mono">{item.serialNumber}</span>
                                            ) : canEdit && item.quantity > 1 ? (
                                                <span
                                                    onClick={() => {
                                                        setSelectedAssignedItemForUpdate({ soldierId: soldier.id, item });
                                                        setUpdateAssignedItemModalOpen(true);
                                                    }}
                                                    className="font-mono cursor-pointer hover:text-blue-400 transition-colors"
                                                    title="לחץ לערוך כמות"
                                                >
                                                    {item.quantity}
                                                </span>
                                            ) : (
                                                <span className="font-mono">{item.quantity}</span>
                                            )}
                                        </span>
                                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{item.provider}</span>
                                        {canEdit && (
                                            item.quantity > 1 ? (
                                                <button
                                                    onClick={() => {
                                                        setSelectedAssignedItemForUpdate({ soldierId: soldier.id, item });
                                                        setUpdateAssignedItemModalOpen(true);
                                                    }}
                                                    className="text-blue-400 hover:text-blue-300 p-1"
                                                    title="ערוך כמות"
                                                >
                                                    ערוך
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUnassignItem(soldier.id, item.id, item)}
                                                    className="text-red-400 hover:text-red-300 p-1"
                                                    title="הסר פריט"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )
                                        )}
                                    </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                    
                    {soldier.assignedItems.length === 0 && soldierTaasukot.length === 0 && (
                        <p className="text-gray-400">אין ציוד משויך לחייל זה.</p>
                    )}
                </div>
            </div>

            {isManager && !isOwnProfile && (
                 <div className="mt-6">
                    <button 
                        onClick={() => handleRemoveFromMisgeret(soldier.id, misgeret.id)}
                        disabled={!canBeRemoved || soldier.id === 'admin-1'}
                        className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed disabled:text-gray-400"
                    >
                       הסר מהמסגרת
                    </button>
                    {!canBeRemoved && <p className="text-xs text-red-400 mt-1 text-center">יש לשחרר את החייל מכל התעסוקות לפני הסרה מהמסגרת.</p>}
                 </div>
            )}
        </div>
    );
};

  const TaasukaView = () => {
    const [activeTab, setActiveTab] = useState('inventory');
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    if (!selectedTaasuka || !selectedMisgeret) return <p>טוען תעסוקה...</p>;
    
    // Double-check permissions before rendering (additional security layer)
    if (!currentUser) {
      addToast('נדרש משתמש מחובר', 'error');
      goHome();
      return <p>טוען...</p>;
    }

    const isAdmin = currentUser.role === 'admin';
    const isAssignedToTaasuka = selectedTaasuka.personnelIds.includes(currentUser.id);

    if (!isAdmin && !isAssignedToTaasuka) {
      addToast('אין לך הרשאה לצפות בתעסוקה זו. רק מנהלים או משתמשים המשויכים לתעסוקה יכולים לגשת אליה.', 'error');
      goHome();
      return <p>טוען...</p>;
    }
    
    const taasukaPersonnel = selectedMisgeret.personnel.filter(p => selectedTaasuka.personnelIds.includes(p.id));
    
    // Group צל"ם items by name for clustering
    const groupedSerialItems = useMemo(() => {
      if (!data || !selectedTaasuka) return new Map<string, InventoryItem[]>();
      const groups = new Map<string, InventoryItem[]>();
      
      selectedTaasuka.inventory
        .filter(item => item.hasSerialNumber)
        .forEach(item => {
          const key = item.name.trim().toLowerCase();
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key)!.push(item);
        });
      
      return groups;
    }, [data, selectedTaasuka]);
    
    // Get all assigned items for this taasuka
    const assignedItemsForTaasuka = useMemo(() => {
      if (!data) return [];
      return data.misgerets
        .flatMap(m => m.personnel)
        .flatMap(soldier => soldier.assignedItems)
        .filter(item => item.taasukaId === selectedTaasuka.id);
    }, [data, selectedTaasuka]);
    
    // Get all assigned items for this taasuka with serial numbers
    const assignedItemsWithSerial = useMemo(() => {
      return assignedItemsForTaasuka.filter(item => item.serialNumber);
    }, [assignedItemsForTaasuka]);
    
    const toggleExpand = (itemName: string) => {
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemName)) {
          newSet.delete(itemName);
        } else {
          newSet.add(itemName);
        }
        return newSet;
      });
    };
    
    // Check if current user can remove a soldier from taasuka
    const canRemoveFromTaasuka = (targetSoldier: Soldier): boolean => {
        if (!currentUser || currentUser.id === targetSoldier.id) return false; // Can't remove yourself
        const userIsAdmin = currentUser.role === 'admin';
        const userIsRassap = currentUser.role === 'rassap' || currentUser.role === 'admin';
        const targetIsAdmin = targetSoldier.role === 'admin';
        const targetIsRassap = targetSoldier.role === 'rassap';
        
        // Only admins can remove admins
        if (targetIsAdmin && !userIsAdmin) return false;
        // Only admins can remove rassaps
        if (targetIsRassap && !userIsAdmin) return false;
        // Only rassaps/admins can remove soldiers
        if (!userIsRassap) return false;
        
        return true;
    };

    // Check if current user can unassign items (rassap/admin assigned to taasuka)
    const canUnassignItems = (): boolean => {
        if (!currentUser || !selectedTaasuka) return false;
        const isAdmin = currentUser.role === 'admin';
        const isRassap = currentUser.role === 'rassap' || currentUser.role === 'admin';
        const isAssignedToTaasuka = selectedTaasuka.personnelIds.includes(currentUser.id);
        return isAdmin || (isRassap && isAssignedToTaasuka);
    };

    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-2 text-emerald-400">{selectedTaasuka.name}</h2>
        <p className="text-gray-400 mb-4">מסגרת: {selectedMisgeret.name}</p>

        <div className="border-b border-gray-700 mb-4">
          <nav className="flex space-x-4" aria-label="Tabs">
            <button onClick={() => setActiveTab('inventory')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'inventory' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'text-gray-400 hover:text-gray-200'}`}>מלאי</button>
            <button onClick={() => setActiveTab('personnel')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'personnel' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'text-gray-400 hover:text-gray-200'}`}>כוח אדם</button>
            <button onClick={() => setActiveTab('teams')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'teams' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'text-gray-400 hover:text-gray-200'}`}>צוותים</button>
            <button onClick={() => setActiveTab('tasks')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'tasks' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'text-gray-400 hover:text-gray-200'}`}>משימות</button>
          </nav>
        </div>

        {activeTab === 'inventory' && (
          <div>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setAddItemModalOpen(true)} className="bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 flex items-center gap-2 flex-1"><PlusIcon/> הוסף פריט</button>
              <button onClick={() => setAddFromImageModalOpen(true)} className="bg-sky-500 text-white py-2 px-4 rounded-lg hover:bg-sky-600 flex items-center gap-2 flex-1"><PlusIcon/> הוסף מספר פריטים</button>
            </div>
            <div className="space-y-2">
              {(() => {
                // Separate regular items from צל"ם items
                const regularItems = selectedTaasuka.inventory.filter(item => !item.hasSerialNumber);
                const serialNumberItems = selectedTaasuka.inventory.filter(item => item.hasSerialNumber);
                
                // Group צל"ם items by name
                const groupedByName = new Map<string, InventoryItem[]>();
                serialNumberItems.forEach(item => {
                  const key = item.name.trim().toLowerCase();
                  if (!groupedByName.has(key)) {
                    groupedByName.set(key, []);
                  }
                  groupedByName.get(key)!.push(item);
                });
                
                return (
                  <>
                    {/* Regular items */}
                    {regularItems.map(item => {
                      // Calculate assigned quantity for this item
                      const assignedItemsForThis = assignedItemsForTaasuka.filter(ai => 
                        ai.inventoryItemId === item.id && !ai.serialNumber
                      );
                      const assignedQuantity = assignedItemsForThis.reduce((sum, ai) => sum + (ai.quantity || 1), 0);
                      const totalQuantity = item.quantity || 0;
                      const availableQuantity = Math.max(0, totalQuantity - assignedQuantity);
                      
                      return (
                        <div key={item.id} className="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                          <span>{item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">זמינים: {availableQuantity}</span>
                            {(currentUser?.role === 'admin' || currentUser?.role === 'rassap') ? (
                              <span
                                onClick={() => openUpdateItemModal(item, assignedQuantity)}
                                className="font-mono bg-gray-700 px-2 py-1 rounded cursor-pointer hover:bg-gray-600 transition-colors"
                                title={currentUser?.role === 'rassap' ? 'לחץ לערוך כמות (רק הגדלה)' : 'לחץ לערוך כמות'}
                              >
                                סה"כ: {totalQuantity}
                              </span>
                            ) : (
                              <span className="font-mono bg-gray-700 px-2 py-1 rounded">סה"כ: {totalQuantity}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Clustered צל"ם items */}
                    {Array.from(groupedByName.entries()).map(([itemNameKey, items]) => {
                      const itemName = items[0].name; // Use first item's name as display name
                      
                      // Calculate total: serial numbers count + quantity (לל"צ)
                      const totalSerialNumbers = items.reduce((sum, item) => sum + (item.serialNumbers?.length || 0), 0);
                      const totalNoSNQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                      const totalQuantity = totalSerialNumbers + totalNoSNQuantity;
                      
                      const isExpanded = expandedItems.has(itemName);
                      
                      // Find all assigned items with this name and serial numbers
                      const assignedForThisItem = assignedItemsWithSerial.filter(ai => 
                        ai.name.trim().toLowerCase() === itemNameKey && ai.inventoryItemId && items.some(inv => inv.id === ai.inventoryItemId)
                      );
                      
                      // Get soldiers for assigned items
                      const assignedWithSoldiers = assignedForThisItem.map(ai => {
                        const soldier = data?.misgerets
                          .flatMap(m => m.personnel)
                          .find(s => s.assignedItems.some(ai2 => ai2.id === ai.id));
                        return { assignedItem: ai, soldier };
                      });
                      
                      // Available = total serial numbers - assigned serial numbers + unassigned לל"צ quantity
                      const assignedSerialNumbersCount = assignedWithSoldiers.filter(a => a.assignedItem.serialNumber).length;
                      const availableQuantity = (totalSerialNumbers - assignedSerialNumbersCount) + totalNoSNQuantity;
                      
                      return (
                        <div key={itemNameKey} className="bg-gray-800 rounded-lg overflow-hidden">
                          <div 
                            onClick={() => toggleExpand(itemName)} 
                            className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              {isExpanded ? (
                                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                              )}
                              <span>{itemName} <span className="text-xs text-gray-400">(צל"ם)</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400">זמינים: {availableQuantity}</span>
                              <span className="font-mono bg-gray-700 px-2 py-1 rounded">סה"כ: {totalQuantity}</span>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="border-t border-gray-700 p-3 bg-gray-750">
                              <div className="space-y-2">
                                {/* Get all serial numbers from inventory items */}
                                {(() => {
                                  const allSerialNumbers: string[] = [];
                                  items.forEach(item => {
                                    if (item.serialNumbers && item.serialNumbers.length > 0) {
                                      allSerialNumbers.push(...item.serialNumbers);
                                    }
                                  });
                                  
                                  // Add לל"צ items (represented by quantity)
                                  const noSNQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                                  
                                  // Create a map of serial number to assigned soldier
                                  const serialNumberToSoldier = new Map<string, { soldier: Soldier, assignedItem: AssignedItem }>();
                                  assignedWithSoldiers.forEach(({ assignedItem, soldier }) => {
                                    if (assignedItem.serialNumber && soldier) {
                                      serialNumberToSoldier.set(assignedItem.serialNumber, { soldier, assignedItem });
                                    }
                                  });
                                  
                                  // Separate assigned and available serial numbers
                                  const assignedSNs = Array.from(serialNumberToSoldier.keys());
                                  const availableSNs = allSerialNumbers.filter(sn => !assignedSNs.includes(sn));
                                  
                                  return (
                                    <>
                                      {/* Show all serial numbers with their owners or assign button */}
                                      <div className="space-y-1">
                                        {allSerialNumbers.map((sn, idx) => {
                                          const assignment = serialNumberToSoldier.get(sn);
                                          // Find the inventory item that contains this serial number
                                          const inventoryItem = items.find(item => 
                                            item.serialNumbers && item.serialNumbers.includes(sn)
                                          );
                                          return (
                                            <div key={`${sn}-${idx}`} className="flex justify-between items-center bg-gray-900 p-2 rounded text-sm">
                                              <span className="font-mono text-cyan-400">{sn}</span>
                                              <div className="flex items-center gap-2">
                                                {assignment ? (
                                                  <div className="text-right">
                                                    <div className="text-gray-300">{assignment.soldier.name}</div>
                                                    <div className="text-xs text-gray-400">{assignment.soldier.personalId}</div>
                                                  </div>
                                                ) : (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (inventoryItem) {
                                                        // Store which item and SN to assign
                                                        setSelectedSerialNumberForAssignment({ 
                                                          inventoryItemId: inventoryItem.id, 
                                                          serialNumber: sn,
                                                          itemName: itemName
                                                        });
                                                        setSelectSoldierModalOpen(true);
                                                      }
                                                    }}
                                                    className="bg-blue-500 text-white text-xs py-1 px-3 rounded hover:bg-blue-600"
                                                  >
                                                    שייך
                                                  </button>
                                                )}
                                                {currentUser?.role === 'admin' && inventoryItem && (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (window.confirm(`האם אתה בטוח שברצונך להסיר את המס"ד ${sn}?`)) {
                                                        handleRemoveSerialNumber(inventoryItem.id, sn);
                                                      }
                                                    }}
                                                    className="text-red-400 hover:text-red-300 p-1"
                                                    title="הסר מסד"
                                                  >
                                                    <TrashIcon className="w-4 h-4" />
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                        
                                        {/* Show לל"צ items (no SN) */}
                                        {noSNQuantity > 0 && (
                                          <div className="flex justify-between items-center bg-gray-900 p-2 rounded text-sm border-t border-gray-700 mt-2 pt-2">
                                            <span className="text-gray-400">לל"צ (ללא מס"ד סידורי)</span>
                                            <div className="flex items-center gap-2">
                                              <span className="text-gray-300">כמות: </span>
                                              {currentUser?.role === 'admin' && items.length > 0 ? (
                                                <span
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Find the first item to edit its quantity (all items in the group share the same quantity)
                                                    const itemToEdit = items.find(item => item.hasSerialNumber);
                                                    if (itemToEdit) {
                                                      setSelectedItemForUpdate({ ...itemToEdit, quantity: noSNQuantity });
                                                      setUpdateItemModalOpen(true);
                                                    }
                                                  }}
                                                  className="font-mono text-gray-300 cursor-pointer hover:text-blue-400 transition-colors"
                                                  title="לחץ לערוך כמות"
                                                >
                                                  {noSNQuantity}
                                                </span>
                                              ) : (
                                                <span className="font-mono text-gray-300">{noSNQuantity}</span>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'personnel' && (
          <div>
            <div className="flex gap-2 mb-4">
                <button onClick={() => setAddToTaasukaModalOpen(true)} className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2">
                    <UserAddIcon/> הוסף כוח אדם לתעסוקה
                </button>
                <button onClick={() => setBulkAssignModalOpen(true)} className="w-full bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600 flex items-center justify-center gap-2">
                    <UsersIcon/> שייך ציוד בבת אחת
                </button>
            </div>
            <div className="space-y-3">
                {taasukaPersonnel.map(soldier => {
                    // Show items from taasuka inventory OR external items linked to this taasuka
                    const itemsInThisTaasuka = soldier.assignedItems.filter(item => 
                        item.taasukaId === selectedTaasuka.id
                    );
                    const hasItems = itemsInThisTaasuka.length > 0;
                    const isManager = currentUser?.role === 'rassap' || currentUser?.role === 'admin';
                    
                    return (
                    <div key={soldier.id} className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                        <div className="cursor-pointer flex-1" onClick={() => selectSoldierProfile(soldier.id)}>
                            <p className="font-bold">{soldier.name}</p>
                            <p className="text-sm text-gray-400">{soldier.personalId}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                               <button onClick={() => openAssignModal(soldier, 'inventory')} className="bg-blue-500 text-white text-xs py-1 px-3 rounded-full hover:bg-blue-600">שייך ממלאי</button>
                               <button onClick={() => openAssignModal(soldier, 'external')} className="bg-purple-500 text-white text-xs py-1 px-3 rounded-full hover:bg-purple-600">שייך מחיצוני</button>
                            </div>
                            {canRemoveFromTaasuka(soldier) && !hasItems && (
                                <button 
                                    onClick={() => {
                                        if (window.confirm(`האם אתה בטוח שברצונך להסיר את ${soldier.name} מהתעסוקה ${selectedTaasuka.name}?`)) {
                                            handleReleaseFromTaasuka(soldier.id, selectedTaasuka.id);
                                        }
                                    }} 
                                    className="bg-red-600 text-white text-xs py-1 px-3 rounded-full hover:bg-red-700"
                                >
                                    הסר מהתעסוקה
                                </button>
                            )}
                            {canRemoveFromTaasuka(soldier) && hasItems && (
                                <p className="text-xs text-yellow-400">לא ניתן להסיר - יש ציוד משויך</p>
                            )}
                        </div>
                        </div>
                        {hasItems && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                            <h4 className="text-sm font-semibold mb-2">ציוד משויך בתעסוקה זו:</h4>
                            <ul className="text-gray-300 text-sm space-y-1">
                            {itemsInThisTaasuka.map(item => {
                                const isFromInventory = item.inventoryItemId !== null;
                                // Display serial number if available, otherwise quantity
                                const displayValue = item.serialNumber || item.quantity;
                                return (
                                <li key={item.id} className="flex justify-between items-center gap-2">
                                    <span className="flex-1">
                                        {item.name} - {item.serialNumber ? (
                                            <span className="font-mono">{item.serialNumber}</span>
                                        ) : canUnassignItems() && item.quantity > 1 ? (
                                            <span
                                                onClick={() => {
                                                    setSelectedAssignedItemForUpdate({ soldierId: soldier.id, item });
                                                    setUpdateAssignedItemModalOpen(true);
                                                }}
                                                className="font-mono cursor-pointer hover:text-blue-400 transition-colors"
                                                title="לחץ לערוך כמות"
                                            >
                                                {item.quantity}
                                            </span>
                                        ) : (
                                            <span className="font-mono">{item.quantity}</span>
                                        )}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${isFromInventory ? 'bg-blue-700 text-gray-200' : 'bg-purple-700 text-gray-200'}`}>
                                        {isFromInventory ? 'ממלאי התעסוקה' : `${item.provider} (ספק חיצוני)`}
                                    </span>
                                    {canUnassignItems() && (
                                        item.quantity > 1 ? (
                                            <button
                                                onClick={() => {
                                                    setSelectedAssignedItemForUpdate({ soldierId: soldier.id, item });
                                                    setUpdateAssignedItemModalOpen(true);
                                                }}
                                                className="text-blue-400 hover:text-blue-300 p-1"
                                                title="ערוך כמות"
                                            >
                                                ערוך
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleUnassignItem(soldier.id, item.id, item)}
                                                className="text-red-400 hover:text-red-300 p-1"
                                                title="הסר פריט"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )
                                    )}
                                </li>
                                );
                            })}
                            </ul>
                        </div>
                        )}
                    </div>
                    );
                })}
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">צוותים</h3>
                    <button onClick={() => { setEditingTeam(null); setManageTeamModalOpen(true); }} className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center gap-2">
                      <PlusIcon/> צור צוות
                    </button>
                </div>
                <div className="space-y-3">
                  {selectedTaasuka.teams.map(team => (
                      <div key={team.id} className="bg-gray-800 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold">{team.name}</p>
                                <p className="text-sm text-gray-400">{team.memberIds.length} חברים</p>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => { setEditingTeam(team); setManageTeamModalOpen(true); }} className="p-2 text-gray-400 hover:text-white"><EditIcon className="w-5 h-5"/></button>
                                  <button onClick={() => handleDeleteTeam(team.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                              </div>
                          </div>
                      </div>
                  ))}
                  {selectedTaasuka.teams.length === 0 && <p className="text-gray-400">אין צוותים בתעסוקה זו.</p>}
                </div>
            </div>
        )}
        
        {activeTab === 'tasks' && (
          <div>
            <button onClick={() => setAddTaskModalOpen(true)} className="bg-emerald-500 w-full text-white py-2 px-4 rounded-lg hover:bg-emerald-600 flex items-center gap-2 justify-center mb-4"><PlusIcon/> הוסף משימה</button>
            <div className="space-y-3">
              {selectedTaasuka.tasks.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(task => (
                <button 
                  key={task.id} 
                  onClick={() => selectTask(task.id)}
                  className={`w-full text-right bg-gray-800 p-3 rounded-lg flex items-start gap-4 ${task.isComplete ? 'opacity-50' : ''} hover:bg-gray-700 transition-colors`}
                >
                  <div className="flex-1">
                    <p className={`font-bold ${task.isComplete ? 'line-through' : ''}`}>{task.title}</p>
                    <p className={`text-sm text-gray-300 ${task.isComplete ? 'line-through' : ''}`}>{task.description}</p>
                    <div className="text-xs text-gray-400 mt-2 flex items-center gap-4 flex-wrap">
                      <span>תאריך: {new Date(task.startDate).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short'})}</span>
                      <span>משויך ל: {getAssigneeName(task, selectedTaasuka)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    {task.isComplete && <CheckCircleIcon className="w-5 h-5 text-green-500" title="הושלמה"/>}
                    {task.isRecurring && <RefreshIcon className="w-5 h-5 text-cyan-400" title={`חוזר על עצמו ${task.recurrence}`}/>}
                  </div>
                </button>
              ))}
               {selectedTaasuka.tasks.length === 0 && <p className="text-gray-400">אין משימות בתעסוקה זו.</p>}
            </div>
          </div>
        )}
      </div>
    );
  };

  const SoldierTaasukaView = () => {
    const [activeTab, setActiveTab] = useState('tasks');
    if (!selectedTaasuka || !currentUser || !data) return <p>טוען תעסוקה...</p>;

    const misgeret = data.misgerets.find(m => m.id === selectedTaasuka.misgeretId);
    const soldier = misgeret?.personnel.find(p => p.id === currentUser.id);

    if (!soldier || !misgeret) return <p>שגיאה: לא נמצא חייל.</p>;

    const taasukaItems = soldier.assignedItems.filter(item => item.taasukaId === selectedTaasuka.id);

    const soldierTeamsInTaasuka = selectedTaasuka.teams.filter(team => team.memberIds.includes(soldier.id));
    const ledTeamsInTaasuka = soldierTeamsInTaasuka.filter(team => team.leaderId === soldier.id);
    
    const soldierTasksInTaasuka = useMemo(() => {
        const tasks: Task[] = [];
        const soldierTeamIds = soldierTeamsInTaasuka.map(t => t.id);

        selectedTaasuka.tasks.forEach(task => {
            const isDirectlyAssigned = task.assignedToType === 'soldier' && task.assignedToIds.includes(soldier.id);
            const isTeamAssigned = task.assignedToType === 'team' && task.assignedToIds.some(teamId => soldierTeamIds.includes(teamId));
            if (isDirectlyAssigned || isTeamAssigned) {
                tasks.push(task);
            }
        });
        return tasks.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [selectedTaasuka, soldier.id, soldierTeamsInTaasuka]);

    const openLeaderAddTaskModal = (team: Team) => {
        setTaskCreationForTeam(team);
        setAddTaskModalOpen(true);
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-2 text-emerald-400">{selectedTaasuka.name}</h2>
            <p className="text-gray-400 mb-4">תצוגת חייל</p>

            <div className="border-b border-gray-700 mb-4">
                <nav className="flex space-x-4" aria-label="Tabs">
                    <button onClick={() => setActiveTab('tasks')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'tasks' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'text-gray-400 hover:text-gray-200'}`}>המשימות שלי</button>
                    <button onClick={() => setActiveTab('equipment')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'equipment' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'text-gray-400 hover:text-gray-200'}`}>הציוד שלי</button>
                    <button onClick={() => setActiveTab('teams')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'teams' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'text-gray-400 hover:text-gray-200'}`}>הצוותים שלי</button>
                </nav>
            </div>
            
            {activeTab === 'tasks' && (
                <div className="space-y-3">
                    {soldierTasksInTaasuka.map(task => (
                        <button 
                            key={task.id} 
                            onClick={() => selectTask(task.id)}
                            className={`w-full text-right bg-gray-800 p-3 rounded-lg flex items-center gap-4 ${task.isComplete ? 'opacity-50' : ''} hover:bg-gray-700 transition-colors`}
                        >
                            <div className="flex-1">
                                <p className={`font-bold ${task.isComplete ? 'line-through' : ''}`}>{task.title}</p>
                                <p className="text-xs text-gray-400 mt-1">תאריך: {new Date(task.startDate).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}</p>
                            </div>
                             <div className="flex flex-col items-center gap-2">
                                {task.isComplete && <CheckCircleIcon className="w-5 h-5 text-green-500" title="הושלמה"/>}
                                {task.isRecurring && <RefreshIcon className="w-5 h-5 text-cyan-400" title={`חוזר על עצמו ${task.recurrence}`}/>}
                            </div>
                        </button>
                    ))}
                    {soldierTasksInTaasuka.length === 0 && <p className="text-gray-400">אין לך משימות בתעסוקה זו.</p>}
                </div>
            )}
            
            {activeTab === 'equipment' && (
                 <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">ציוד בתעסוקה זו</h3>
                    </div>
                    {taasukaItems.length > 0 ? (
                        <ul className="text-gray-300 text-sm space-y-1">
                            {taasukaItems.map(item => (
                                <li key={item.id} className="flex justify-between items-center">
                                    <span>{item.name} - <span className="font-mono">{item.serialNumber || item.quantity}</span></span>
                                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{item.provider}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-gray-400">אין לך ציוד משויך בתעסוקה זו.</p>}
                </div>
            )}

            {activeTab === 'teams' && (
                <div className="space-y-4">
                    {soldierTeamsInTaasuka.map(team => (
                        <div key={team.id} className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-lg">{team.name}</h4>
                                {ledTeamsInTaasuka.some(ledTeam => ledTeam.id === team.id) && (
                                    <span className="text-xs bg-amber-500 text-white font-bold py-1 px-2 rounded-full">מוביל צוות</span>
                                )}
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-700">
                                <h5 className="text-sm font-semibold mb-2">חברי צוות:</h5>
                                <ul className="text-gray-300 text-sm space-y-1">
                                    {team.memberIds.map(memberId => {
                                        const member = misgeret?.personnel.find(p => p.id === memberId);
                                        return <li key={memberId}>{member?.name || 'חייל לא ידוע'}</li>;
                                    })}
                                </ul>
                                {ledTeamsInTaasuka.some(ledTeam => ledTeam.id === team.id) && (
                                    <button 
                                        onClick={() => openLeaderAddTaskModal(team)} 
                                        className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 text-sm flex items-center justify-center gap-2">
                                        <PlusIcon className="w-4 h-4"/> הוסף משימה לצוות
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {soldierTeamsInTaasuka.length === 0 && <p className="text-gray-400">אינך חבר באף צוות בתעסוקה זו.</p>}
                </div>
            )}
        </div>
    );
  };
  
  const TaskDetailView = () => {
    const task = useMemo(() => {
      if (!selectedTaskId || !data) return null;
      return data.taasukot.flatMap(t => t.tasks).find(t => t.id === selectedTaskId) || null;
    }, [data, selectedTaskId]);

    const taasuka = useMemo(() => {
      if (!task || !data) return null;
      return data.taasukot.find(t => t.id === selectedTaasuka?.id);
    }, [task, selectedTaasuka, data]);

    if (!task || !taasuka || !currentUser || !data) return <p>טוען משימה...</p>;

    const misgeret = data.misgerets.find(m => m.id === taasuka.misgeretId);
    if (!misgeret) return <p>שגיאה: לא נמצאה מסגרת.</p>;
    
    const creator = misgeret.personnel.find(p => p.id === task.creatorId);
    const userTeams = taasuka.teams.filter(t => t.memberIds.includes(currentUser.id));
    const userTeamIds = userTeams.map(t => t.id);

    const canModify =
      currentUser.role === 'admin' ||
      currentUser.role === 'rassap' ||
      task.creatorId === currentUser.id ||
      (task.assignedToType === 'soldier' && task.assignedToIds.includes(currentUser.id)) ||
      (task.assignedToType === 'team' && task.assignedToIds.some(teamId => userTeamIds.includes(teamId)));
    
    const canDelete = currentUser.role === 'admin' || currentUser.role === 'rassap' || task.creatorId === currentUser.id;

    const handleExportToCalendar = () => {
      generateIcsFile(task);
    };

    return (
      <div className="p-4 space-y-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className={`text-2xl font-bold ${task.isComplete ? 'line-through text-gray-500' : 'text-emerald-400'}`}>{task.title}</h2>
              <p className="text-gray-400">{taasuka.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExportToCalendar} className="p-2 text-gray-400 hover:text-white" title="יצא ללוח שנה">
                <CalendarIcon className="w-6 h-6" />
              </button>
              {canDelete && (
                <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-400" title="מחק משימה">
                  <TrashIcon className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-gray-300">{task.description}</p>
          <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400 space-y-2">
            <p><strong>משויך ל:</strong> {getAssigneeName(task, taasuka)}</p>
            <p><strong>תאריך:</strong> {new Date(task.startDate).toLocaleString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>יוצר המשימה:</strong> {creator?.name || 'לא ידוע'}</p>
            {task.isRecurring && <p className="flex items-center gap-1"><RefreshIcon className="w-4 h-4 text-cyan-400"/> <strong>חוזרת:</strong> {task.recurrence}</p>}
          </div>
        </div>

        {canModify && (
          <button onClick={() => toggleTaskComplete(task.id)} className={`w-full py-3 rounded-lg text-lg font-bold transition-colors flex items-center justify-center gap-2 ${task.isComplete ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'}`}>
            {task.isComplete ? <XIcon className="w-6 h-6" /> : <CheckCircleIcon className="w-6 h-6" />}
            {task.isComplete ? 'בטל השלמה' : 'סמן כהושלמה'}
          </button>
        )}
      </div>
    );
  };
  
  // Main return statement - using conditional rendering
  return (
    <>
      {!currentUser && (
        isLoading && !data ? <LoadingSpinner /> : <LoginView />
      )}
      {currentUser && (isLoading || !data) && <LoadingSpinner />}
      {currentUser && !isLoading && data && (
        <div className="min-h-screen flex flex-col">
          <Header />
          <ToastNotifications toasts={toasts} setToasts={setToasts} />
          <main className="flex-1 container mx-auto p-4">
            {
              activeView === 'home' ? <HomeView /> :
              activeView === 'taasuka' ? <TaasukaView /> :
              activeView === 'misgeret' ? <MisgeretView /> :
              activeView === 'soldierProfile' ? <SoldierProfileView /> :
              activeView === 'taskDetail' ? <TaskDetailView /> :
              activeView === 'soldierTaasuka' ? <SoldierTaasukaView /> :
              <p>Invalid view</p>}
          </main>

          {isNewTaasukaModalOpen && <NewTaasukaModal onClose={() => setNewTaasukaModalOpen(false)} onCreate={handleCreateTaasuka} misgerets={data.misgerets} />}
          {isNewMisgeretModalOpen && <NewMisgeretModal onClose={() => setNewMisgeretModalOpen(false)} onCreate={handleCreateMisgeret} />}
          {isAddItemModalOpen && selectedTaasuka && <AddItemModal onClose={() => setAddItemModalOpen(false)} onAdd={handleAddItem} />}
          {isUpdateItemModalOpen && selectedTaasuka && selectedItemForUpdate && currentUser && <UpdateItemModal onClose={() => setUpdateItemModalOpen(false)} onUpdate={handleUpdateItemQuantity} item={selectedItemForUpdate} assignedQuantity={selectedItemAssignedQuantity} currentUser={currentUser} />}
          {isUpdateAssignedItemModalOpen && selectedAssignedItemForUpdate && <UpdateAssignedItemModal onClose={() => { setUpdateAssignedItemModalOpen(false); setSelectedAssignedItemForUpdate(null); }} onUpdate={handleUpdateAssignedItemQuantity} soldierId={selectedAssignedItemForUpdate.soldierId} item={selectedAssignedItemForUpdate.item} />}
          {isAddFromImageModalOpen && selectedTaasuka && <AddFromImageModal onClose={() => setAddFromImageModalOpen(false)} onAddBatch={handleAddItemsBatch} />}
          {isAddPersonnelModalOpen && selectedMisgeretId && <AddPersonnelModal onClose={() => setAddPersonnelModalOpen(false)} onAdd={handleAddSoldier} />}
          {isAssignItemModalOpen && selectedTaasuka && selectedSoldierForAssignment && data && <AssignItemModal onClose={() => setAssignItemModalOpen(false)} onAssign={handleAssignItem} inventory={selectedTaasuka.inventory} soldier={selectedSoldierForAssignment} allSoldiers={data.misgerets.flatMap(m => m.personnel)} />}
          {isAddExternalItemModalOpen && selectedSoldierForAssignment && <AddExternalItemModal onClose={() => setAddExternalItemModalOpen(false)} onAdd={handleAddExternalItem} soldier={selectedSoldierForAssignment} />}
          {isBulkAssignModalOpen && selectedTaasuka && selectedMisgeret && <BulkAssignModal onClose={() => setBulkAssignModalOpen(false)} onAssign={handleBulkAssign} taasuka={selectedTaasuka} misgeret={selectedMisgeret}/>}
          {isAddToTaasukaModalOpen && selectedTaasuka && selectedMisgeret && <AddToTaasukaModal onClose={() => setAddToTaasukaModalOpen(false)} onAdd={handleAddSoldiersToTaasuka} misgeretPersonnel={selectedMisgeret.personnel} taasukaPersonnelIds={selectedTaasuka.personnelIds} />}
          {isAddTaskModalOpen && selectedTaasuka && selectedMisgeret && <AddTaskModal onClose={() => { setAddTaskModalOpen(false); setTaskCreationForTeam(null); }} onAdd={handleAddTask} personnel={selectedMisgeret.personnel.filter(p => selectedTaasuka.personnelIds.includes(p.id))} teams={selectedTaasuka.teams} teamForCreation={taskCreationForTeam} />}
          {isManageTeamModalOpen && selectedTaasuka && selectedMisgeret && <ManageTeamModal onClose={() => { setManageTeamModalOpen(false); setEditingTeam(null); }} onSave={handleSaveTeam} team={editingTeam} personnel={selectedMisgeret.personnel.filter(p => selectedTaasuka.personnelIds.includes(p.id))}/>}
          {isChangePasswordModalOpen && currentUser && <ChangePasswordModal soldier={currentUser} onClose={() => setChangePasswordModalOpen(false)} onSave={handleChangePassword} />}
          {isSystemModalOpen && <SystemManagementModal onClose={() => setSystemModalOpen(false)} />}
          {isSelectSoldierModalOpen && selectedTaasuka && selectedSerialNumberForAssignment && data && (
            <SelectSoldierModal
              onClose={() => {
                setSelectSoldierModalOpen(false);
                setSelectedSerialNumberForAssignment(null);
              }}
              onSelect={(soldierId) => {
                if (selectedSerialNumberForAssignment) {
                  handleAssignItem(soldierId, selectedSerialNumberForAssignment.inventoryItemId, 1, selectedSerialNumberForAssignment.serialNumber);
                  setSelectSoldierModalOpen(false);
                  setSelectedSerialNumberForAssignment(null);
                }
              }}
              availableSoldiers={data.misgerets
                .find(m => m.id === selectedTaasuka.misgeretId)
                ?.personnel.filter(p => selectedTaasuka.personnelIds.includes(p.id)) || []}
              serialNumber={selectedSerialNumberForAssignment.serialNumber}
              itemName={selectedSerialNumberForAssignment.itemName}
            />
          )}
        </div>
      )}
    </>
  );
};

const Modal: React.FC<{ children: React.ReactNode, title: string, onClose: () => void }> = ({ children, title, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-40 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-emerald-400">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5"/></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

const NewTaasukaModal: React.FC<{ onClose: () => void, onCreate: (name: string, misgeretId: string) => void, misgerets: Misgeret[] }> = ({ onClose, onCreate, misgerets }) => {
  const [name, setName] = useState('');
  const [misgeretId, setMisgeretId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && misgeretId) {
      onCreate(name, misgeretId);
    }
  };

  return (
    <Modal title="צור תעסוקה חדשה" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="taasuka-name" className="block text-sm font-medium mb-1">שם התעסוקה</label>
            <input id="taasuka-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
        </div>
        <div>
            <label htmlFor="misgeret-select" className="block text-sm font-medium mb-1">בחר מסגרת</label>
            <select id="misgeret-select" value={misgeretId} onChange={e => setMisgeretId(e.target.value)} required className="w-full bg-gray-700 border-gray-600 rounded-md p-2">
                <option value="" disabled>-- בחר מסגרת --</option>
                {misgerets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
        </div>
        <button type="submit" className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600">צור</button>
      </form>
    </Modal>
  );
};

const NewMisgeretModal: React.FC<{ onClose: () => void, onCreate: (name: string) => void }> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim()) onCreate(name);
    };
  
    return (
      <Modal title="צור מסגרת חדשה" onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="שם המסגרת" className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
            <button type="submit" className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600">צור</button>
        </form>
      </Modal>
    );
};

const AddPersonnelModal: React.FC<{ onClose: () => void, onAdd: (name: string, personalId: string, role: 'soldier' | 'rassap' | 'admin') => void }> = ({ onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [personalId, setPersonalId] = useState('');
    const [role, setRole] = useState<'soldier' | 'rassap' | 'admin'>('soldier');
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim() && personalId.trim()) {
        onAdd(name, personalId, role);
      }
    };
  
    return (
      <Modal title="הוסף איש צוות" onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="שם מלא" className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
          <input type="text" value={personalId} onChange={e => setPersonalId(e.target.value)} required placeholder="מספר אישי" className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
          <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full bg-gray-700 border-gray-600 rounded-md p-2">
            <option value="soldier">חייל</option>
            <option value="rassap">רס"פ</option>
            <option value="admin">מנהל</option>
          </select>
          <button type="submit" className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600">הוסף</button>
        </form>
      </Modal>
    );
};

const AddItemModal: React.FC<{ onClose: () => void, onAdd: (name: string, serialNumbers: string[], quantityForNoSN: number, hasSerialNumber: boolean) => void }> = ({ onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [hasSerialNumber, setHasSerialNumber] = useState(false);
    const [serialNumbers, setSerialNumbers] = useState<string[]>(['']); // Array of SN inputs, empty string = לל"צ
  
    const addSerialNumberField = () => {
      setSerialNumbers([...serialNumbers, '']);
    };
  
    const updateSerialNumber = (index: number, value: string) => {
      const updated = [...serialNumbers];
      updated[index] = value;
      setSerialNumbers(updated);
    };
  
    const removeSerialNumberField = (index: number) => {
      if (serialNumbers.length > 1) {
        setSerialNumbers(serialNumbers.filter((_, i) => i !== index));
      }
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      
      if (hasSerialNumber) {
        // For צל"ם items: separate SN items from לל"צ (empty SNs)
        const snItems = serialNumbers.filter(sn => sn.trim() !== '');
        const noSNCount = serialNumbers.filter(sn => sn.trim() === '').length;
        onAdd(name, snItems, noSNCount, true);
      } else {
        // Regular item
        onAdd(name, [], quantity, false);
      }
    };
  
    return (
      <Modal title="הוסף פריט למלאי" onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="שם פריט" className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="has-serial-number" 
              checked={hasSerialNumber} 
              onChange={e => {
                setHasSerialNumber(e.target.checked);
                if (e.target.checked) {
                  setSerialNumbers(['']); // Start with one empty field
                }
              }}
              className="w-4 h-4 text-emerald-500 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="has-serial-number" className="text-sm font-medium">צל"ם (פריט עם מספר סידורי)</label>
          </div>
          
          {!hasSerialNumber && (
            <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value, 10) || 1)} required min="1" placeholder="כמות" className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
          )}
          
          {hasSerialNumber && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">מס"דים (השאר ריק ללל"צ):</label>
              {serialNumbers.map((sn, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    value={sn} 
                    onChange={e => updateSerialNumber(index, e.target.value)} 
                    placeholder={index === 0 ? 'מס"ד או ריק ללל"צ' : 'מס"ד'}
                    className="flex-1 bg-gray-700 border-gray-600 rounded-md p-2"
                  />
                  {index === serialNumbers.length - 1 && (
                    <button 
                      type="button" 
                      onClick={addSerialNumberField}
                      className="bg-emerald-500 text-white px-3 py-2 rounded-md hover:bg-emerald-600 flex items-center"
                      title='הוסף מס"ד נוסף'
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  )}
                  {serialNumbers.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeSerialNumberField(index)}
                      className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <p className="text-xs text-gray-400">השאר מס"ד ריק כדי להוסיף לל"צ (ללא מס"ד סידורי)</p>
            </div>
          )}
          
          <button type="submit" className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600">הוסף</button>
        </form>
      </Modal>
    );
};

const UpdateItemModal: React.FC<{ 
  onClose: () => void; 
  onUpdate: (itemId: string, quantity: number) => void; 
  item: InventoryItem;
  assignedQuantity?: number; // For regular items, the amount currently assigned
  currentUser: Soldier;
}> = ({ onClose, onUpdate, item, assignedQuantity = 0, currentUser }) => {
    const [quantity, setQuantity] = useState(item.quantity || 0);
    const isAdmin = currentUser.role === 'admin';
    const isRassap = currentUser.role === 'rassap';
    const currentQuantity = item.quantity || 0;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const qty = parseInt(quantity.toString()) || 0;
        
        // Check if rassap is trying to decrease quantity (not allowed)
        if (isRassap && !item.hasSerialNumber && qty < currentQuantity) {
          alert('רספ"ים יכולים רק להגדיל כמות, לא להקטין. רק מנהלים יכולים להקטין כמות.');
          setQuantity(currentQuantity);
          return;
        }
        
        // Check if total will be 0
        if (item.hasSerialNumber) {
          const totalSNs = (item.serialNumbers || []).length;
          const totalIsZero = totalSNs === 0 && qty <= 0;
          if (totalIsZero) {
            if (!isAdmin) {
              alert('רק מנהלים יכולים למחוק פריטים מהמלאי');
              setQuantity(currentQuantity);
              return;
            }
            if (!window.confirm('האם אתה בטוח שברצונך למחוק את הפריט מהמלאי? (סה"כ = 0)')) {
              return;
            }
          }
        } else {
          // For regular items, validate minimum quantity
          if (qty < assignedQuantity) {
            alert(`לא ניתן להגדיר כמות נמוכה מ-${assignedQuantity} (כמות ששויכה)`);
            setQuantity(currentQuantity);
            return;
          }
          if (qty === 0) {
            if (!isAdmin) {
              alert('רק מנהלים יכולים למחוק פריטים מהמלאי');
              setQuantity(currentQuantity);
              return;
            }
            if (!window.confirm('האם אתה בטוח שברצונך למחוק את הפריט מהמלאי?')) {
              return;
            }
          }
        }
        onUpdate(item.id, qty);
    };

    const isTzalam = item.hasSerialNumber;
    const hasSerialNumbers = isTzalam && (item.serialNumbers || []).length > 0;

    return (
        <Modal title={`ערוך כמות: ${item.name}`} onClose={onClose}>
            <p className="mb-2">כמות נוכחית (לל"צ): {item.quantity || 0}</p>
            {isTzalam && hasSerialNumbers && (
              <p className="mb-2 text-xs text-yellow-400">הערה: לפריט זה יש מס"דים במלאי. עדכון הכמות ישפיע רק על לל"צ.</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {isTzalam ? 'כמות חדשה (לל"צ)' : 'כמות חדשה'}
                  </label>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={e => {
                      const newVal = parseInt(e.target.value) || 0;
                      // Prevent rassap from entering values less than current
                      if (isRassap && !isTzalam && newVal < currentQuantity) {
                        return; // Don't update
                      }
                      setQuantity(newVal);
                    }}
                    required 
                    min={isRassap && !isTzalam ? currentQuantity : (isTzalam ? 0 : assignedQuantity)} 
                    className="w-full bg-gray-700 border-gray-600 rounded-md p-2" 
                    disabled={isRassap && isTzalam && currentQuantity > 0}
                  />
                  {isRassap && !isTzalam ? (
                    <p className="text-xs text-yellow-400 mt-1">רספ"ים יכולים רק להגדיל כמות. מינימום: {currentQuantity}</p>
                  ) : isRassap && isTzalam ? (
                    <p className="text-xs text-yellow-400 mt-1">רספ"ים לא יכולים לערוך כמות לל"צ. רק מנהלים יכולים.</p>
                  ) : isTzalam && hasSerialNumbers ? (
                    <p className="text-xs text-gray-400 mt-1">הזן 0 כדי להסיר את כל לל"צ (הפריט יישאר עם המס"דים). הפריט יימחק רק אם גם המס"דים יוסרו.</p>
                  ) : assignedQuantity > 0 ? (
                    <p className="text-xs text-yellow-400 mt-1">מינימום: {assignedQuantity} (כמות ששויכה). הזן 0 כדי למחוק את הפריט מהמלאי.</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">הזן 0 כדי למחוק את הפריט מהמלאי (סה"כ = 0)</p>
                  )}
                </div>
                <button type="submit" className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600">
                  {quantity <= 0 && (!hasSerialNumbers) ? 'מחק פריט' : 'עדכן כמות'}
                </button>
            </form>
        </Modal>
    );
};

const UpdateAssignedItemModal: React.FC<{ 
  onClose: () => void; 
  onUpdate: (soldierId: string, itemId: string, quantity: number) => void; 
  soldierId: string;
  item: AssignedItem;
}> = ({ onClose, onUpdate, soldierId, item }) => {
    const [quantity, setQuantity] = useState(item.quantity || 1);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const qty = parseInt(quantity.toString()) || 0;
        
        // Serial number items always have quantity of 1
        if (item.serialNumber && qty !== 1) {
            alert('פריטי צל"ם תמיד עם כמות של 1');
            return;
        }
        
        if (qty < 0) {
            alert('כמות לא יכולה להיות שלילית');
            return;
        }
        
        if (qty === 0 && !window.confirm('האם אתה בטוח שברצונך להסיר את הפריט? (הזן 0 כדי למחוק)')) {
            return;
        }
        
        onUpdate(soldierId, item.id, qty);
    };

    const isSerialNumberItem = !!item.serialNumber;

    return (
        <Modal title={`ערוך כמות: ${item.name}`} onClose={onClose}>
            <p className="mb-2">כמות נוכחית: {item.quantity}</p>
            {isSerialNumberItem && (
              <p className="mb-2 text-xs text-yellow-400">הערה: פריטי צל"ם תמיד עם כמות של 1.</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">כמות חדשה</label>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={e => setQuantity(parseInt(e.target.value) || 0)} 
                    required 
                    min={isSerialNumberItem ? 1 : 0}
                    max={isSerialNumberItem ? 1 : undefined}
                    disabled={isSerialNumberItem}
                    className="w-full bg-gray-700 border-gray-600 rounded-md p-2" 
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {isSerialNumberItem 
                      ? 'לא ניתן לשנות כמות של פריטי צל"ם' 
                      : 'הזן 0 כדי למחוק את הפריט מהחייל'
                    }
                  </p>
                </div>
                <button type="submit" className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600">
                  {quantity === 0 ? 'מחק פריט' : 'עדכן כמות'}
                </button>
            </form>
        </Modal>
    );
};
  
const AddFromImageModal: React.FC<{ onClose: () => void, onAddBatch: (items: Omit<InventoryItem, 'id'>[]) => void }> = ({ onClose, onAddBatch }) => {
    const [items, setItems] = useState<Array<{ name: string; quantity: number }>>([{ name: '', quantity: 1 }]);
    const [error, setError] = useState('');

    const addItemRow = () => {
        setItems([...items, { name: '', quantity: 1 }]);
    };

    const removeItemRow = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: 'name' | 'quantity', value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const validItems = items
            .filter(item => item.name.trim() && item.quantity > 0)
            .map(item => ({ name: item.name.trim(), quantity: item.quantity }));
        
        if (validItems.length === 0) {
            setError("אנא הזן לפחות פריט אחד עם שם וכמות תקינים.");
            return;
        }

        onAddBatch(validItems);
        onClose();
    };
  
    return (
      <Modal title="הוסף מספר פריטים למלאי" onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center bg-gray-800 p-2 rounded-lg">
                        <input
                            type="text"
                            value={item.name}
                            onChange={e => updateItem(index, 'name', e.target.value)}
                            placeholder="שם פריט"
                            className="flex-1 bg-gray-700 border-gray-600 rounded-md p-2"
                            required={index === 0}
                        />
                        <input
                            type="number"
                            value={item.quantity}
                            onChange={e => updateItem(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                            min="1"
                            placeholder="כמות"
                            className="w-24 bg-gray-700 border-gray-600 rounded-md p-2"
                            required={index === 0}
                        />
                        {items.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeItemRow(index)}
                                className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            
            <button
                type="button"
                onClick={addItemRow}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-500 flex items-center justify-center gap-2"
            >
                <PlusIcon className="w-4 h-4" />
                הוסף שורה
            </button>
            
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            
            <button type="submit" className="w-full bg-emerald-500 text-white py-2 px-4 rounded-md hover:bg-emerald-600">
                הוסף פריטים
            </button>
        </form>
      </Modal>
    );
};

const AssignItemModal: React.FC<{
  onClose: () => void;
  onAssign: (soldierId: string, itemId: string, quantity: number, serialNumber?: string | null) => void;
  inventory: InventoryItem[];
  soldier: Soldier;
  allSoldiers: Soldier[];
}> = ({ onClose, onAssign, inventory, soldier, allSoldiers }) => {
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedSerialNumber, setSelectedSerialNumber] = useState<string>('');
  const selectedItem = inventory.find(i => i.id === itemId);
  const isSerialNumberItem = selectedItem?.hasSerialNumber || false;
  
  // Get available and assigned serial numbers for the selected item
  const serialNumberInfo = useMemo(() => {
    if (!selectedItem || !selectedItem.hasSerialNumber || !selectedItem.serialNumbers) {
      return { available: [], assigned: [] };
    }
    
    // Get all assigned items with this inventory item ID
    const assignedItems = allSoldiers.flatMap(s => 
      s.assignedItems.filter(ai => 
        ai.inventoryItemId === selectedItem.id && ai.serialNumber
      ).map(ai => ({
        serialNumber: ai.serialNumber!,
        soldier: s
      }))
    );
    
    // Map of serial number to assigned soldier
    const assignedMap = new Map(assignedItems.map(a => [a.serialNumber, a.soldier]));
    
    // Separate available and assigned
    const available: string[] = [];
    const assigned: Array<{ serialNumber: string; soldier: Soldier }> = [];
    
    selectedItem.serialNumbers.forEach(sn => {
      const assignedSoldier = assignedMap.get(sn);
      if (assignedSoldier) {
        assigned.push({ serialNumber: sn, soldier: assignedSoldier as Soldier });
      } else {
        available.push(sn);
      }
    });
    
    return { available, assigned };
  }, [selectedItem, allSoldiers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !selectedItem) return;
    
    if (isSerialNumberItem) {
      // For צל"ם items, quantity is always 1 and serial number is required
      if (!selectedSerialNumber) {
        alert('יש לבחור מספר סידורי עבור פריטי צל"ם');
        return;
      }
      if (serialNumberInfo.available.length === 0) {
        alert(`אין מס"דים זמינים עבור פריט זה`);
        return;
      }
      onAssign(soldier.id, itemId, 1, selectedSerialNumber);
    } else {
      // Regular items - check available quantity (total - assigned)
      const assignedItemsForThis = allSoldiers.flatMap(s => s.assignedItems)
        .filter(ai => ai.inventoryItemId === itemId && !ai.serialNumber);
      const assignedQuantity = assignedItemsForThis.reduce((sum, ai) => sum + (ai.quantity || 1), 0);
      const totalQuantity = selectedItem.quantity || 0;
      const availableQuantity = totalQuantity - assignedQuantity;
      
      if (quantity <= 0 || quantity > availableQuantity) {
        alert(`כמות לא מספקת. זמינים: ${availableQuantity}, סה"כ: ${totalQuantity}`);
        return;
      }
      onAssign(soldier.id, itemId, quantity, null);
    }
  };

  return (
    <Modal title={`שייך פריט ל${soldier.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="item-select" className="block text-sm font-medium mb-1">בחר פריט</label>
          <select id="item-select" value={itemId} onChange={e => {
            setItemId(e.target.value);
            setQuantity(1);
            setSelectedSerialNumber('');
          }} required className="w-full bg-gray-700 border-gray-600 rounded-md p-2">
            <option value="" disabled>-- בחר פריט מהמלאי --</option>
            {inventory.map(item => {
              // For serial number items, check available SNs
              // For regular items, calculate available as (total - assigned)
              let availableCount = 0;
              if (item.hasSerialNumber) {
                const assignedSNs = allSoldiers.flatMap(s => s.assignedItems)
                  .filter(ai => ai.inventoryItemId === item.id && ai.serialNumber)
                  .length;
                availableCount = (item.serialNumbers?.length || 0) - assignedSNs;
              } else {
                // Regular item: available = total - assigned
                const assignedItemsForThis = allSoldiers.flatMap(s => s.assignedItems)
                  .filter(ai => ai.inventoryItemId === item.id && !ai.serialNumber);
                const assignedQuantity = assignedItemsForThis.reduce((sum, ai) => sum + (ai.quantity || 1), 0);
                const totalQuantity = item.quantity || 0;
                availableCount = Math.max(0, totalQuantity - assignedQuantity);
              }
              if (availableCount <= 0) return null;
              return (
                <option key={item.id} value={item.id}>
                  {item.name} {item.hasSerialNumber ? '(צל"ם)' : ''} (זמינים: {availableCount})
                </option>
              );
            }).filter(Boolean)}
          </select>
        </div>
        {selectedItem && (
          <>
            {isSerialNumberItem ? (
              <div>
                <label htmlFor="serial-number" className="block text-sm font-medium mb-1">בחר מס"ד *</label>
                <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-800 rounded-md p-2">
                  {/* Available serial numbers */}
                  {serialNumberInfo.available.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">זמינים ({serialNumberInfo.available.length}):</p>
                      <div className="space-y-1">
                        {serialNumberInfo.available.map(sn => (
                          <label key={sn} className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded cursor-pointer">
                            <input
                              type="radio"
                              name="serial-number"
                              value={sn}
                              checked={selectedSerialNumber === sn}
                              onChange={() => setSelectedSerialNumber(sn)}
                              className="w-4 h-4"
                            />
                            <span className="font-mono text-cyan-400">{sn}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Assigned serial numbers */}
                  {serialNumberInfo.assigned.length > 0 && (
                    <div className="border-t border-gray-700 pt-2 mt-2">
                      <p className="text-xs text-gray-400 mb-1">משויכים ({serialNumberInfo.assigned.length}):</p>
                      <div className="space-y-1">
                        {serialNumberInfo.assigned.map(({ serialNumber: sn, soldier: owner }) => (
                          <div key={sn} className="flex justify-between items-center p-2 text-sm text-gray-500">
                            <span className="font-mono">{sn}</span>
                            <div className="text-right">
                              <div>{owner.name}</div>
                              <div className="text-xs text-gray-600">{owner.personalId}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {serialNumberInfo.available.length === 0 && serialNumberInfo.assigned.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">אין מס"דים זמינים</p>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">כמות: 1 (אוטומטי לפריטי צל"ם)</p>
              </div>
            ) : (
              <div>
                <label htmlFor="item-quantity" className="block text-sm font-medium mb-1">כמות (מקסימום: {selectedItem.quantity})</label>
                <input
                  id="item-quantity"
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(Math.min(parseInt(e.target.value, 10) || 1, selectedItem.quantity))}
                  required
                  min="1"
                  max={selectedItem.quantity}
                  className="w-full bg-gray-700 border-gray-600 rounded-md p-2"
                />
              </div>
            )}
          </>
        )}
        <button type="submit" disabled={!itemId || !selectedItem} className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600 disabled:bg-gray-500">שייך</button>
      </form>
    </Modal>
  );
};

const AddExternalItemModal: React.FC<{
    onClose: () => void;
    onAdd: (soldierId: string, name: string, quantity: number, provider: string) => void;
    soldier: Soldier;
}> = ({ onClose, onAdd, soldier }) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [provider, setProvider] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && quantity > 0 && provider.trim()) {
            onAdd(soldier.id, name, quantity, provider);
        }
    };

    return (
        <Modal title={`שייך פריט חיצוני ל${soldier.name}`} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="שם פריט" className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
                <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value, 10))} required min="1" placeholder="כמות" className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
                <input type="text" value={provider} onChange={e => setProvider(e.target.value)} required placeholder="גורם מספק (למשל: אפסנאות)" className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
                <button type="submit" className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600">שייך</button>
            </form>
        </Modal>
    );
};

const BulkAssignModal: React.FC<{
    onClose: () => void;
    onAssign: (itemQuantities: { [itemId: string]: number }, soldierIds: string[]) => void;
    taasuka: Taasuka;
    misgeret: Misgeret;
}> = ({ onClose, onAssign, taasuka, misgeret }) => {
    const [selectedItems, setSelectedItems] = useState<{ [itemId: string]: number }>({});
    const [selectedSoldierIds, setSelectedSoldierIds] = useState<string[]>([]);
    const taasukaPersonnel = misgeret.personnel.filter(p => taasuka.personnelIds.includes(p.id));

    const handleItemChange = (itemId: string, quantity: number) => {
        if (quantity > 0) {
            setSelectedItems(prev => ({ ...prev, [itemId]: quantity }));
        } else {
            setSelectedItems(prev => {
                const newItems = { ...prev };
                delete newItems[itemId];
                return newItems;
            });
        }
    };
    
    const handleSoldierToggle = (soldierId: string) => {
        setSelectedSoldierIds(prev =>
            prev.includes(soldierId) ? prev.filter(id => id !== soldierId) : [...prev, soldierId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (Object.keys(selectedItems).length > 0 && selectedSoldierIds.length > 0) {
            onAssign(selectedItems, selectedSoldierIds);
        }
    };
    
    return (
        <Modal title="שיוך ציוד בבת אחת" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h4 className="font-semibold mb-2">1. בחר פריטים וכמות לכל חייל</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                        {taasuka.inventory.filter(i => i.quantity > 0).map(item => (
                            <div key={item.id} className="flex items-center gap-2">
                                <span className="flex-1">{item.name} (במלאי: {item.quantity})</span>
                                <input
                                    type="number"
                                    min={isTzalam ? 0 : assignedQuantity}
                                    max={Math.floor(item.quantity / (selectedSoldierIds.length || 1) )}
                                    placeholder="כמות"
                                    onChange={e => handleItemChange(item.id, parseInt(e.target.value))}
                                    className="w-24 bg-gray-700 border-gray-600 rounded-md p-1"
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">2. בחר חיילים לשיוך</h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto p-1">
                        {taasukaPersonnel.map(soldier => (
                            <label key={soldier.id} className="flex items-center gap-2 p-2 bg-gray-700 rounded-md cursor-pointer hover:bg-gray-600">
                                <input
                                    type="checkbox"
                                    checked={selectedSoldierIds.includes(soldier.id)}
                                    onChange={() => handleSoldierToggle(soldier.id)}
                                    className="rounded text-emerald-500 focus:ring-emerald-500"
                                />
                                {soldier.name}
                            </label>
                        ))}
                    </div>
                </div>
                <button type="submit" className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600">שייך ציוד</button>
            </form>
        </Modal>
    );
};

const SelectSoldierModal: React.FC<{
  onClose: () => void;
  onSelect: (soldierId: string) => void;
  availableSoldiers: Soldier[];
  serialNumber: string;
  itemName: string;
}> = ({ onClose, onSelect, availableSoldiers, serialNumber, itemName }) => {
  const [selectedSoldierId, setSelectedSoldierId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSoldierId) {
      onSelect(selectedSoldierId);
    }
  };

  return (
    <Modal title={`שייך מס"ד ${serialNumber} (${itemName})`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="soldier-select" className="block text-sm font-medium mb-1">בחר חייל</label>
          <select
            id="soldier-select"
            value={selectedSoldierId}
            onChange={e => setSelectedSoldierId(e.target.value)}
            required
            className="w-full bg-gray-700 border-gray-600 rounded-md p-2"
          >
            <option value="" disabled>-- בחר חייל --</option>
            {availableSoldiers.map(soldier => (
              <option key={soldier.id} value={soldier.id}>
                {soldier.name} ({soldier.personalId})
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={!selectedSoldierId}
          className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600 disabled:bg-gray-500"
        >
          שייך
        </button>
      </form>
    </Modal>
  );
};

const AddToTaasukaModal: React.FC<{
    onClose: () => void;
    onAdd: (soldierIds: string[]) => void;
    misgeretPersonnel: Soldier[];
    taasukaPersonnelIds: string[];
}> = ({ onClose, onAdd, misgeretPersonnel, taasukaPersonnelIds }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const availablePersonnel = misgeretPersonnel.filter(p => !taasukaPersonnelIds.includes(p.id));

    const handleToggle = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedIds.length > 0) onAdd(selectedIds);
    };

    return (
        <Modal title="הוסף כוח אדם לתעסוקה" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {availablePersonnel.map(soldier => (
                        <label key={soldier.id} className="flex items-center gap-2 p-2 bg-gray-700 rounded-md cursor-pointer hover:bg-gray-600">
                            <input type="checkbox" checked={selectedIds.includes(soldier.id)} onChange={() => handleToggle(soldier.id)} className="rounded text-emerald-500 focus:ring-emerald-500"/>
                            {soldier.name}
                        </label>
                    ))}
                    {availablePersonnel.length === 0 && <p className="text-gray-400">כל אנשי המסגרת כבר משויכים לתעסוקה.</p>}
                </div>
                <button type="submit" disabled={selectedIds.length === 0} className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600 disabled:bg-gray-500">הוסף נבחרים</button>
            </form>
        </Modal>
    );
};

const AddTaskModal: React.FC<{
  onClose: () => void;
  onAdd: (taskData: Omit<Task, 'id' | 'isComplete' | 'creatorId'>) => void;
  personnel: Soldier[];
  teams: Team[];
  teamForCreation: Team | null;
}> = ({ onClose, onAdd, personnel, teams, teamForCreation }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
    const [assignedToType, setAssignedToType] = useState<'soldier' | 'team'>(teamForCreation ? 'team' : 'soldier');
    const [assignedToIds, setAssignedToIds] = useState<string[]>(teamForCreation ? [teamForCreation.id] : []);
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | 'monthly' | null>(null);
    const [notifyOnComplete, setNotifyOnComplete] = useState<'creator' | 'all_rassaps'>('creator');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && assignedToIds.length > 0) {
            onAdd({
                title,
                description,
                startDate,
                isAllDay: false, // Simplified for now
                isRecurring,
                recurrence: isRecurring ? recurrence : null,
                assignedToType,
                assignedToIds,
                notifyOnComplete,
            });
        }
    };
    
    return (
        <Modal title={teamForCreation ? `משימה חדשה לצוות ${teamForCreation.name}` : "הוסף משימה חדשה"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="כותרת המשימה" className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="תיאור (אופציונלי)" className="w-full bg-gray-700 border-gray-600 rounded-md p-2 h-24" />
                <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
                
                {!teamForCreation && (
                    <select value={assignedToType} onChange={e => { setAssignedToType(e.target.value as any); setAssignedToIds([]); }} className="w-full bg-gray-700 border-gray-600 rounded-md p-2">
                        <option value="soldier">שייך לחייל</option>
                        <option value="team">שייך לצוות</option>
                    </select>
                )}

                {assignedToType === 'soldier' ? (
                    <select multiple value={assignedToIds} onChange={e => setAssignedToIds(Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value))} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 h-32">
                        {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                ) : (
                    <select value={assignedToIds[0] || ''} onChange={e => setAssignedToIds([e.target.value])} disabled={!!teamForCreation} className="w-full bg-gray-700 border-gray-600 rounded-md p-2">
                        <option value="" disabled>-- בחר צוות --</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                )}

                <div className="flex items-center gap-2">
                    <input id="recurring" type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="rounded text-emerald-500" />
                    <label htmlFor="recurring">משימה חוזרת</label>
                </div>
                {isRecurring && (
                    <select value={recurrence || ''} onChange={e => setRecurrence(e.target.value as any)} className="w-full bg-gray-700 border-gray-600 rounded-md p-2">
                        <option value="daily">יומי</option>
                        <option value="weekly">שבועי</option>
                        <option value="monthly">חודשי</option>
                    </select>
                )}
                
                <button type="submit" className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600">הוסף משימה</button>
            </form>
        </Modal>
    );
};

const ManageTeamModal: React.FC<{
    onClose: () => void;
    onSave: (teamData: { id?: string; name: string; memberIds: string[], leaderId: string }) => void;
    team: Team | null;
    personnel: Soldier[];
}> = ({ onClose, onSave, team, personnel }) => {
    const [name, setName] = useState(team?.name || '');
    const [memberIds, setMemberIds] = useState<string[]>(team?.memberIds || []);
    const [leaderId, setLeaderId] = useState<string>(team?.leaderId || '');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && memberIds.length > 0 && leaderId) {
            onSave({ id: team?.id, name, memberIds, leaderId });
        }
    };

    return (
        <Modal title={team ? "ערוך צוות" : "צור צוות חדש"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="שם הצוות" className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
                <div>
                    <label className="block text-sm font-medium mb-1">בחר חברי צוות</label>
                    <select multiple value={memberIds} onChange={e => setMemberIds(Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value))} className="w-full h-32 bg-gray-700 border-gray-600 rounded-md p-2">
                        {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">בחר מוביל צוות (חייב להיות חבר בצוות)</label>
                    <select value={leaderId} onChange={e => setLeaderId(e.target.value)} required className="w-full bg-gray-700 border-gray-600 rounded-md p-2">
                        <option value="" disabled>-- בחר מוביל --</option>
                        {personnel.filter(p => memberIds.includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <button type="submit" className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600">שמור</button>
            </form>
        </Modal>
    );
};

const ChangePasswordModal: React.FC<{
    soldier: Soldier,
    onClose: () => void,
    onSave: (soldierId: string, oldPass: string, newPass: string) => boolean,
}> = ({ soldier, onClose, onSave }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const passwordChecks = useMemo(() => ({
        length: newPassword.length >= 8,
        lower: /[a-z]/.test(newPassword),
        upper: /[A-Z]/.test(newPassword),
        number: /\d/.test(newPassword),
        special: /[^a-zA-Z0-9]/.test(newPassword),
    }), [newPassword]);
    
    const isPasswordStrong = Object.values(passwordChecks).every(Boolean);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) {
            setError('הסיסמאות החדשות אינן תואמות');
            return;
        }
        if (!isPasswordStrong) {
            setError('הסיסמה החדשה אינה חזקה מספיק');
            return;
        }
        const success = onSave(soldier.id, oldPassword, newPassword);
        if(!success) {
            setError('הסיסמה הנוכחית שגויה');
        }
    };

    return (
        <Modal title="שינוי סיסמה" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required placeholder="סיסמה נוכחית" className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="סיסמה חדשה" className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="אימות סיסמה חדשה" className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
                 <div className="text-xs text-gray-400 space-y-1">
                    <p className={passwordChecks.length ? 'text-green-400' : ''}>✓ לפחות 8 תווים</p>
                    <p className={passwordChecks.lower ? 'text-green-400' : ''}>✓ אות קטנה אחת לפחות</p>
                    <p className={passwordChecks.upper ? 'text-green-400' : ''}>✓ אות גדולה אחת לפחות</p>
                    <p className={passwordChecks.number ? 'text-green-400' : ''}>✓ מספר אחד לפחות</p>
                    <p className={passwordChecks.special ? 'text-green-400' : ''}>✓ תו מיוחד אחד לפחות (!@#)</p>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button type="submit" disabled={!isPasswordStrong || newPassword !== confirmPassword} className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600 disabled:bg-gray-500">שמור שינויים</button>
            </form>
        </Modal>
    );
};

const SystemManagementModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const handleExport = async () => {
        try {
            const jsonString = await exportDatabase();
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rassapp_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
            alert("שגיאה בייצוא הנתונים");
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!window.confirm("פעולה זו תמחק את כל הנתונים הקיימים ותחליף אותם בנתונים מהקובץ. האם להמשיך?")) {
            e.target.value = ''; // Reset input
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const jsonString = event.target?.result as string;
                await importDatabase(jsonString);
                alert("הנתונים יובאו בהצלחה. הדף ירענן את עצמו כעת.");
                window.location.reload();
            } catch (error) {
                console.error("Import failed:", error);
                alert("שגיאה בייבוא הנתונים. ודא שהקובץ תקין.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <Modal title="ניהול מערכת" onClose={onClose}>
            <div className="space-y-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-bold text-lg mb-2 text-emerald-400">גיבוי וסנכרון</h4>
                    <p className="text-gray-300 text-sm mb-4">
                        מכיוון שהאפליקציה פועלת ללא שרת מרכזי, ניתן להעביר נתונים בין משתמשים באמצעות קבצים.
                        <br/>
                        1. המנהל מבצע שינויים ולוחץ על <strong>ייצוא</strong>.
                        <br/>
                        2. שולחים את הקובץ לחיילים (בוואטסאפ/מייל).
                        <br/>
                        3. החיילים לוחצים על <strong>ייבוא</strong> כדי לקבל את המידע העדכני.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                        <button onClick={handleExport} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                            <CloudDownloadIcon className="w-5 h-5" />
                            ייצוא נתונים לקובץ (גיבוי)
                        </button>
                        
                        <label className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg transition-colors cursor-pointer">
                            <CloudUploadIcon className="w-5 h-5" />
                            <span>ייבוא נתונים מקובץ (שחזור)</span>
                            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                        </label>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default App;