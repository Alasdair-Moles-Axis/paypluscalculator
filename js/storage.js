/**
 * Tungsten Pay+ ROI Calculator - Storage Module
 * Handles localStorage operations for saving and loading calculations
 */

class StorageManager {
    constructor() {
        this.storageKey = 'tungsten_roi_calculator';
        this.maxSavedCalculations = 10;
    }

    /**
     * Check if localStorage is available
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get all data from localStorage
     */
    getData() {
        if (!this.isAvailable()) {
            return this.getDefaultStorage();
        }

        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Error reading from localStorage:', e);
        }

        return this.getDefaultStorage();
    }

    /**
     * Get default storage structure
     */
    getDefaultStorage() {
        return {
            version: '1.0.0',
            lastAccessed: new Date().toISOString(),
            currentCalculation: null,
            savedCalculations: [],
            settings: {
                defaultTungstenFees: {
                    localRail: 0.15,
                    crossBorder: 0.25,
                    fxMargins: {
                        tier1: 0.50,
                        tier2: 0.35,
                        tier3: 0.20
                    },
                    cardRebate: 1.50
                },
                defaultCurrentProviderFees: {
                    localRail: 0.25,
                    crossBorder: 0.50,
                    fxMargins: {
                        tier1: 0.75,
                        tier2: 0.60,
                        tier3: 0.45
                    },
                    cardRebate: 1.00
                }
            }
        };
    }

    /**
     * Save all data to localStorage
     */
    saveData(data) {
        if (!this.isAvailable()) {
            console.warn('localStorage is not available');
            return false;
        }

        try {
            data.lastAccessed = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            
            // If quota exceeded, try to free up space
            if (e.name === 'QuotaExceededError') {
                this.cleanupOldCalculations();
                try {
                    localStorage.setItem(this.storageKey, JSON.stringify(data));
                    return true;
                } catch (e2) {
                    console.error('Still unable to save after cleanup:', e2);
                }
            }
            
            return false;
        }
    }

    /**
     * Save current calculation
     */
    saveCurrentCalculation(calculationData) {
        const storage = this.getData();
        storage.currentCalculation = {
            data: calculationData,
            timestamp: new Date().toISOString()
        };
        return this.saveData(storage);
    }

    /**
     * Load current calculation
     */
    loadCurrentCalculation() {
        const storage = this.getData();
        return storage.currentCalculation ? storage.currentCalculation.data : null;
    }

    /**
     * Save a named calculation
     */
    saveCalculation(name, calculationData) {
        const storage = this.getData();
        
        const calculation = {
            id: this.generateId(),
            name: name || `Calculation ${storage.savedCalculations.length + 1}`,
            data: calculationData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Check if calculation with same name exists
        const existingIndex = storage.savedCalculations.findIndex(c => c.name === calculation.name);
        
        if (existingIndex >= 0) {
            // Update existing
            calculation.id = storage.savedCalculations[existingIndex].id;
            calculation.createdAt = storage.savedCalculations[existingIndex].createdAt;
            storage.savedCalculations[existingIndex] = calculation;
        } else {
            // Add new
            storage.savedCalculations.unshift(calculation);
            
            // Limit number of saved calculations
            if (storage.savedCalculations.length > this.maxSavedCalculations) {
                storage.savedCalculations = storage.savedCalculations.slice(0, this.maxSavedCalculations);
            }
        }

        return this.saveData(storage) ? calculation : null;
    }

    /**
     * Load a saved calculation by ID
     */
    loadCalculation(id) {
        const storage = this.getData();
        const calculation = storage.savedCalculations.find(c => c.id === id);
        return calculation ? calculation.data : null;
    }

    /**
     * Get all saved calculations
     */
    getSavedCalculations() {
        const storage = this.getData();
        return storage.savedCalculations.map(calc => ({
            id: calc.id,
            name: calc.name,
            createdAt: calc.createdAt,
            updatedAt: calc.updatedAt
        }));
    }

    /**
     * Delete a saved calculation
     */
    deleteCalculation(id) {
        const storage = this.getData();
        storage.savedCalculations = storage.savedCalculations.filter(c => c.id !== id);
        return this.saveData(storage);
    }

    /**
     * Clear all saved calculations
     */
    clearAllCalculations() {
        const storage = this.getData();
        storage.savedCalculations = [];
        return this.saveData(storage);
    }

    /**
     * Cleanup old calculations to free up space
     */
    cleanupOldCalculations() {
        const storage = this.getData();
        
        // Keep only the 5 most recent calculations
        if (storage.savedCalculations.length > 5) {
            storage.savedCalculations = storage.savedCalculations
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .slice(0, 5);
            
            this.saveData(storage);
        }
    }

    /**
     * Export calculation as JSON file
     */
    exportCalculation(calculationData, filename) {
        const dataStr = JSON.stringify(calculationData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `tungsten-roi-${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Import calculation from JSON file
     */
    importCalculation(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid JSON file'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Get storage usage information
     */
    getStorageInfo() {
        if (!this.isAvailable()) {
            return {
                available: false,
                used: 0,
                total: 0,
                percentage: 0
            };
        }

        try {
            const data = localStorage.getItem(this.storageKey);
            const used = data ? new Blob([data]).size : 0;
            const total = 5 * 1024 * 1024; // Approximate 5MB limit
            
            return {
                available: true,
                used: used,
                total: total,
                percentage: (used / total) * 100,
                usedFormatted: this.formatBytes(used),
                totalFormatted: this.formatBytes(total)
            };
        } catch (e) {
            return {
                available: true,
                used: 0,
                total: 0,
                percentage: 0,
                error: e.message
            };
        }
    }

    /**
     * Format bytes to human-readable string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Clear all data (reset)
     */
    clearAll() {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (e) {
            console.error('Error clearing localStorage:', e);
            return false;
        }
    }

    /**
     * Get settings
     */
    getSettings() {
        const storage = this.getData();
        return storage.settings;
    }

    /**
     * Update settings
     */
    updateSettings(settings) {
        const storage = this.getData();
        storage.settings = { ...storage.settings, ...settings };
        return this.saveData(storage);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}