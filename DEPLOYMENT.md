# Guide de Déploiement - Blog IA Humaniste

## 🎯 Objectif
Déployer le blog sur le domaine **blog-ia.lecaveaudelopus.com** hébergé chez OVH.

## 📊 État Actuel du Projet
- ✅ **40 articles** importés et validés (21 initiaux + 19 nouveaux)
- ✅ **780 connexions automatiques** générées entre articles
- ✅ **Build de production** optimisé (3.3MB total)
- ✅ **Application stable** - zéro bug critique

## 📁 Fichiers de Déploiement
Contenu du dossier `dist/` à uploader :

```
dist/
├── index.html              # Page principale (0.77 kB)
├── assets/
│   ├── index-fzsi6jCQ.css  # Styles (3.1MB - incluant Tailwind)
│   ├── index-o6_H_0rl.js   # Code principal (45.44 kB)
│   ├── vendor-nf7bT_Uh.js  # React/libs (140.87 kB)
│   └── d3-DkhH6sKg.js      # D3.js graphique (24.89 kB)
└── data/
    ├── articles.json       # 40 articles de production
    └── connections.json    # 780 connexions
```

## 🌐 Configuration OVH - Étapes

### 1. Sous-domaine sur OVH
1. **Se connecter** à l'espace client OVH
2. **Aller dans** : Hébergements → lecaveaudelopus.com → Sous-domaines
3. **Créer un sous-domaine :**
   - Nom : `blog-ia`
   - Dossier cible : `blog-ia/` (nouveau dossier)
   - SSL : ✅ Activer (Let's Encrypt)

### 2. Upload FTP/SFTP
**Méthode recommandée : FileZilla ou WinSCP**

```
Serveur FTP : ftp.lecaveaudelopus.com (ou IP OVH)
Utilisateur : [votre login FTP OVH]
Mot de passe : [votre mot de passe FTP]
Port : 21 (FTP) ou 22 (SFTP)
```

**Structure à créer :**
```
/blog-ia/          (dossier racine du sous-domaine)
├── index.html     (copier depuis dist/)
├── assets/        (copier tout le dossier depuis dist/)
└── data/          (copier tout le dossier depuis dist/)
```

### 3. Permissions et Configuration
- **Permissions** : 755 pour les dossiers, 644 pour les fichiers
- **Index** : index.html sera servi automatiquement
- **HTTPS** : Se configure automatiquement avec Let's Encrypt

## 🚀 Instructions de Déploiement

### Option A : Upload Manuel (FileZilla)
1. **Télécharger FileZilla** : https://filezilla-project.org/
2. **Se connecter** avec les identifiants FTP OVH
3. **Naviguer** vers le dossier racine de votre hébergement
4. **Créer** le dossier `blog-ia/`
5. **Uploader** tout le contenu de `dist/` vers `blog-ia/`

### Option B : Upload via WinSCP (Windows)
1. **Télécharger WinSCP** : https://winscp.net/
2. **Protocole** : SFTP (plus sécurisé) ou FTP
3. **Upload** : Glisser-déposer le contenu de `dist/`

### Option C : Ligne de Commande (si SSH activé)
```bash
# Si vous avez accès SSH sur votre hébergement OVH
scp -r dist/* user@server:/path/to/blog-ia/
```

## 🔧 Configuration Technique

### Fichiers Statiques
- **Type** : Application React/Vite statique
- **Serveur requis** : Nginx/Apache (standard OVH)
- **Base de données** : Aucune (JSON statique)
- **Node.js** : Non requis en production

### Réglages .htaccess (Apache)
Créer `/blog-ia/.htaccess` si nécessaire :
```apache
# Forcer HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# SPA Routing
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Cache headers
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType application/json "access plus 1 day"
</IfModule>
```

## ✅ Tests Post-Déploiement

### 1. Vérifications Fonctionnelles
- [ ] **URL principale** : https://blog-ia.lecaveaudelopus.com
- [ ] **Chargement** : Page se charge sans erreur
- [ ] **Navigation tags** : Filtrage fonctionne
- [ ] **Graphique D3** : Visualisation s'affiche
- [ ] **Recherche** : Barre de recherche opérationnelle
- [ ] **Articles** : 40 articles visibles
- [ ] **Responsive** : Affichage mobile correct

### 2. Tests Performance
- [ ] **Lighthouse** : Score > 90
- [ ] **Temps de chargement** : < 3 secondes
- [ ] **Taille totale** : ~3.3MB (acceptable)
- [ ] **HTTPS** : Certificat SSL actif

### 3. Tests de Contenu
- [ ] **Articles récents** : 19 nouveaux articles visibles
- [ ] **Connexions** : Graphique avec 780 liens
- [ ] **Domaines** : 6 domaines primaires actifs
- [ ] **Recherche** : Résultats pertinents

## 🐛 Dépannage Courant

### Problème : Page blanche
- **Vérifier** : Tous les fichiers uploadés
- **Vérifier** : Permissions (755/644)
- **Console** : F12 → Erreurs JavaScript

### Problème : CSS/JS non chargés
- **Vérifier** : Dossier `assets/` complet
- **Vérifier** : Chemins relatifs corrects
- **Cache** : Vider cache navigateur (Ctrl+F5)

### Problème : Données manquantes
- **Vérifier** : Dossier `data/` uploadé
- **Vérifier** : `articles.json` et `connections.json` présents
- **Taille** : Fichiers non corrompus

## 📞 Support
- **OVH** : Guide hébergement web
- **FileZilla** : Documentation FTP
- **SSL** : Let's Encrypt se configure automatiquement

## 🎉 Résultat Attendu
Une fois déployé, le blog sera accessible à :
**https://blog-ia.lecaveaudelopus.com**

Avec navigation complète, 40 articles, graphique interactif et recherche intelligente.

---

**Dernière mise à jour :** 13 août 2025  
**Taille du build :** 3.3MB  
**Articles :** 40 (production ready)  
**Connexions :** 780 (générées automatiquement)