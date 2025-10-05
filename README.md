# 📦 Alias Manager ZSH

Un outil CLI puissant multiplateforme pour gérer et synchroniser vos alias shell (ZSH, Bash, Fish) entre toutes vos machines via Git. Version publique sans données personnelles.

## 🌍 Compatibilité

- **Systèmes d'exploitation** : Linux, macOS, Windows
- **Shells supportés** : ZSH, Bash, Fish
- **Node.js** : >= 16.0.0

## 🔒 Configuration Git sécurisée

⚠️ **Important** : Après avoir cloné ce dépôt, configurez votre propre dépôt Git pour éviter de pousser sur le dépôt original :

### **1. Créer votre propre dépôt GitHub**

1. Allez sur [GitHub.com](https://github.com) et créez un nouveau dépôt
2. Nommez-le par exemple `mon-alias-manager` ou `mes-alias`
3. **Ne pas** initialiser avec README, .gitignore ou licence (le projet en a déjà)

### **2. Configurer le remote Git**

```bash
# Supprimer le remote original
git remote remove origin

# Ajouter votre propre dépôt
git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-REPO.git

# Pousser vers votre dépôt
git push -u origin main
```

### **3. Configuration pour l'auto-push**

L'outil utilise le fichier `configs/sync.json` pour la synchronisation. Pour activer l'auto-push :

```bash
# Vérifier que votre dépôt est bien configuré
git remote -v

# Tester la synchronisation
alias-manager add test "echo hello"
# → Cela va commiter localement et vous guider pour le push
```

### **4. Synchronisation entre machines**

Sur vos autres machines :

```bash
# Cloner VOTRE dépôt (pas le dépôt original)
git clone https://github.com/VOTRE-USERNAME/VOTRE-REPO.git
cd VOTRE-REPO

# Installer l'outil
npm install && npm link

# Synchroniser les alias
alias-manager sync
```

## 🚀 Installation rapide

### **Première installation**

```bash
# 1. Cloner le projet
git clone https://github.com/TerryBBz/AliasManagerZSH.git
cd AliasManagerZSH

# 2. Installer les dépendances
npm install && npm link

# 3. 🔒 CONFIGURATION GIT SÉCURISÉE (OBLIGATOIRE)
git remote remove origin
git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-REPO.git
git push -u origin main

# 4. Configurer votre environnement
alias-manager setup-zshrc    # Restaurer .zshrc avec vos fonctions (ZSH uniquement)
alias-manager install        # Ajouter l'intégration des alias (détection automatique du shell)
alias-manager sync           # Synchroniser les alias existants

# 5. Rechargement (selon votre shell)
# Pour ZSH: source ~/.zshrc
# Pour Bash: source ~/.bashrc  
# Pour Fish: source ~/.config/fish/config.fish
```

### **Sur une nouvelle machine**

```bash
git clone https://github.com/TerryBBz/AliasManagerZSH.git
cd AliasManagerZSH
npm install && npm link
alias-manager setup-zshrc && alias-manager install && alias-manager sync
source ~/.zshrc
```

## ✨ Fonctionnalités

- ✅ **Gestion par groupes** - Organisez vos alias (git, docker, system...)
- 🔄 **Activation/Désactivation** - Gérez vos alias sans les supprimer
- 🔄 **Synchronisation Git** - Auto-commit/push + sync entre machines
- 📱 **Import depuis .zshrc** - Migration automatique de vos alias existants
- 🛡️ **Validation intelligente** - Protection contre les conflits système
- 🎯 **Interface simple** - Commandes intuitives et messages clairs

## 📖 Utilisation

### 🔄 Synchronisation entre machines

```bash
# Machine 1 - Ajouter un alias (auto-commit + push)
alias-manager add deploy "docker compose up -d" --group docker

# Machine 2 - Récupérer les changements
alias-manager sync

# Import depuis un .zshrc existant
alias-manager import          # Depuis ~/.zshrc
alias-manager import-preview  # Voir ce qui sera importé
```

### Ajouter des alias

```bash
# Alias simple (auto-sync avec Git)
alias-manager add serve "php -S localhost:8000 -t public"

# Alias avec groupe
alias-manager add gpl "git pull origin main" --group git
alias-manager add gps "git push" --group git
```

### Lister les alias

```bash
# Tous les alias
alias-manager list

# Un groupe spécifique
alias-manager list git

# Avec les alias désactivés
alias-manager list --show-disabled

# Lister les groupes
alias-manager list group
```

### Gérer les alias

```bash
# Désactiver/Réactiver
alias-manager disable serve
alias-manager enable serve

# Gérer des groupes entiers
alias-manager disable-group git
alias-manager enable-group git

# Supprimer
alias-manager remove serve
```

### Sauvegarde et restauration

```bash
# Sauvegarde
alias-manager backup ~/mes-alias.json

# Restauration
alias-manager restore ~/mes-alias.json
```

## 📁 Structure des fichiers

```
AliasManager/
├── configs/
│   ├── sync.json           # Alias synchronisés (versionné Git)
│   └── zshrc-template.txt  # Template .zshrc avec vos fonctions
├── data/
│   ├── aliases.json        # Base de données locale
│   └── aliases.sh          # Fichier shell généré pour ZSH
└── src/                    # Code source
```

**Fichiers synchronisés via Git :**

- `configs/sync.json` - Vos alias avec groupes et descriptions
- `configs/zshrc-template.txt` - Votre configuration .zshrc personnalisée

## 🔧 Exemple de configuration

**aliases.json**

```json
{
  "groups": {
    "git": {
      "gpl": { "cmd": "git pull origin main", "disabled": false },
      "gps": { "cmd": "git push", "disabled": false }
    },
    "docker": {
      "dps": { "cmd": "docker ps", "disabled": false },
      "dlog": { "cmd": "docker logs -f", "disabled": true }
    }
  }
}
```

**aliases.sh généré**

```bash
# Generated by alias-manager

# Group: git
alias gpl='git pull origin main'
alias gps='git push'

# Group: docker
alias dps='docker ps'
# dlog is disabled
```

## 🎯 Messages d'interface

- ✅ `Alias 'gpl' ajouté dans le groupe 'git'`
- 🔕 `Alias 'serve' désactivé dans le groupe 'default'`
- 🔔 `Alias 'serve' réactivé dans le groupe 'default'`
- ❌ `L'alias 'test' existe déjà dans le groupe 'default'`

## 🛠️ Commandes disponibles

### Configuration

```bash
alias-manager setup-zshrc   # Restaurer .zshrc depuis le template
alias-manager install       # Ajouter l'intégration à .zshrc
alias-manager uninstall     # Supprimer l'intégration
alias-manager setup-info    # Voir les instructions détaillées
```

### Synchronisation

```bash
alias-manager sync          # Git pull + application des changements
alias-manager import        # Importer depuis .zshrc existant
alias-manager import-preview # Prévisualiser l'import
```

### Gestion des alias

```bash
alias-manager add <nom> "<commande>" [--group groupe]
alias-manager remove <nom> [--group groupe]
alias-manager list [groupe] [--show-disabled]
alias-manager enable/disable <nom> [--group groupe]
alias-manager backup/restore <fichier>
```

## 🔒 Sécurité

- Validation des noms d'alias (caractères autorisés)
- Protection contre l'écrasement de commandes système critiques
- Échappement automatique des caractères spéciaux
- Sauvegarde automatique du .zshrc avant modification

## 🎯 Workflow typique

```bash
# Setup initial
git clone https://github.com/TerryBBz/AliasManager.git
cd AliasManager && npm install && npm link
alias-manager setup-zshrc && alias-manager install && alias-manager sync

# Usage quotidien
alias-manager add myalias "echo hello"  # Auto-sync vers Git
# Sur autre machine...
alias-manager sync                      # Récupère automatiquement myalias
```

---

**Développé multiplateforme (Linux, macOS, Windows) avec support ZSH, Bash, Fish et synchronisation Git** 🌍⚡🔄
