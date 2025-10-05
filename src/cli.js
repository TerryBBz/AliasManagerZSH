#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { AliasManager } from './alias-manager.js';
import { Installer } from './installer.js';
import { DataManager } from './data-manager.js';

const manager = new AliasManager();
const installer = new Installer();

// Configuration des arguments
const options = {
  group: {
    type: 'string',
    short: 'g'
  },
  'show-disabled': {
    type: 'boolean'
  }
};

async function main() {
  try {
    const { values, positionals } = parseArgs({
      args: process.argv.slice(2),
      options,
      allowPositionals: true
    });

    const [command, ...args] = positionals;

    switch (command) {
      case 'add':
        if (args.length < 2) {
          console.error('❌ Usage: alias-manager add <nom> "<commande>" [--group nom_du_groupe]');
          process.exit(1);
        }
        await manager.addAlias(args[0], args[1], values.group);
        break;

      case 'list':
        if (args[0] === 'group') {
          await manager.listGroups();
        } else if (args[0]) {
          await manager.listAliases(args[0], values['show-disabled']);
        } else {
          await manager.listAliases(null, values['show-disabled']);
        }
        break;

      case 'remove':
        if (args.length < 1) {
          console.error('❌ Usage: alias-manager remove <nom> [--group nom_du_groupe]');
          process.exit(1);
        }
        await manager.removeAlias(args[0], values.group);
        break;

      case 'disable':
        if (args.length < 1) {
          console.error('❌ Usage: alias-manager disable <nom> [--group nom_du_groupe]');
          process.exit(1);
        }
        await manager.disableAlias(args[0], values.group);
        break;

      case 'enable':
        if (args.length < 1) {
          console.error('❌ Usage: alias-manager enable <nom> [--group nom_du_groupe]');
          process.exit(1);
        }
        await manager.enableAlias(args[0], values.group);
        break;

      case 'disable-group':
        if (args.length < 1) {
          console.error('❌ Usage: alias-manager disable-group <nom_du_groupe>');
          process.exit(1);
        }
        await manager.disableGroup(args[0]);
        break;

      case 'enable-group':
        if (args.length < 1) {
          console.error('❌ Usage: alias-manager enable-group <nom_du_groupe>');
          process.exit(1);
        }
        await manager.enableGroup(args[0]);
        break;

      case 'backup':
        if (args.length < 1) {
          console.error('❌ Usage: alias-manager backup <chemin_fichier>');
          process.exit(1);
        }
        await manager.backup(args[0]);
        break;

      case 'restore':
        if (args.length < 1) {
          console.error('❌ Usage: alias-manager restore <chemin_fichier>');
          process.exit(1);
        }
        await manager.restore(args[0]);
        break;

      case 'install':
        await installer.addToZshrc();
        break;

      case 'uninstall':
        await installer.removeFromZshrc();
        break;

      case 'setup-info':
        await installer.showInstallationInstructions();
        break;

      case 'import':
        if (args.length > 0) {
          // Import depuis un fichier spécifique
          await importFromFile(args[0]);
        } else {
          // Import depuis ~/.zshrc par défaut
          await importFromZshrc();
        }
        break;

      case 'import-preview':
        if (args.length > 0) {
          await previewImport(args[0]);
        } else {
          await previewImport();
        }
        break;

      case 'sync':
        await syncFromGit();
        break;

      case 'setup-zshrc':
        await setupZshrcFromTemplate();
        break;

      case 'update':
        await updateAliasManager();
        break;

      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;

      default:
        console.error('❌ Commande inconnue. Utilisez --help pour voir les commandes disponibles.');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.clear();
  console.log(`
📦 Alias Manager - Gestionnaire d'alias ZSH

Usage: alias-manager <commande> [options]

Commandes:
  add <nom> "<commande>" [--group groupe]    Ajouter un alias
  list [groupe] [--show-disabled]           Lister les alias
  list group                               Lister les groupes
  remove <nom> [--group groupe]            Supprimer un alias
  disable <nom> [--group groupe]           Désactiver un alias
  enable <nom> [--group groupe]            Réactiver un alias
  disable-group <groupe>                   Désactiver un groupe
  enable-group <groupe>                    Réactiver un groupe
  backup <fichier>                         Sauvegarder tous les alias
  restore <fichier>                        Restaurer depuis un fichier
  install                                  Ajouter l'intégration à .zshrc
  uninstall                                Supprimer l'intégration de .zshrc
  setup-info                               Afficher les instructions d'installation
  import [fichier]                         Importer les alias depuis .zshrc (ou fichier spécifié)
  import-preview [fichier]                 Prévisualiser l'import sans l'effectuer
  sync                                     Synchroniser avec Git (pull + application des changements)
  setup-zshrc                              Restaurer le .zshrc depuis le template du projet
  update                                   Mettre à jour la version npm et corriger l'alias am

Options:
  --group, -g <nom>    Spécifier le groupe (défaut: default)
  --show-disabled      Afficher aussi les alias désactivés
  --help, -h           Afficher cette aide

Exemples:
  alias-manager add serve "php -S localhost:8000 -t public"
  alias-manager add gpl "git pull origin main" --group git
  alias-manager list git
  alias-manager disable serve
  alias-manager backup ~/mes-alias.json
  alias-manager import                     # Import depuis ~/.zshrc
  alias-manager import ~/autre-config.zsh # Import depuis un fichier spécifique
  alias-manager import-preview             # Voir ce qui sera importé
`);
}

async function importFromZshrc(filePath = null) {
  try {
    console.log('📂 Import des alias depuis .zshrc...');
    
    const dataManager = new DataManager();
    const importedAliases = await dataManager.importFromZshrc(filePath);
    
    const totalAliases = Object.values(importedAliases).reduce((total, group) => total + Object.keys(group).length, 0);
    
    if (totalAliases === 0) {
      console.log('ℹ️  Aucun alias trouvé dans le fichier.');
      return;
    }
    
    console.log(`\n📦 ${totalAliases} alias trouvés dans ${Object.keys(importedAliases).length} groupes:`);
    for (const [groupName, aliases] of Object.entries(importedAliases)) {
      console.log(`   • ${groupName}: ${Object.keys(aliases).length} alias`);
    }
    
    await dataManager.mergeImportedData(importedAliases);
    
    console.log('\n✅ Import terminé avec succès !');
    console.log('🔄 Rechargez votre terminal (source ~/.zshrc) pour appliquer les changements.');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error.message);
  }
}

async function importFromFile(filePath) {
  await importFromZshrc(filePath);
}

async function previewImport(filePath = null) {
  try {
    console.log('👀 Prévisualisation de l\'import...');
    
    const dataManager = new DataManager();
    const importedAliases = await dataManager.importFromZshrc(filePath);
    
    const totalAliases = Object.values(importedAliases).reduce((total, group) => total + Object.keys(group).length, 0);
    
    if (totalAliases === 0) {
      console.log('ℹ️  Aucun alias trouvé dans le fichier.');
      return;
    }
    
    console.log(`\n📦 ${totalAliases} alias seraient importés:`);
    
    for (const [groupName, aliases] of Object.entries(importedAliases)) {
      console.log(`\n🔸 Groupe: ${groupName}`);
      for (const [aliasName, aliasData] of Object.entries(aliases)) {
        console.log(`   ${aliasName} = "${aliasData.cmd}"`);
        if (aliasData.description && aliasData.description !== 'Alias importé depuis .zshrc') {
          console.log(`      ↳ ${aliasData.description}`);
        }
      }
    }
    
    console.log('\n💡 Utilisez "alias-manager import" pour effectuer l\'import réel.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la prévisualisation:', error.message);
  }
}

async function syncFromGit() {
  try {
    console.log('🔄 Synchronisation avec Git...');
    
    const dataManager = new DataManager();
    
    // Git pull dans le dossier du projet
    console.log('📥 Git pull...');
    const { execSync } = await import('child_process');
    
    try {
      const output = execSync(`git -C "${dataManager.projectDir}" pull`, { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      console.log('✅ Git pull terminé:', output.trim());
    } catch (gitError) {
      console.error('❌ Erreur Git pull:', gitError.message);
      console.log('💡 Assurez-vous d\'être dans un dépôt Git avec une branche trackée.');
      return;
    }
    
    // Vérifier s'il y a un fichier de sync
    const fs = await import('fs-extra');
    const syncExists = await fs.default.pathExists(dataManager.syncFile);
    
    if (!syncExists) {
      console.log('📝 Aucun fichier de synchronisation trouvé, création du fichier initial...');
      await createInitialSyncFile(dataManager);
      return;
    }
    
    // Charger et appliquer les changements depuis le fichier de sync
    console.log('📂 Application des changements...');
    const syncData = await fs.default.readJSON(dataManager.syncFile);
    
    // Appliquer les alias depuis le fichier de sync
    await dataManager.saveData(syncData);
    await dataManager.generateAliasFile(syncData);
    
    console.log('✅ Synchronisation terminée !');
    console.log('🔄 Rechargez votre terminal (source ~/.zshrc) pour appliquer les changements.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message);
  }
}

async function createInitialSyncFile(dataManager) {
  try {
    // Créer le fichier de sync initial avec les données actuelles
    const currentData = await dataManager.loadData();
    const fs = await import('fs-extra');
    
    await fs.default.writeJSON(dataManager.syncFile, currentData, { spaces: 2 });
    
    console.log('✅ Fichier de synchronisation créé');
    console.log(`📁 Emplacement: ${dataManager.syncFile}`);
    console.log('💡 Vous pouvez maintenant committer ce fichier dans Git pour la synchronisation.');
  } catch (error) {
    console.error('❌ Erreur lors de la création du fichier de sync:', error.message);
  }
}

async function setupZshrcFromTemplate() {
  try {
    console.log('🔧 Configuration du .zshrc depuis le template...');
    
    const dataManager = new DataManager();
    const fs = await import('fs-extra');
    const path = await import('path');
    
    // Chemin du template et du .zshrc
    const templatePath = path.default.join(dataManager.projectDir, 'configs', 'zshrc-template.txt');
    const zshrcPath = path.default.join(dataManager.homeDir, '.zshrc');
    
    // Vérifier que le template existe
    const templateExists = await fs.default.pathExists(templatePath);
    if (!templateExists) {
      console.error('❌ Template .zshrc non trouvé dans configs/zshrc-template.txt');
      return;
    }
    
    // Créer une sauvegarde du .zshrc existant
    const zshrcExists = await fs.default.pathExists(zshrcPath);
    if (zshrcExists) {
      const backupPath = `${zshrcPath}.backup.${Date.now()}`;
      await fs.default.copy(zshrcPath, backupPath);
      console.log(`💾 Sauvegarde créée: ${backupPath}`);
    }
    
    // Copier le template
    await fs.default.copy(templatePath, zshrcPath);
    
    console.log('✅ .zshrc restauré depuis le template');
    console.log('🔄 Rechargez votre terminal (source ~/.zshrc) pour appliquer les changements');
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration du .zshrc:', error.message);
  }
}

async function updateAliasManager() {
  try {
    console.log('🔄 Mise à jour d\'alias-manager...');

    const fs = await import('fs-extra');
    const path = await import('path');
    const { execSync } = await import('child_process');

    // Récupérer les informations de version
    const projectDir = '/Users/mactb/Desktop/MacCode/AliasManager';
    const packageJsonPath = path.default.join(projectDir, 'package.json');
    const packageJson = await fs.default.readJSON(packageJsonPath);
    const localVersion = packageJson.version;

    console.log(`📦 Version locale: ${localVersion}`);

    // Vérifier la version npm installée
    let npmVersion = 'non installé';
    try {
      const npmOutput = execSync('npm list -g alias-manager --depth=0', { encoding: 'utf8', stdio: 'pipe' });
      const versionMatch = npmOutput.match(/alias-manager@(\d+\.\d+\.\d+)/);
      if (versionMatch) {
        npmVersion = versionMatch[1];
      }
    } catch (error) {
      console.log('ℹ️  alias-manager n\'est pas installé via npm');
    }

    console.log(`📦 Version npm: ${npmVersion}`);

    // Mettre à jour la version dans package.json si nécessaire
    const newVersion = `${parseInt(localVersion.split('.')[0])}.${parseInt(localVersion.split('.')[1])}.${parseInt(localVersion.split('.')[2]) + 1}`;

    // Publier la nouvelle version
    console.log(`🚀 Publication de la version ${newVersion}...`);

    // Mettre à jour package.json
    packageJson.version = newVersion;
    await fs.default.writeJSON(packageJsonPath, packageJson, { spaces: 2 });

    // Publier via npm depuis le répertoire du projet
    try {
      execSync('npm publish', {
        encoding: 'utf8',
        stdio: 'inherit',
        cwd: projectDir
      });
      console.log(`✅ Version ${newVersion} publiée sur npm`);
    } catch (error) {
      console.log('⚠️  Publication npm échouée (peut-être déjà publiée)');
    }

    // Installer/mettre à jour la version globale
    console.log('📥 Installation de la nouvelle version...');
    try {
      execSync(`npm install -g alias-manager@${newVersion}`, { encoding: 'utf8', stdio: 'inherit' });
      console.log(`✅ Version ${newVersion} installée globalement`);
    } catch (error) {
      console.log('⚠️  Installation globale échouée, essai avec la version locale...');
      execSync('npm install -g .', {
        encoding: 'utf8',
        stdio: 'inherit',
        cwd: projectDir
      });
    }

    // Corriger l'alias am dans .zshrc
    console.log('🔧 Correction de l\'alias am dans .zshrc...');
    const zshrcPath = path.default.join(process.env.HOME, '.zshrc');

    if (await fs.default.pathExists(zshrcPath)) {
      let zshrcContent = await fs.default.readFile(zshrcPath, 'utf8');

      // Rechercher et remplacer l'alias am
      const aliasPattern = /alias am=.*$/m;
      const newAlias = 'alias am="alias-manager"';

      if (aliasPattern.test(zshrcContent)) {
        zshrcContent = zshrcContent.replace(aliasPattern, newAlias);
        console.log('✏️  Alias am mis à jour');
      } else {
        // Ajouter l'alias si il n'existe pas
        zshrcContent += `\n# Alias Manager shortcut\n${newAlias}\n`;
        console.log('➕ Alias am ajouté');
      }

      await fs.default.writeFile(zshrcPath, zshrcContent);
    }

    console.log('\n✅ Mise à jour terminée !');
    console.log('🔄 Rechargez votre terminal (source ~/.zshrc) pour appliquer les changements');
    console.log(`💡 Vous pouvez maintenant utiliser: am --help`);

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message);
  }
}

main();