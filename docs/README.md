# AI Humanist Blog - Documentation Développeur

## 🎯 Vision du Projet

Blog de veille IA révélant les **interconnexions sémantiques** entre technique et éthique via navigation graphique interactive avec **connexions intelligentes basées sur embeddings locaux**. Navigation exploratoire découvrant automatiquement les ponts interdisciplinaires et oppositions subtiles.

## 🏗️ Stack Technique Phase 11

- **Frontend :** React 18 + TypeScript + Tailwind CSS
- **Visualisation :** D3.js force simulation optimisée
- **Build :** Vite + PostCSS  
- **Data :** JSON statique + validation Zod + écriture atomique
- **IA/ML :** Transformers.js (all-MiniLM-L6-v2) pour embeddings 384-D
- **Scripts :** Node.js + tsx avec fiabilisation complète

## 📊 État Actuel Phase 11 P0+P1

✅ **Production Ready Phase 11** - 56 articles, 208 connexions intelligentes  
✅ **Fiabilisation P0** - Écriture atomique + validation Zod + tests intégrés  
✅ **Connexions Intelligentes P1** - Embeddings sémantiques + triple méthodologie  
✅ **Distribution équilibrée** - 56.7% similar_to, 23.6% contradicts, 19.2% builds_on  
✅ **Détection automatique** - XAI↔transparency, oppositions performance↔éthique  

## 🚀 Commandes Essentielles Phase 11

```bash
# Développement
npm run dev                           # http://localhost:5173

# Workflow Phase 11 - Connexions Intelligentes
npm run generate-embeddings           # Génération vecteurs sémantiques (384-D)
npm run enrich-connections            # Triple enrichissement (LLM + thématique + sémantique)  
npm run fix-subtlety                  # Affinement subtilité relationnelle
npm run analyze-bias                  # Analyse biais méthodologiques

# Ajout d'articles (workflow Phase 11)
# 1. Ajouter manuellement articles dans public/data/articles.json
# 2. Puis lancer l'enrichissement automatique :

# Qualité code
npm run lint                          # Vérification (0 erreurs)
npm run build                         # Compilation production
```

## 📁 Architecture Phase 11

```
ai-humanist-blog/
├── 🎨 src/                           # Interface utilisateur (inchangée)
│   ├── components/                   # React composants  
│   ├── hooks/                        # Logique métier
│   ├── utils/                        # Algorithmes
│   └── config/                       # Configuration
├── 🤖 scripts/                       # NOUVEAU - Connexions intelligentes
│   ├── enrichConnections.ts          # 🆕 Triple enrichissement consolidé
│   ├── generateEmbeddings.ts         # 🆕 Embeddings Transformers.js
│   ├── fixRelationSubtlety.ts        # 🆕 Affinement subtilité
│   ├── analyzeConnectionBias.ts      # 🆕 Analyse biais
│   ├── writeFileAtomic.ts            # 🆕 Écriture sécurisée 
│   ├── zodSchemas.ts                 # 🆕 Validation runtime
│   └── old_scripts/                  # 🗃️ Archive (15 scripts Phase 10)
├── 💾 public/data/
│   ├── articles.json                 # 56 articles fiabilisés
│   ├── connections.json              # 🆕 208 connexions intelligentes  
│   └── embeddings.json               # 🆕 Vecteurs sémantiques (384-D)
└── 📚 docs/
    ├── TECHNICAL.md                  # 🆕 Architecture technique Phase 11
    ├── PROGRESS.md                   # 🆕 Historique complet projet
    └── TODO_Phase11.md               # Plan Phase 11 (référence)
```

## 🧠 Fonctionnalités Phase 11

### 🔗 Connexions Intelligentes (P1)
- **Triple méthodologie :** LLM directes (38) + Ponts thématiques (3) + Sémantiques (167)
- **Embeddings locaux :** all-MiniLM-L6-v2, 384 dimensions, multilingue
- **Classification automatique :** 5 types relations avec subtilité contextuelle  
- **Détection fine :** XAI↔transparency, oppositions performance↔éthique
- **Performance :** 208 connexions en 37ms, embeddings en 3.6s

### 🛡️ Fiabilisation (P0)
- **Écriture atomique :** Locks + fichiers temporaires (zéro corruption)
- **Validation Zod :** Schémas stricts runtime sur tous datasets
- **Gestion d'erreurs :** Try-catch généralisés avec fallbacks
- **Tests intégrés :** Validation automatique dans tous scripts
- **Scripts organisés :** 6 actifs, 15 archivés dans old_scripts/

## 📊 Métriques de Qualité

### 🚀 Performance
```json
{
  "generation_embeddings": "3.6s (56 articles)",
  "enrichissement_connexions": "37ms (208 connexions)", 
  "affinement_subtilite": "50ms (49 transformations)",
  "validation_zod": "<10ms par dataset",
  "ecriture_atomique": "<100ms avec locks",
  "interface_chargement": "<300ms (préservé)",
  "navigation_graphique": "temps réel (inchangé)"
}
```

### 🎯 Distribution Connexions
- **similar_to :** 118 (56.7%) - Similarités sémantiques
- **contradicts :** 49 (23.6%) - Oppositions subtiles détectées
- **builds_on :** 40 (19.2%) - Constructions/améliorations  
- **questions :** 1 (0.5%) - Questionnements profonds
- **implements :** 0 (0%) - Implémentations techniques

### 📈 Qualité Sémantique
- ✅ **Représentativité :** XAI↔transparency, ML↔ethics détectées automatiquement
- ✅ **Oppositions subtiles :** automation↔humain, performance↔éthique
- ✅ **Équilibre méthodologique :** 80.3% sémantique + 19.7% LLM directes
- ✅ **Diversité domaines :** 6 domaines, densité optimale (4-6 conn/article)

## 🔧 Guide Développeur

### 1. Configuration Initiale
```bash
git clone <repo>
cd ai-humanist-blog
npm install
```

### 2. Workflow Développement
```bash
# 1. Génération embeddings (si nouveaux articles)
npm run generate-embeddings

# 2. Enrichissement connexions intelligentes
npm run enrich-connections  

# 3. Affinement subtilité (optionnel)
npm run fix-subtlety

# 4. Vérification qualité
npm run analyze-bias
npm run lint

# 5. Test interface
npm run dev
```

### 3. Ajout Nouveaux Articles (Phase 11)
```bash
# 1. Éditer manuellement public/data/articles.json
#    (ajouter nouvel article à la fin du tableau)

# 2. Régénérer embeddings et connexions
npm run generate-embeddings           # Si nouveaux articles
npm run enrich-connections            # Régénération connexions
npm run fix-subtlety                  # Affinement optionnel
```

### 4. Validation et Tests
```bash
# Vérification lint (doit être 0 erreurs)
npm run lint

# Compilation production
npm run build

# Analyse biais connexions
npm run analyze-bias
```

## 📋 Format Données

### Article Standard
```typescript
interface Article {
  id: string                           // art_056, art_057...
  title: string                        // Titre descriptif
  url: string                          // URL source
  summary: string                      // Résumé 2-3 phrases
  primary_domain: PrimaryDomain        // technique|ethique|usage_professionnel|recherche|philosophie|frugalite
  secondary_domains: SecondaryDomain[] // nlp|computer_vision|bias_fairness|transparency...
  concepts: Concept[]                  // Concepts avec types + controverse
  tools_mentioned: Tool[]              // Outils/frameworks mentionnés
  complexity_level: 'beginner'|'intermediate'|'advanced'
  interest_level: number               // 1-5
  // ... autres champs
}
```

### Connexion Intelligente
```typescript
interface Connection {
  source_id: string                    // art_056
  target_id: string                    // art_023  
  type: ConnectionType                 // builds_on|contradicts|implements|questions|similar_to
  strength: number                     // 0.35-1.0
  auto_detected: boolean               // true (sémantique) | false (LLM direct)
  reasoning: string                    // Explication connexion
}
```

## 🎛️ Configuration

### Paramètres Navigation (`src/config/navigation.ts`)
```typescript
export const NAVIGATION_CONFIG = {
  MAX_NODES_DISPLAYED: 40,             # Limite affichage graphique
  MIN_CONNECTION_STRENGTH: 0.3,        # Seuil connexions (abaissé Phase 11)
  MAX_FOCUS_CONNECTIONS: 15,           # Mode focus article
  MAX_OVERVIEW_CONNECTIONS: 30,        # Vue d'ensemble
  // ...
}
```

### Seuils Embeddings (`scripts/enrichConnections.ts`)
```typescript
const SEMANTIC_THRESHOLD = 0.35        # Similarité cosinus minimum
const MAX_SEMANTIC_CONNECTIONS = 4     # Par article sous-connecté
```

## 🧪 Tests et Validation

### Validation Automatique
- **Zod schemas :** 100% données validées avant écriture
- **Écriture atomique :** Tests locks + corruption protection
- **Embeddings :** 56/56 articles traités avec succès
- **Connexions :** 208 générées, distribution cohérente
- **Interface :** Navigation préservée, performance maintenue

### Métriques Attendues
- **Lint :** 0 erreurs, 0 warnings (excludes old_scripts/)
- **Build :** Compilation sans erreur TypeScript
- **Performance :** <300ms chargement initial
- **Connexions :** Distribution équilibrée 50-60% similar_to
- **Embeddings :** Génération <5s pour corpus complet

## 🔄 Evolution et Maintenance

### Phase 11 P2 - Prochaines Étapes
- **Recherche vectorielle :** Migration SQLite + sqlite-vec
- **Interface recherche :** Sémantique + typo-tolérance  
- **API endpoints :** Pour intégrations externes
- **Scaling :** Support >100 articles avec virtualisation

### Maintenance Régulière
```bash
# Validation intégrité (mensuel)
npm run analyze-bias

# Régénération complète (nouveaux articles)
npm run generate-embeddings
npm run enrich-connections
npm run fix-subtlety

# Nettoyage (au besoin)
git clean -fd
npm install
```

## 🎯 Vision Accomplie

**L'AI Humanist Blog Phase 11 P0+P1** révèle automatiquement les interconnexions sémantiques technique ↔ éthique via :

✅ **Intelligence locale :** Embeddings Transformers.js multilingues  
✅ **Analyse subtile :** Détection oppositions performance↔éthique, automation↔humain  
✅ **Architecture fiable :** Écriture atomique + validation Zod + tests intégrés  
✅ **Interface préservée :** Navigation graphique inchangée pour l'utilisateur  
✅ **Qualité production :** Documentation complète + code organisé + lint 0 erreurs  

**Base solide établie pour Phase 11 P2 (recherche vectorielle performante).**