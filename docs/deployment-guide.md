# Guide de Déploiement - AI Humanist Blog

## 🚨 PROBLÈME CRITIQUE : Disparition du fichier .htaccess

### **Symptôme**
Le fichier `.htaccess` disparaît après chaque build, provoquant des erreurs 404 sur les routes React Router en production.

### **Cause Technique Identifiée**

1. **Vite Build Process** : Le build Vite (`npm run build`) recrée complètement le dossier `dist/`
2. **Gitignore** : Le `.gitignore` exclut `dist/` (ligne 8), donc `.htaccess` n'est pas versionné s'il est dans `dist/`
3. **Copie Assets** : Vite copie automatiquement tout le contenu du dossier `public/` vers `dist/` pendant le build

### **Solution Technique Définitive**

**✅ SOLUTION : Placer .htaccess dans `public/.htaccess`**

```bash
# Structure correcte
public/
├── .htaccess          # ← ICI (sera copié automatiquement dans dist/)
├── data/
│   ├── articles.json
│   └── connections.json
└── ...

dist/                  # Généré par build
├── .htaccess          # ← Copié automatiquement depuis public/
├── assets/
├── data/
└── index.html
```

### **Contenu .htaccess Optimisé**

Le fichier `public/.htaccess` contient :
- **Routing SPA** : Redirection de toutes les routes vers `index.html`
- **Cache stratégique** : Assets JS/CSS (1 mois), Images (1 an), JSON (1 jour)
- **Compression GZIP** : Réduction de 70% de la taille des fichiers
- **Sécurité de base** : Headers de protection CSRF/XSS

### **Process de Déploiement Correct**

```bash
# 1. Build (recrée dist/ avec .htaccess depuis public/)
npm run build

# 2. Vérification automatique
ls -la dist/.htaccess  # Doit exister

# 3. Upload vers serveur
# dist/ contient maintenant .htaccess automatiquement
```

### **Validation**

```bash
# Test après build
cd ai-humanist-blog
npm run build
ls -la dist/.htaccess    # ✅ Doit être présent
cat dist/.htaccess       # ✅ Doit contenir les règles Apache
```

## **Pourquoi cette solution est définitive**

1. **Automatique** : Vite copie `public/.htaccess` → `dist/.htaccess` à chaque build
2. **Versionné** : `public/.htaccess` est dans git, pas `dist/.htaccess`
3. **Robuste** : Impossible d'oublier car intégré au process de build
4. **Standard** : C'est la méthode recommandée par Vite pour les fichiers statiques

## **Documentation Technique**

- **Vite Public Directory** : https://vitejs.dev/guide/assets.html#the-public-directory
- **React Router + Apache** : Nécessite réécriture URLs pour SPA
- **Cache Strategy** : Assets avec hash = cache long, HTML = pas de cache

---

**⚠️ IMPORTANT** : Ne jamais placer `.htaccess` directement dans `dist/` car ce dossier est recréé à chaque build.