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

  async checkZshInstalled() {
    try {
      const shell = process.env.SHELL || '';
      return shell.includes('zsh');
    } catch {
      return false;
    }
  }

  async checkZshrcExists() {
    try {
      return await fs.pathExists(this.zshrcPath);
    } catch {
      return false;
    }
  }

  async isAlreadyIntegrated() {
    try {
      const zshrcContent = await fs.readFile(this.zshrcPath, 'utf8');
      return zshrcContent.includes('# Alias Manager - Chargement automatique des alias');
    } catch {
      return false;
    }
  }

  async addToZshrc() {
    try {
      // Vérifications préalables
      if (!await this.checkZshInstalled()) {
        throw new Error('ZSH n\'est pas installé ou n\'est pas votre shell par défaut');
      }

      if (!await this.checkZshrcExists()) {
        throw new Error('Le fichier .zshrc n\'existe pas');
      }

      if (await this.isAlreadyIntegrated()) {
        console.log('ℹ️  L\'intégration existe déjà dans .zshrc');
        return false;
      }

      // Créer une sauvegarde de .zshrc
      const backupPath = `${this.zshrcPath}.backup.${Date.now()}`;
      await fs.copy(this.zshrcPath, backupPath);

      // Ajouter la ligne d'intégration avec le chemin absolu du projet
      const integrationLine = `\n# Alias Manager - Chargement automatique des alias\n[ -f "${this.aliasFilePath}" ] && source "${this.aliasFilePath}"\n`;
      await fs.appendFile(this.zshrcPath, integrationLine);

      console.log('✅ Intégration ajoutée à .zshrc');
      console.log(`💾 Sauvegarde créée: ${backupPath}`);
      console.log('🔄 Exécutez "source ~/.zshrc" ou redémarrez votre terminal pour appliquer les changements');
      
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