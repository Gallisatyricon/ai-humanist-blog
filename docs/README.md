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

## 📊 État Actuel Phase 1 - Architecture Triple

✅ **Production Ready Phase 1** - 65 articles (art_001→art_112), 244 connexions intelligentes  
✅ **Fiabilisation complète** - Écriture atomique + validation Zod + locks anti-corruption  
✅ **Architecture Triple** - Hard + Manual + Semantic avec calibrage adaptatif  
✅ **Score qualité 83/100** - Validation empirique, precision 70%, F1-Score 65%  
✅ **100% exploitation** - Toutes validations manuelles utilisées efficacement  

## 🚀 Commandes Essentielles Phase 1

```bash
# Développement
npm run dev                           # http://localhost:5173

# Workflow Architecture Triple - Complet (setup initial)
npm run generate-embeddings           # 1. Génération vecteurs sémantiques (384-D)
npm run analyze-ground-truth          # 2. Analyse patterns validations manuelles  
npm run calibrate-thresholds          # 3. Calibrage seuils adaptatifs
npm run enhance-ground-truth          # 4. Architecture triple (PRINCIPAL)
npm run fix-subtlety                  # 5. Affinement relationnel (optionnel - non implémenté)
npm run validate-triple               # 6. Validation empirique qualité

# Workflow Simplifié (ajout nouveaux articles)
npm run generate-embeddings           # 1. Embeddings nouveaux articles
npm run enrich-connections            # 2. Architecture triple (alias enhance-ground-truth)

# Import articles
npm run batch-import                  # Import batch avec workflow automatique
npm run add-complete                  # Import article individuel enrichi

# Qualité code
npm run lint                          # Vérification (0 erreurs)
npm run build                         # Compilation production
```

## 📁 Architecture Phase 1

```
ai-humanist-blog/
├── 🎨 src/                           # Interface utilisateur React 18
│   ├── components/                   # Composants React + D3.js  
│   ├── hooks/                        # Hooks logique métier
│   ├── utils/                        # Algorithmes + utilitaires
│   └── config/                       # Configuration navigation
├── 🤖 scripts/                       # Architecture Triple (voir scripts/README.md)
│   ├── enhanceGroundTruth.ts         # 🎯 Architecture triple principale
│   ├── fixRelationSubtlety.ts        # Affinage subtilité ponts interdisciplinaires
│   ├── optimizeReadability.ts        # Optimisation lisibilité graphique
│   ├── generateEmbeddings.ts         # Embeddings Transformers.js (384-D)
│   ├── analyzeGroundTruth.ts         # Analyse patterns validations
│   ├── calibrateSemanticThresholds.ts # Calibrage seuils adaptatifs
│   ├── validateTripleArchitecture.ts # Validation empirique qualité
│   ├── batchImportArticles.ts        # Import batch + workflow
│   ├── addArticleComplete.ts         # Import article individuel
│   ├── testRunner.ts                 # Tests sécurisés environnement isolé
│   ├── writeFileAtomic.ts            # Infrastructure écriture atomique
│   ├── zodSchemas.ts                 # Validation runtime Zod
│   └── config/paths.ts               # Configuration centralisée chemins
├── 💾 public/data/
│   ├── articles.json                 # 65 articles validés (art_001→art_112)
│   ├── connections.json              # 244 connexions triple architecture  
│   └── embeddings.json               # Vecteurs sémantiques 384-D
├── 📁 input_data/                    # Données validations manuelles
├── 📚 docs/                          # Documentation complète
│   ├── README.md                     # Documentation développeur (ce fichier)
│   ├── CONTROLE_QUALITE.md           # Guide workflow sécurisé
│   ├── technical.md                  # Architecture technique détaillée
│   ├── progress.md                   # Historique complet évolutions
│   └── TEMPLATES.md                  # Templates JSON intégrations
├── 🗃️ .archives/                     # Archives historiques projet
│   ├── scripts-phase10/              # Scripts phases précédentes  
│   ├── scripts-phase11/              # Scripts développement consolidés
│   └── exports-legacy/               # Exports historiques
└── 💾 .backups/                      # Sauvegardes automatiques (voir CONTROLE_QUALITE.md)
```

## 🧠 Fonctionnalités Phase 1

### 🏗️ Architecture Triple Ground Truth
- **Hiérarchie intelligente :** Hard (38) + Manual (99) + Semantic (71) = 244 connexions
- **Exploitation 100%** des validations manuelles disponibles 
- **Calibrage adaptatif :** Seuils par paires domaines (technique↔éthique: 0.32)
- **Score qualité 83/100 :** Précision 70%, F1-Score 65%, production ready
- **5 types détectés :** builds_on, contradicts, implements, questions, similar_to

### 🤖 Intelligence Sémantique
- **Embeddings locaux :** all-MiniLM-L6-v2, 384 dimensions, multilingue
- **Détection automatique :** Conflictualité, ponts domaines, approfondissements  
- **Performance :** Embeddings 65 articles en <5s, connexions en temps réel
- **Équilibrage types :** Distribution diverse auto_detected vs validations manuelles

### 🛡️ Infrastructure Robuste
- **Écriture atomique :** Locks proper-lockfile + protection corruption
- **Validation Zod :** Schémas stricts runtime sur tous datasets
- **Configuration centralisée :** Évite duplication chemins process.cwd()
- **Scripts consolidés :** 11 fonctionnels + documentation complète
- **Workflows documentés :** Complet (6 étapes) vs Simplifié (2 étapes)

## 📊 Métriques de Qualité

### 🚀 Performance Phase 1
```json
{
  "articles_totaux": "65 (art_001→art_112)",
  "connexions_totales": "244 (Hard: 38, Manual: 99, Semantic: 71)",
  "generation_embeddings": "<5s (65 articles, 384-D)",
  "architecture_triple": "temps réel avec calibrage", 
  "validation_empirique": "score 83/100, F1: 65%",
  "ecriture_atomique": "<100ms avec proper-lockfile",
  "interface_chargement": "<300ms (préservée)",
  "navigation_graphique": "temps réel D3.js (inchangée)"
}
```

### 🎯 Architecture Triple Répartition
- **Hard connections :** 38 (18%) - connected_articles validées, strength: 0.9
- **Manual validations :** 99 (48%) - suggested_connections exploitées  
- **Semantic auto :** 71 (34%) - auto_detected avec calibrage adaptatif
- **Couverture articles :** 89% avec min 2 connexions
- **Ponts inter-domaines :** technique↔éthique détectés automatiquement

### 📈 Validation Empirique
- ✅ **Ground truth exploité :** 100% validations manuelles utilisées
- ✅ **Calibrage réussi :** Seuils adaptatifs par paires domaines
- ✅ **Score production :** 83/100 (seuil 70/100 validé)
- ✅ **Diversité types :** 5 types équilibrés avec auto_detected flag
- ✅ **Précision estimée :** 70% avec recall 65%

## 🔧 Guide Développeur

### 1. Configuration Initiale
```bash
git clone <repo>
cd ai-humanist-blog
npm install
```

### 2. Workflow Développement Architecture Triple
```bash
# Workflow Complet (setup initial + analyse qualité)
npm run generate-embeddings           # 1. Génération vecteurs 384-D
npm run analyze-ground-truth          # 2. Analyse patterns validations  
npm run calibrate-thresholds          # 3. Calibrage seuils adaptatifs
npm run enhance-ground-truth          # 4. Architecture triple (PRINCIPAL)
npm run fix-subtlety                  # 5. Affinage subtilité ponts interdisciplinaires
npm run optimize-readability          # 6. Optimisation lisibilité graphique
npm run validate-triple               # 7. Validation empirique

# Workflow Simplifié (ajout routine articles)
npm run generate-embeddings           # 1. Embeddings nouveaux articles
npm run enrich-connections            # 2. Architecture triple directement

# Vérification qualité
npm run lint && npm run build         # Code + compilation
npm run dev                           # Test interface
```

### 3. Import Nouveaux Articles Phase 1
```bash
# Option A: Import batch automatique (recommandé)
# 1. Préparer fichier input_data/YYYY_articles.md (format JSON délimité)
npm run batch-import                  # Import + workflow automatique complet

# Option B: Import manuel individuel
npm run add-complete                  # Script interactif ajout article

# Option C: Ajout manuel direct
# 1. Éditer public/data/articles.json (ajouter à la fin)
# 2. Workflow simplifié:
npm run generate-embeddings && npm run enrich-connections
```

### 4. Validation et Tests Phase 1
```bash
# Validation architecture triple complète
npm run validate-triple               # Score global, métriques empiriques

# Vérification qualité code (doit être 0 erreurs)
npm run lint && npm run build

# Tests manuels interface
npm run dev                           # Vérifier navigation graphique
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

### Connexion Architecture Triple
```typescript
interface Connection {
  source_id: string                    // art_104
  target_id: string                    // art_023  
  type: ConnectionType                 // builds_on|contradicts|implements|questions|similar_to
  strength: number                     // 0.25-1.0 (calibré par domaine)
  auto_detected: boolean               // false (Hard/Manual) | true (Semantic)
  reasoning: string                    // Explication contextuelle
  source: 'hard_connection'|'manual_validation'|'semantic_auto' // Traçabilité
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

### Architecture Triple (`scripts/enhanceGroundTruth.ts`)
```typescript
// Seuils calibrés par paires domaines (issus de calibrateSemanticThresholds.ts)
const DOMAIN_THRESHOLDS = {
  'technique-ethique': 0.32,           // Inter-domaine : plus généreux
  'technique-technique': 0.45,         // Intra-domaine : plus strict
  // ... calibrage adaptatif complet par scripts/calibrateSemanticThresholds.ts
}

const MAX_CONNECTIONS_PER_ARTICLE = 6  // Équilibrage charge cognitive
```

## 🧪 Tests et Validation

### Validation Automatique Phase 1
- **Zod schemas :** 100% données validées avant écriture atomique
- **Proper-lockfile :** Protection corruption avec timeouts configurables
- **Embeddings :** 65/65 articles traités (384-D, all-MiniLM-L6-v2)
- **Architecture triple :** 244 connexions (38+99+71), score 83/100
- **Interface :** Navigation D3.js préservée, performance maintenue

### Métriques Attendues Production
- **Lint + Build :** 0 erreurs TypeScript (excludes old_scripts/)
- **Score validation :** ≥70/100 (83/100 atteint)
- **Performance :** <300ms chargement, <5s génération embeddings
- **Architecture triple :** Équilibrage Hard (18%) + Manual (48%) + Semantic (34%)
- **Couverture articles :** ≥80% avec min 2 connexions (89% atteint)

## 🔄 Evolution et Maintenance

### Phase 2 - Prochaines Étapes
- **Recherche vectorielle :** Exploitation 244 connexions + embeddings 384-D
- **Interface recherche :** Sémantique avec dashboard qualité
- **API complète :** Endpoints pour intégrations externes
- **Scaling :** Support >100 articles avec virtualisation progressive

### Maintenance Régulière Phase 1
```bash
# Validation intégrité architecture triple (mensuel)
npm run validate-triple

# Régénération complète (nouveaux articles batch)
npm run batch-import                  # Option recommandée
# OU workflow manuel:
npm run generate-embeddings && npm run enrich-connections

# Validation qualité
npm run lint && npm run build

# Nettoyage développement
git clean -fd && npm install
```

## 🎯 Vision Accomplie Phase 1

**L'AI Humanist Blog Phase 1 - Architecture Triple Ground Truth** exploite maximalement les validations humaines pour révéler automatiquement les interconnexions technique ↔ éthique :

✅ **Ground Truth exploité :** 100% des 99 validations manuelles utilisées efficacement  
✅ **Architecture Triple :** Hiérarchie Hard + Manual + Semantic avec calibrage adaptatif  
✅ **Score production 83/100 :** Validation empirique, précision 70%, F1-Score 65%  
✅ **Infrastructure robuste :** Écriture atomique + Zod + 11 scripts documentés  
✅ **Navigation préservée :** Interface D3.js inchangée, performance maintenue  
✅ **244 connexions intelligentes :** Équilibrage optimal (18% + 48% + 34%)  

**Fondation solide pour Phase 2 : recherche vectorielle exploitant les 244 connexions.**