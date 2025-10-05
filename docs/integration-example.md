# Exemple d'intégration ZSH

## Ce que fait l'outil automatiquement

L'outil AliasManager s'intègre dans votre configuration ZSH existante en ajoutant simplement cette ligne à votre `~/.zshrc` :

```bash
# Alias Manager - Chargement automatique des alias
[ -f "$HOME/.alias-manager/aliases.sh" ] && source "$HOME/.alias-manager/aliases.sh"
```

## Fichiers créés par l'outil

- `~/.alias-manager/aliases.json` - Base de données des alias
- `~/.alias-manager/aliases.sh` - Fichier shell généré automatiquement
- `~/.zshrc.backup.TIMESTAMP` - Sauvegarde de votre .zshrc original

## Installation

1. Cloner le projet
2. `npm install`
3. `npm link` (pour installation globale)
4. `alias-manager install` (pour intégration ZSH automatique)

## Désinstallation

```bash
# Supprimer l'outil
npm unlink alias-manager

# Supprimer les données (optionnel)
rm -rf ~/.alias-manager

# Nettoyer .zshrc (optionnel - l'outil peut le faire automatiquement)
alias-manager uninstall
```

L'outil respecte votre configuration ZSH existante et ne la remplace jamais.