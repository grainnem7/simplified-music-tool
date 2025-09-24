import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { GestureProfile, GestureEngineConfig } from './types';

interface GestureDB extends DBSchema {
  profiles: {
    key: string;
    value: GestureProfile;
  };
}

export class ProfileManager {
  private db: IDBPDatabase<GestureDB> | null = null;
  private readonly dbName = 'GestureProfiles';
  private readonly version = 1;

  async init(): Promise<void> {
    this.db = await openDB<GestureDB>(this.dbName, this.version, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'name' });
        }
      },
    });
  }

  async saveProfile(profile: GestureProfile): Promise<void> {
    if (!this.db) await this.init();

    profile.updatedAt = Date.now();

    await this.db!.put('profiles', profile);
    console.log(`Profile "${profile.name}" saved`);
  }

  async loadProfile(name: string): Promise<GestureProfile | null> {
    if (!this.db) await this.init();

    const profile = await this.db!.get('profiles', name);
    return profile || null;
  }

  async listProfiles(): Promise<string[]> {
    if (!this.db) await this.init();

    const profiles = await this.db!.getAll('profiles');
    return profiles.map(p => p.name);
  }

  async deleteProfile(name: string): Promise<void> {
    if (!this.db) await this.init();

    await this.db!.delete('profiles', name);
    console.log(`Profile "${name}" deleted`);
  }

  async exportProfile(name: string): Promise<string> {
    const profile = await this.loadProfile(name);

    if (!profile) {
      throw new Error(`Profile "${name}" not found`);
    }

    // Convert to JSON with proper serialization
    const exportData = {
      ...profile,
      modelWeights: profile.modelWeights ? this.serializeWeights(profile.modelWeights) : null,
      scaler: profile.scaler ? {
        mean: Array.from(profile.scaler.mean),
        std: Array.from(profile.scaler.std)
      } : null
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importProfile(jsonData: string): Promise<string> {
    try {
      const data = JSON.parse(jsonData);

      // Validate required fields
      if (!data.name || !data.gestures || !data.config) {
        throw new Error('Invalid profile data');
      }

      // Convert arrays back to Float32Arrays
      if (data.scaler) {
        data.scaler = {
          mean: new Float32Array(data.scaler.mean),
          std: new Float32Array(data.scaler.std)
        };
      }

      // Deserialize weights if present
      if (data.modelWeights) {
        data.modelWeights = this.deserializeWeights(data.modelWeights);
      }

      const profile: GestureProfile = {
        name: data.name,
        gestures: data.gestures,
        modelWeights: data.modelWeights,
        scaler: data.scaler,
        config: data.config,
        createdAt: data.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      await this.saveProfile(profile);
      return profile.name;
    } catch (error) {
      throw new Error(`Failed to import profile: ${error}`);
    }
  }

  async exportAllProfiles(): Promise<string> {
    if (!this.db) await this.init();

    const profiles = await this.db!.getAll('profiles');

    const exportData = profiles.map(profile => ({
      ...profile,
      modelWeights: profile.modelWeights ? this.serializeWeights(profile.modelWeights) : null,
      scaler: profile.scaler ? {
        mean: Array.from(profile.scaler.mean),
        std: Array.from(profile.scaler.std)
      } : null
    }));

    return JSON.stringify({ profiles: exportData }, null, 2);
  }

  async importAllProfiles(jsonData: string): Promise<number> {
    try {
      const data = JSON.parse(jsonData);

      if (!data.profiles || !Array.isArray(data.profiles)) {
        throw new Error('Invalid export data');
      }

      let imported = 0;

      for (const profileData of data.profiles) {
        try {
          await this.importProfile(JSON.stringify(profileData));
          imported++;
        } catch (error) {
          console.error(`Failed to import profile "${profileData.name}":`, error);
        }
      }

      return imported;
    } catch (error) {
      throw new Error(`Failed to import profiles: ${error}`);
    }
  }

  private serializeWeights(weights: any): any {
    if (Array.isArray(weights)) {
      return weights.map(w => {
        if (w.data && w.shape) {
          return {
            data: Array.from(w.data),
            shape: w.shape
          };
        }
        return w;
      });
    }

    // Handle different weight formats
    if (weights.classifier) {
      return {
        classifier: this.serializeWeights(weights.classifier),
        autoencoder: weights.autoencoder ? this.serializeWeights(weights.autoencoder) : null,
        labels: weights.labels
      };
    }

    return weights;
  }

  private deserializeWeights(weights: any): any {
    if (Array.isArray(weights)) {
      return weights.map(w => {
        if (w.data && w.shape) {
          return {
            data: w.data,
            shape: w.shape
          };
        }
        return w;
      });
    }

    // Handle different weight formats
    if (weights.classifier) {
      return {
        classifier: this.deserializeWeights(weights.classifier),
        autoencoder: weights.autoencoder ? this.deserializeWeights(weights.autoencoder) : null,
        labels: weights.labels
      };
    }

    return weights;
  }

  async createDefaultProfile(): Promise<void> {
    const defaultConfig: GestureEngineConfig = {
      velocityMin: 0.5,
      displacementMin: 0.1,
      holdMs: 200,
      arming: false,
      smoothingAlpha: 0.3,
      confidenceThreshold: 0.7,
      windowSizeMs: 500,
      strideMs: 100
    };

    const defaultProfile: GestureProfile = {
      name: 'default',
      gestures: ['Wave', 'Point', 'Swipe'],
      config: defaultConfig,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.saveProfile(defaultProfile);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}