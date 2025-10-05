# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AliasManager is a command-line tool for managing ZSH aliases with Git synchronization across multiple machines. It organizes aliases into groups, supports enable/disable functionality, and automatically synchronizes changes via Git.

## Architecture

### Core Classes
- **AliasManager** (`src/alias-manager.js`) - Main business logic for CRUD operations on aliases
- **DataManager** (`src/data-manager.js`) - Handles data persistence, file generation, and Git synchronization
- **Validator** (`src/validator.js`) - Input validation with system command conflict detection
- **Installer** (`src/installer.js`) - ZSH integration and setup utilities

### Data Flow
1. Commands enter through CLI (`src/cli.js`) 
2. Business logic handled by AliasManager
3. Data persisted via DataManager to `data/aliases.json`
4. Shell aliases generated to `data/aliases.sh`
5. Changes auto-synchronized to `configs/sync.json` and pushed to Git

### File Structure
- `data/aliases.json` - Local database (not version controlled)
- `data/aliases.sh` - Generated shell script sourced by .zshrc
- `configs/sync.json` - Git-synchronized alias data for cross-machine sync
- `configs/zshrc-template.txt` - Template .zshrc with user configurations

## Development Commands

- `npm start` - Run CLI interface
- `node src/cli.js` - Direct CLI execution
- `npm test` - Run tests (currently empty placeholder)

## Key Features

### Git Synchronization Workflow
- All alias modifications automatically update `configs/sync.json`
- Auto-commit and push to Git with descriptive messages
- `alias-manager sync` pulls changes and applies them locally

### Group-Based Organization
- Aliases organized into groups (default, git, mysql, outils, etc.)
- Groups can be enabled/disabled as units
- Each alias has `cmd`, `disabled`, and optional `description` properties

### ZSH Integration
- Generated `data/aliases.sh` is sourced in .zshrc
- Installation adds sourcing line to .zshrc with backup
- Template system preserves user's existing .zshrc configuration

### Security & Validation
- System command conflict detection (prevents overriding cd, ls, rm, etc.)
- Input validation for alias names, commands, and group names
- Character restrictions and length limits enforced

## Import System

The tool can import existing aliases from .zshrc files:
- Parses existing alias declarations
- Automatically categorizes into groups
- Preserves descriptions from comments
- Preview mode available before actual import