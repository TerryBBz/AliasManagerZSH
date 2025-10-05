import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

export class Installer {
  constructor() {
    this.homeDir = os.homedir();
    this.zshrcPath = path.join(this.homeDir, '.zshrc');
    
    // Détecter le dossier du projet AliasManager
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.projectDir = path.resolve(__dirname, '..');
    
    // Utiliser le dossier data/ dans le projet
    this.configDir = path.join(this.projectDir, 'data');
    this.aliasFilePath = path.join(this.configDir, 'aliases.sh');
  }

  async checkShellInstalled() {
    try {
      const shell = process.env.SHELL || '';
      return {
        shell: shell,
        isZsh: shell.includes('zsh'),
        isBash: shell.includes('bash'),
        isFish: shell.includes('fish'),
        isSupported: shell.includes('zsh') || shell.includes('bash') || shell.includes('fish')
      };
    } catch {
      return {
        shell: '',
        isZsh: false,
        isBash: false,
        isFish: false,
        isSupported: false
      };
    }
  }

  async checkConfigFileExists() {
    try {
      const shellInfo = await this.checkShellInstalled();
      let configPath;
      
      if (shellInfo.isZsh) {
        configPath = this.zshrcPath;
      } else if (shellInfo.isBash) {
        configPath = path.join(this.homeDir, '.bashrc');
      } else if (shellInfo.isFish) {
        configPath = path.join(this.homeDir, '.config', 'fish', 'config.fish');
      } else {
        return false;
      }
      
      return await fs.pathExists(configPath);
    } catch {
      return false;
    }
  }

  async isAlreadyIntegrated() {
    try {
      const shellInfo = await this.checkShellInstalled();
      let configPath;
      
      if (shellInfo.isZsh) {
        configPath = this.zshrcPath;
      } else if (shellInfo.isBash) {
        configPath = path.join(this.homeDir, '.bashrc');
      } else if (shellInfo.isFish) {
        configPath = path.join(this.homeDir, '.config', 'fish', 'config.fish');
      } else {
        return false;
      }
      
      const configContent = await fs.readFile(configPath, 'utf8');
      return configContent.includes('# Alias Manager - Chargement automatique des alias');
    } catch {
      return false;
    }
  }

  async addToShellConfig() {
    try {
      // Vérifications préalables
      const shellInfo = await this.checkShellInstalled();
      if (!shellInfo.isSupported) {
        throw new Error('Aucun shell supporté détecté (ZSH, Bash, Fish requis)');
      }

      if (!await this.checkConfigFileExists()) {
        throw new Error('Le fichier de configuration du shell n\'existe pas');
      }

      if (await this.isAlreadyIntegrated()) {
        console.log('ℹ️  L\'intégration existe déjà dans votre configuration shell');
        return false;
      }

      // Déterminer le fichier de configuration
      let configPath;
      let reloadCommand;
      
      if (shellInfo.isZsh) {
        configPath = this.zshrcPath;
        reloadCommand = 'source ~/.zshrc';
      } else if (shellInfo.isBash) {
        configPath = path.join(this.homeDir, '.bashrc');
        reloadCommand = 'source ~/.bashrc';
      } else if (shellInfo.isFish) {
        configPath = path.join(this.homeDir, '.config', 'fish', 'config.fish');
        reloadCommand = 'source ~/.config/fish/config.fish';
      }

      // Créer une sauvegarde
      const backupPath = `${configPath}.backup.${Date.now()}`;
      await fs.copy(configPath, backupPath);

      // Ajouter la ligne d'intégration
      let integrationLine;
      if (shellInfo.isFish) {
        // Fish utilise une syntaxe différente
        integrationLine = `\n# Alias Manager - Chargement automatique des alias\nif test -f "${this.aliasFilePath}"\n    source "${this.aliasFilePath}"\nend\n`;
      } else {
        // ZSH et Bash utilisent la même syntaxe
        integrationLine = `\n# Alias Manager - Chargement automatique des alias\n[ -f "${this.aliasFilePath}" ] && source "${this.aliasFilePath}"\n`;
      }
      
      await fs.appendFile(configPath, integrationLine);

      console.log(`✅ Intégration ajoutée à ${path.basename(configPath)}`);
      console.log(`💾 Sauvegarde créée: ${backupPath}`);
      console.log(`🔄 Exécutez "${reloadCommand}" ou redémarrez votre terminal pour appliquer les changements`);
      
      return true;
    } catch (error) {
      throw new Error(`Erreur lors de l'intégration: ${error.message}`);
    }
  }

  async removeFromZshrc() {
    try {
      if (!await this.checkZshrcExists()) {
        throw new Error('Le fichier .zshrc n\'existe pas');
      }

      const zshrcContent = await fs.readFile(this.zshrcPath, 'utf8');
      
      if (!zshrcContent.includes('# Alias Manager - Chargement automatique des alias')) {
        console.log('ℹ️  L\'intégration n\'existe pas dans .zshrc');
        return false;
      }

      // Créer une sauvegarde
      const backupPath = `${this.zshrcPath}.backup.${Date.now()}`;
      await fs.copy(this.zshrcPath, backupPath);

      // Supprimer les lignes relatives à alias-manager
      const lines = zshrcContent.split('\n');
      const filteredLines = [];
      let skipNext = false;

      for (const line of lines) {
        if (line.includes('# Alias Manager')) {
          skipNext = true;
          continue;
        }
        
        if (skipNext && line.includes(this.aliasFilePath)) {
          skipNext = false;
          continue;
        }
        
        filteredLines.push(line);
      }

      await fs.writeFile(this.zshrcPath, filteredLines.join('\n'));

      console.log('✅ Intégration supprimée de .zshrc');
      console.log(`💾 Sauvegarde créée: ${backupPath}`);
      
      return true;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }
  }

  async showInstallationInstructions() {
    console.log(`
🚀 Installation de Alias Manager

1. Installation des dépendances:
   cd ${process.cwd()}
   npm install

2. Installation globale:
   npm link

3. Intégration ZSH (automatique):
   L'outil proposera d'ajouter automatiquement la ligne suivante à votre .zshrc:
   [ -f "$HOME/.alias-manager/aliases.sh" ] && source "$HOME/.alias-manager/aliases.sh"

4. Rechargement du terminal:
   source ~/.zshrc
   (ou redémarrez votre terminal)

5. Test:
   alias-manager --help

📁 Fichiers créés:
   • ~/.alias-manager/aliases.json (données)
   • ~/.alias-manager/aliases.sh (alias générés)

🔧 Désinstallation:
   npm unlink alias-manager
   rm -rf ~/.alias-manager
   (+ supprimer manuellement la ligne de .zshrc si besoin)
`);
  }

  async promptForIntegration() {
    // Dans un vrai projet, on utiliserait un module comme 'readline' pour l'interaction
    // Ici on simule juste l'affichage du message
    console.log('🤔 Voulez-vous ajouter l\'intégration ZSH à votre .zshrc automatiquement ?');
    console.log('   (Cela permettra de charger automatiquement vos alias)');
    console.log('');
    console.log('   Pour accepter: alias-manager install');
    console.log('   Pour refuser:  continuez à utiliser l\'outil normalement');
  }
}