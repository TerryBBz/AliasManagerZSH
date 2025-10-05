export class Validator {
  static validateAliasName(name) {
    if (typeof name !== 'string') {
      throw new Error('Le nom d\'alias doit être une chaîne de caractères');
    }

    if (name.length === 0) {
      throw new Error('Le nom d\'alias ne peut pas être vide');
    }

    // Vérifier les caractères autorisés (lettres, chiffres, tirets, underscore)
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new Error('Le nom d\'alias ne peut contenir que des lettres, chiffres, tirets et underscores');
    }

    // Vérifier que le nom ne commence pas par un chiffre
    if (/^[0-9]/.test(name)) {
      throw new Error('Le nom d\'alias ne peut pas commencer par un chiffre');
    }

    // Vérifier la longueur maximale
    if (name.length > 50) {
      throw new Error('Le nom d\'alias ne peut pas dépasser 50 caractères');
    }

    return true;
  }

  static validateCommand(command) {
    if (typeof command !== 'string') {
      throw new Error('La commande doit être une chaîne de caractères');
    }

    if (command.trim().length === 0) {
      throw new Error('La commande ne peut pas être vide');
    }

    // Vérifier la longueur maximale
    if (command.length > 1000) {
      throw new Error('La commande ne peut pas dépasser 1000 caractères');
    }

    return true;
  }

  static validateGroupName(groupName) {
    if (typeof groupName !== 'string') {
      throw new Error('Le nom de groupe doit être une chaîne de caractères');
    }

    if (groupName.length === 0) {
      throw new Error('Le nom de groupe ne peut pas être vide');
    }

    // Vérifier les caractères autorisés
    if (!/^[a-zA-Z0-9_-]+$/.test(groupName)) {
      throw new Error('Le nom de groupe ne peut contenir que des lettres, chiffres, tirets et underscores');
    }

    // Vérifier la longueur maximale
    if (groupName.length > 30) {
      throw new Error('Le nom de groupe ne peut pas dépasser 30 caractères');
    }

    return true;
  }

  static getSystemCommands() {
    // Liste des commandes système critiques qu'il ne faut pas écraser
    return new Set([
      'cd', 'ls', 'cp', 'mv', 'rm', 'mkdir', 'rmdir', 'pwd', 'cat', 'less', 'more',
      'grep', 'find', 'sort', 'uniq', 'head', 'tail', 'wc', 'diff', 'tar', 'gzip',
      'chmod', 'chown', 'ps', 'kill', 'killall', 'sudo', 'su', 'which', 'whereis',
      'man', 'history', 'export', 'env', 'date', 'cal', 'who', 'whoami', 'id',
      'mount', 'umount', 'df', 'du', 'free', 'top', 'htop', 'ssh', 'scp', 'rsync',
      'curl', 'wget', 'ping', 'traceroute', 'netstat', 'ifconfig', 'iptables',
      'systemctl', 'service', 'crontab', 'at', 'jobs', 'bg', 'fg', 'nohup'
    ]);
  }

  static checkSystemCommandConflict(aliasName) {
    const systemCommands = this.getSystemCommands();
    
    if (systemCommands.has(aliasName)) {
      throw new Error(`'${aliasName}' est une commande système critique. Choisissez un autre nom.`);
    }

    return true;
  }
}