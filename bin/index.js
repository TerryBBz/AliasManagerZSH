#!/usr/bin/env node

// Redirection vers le vrai CLI pour maintenir la compatibilité
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliPath = join(__dirname, '..', 'src', 'cli.js');

// Importer et exécuter le CLI principal
import(cliPath);