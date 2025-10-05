import { DataManager } from './data-manager.js';
import { Validator } from './validator.js';
import fs from 'fs-extra';

export class AliasManager {
  constructor() {
    this.dataManager = new DataManager();
  }

  async addAlias(name, command, group = 'default') {
    try {
      // Validation
      Validator.validateAliasName(name);
      Validator.validateCommand(command);
      Validator.validateGroupName(group);
      Validator.checkSystemCommandConflict(name);

      // Charger les données existantes
      const data = await this.dataManager.loadData();

      // Vérifier si l'alias existe déjà dans ce groupe
      if (data.groups[group] && data.groups[group][name]) {
        throw new Error(`L'alias '${name}' existe déjà dans le groupe '${group}'.`);
      }

      // Créer le groupe s'il n'existe pas
      if (!data.groups[group]) {
        data.groups[group] = {};
      }

      // Ajouter l'alias
      data.groups[group][name] = {
        cmd: command,
        disabled: false
      };

      // Sauvegarder et regénérer
      await this.dataManager.saveData(data);
      await this.dataManager.generateAliasFile(data);

      console.log(`✅ Alias '${name}' ajouté dans le groupe '${group}'.`);
      
      // Auto-commit et push vers Git
      await this.dataManager.updateSyncFileAndGitPush('feat', `add alias '${name}' to group '${group}'`);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async removeAlias(name, group = 'default') {
    try {
      Validator.validateAliasName(name);
      Validator.validateGroupName(group);

      const data = await this.dataManager.loadData();

      if (!data.groups[group] || !data.groups[group][name]) {
        throw new Error(`L'alias '${name}' n'existe pas dans le groupe '${group}'.`);
      }

      delete data.groups[group][name];

      // Si le groupe est vide et n'est pas le groupe par défaut, le supprimer
      if (group !== 'default' && Object.keys(data.groups[group]).length === 0) {
        delete data.groups[group];
      }

      await this.dataManager.saveData(data);
      await this.dataManager.generateAliasFile(data);

      console.log(`🗑️  Alias '${name}' supprimé du groupe '${group}'.`);
      
      // Auto-commit et push vers Git
      await this.dataManager.updateSyncFileAndGitPush('feat', `remove alias '${name}' from group '${group}'`);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async disableAlias(name, group = 'default') {
    try {
      Validator.validateAliasName(name);
      Validator.validateGroupName(group);

      const data = await this.dataManager.loadData();

      if (!data.groups[group] || !data.groups[group][name]) {
        throw new Error(`L'alias '${name}' n'existe pas dans le groupe '${group}'.`);
      }

      if (data.groups[group][name].disabled) {
        console.log(`ℹ️  L'alias '${name}' est déjà désactivé dans le groupe '${group}'.`);
        return;
      }

      data.groups[group][name].disabled = true;

      await this.dataManager.saveData(data);
      await this.dataManager.generateAliasFile(data);

      console.log(`🔕 Alias '${name}' désactivé dans le groupe '${group}'.`);
      
      // Auto-commit et push vers Git
      await this.dataManager.updateSyncFileAndGitPush('feat', `disable alias '${name}' in group '${group}'`);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async enableAlias(name, group = 'default') {
    try {
      Validator.validateAliasName(name);
      Validator.validateGroupName(group);

      const data = await this.dataManager.loadData();

      if (!data.groups[group] || !data.groups[group][name]) {
        throw new Error(`L'alias '${name}' n'existe pas dans le groupe '${group}'.`);
      }

      if (!data.groups[group][name].disabled) {
        console.log(`ℹ️  L'alias '${name}' est déjà activé dans le groupe '${group}'.`);
        return;
      }

      data.groups[group][name].disabled = false;

      await this.dataManager.saveData(data);
      await this.dataManager.generateAliasFile(data);

      console.log(`🔔 Alias '${name}' réactivé dans le groupe '${group}'.`);
      
      // Auto-commit et push vers Git
      await this.dataManager.updateSyncFileAndGitPush('feat', `enable alias '${name}' in group '${group}'`);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async disableGroup(groupName) {
    try {
      Validator.validateGroupName(groupName);

      const data = await this.dataManager.loadData();

      if (!data.groups[groupName]) {
        throw new Error(`Le groupe '${groupName}' n'existe pas.`);
      }

      let count = 0;
      for (const [aliasName, aliasData] of Object.entries(data.groups[groupName])) {
        if (!aliasData.disabled) {
          aliasData.disabled = true;
          count++;
        }
      }

      if (count === 0) {
        console.log(`ℹ️  Tous les alias du groupe '${groupName}' sont déjà désactivés.`);
        return;
      }

      await this.dataManager.saveData(data);
      await this.dataManager.generateAliasFile(data);

      console.log(`🔕 Groupe '${groupName}' désactivé (${count} alias).`);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async enableGroup(groupName) {
    try {
      Validator.validateGroupName(groupName);

      const data = await this.dataManager.loadData();

      if (!data.groups[groupName]) {
        throw new Error(`Le groupe '${groupName}' n'existe pas.`);
      }

      let count = 0;
      for (const [aliasName, aliasData] of Object.entries(data.groups[groupName])) {
        if (aliasData.disabled) {
          aliasData.disabled = false;
          count++;
        }
      }

      if (count === 0) {
        console.log(`ℹ️  Tous les alias du groupe '${groupName}' sont déjà activés.`);
        return;
      }

      await this.dataManager.saveData(data);
      await this.dataManager.generateAliasFile(data);

      console.log(`🔔 Groupe '${groupName}' réactivé (${count} alias).`);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async listGroups() {
    try {
      const data = await this.dataManager.loadData();
      const groups = Object.keys(data.groups);

      if (groups.length === 0) {
        console.log('ℹ️  Aucun groupe trouvé.');
        return;
      }

      console.log('📂 Groupes disponibles:');
      for (const groupName of groups.sort()) {
        const aliases = Object.keys(data.groups[groupName]);
        const activeCount = Object.values(data.groups[groupName])
          .filter(alias => !alias.disabled).length;
        const totalCount = aliases.length;
        
        console.log(`  • ${groupName} (${activeCount}/${totalCount} actifs)`);
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async listAliases(groupName = null, showDisabled = false) {
    try {
      const data = await this.dataManager.loadData();

      if (groupName) {
        Validator.validateGroupName(groupName);
        
        if (!data.groups[groupName]) {
          throw new Error(`Le groupe '${groupName}' n'existe pas.`);
        }

        this.displayGroupAliases(groupName, data.groups[groupName], showDisabled);
      } else {
        // Afficher tous les groupes
        const groupNames = Object.keys(data.groups).sort();
        
        if (groupNames.length === 0) {
          console.log('ℹ️  Aucun alias trouvé.');
          return;
        }

        for (const group of groupNames) {
          this.displayGroupAliases(group, data.groups[group], showDisabled);
          console.log(''); // Ligne vide entre les groupes
        }
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  displayGroupAliases(groupName, aliases, showDisabled = false) {
    const aliasEntries = Object.entries(aliases);
    const activeAliases = aliasEntries.filter(([, data]) => !data.disabled);
    const disabledAliases = aliasEntries.filter(([, data]) => data.disabled);

    console.log(`📁 Groupe: ${groupName}`);

    if (activeAliases.length === 0 && disabledAliases.length === 0) {
      console.log('  (aucun alias)');
      return;
    }

    // Afficher les alias actifs
    if (activeAliases.length > 0) {
      for (const [name, data] of activeAliases.sort()) {
        console.log(`  ✅ ${name} → ${data.cmd}`);
      }
    }

    // Afficher les alias désactivés si demandé
    if (showDisabled && disabledAliases.length > 0) {
      for (const [name, data] of disabledAliases.sort()) {
        console.log(`  🔕 ${name} → ${data.cmd} (désactivé)`);
      }
    }
  }

  async backup(filePath) {
    try {
      const data = await this.dataManager.loadData();
      await fs.writeJSON(filePath, data, { spaces: 2 });
      console.log(`💾 Sauvegarde créée: ${filePath}`);
    } catch (error) {
      throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
    }
  }

  async restore(filePath) {
    try {
      const backupData = await fs.readJSON(filePath);
      const validatedData = this.dataManager.validateData(backupData);
      
      await this.dataManager.saveData(validatedData);
      await this.dataManager.generateAliasFile(validatedData);
      
      console.log(`📥 Restauration effectuée depuis: ${filePath}`);
    } catch (error) {
      throw new Error(`Erreur lors de la restauration: ${error.message}`);
    }
  }
}