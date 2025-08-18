# Templates JSON Phase 1 - Architecture Triple et Import

## 🎯 Vue d'Ensemble

Templates JSON optimisés pour l'écosystème Phase 1 Architecture Triple : import batch avec workflow automatique complet, validation Zod stricte, écriture atomique sécurisée, et génération intelligente des connexions via ground truth + calibrage adaptatif.

---

## 🤖 Template n8n - Format d'Entrée

### Structure Attendue par le Workflow n8n
```json
{
  "article": {
    "id": "art_001",
    "title": "AI Ethics in Healthcare: A Systematic Review",
    "url": "https://arxiv.org/abs/2024.12345",
    "source_type": "academic",
    "date": "2024-06-15",
    "summary": "This paper examines ethical considerations in AI healthcare applications, focusing on privacy, bias, and transparency. Systematic review of 150 studies reveals key challenges in clinical deployment.",
    "perspective": "Clinical perspective on AI ethics implementation in real-world healthcare settings.",
    "interest_level": 4,
    "primary_domain": "ethique",
    "secondary_domains": ["healthcare", "privacy", "bias_fairness"],
    "concepts": [
      {
        "id": "healthcare_ai_ethics",
        "name": "Healthcare AI Ethics",
        "type": "philosophical",
        "controversy_level": 2
      },
      {
        "id": "clinical_bias",
        "name": "Clinical Bias Detection",
        "type": "technical",
        "controversy_level": 1
      }
    ],
    "tools_mentioned": [
      {
        "id": "tensorflow_medical",
        "name": "TensorFlow Medical",
        "type": "framework",
        "maturity": "stable"
      },
      {
        "id": "fairlearn",
        "name": "Fairlearn",
        "type": "library",
        "maturity": "stable"
      }
    ],
    "author": "Dr. Sarah Johnson",
    "reading_time": 15,
    "complexity_level": "intermediate",
    "connected_articles": [],
    "centrality_score": 0
  },
  "suggested_connections": [
    {
      "target_id": "art_003",
      "type": "builds_on",
      "strength": 0.78,
      "reasoning": "Both discuss healthcare AI ethics, but this paper provides practical implementation guidelines building on the theoretical framework from art_003.",
      "confidence": 0.85
    },
    {
      "target_id": "art_007",
      "type": "questions",
      "strength": 0.65,
      "reasoning": "This systematic review questions some of the optimistic assumptions about AI transparency made in art_007's technical approach.",
      "confidence": 0.72
    },
    {
      "target_id": "art_012",
      "type": "similar_to",
      "strength": 0.71,
      "reasoning": "Both papers address bias detection in AI systems, with similar methodological approaches but different application domains.",
      "confidence": 0.80
    }
  ]
}
```

### 🎨 Types de Connexions LLM n8n

#### `builds_on` - Construction/Amélioration
```json
{
  "target_id": "art_015",
  "type": "builds_on",
  "strength": 0.82,
  "reasoning": "This paper extends the theoretical framework proposed in art_015 by providing concrete implementation strategies for enterprise environments.",
  "confidence": 0.88
}
```

#### `questions` - Questionnement/Critique  
```json
{
  "target_id": "art_008",
  "type": "questions",
  "strength": 0.73,
  "reasoning": "This research challenges the scalability assumptions made in art_008, presenting evidence that current approaches may not work at industrial scale.",
  "confidence": 0.79
}
```

#### `similar_to` - Approche Similaire
```json
{
  "target_id": "art_021",
  "type": "similar_to", 
  "strength": 0.69,
  "reasoning": "Both studies use transformer-based architectures for natural language processing, with comparable performance metrics and evaluation methodologies.",
  "confidence": 0.75
}
```

#### `implements` - Implémentation Pratique
```json
{
  "target_id": "art_005",
  "type": "implements",
  "strength": 0.85,
  "reasoning": "This paper provides a concrete implementation of the algorithmic principles described in art_005, using TensorFlow and demonstrating real-world results.",
  "confidence": 0.91
}
```

#### `contradicts` - Opposition/Controverse
```json
{
  "target_id": "art_033", 
  "type": "contradicts",
  "strength": 0.77,
  "reasoning": "This study presents findings that directly contradict the conclusions of art_033 regarding the effectiveness of current bias mitigation techniques.",
  "confidence": 0.83
}
```

---

## 📝 Template Article Complet - Exemple Technique

### Article Technique - Machine Learning
```json
{
  "article": {
    "id": "art_050",
    "title": "Efficient Attention Mechanisms in Large Language Models",
    "url": "https://arxiv.org/abs/2408.15234",
    "source_type": "academic",
    "date": "2024-08-15",
    "summary": "Novel sparse attention mechanism reducing computational complexity from O(n²) to O(n log n) while maintaining model performance. Tested on GPT-3 scale models with 40% reduction in training time and energy consumption.",
    "perspective": "Technical breakthrough enabling more democratic access to large-scale AI training through computational efficiency.",
    "interest_level": 5,
    "primary_domain": "technique",
    "secondary_domains": ["nlp", "green_ai", "machine_learning"],
    "concepts": [
      {
        "id": "sparse_attention",
        "name": "Sparse Attention Mechanisms",
        "type": "technical",
        "controversy_level": 0
      },
      {
        "id": "computational_efficiency",
        "name": "Computational Efficiency",
        "type": "methodological",
        "controversy_level": 1
      },
      {
        "id": "model_scaling",
        "name": "Model Scaling Laws",
        "type": "technical",
        "controversy_level": 0
      }
    ],
    "tools_mentioned": [
      {
        "id": "pytorch_lightning",
        "name": "PyTorch Lightning",
        "type": "framework",
        "maturity": "stable"
      },
      {
        "id": "wandb",
        "name": "Weights & Biases",
        "type": "platform",
        "maturity": "stable"
      },
      {
        "id": "triton",
        "name": "OpenAI Triton",
        "type": "library",
        "maturity": "beta"
      }
    ],
    "author": "Prof. Maria Chen, Stanford AI Lab",
    "reading_time": 12,
    "complexity_level": "advanced",
    "connected_articles": [],
    "centrality_score": 0
  },
  "suggested_connections": [
    {
      "target_id": "art_023",
      "type": "builds_on",
      "strength": 0.89,
      "reasoning": "This work directly builds upon the theoretical foundations of attention mechanisms established in art_023, providing practical optimizations for large-scale deployment.",
      "confidence": 0.94
    },
    {
      "target_id": "art_041",
      "type": "implements",
      "strength": 0.76,
      "reasoning": "Implements the energy-efficient AI principles discussed in art_041 through concrete algorithmic improvements in attention computation.",
      "confidence": 0.82
    }
  ]
}
```

---

## 🏛️ Template Article Éthique

### Article Éthique - Bias & Fairness
```json
{
  "article": {
    "id": "art_051",
    "title": "Algorithmic Bias in Hiring: A European Regulatory Perspective",
    "url": "https://link.springer.com/article/bias-hiring-2024",
    "source_type": "academic",
    "date": "2024-07-20",
    "summary": "Analysis of algorithmic bias in automated hiring systems across 15 European countries. Study reveals systematic discrimination against minorities and proposes regulatory framework aligned with EU AI Act requirements.",
    "perspective": "Legal and ethical analysis of AI bias with focus on regulatory compliance and social justice implications.",
    "interest_level": 4,
    "primary_domain": "ethique",
    "secondary_domains": ["bias_fairness", "regulation", "industry_4_0"],
    "concepts": [
      {
        "id": "algorithmic_discrimination",
        "name": "Algorithmic Discrimination",
        "type": "philosophical",
        "controversy_level": 3
      },
      {
        "id": "eu_ai_act_compliance",
        "name": "EU AI Act Compliance",
        "type": "methodological",
        "controversy_level": 2
      },
      {
        "id": "hiring_fairness",
        "name": "Hiring Fairness Metrics",
        "type": "technical",
        "controversy_level": 2
      }
    ],
    "tools_mentioned": [
      {
        "id": "fairness_indicators",
        "name": "TensorFlow Fairness Indicators",
        "type": "library",
        "maturity": "stable"
      },
      {
        "id": "aif360",
        "name": "AI Fairness 360",
        "type": "platform",
        "maturity": "stable"
      }
    ],
    "author": "Dr. Elena Rossi, European Centre for Algorithmic Transparency",
    "reading_time": 18,
    "complexity_level": "intermediate",
    "connected_articles": [],
    "centrality_score": 0
  },
  "suggested_connections": [
    {
      "target_id": "art_012",
      "type": "questions",
      "strength": 0.81,
      "reasoning": "This regulatory perspective questions the adequacy of purely technical bias mitigation approaches proposed in art_012, arguing for legal enforcement mechanisms.",
      "confidence": 0.87
    },
    {
      "target_id": "art_034",
      "type": "builds_on",
      "strength": 0.74,
      "reasoning": "Extends the theoretical framework of algorithmic fairness from art_034 by providing concrete regulatory and implementation guidelines for European contexts.",
      "confidence": 0.80
    }
  ]
}
```

---

## 🏢 Template Article Usage Professionnel

### Article Usage Professionnel - Industry Application
```json
{
  "article": {
    "id": "art_052",
    "title": "AI-Driven Supply Chain Optimization: Lessons from Manufacturing Giants",
    "url": "https://harvard-business-review.com/ai-supply-chain-2024",
    "source_type": "blog",
    "date": "2024-06-30",
    "summary": "Case studies from Boeing, Siemens, and Toyota on AI implementation in supply chain management. Reports 15-25% efficiency gains but highlights challenges in change management and workforce adaptation.",
    "perspective": "Business-focused analysis of AI adoption challenges and opportunities in traditional manufacturing industries.",
    "interest_level": 3,
    "primary_domain": "usage_professionnel",
    "secondary_domains": ["industry_4_0", "machine_learning"],
    "concepts": [
      {
        "id": "supply_chain_ai",
        "name": "Supply Chain AI",
        "type": "technical",
        "controversy_level": 0
      },
      {
        "id": "change_management",
        "name": "AI Change Management",
        "type": "methodological",
        "controversy_level": 1
      },
      {
        "id": "workforce_adaptation",
        "name": "Workforce AI Adaptation",
        "type": "philosophical",
        "controversy_level": 2
      }
    ],
    "tools_mentioned": [
      {
        "id": "sap_ai_core",
        "name": "SAP AI Core",
        "type": "platform",
        "maturity": "stable"
      },
      {
        "id": "azure_ml",
        "name": "Azure Machine Learning",
        "type": "platform",
        "maturity": "stable"
      }
    ],
    "author": "Michael Porter, Harvard Business School",
    "reading_time": 10,
    "complexity_level": "beginner",
    "connected_articles": [],
    "centrality_score": 0
  },
  "suggested_connections": [
    {
      "target_id": "art_018",
      "type": "implements",
      "strength": 0.72,
      "reasoning": "Provides real-world implementation examples of the AI optimization techniques theoretically described in art_018, with concrete ROI measurements.",
      "confidence": 0.78
    }
  ]
}
```

---

## 🔬 Template Article Recherche

### Article Recherche - Survey/Meta-Analysis
```json
{
  "article": {
    "id": "art_053",
    "title": "Large Language Models in Scientific Discovery: A Systematic Meta-Analysis",
    "url": "https://nature.com/articles/llm-scientific-discovery-2024",
    "source_type": "academic",
    "date": "2024-05-15",
    "summary": "Meta-analysis of 247 studies on LLM applications in scientific research across physics, chemistry, and biology. Identifies promising applications in hypothesis generation and literature synthesis, while highlighting reproducibility concerns.",
    "perspective": "Methodological assessment of AI's role in accelerating scientific discovery, with emphasis on rigorous evaluation standards.",
    "interest_level": 5,
    "primary_domain": "recherche",
    "secondary_domains": ["nlp", "methodology", "multi_domain"],
    "concepts": [
      {
        "id": "scientific_ai",
        "name": "AI in Scientific Discovery",
        "type": "methodological",
        "controversy_level": 1
      },
      {
        "id": "hypothesis_generation",
        "name": "AI Hypothesis Generation",
        "type": "technical",
        "controversy_level": 2
      },
      {
        "id": "research_reproducibility",
        "name": "Research Reproducibility",
        "type": "methodological",
        "controversy_level": 3
      }
    ],
    "tools_mentioned": [
      {
        "id": "gpt4_science",
        "name": "GPT-4 for Science",
        "type": "model",
        "maturity": "beta"
      },
      {
        "id": "alphafold",
        "name": "AlphaFold",
        "type": "model",
        "maturity": "stable"
      }
    ],
    "author": "Dr. Nobel Laureate, MIT & Stanford Collaboration",
    "reading_time": 25,
    "complexity_level": "advanced",
    "connected_articles": [],
    "centrality_score": 0
  },
  "suggested_connections": [
    {
      "target_id": "art_009",
      "type": "questions",
      "strength": 0.79,
      "reasoning": "This meta-analysis raises important questions about the reproducibility claims made in art_009, presenting contradictory evidence from multiple studies.",
      "confidence": 0.85
    }
  ]
}
```

---

## 🧘 Template Article Philosophie

### Article Philosophie - AI Consciousness
```json
{
  "article": {
    "id": "art_054",
    "title": "Machine Consciousness and the Hard Problem of AI Sentience",
    "url": "https://stanford-philosophy.edu/machine-consciousness-2024",
    "source_type": "academic",
    "date": "2024-04-10",
    "summary": "Philosophical examination of consciousness emergence in large neural networks. Argues that current AI systems may exhibit proto-conscious behaviors but lack subjective experience. Proposes empirical tests for machine sentience.",
    "perspective": "Rigorous philosophical analysis bridging cognitive science and AI research, with implications for AI rights and ethical treatment.",
    "interest_level": 4,
    "primary_domain": "philosophie",
    "secondary_domains": ["reasoning", "meta_cognition", "nlp"],
    "concepts": [
      {
        "id": "machine_consciousness",
        "name": "Machine Consciousness",
        "type": "philosophical",
        "controversy_level": 3
      },
      {
        "id": "ai_sentience",
        "name": "AI Sentience",
        "type": "philosophical",
        "controversy_level": 3
      },
      {
        "id": "hard_problem_ai",
        "name": "Hard Problem of AI",
        "type": "philosophical",
        "controversy_level": 3
      }
    ],
    "tools_mentioned": [
      {
        "id": "consciousness_meter",
        "name": "Consciousness Meter Framework",
        "type": "framework",
        "maturity": "experimental"
      }
    ],
    "author": "Prof. David Chalmers, NYU",
    "reading_time": 22,
    "complexity_level": "advanced",
    "connected_articles": [],
    "centrality_score": 0
  },
  "suggested_connections": [
    {
      "target_id": "art_026",
      "type": "contradicts",
      "strength": 0.84,
      "reasoning": "Directly contradicts the functionalist approach to AI consciousness proposed in art_026, arguing instead for a phenomenological perspective on machine sentience.",
      "confidence": 0.91
    }
  ]
}
```

---

## 🌱 Template Article Frugalité

### Article Frugalité - Green AI
```json
{
  "article": {
    "id": "art_055",
    "title": "Carbon-Aware AI Training: Reducing the Environmental Footprint of Large Models",
    "url": "https://green-ai-conference.org/carbon-aware-training-2024",
    "source_type": "academic",
    "date": "2024-03-25",
    "summary": "Introduces carbon-aware training algorithms that schedule compute-intensive tasks during periods of low-carbon electricity generation. Demonstrates 30-50% reduction in CO2 emissions for large model training without performance loss.",
    "perspective": "Technical approach to environmental sustainability in AI, bridging green computing and machine learning efficiency.",
    "interest_level": 4,
    "primary_domain": "frugalite", 
    "secondary_domains": ["green_ai", "machine_learning", "methodology"],
    "concepts": [
      {
        "id": "carbon_aware_computing",
        "name": "Carbon-Aware Computing",
        "type": "technical",
        "controversy_level": 0
      },
      {
        "id": "sustainable_ai_training",
        "name": "Sustainable AI Training",
        "type": "methodological",
        "controversy_level": 1
      },
      {
        "id": "energy_efficient_ml",
        "name": "Energy-Efficient ML",
        "type": "technical",
        "controversy_level": 0
      }
    ],
    "tools_mentioned": [
      {
        "id": "carbon_tracker",
        "name": "Carbon Tracker",
        "type": "library",
        "maturity": "stable"
      },
      {
        "id": "green_algorithms",
        "name": "Green Algorithms",
        "type": "platform",
        "maturity": "beta"
      }
    ],
    "author": "Dr. Emma Thompson, Green AI Institute",
    "reading_time": 14,
    "complexity_level": "intermediate",
    "connected_articles": [],
    "centrality_score": 0
  },
  "suggested_connections": [
    {
      "target_id": "art_050",
      "type": "similar_to",
      "strength": 0.73,
      "reasoning": "Both papers focus on efficiency improvements in AI training, with complementary approaches - this one through carbon awareness, art_050 through algorithmic optimization.",
      "confidence": 0.79
    }
  ]
}
```

---

## 🔧 Templates pour Développement

### Template NewArticleInput pour Tests
```json
{
  "article": {
    "id": "test_001",
    "title": "Test Article for Development",
    "url": "https://example.com/test-article",
    "source_type": "blog",
    "date": "2024-08-14",
    "summary": "Test article for development and validation purposes. Contains all required fields with valid data structures.",
    "perspective": "Development testing perspective.",
    "interest_level": 3,
    "primary_domain": "technique",
    "secondary_domains": ["methodology"],
    "concepts": [
      {
        "id": "test_concept",
        "name": "Test Concept",
        "type": "technical",
        "controversy_level": 0
      }
    ],
    "tools_mentioned": [
      {
        "id": "test_tool",
        "name": "Test Tool",
        "type": "framework",
        "maturity": "stable"
      }
    ],
    "author": "Test Author",
    "reading_time": 5,
    "complexity_level": "beginner",
    "connected_articles": [],
    "centrality_score": 0
  },
  "suggested_connections": [
    {
      "target_id": "art_007",
      "type": "similar_to",
      "strength": 0.5,
      "reasoning": "Test connection for development purposes.",
      "confidence": 0.6
    }
  ]
}
```

### Template Connexion Minimum
```json
{
  "target_id": "art_XXX",
  "type": "similar_to",
  "strength": 0.7,
  "reasoning": "Brief explanation of the connection between articles.",
  "confidence": 0.8
}
```

---

## 📋 Référence des Champs

### Champs Obligatoires Article
```typescript
// Champs minimums requis
{
  id: string,              // Format: "art_XXX"
  title: string,           // Minimum 10 caractères
  url: string,             // URL valide
  source_type: string,     // "academic" | "blog" | "github" | "arxiv" | "news"
  date: string,            // Format: "YYYY-MM-DD"
  summary: string,         // Minimum 50 caractères
  interest_level: number,  // 1-5
  primary_domain: string,  // Un des 6 domaines
  secondary_domains: [],   // Array de domaines secondaires
  concepts: [],            // Array d'objets Concept
  tools_mentioned: [],     // Array d'objets Tool
  reading_time: number,    // Minutes
  complexity_level: string // "beginner" | "intermediate" | "advanced"
}
```

### Validation Smart Processing
```json
// Le Smart Processing vérifiera :
{
  "url_unique": true,           // URL pas déjà en base
  "title_coherent": true,       // Titre cohérent avec contenu
  "domains_valid": true,        // Domaines dans la liste autorisée
  "concepts_structured": true,  // Concepts avec ID + name + type
  "tools_structured": true,     // Outils avec ID + name + type + maturity
  "connections_resolvable": true // target_id mappables vers articles existants
}
```

---

## 🚀 Pipeline LLM Optimisé - Basé sur Erreurs Réelles Phase 1 ACCOMPLIE

### 🎯 Leçons Apprises - Problèmes Récurrents Résolus
**Erreurs Phase 1 ACCOMPLIE identifiées et corrigées :**
- **IDs dupliqués** : art_056, art_057, art_058 utilisés 2 fois → Solution : Vérification automatique
- **Input malformé** : JSON cassé dans markdown → Solution : Parser récursif avec brace counting
- **Domains invalides** : 'education' → 'recherche' → Solution : Mapping automatique
- **connected_articles pré-remplis** : LLM anticipe connexions → Solution : Laisser vides (rempli par pipeline)
- **Process.cwd() duplication** : Chemins doublés dans écriture → Solution : Configuration centralisée

### 🧠 Template LLM Robuste - Anti-Erreurs
```json
{
  "article": {
    "id": "art_XXX",                    // ⚠️ CRITIQUE: Vérifier unicité vs articles existants
    "title": "Titre Descriptif Précis",
    "url": "https://source.valide.com",
    "source_type": "academic",          // UNIQUEMENT: academic|blog|github|arxiv|news
    "date": "2024-MM-DD",              // ⚠️ FORMAT STRICT: YYYY-MM-DD
    "summary": "Minimum 50 caractères de résumé contextuel détaillé.",
    "perspective": "Perspective analytique claire.",
    "interest_level": 3,               // ⚠️ UNIQUEMENT 1-5 entier
    "primary_domain": "technique",     // ⚠️ MAPPING OBLIGATOIRE (voir ci-dessous)
    "secondary_domains": ["nlp"],      // Array strings, domains autorisés
    "concepts": [                      // ⚠️ ARRAY REQUIS même si vide
      {
        "id": "concept_id_unique",     // Snake_case obligatoire
        "name": "Nom Concept",
        "type": "technical",           // technical|philosophical|methodological
        "controversy_level": 1         // 0-3 entier uniquement
      }
    ],
    "tools_mentioned": [               // ⚠️ ARRAY REQUIS même si vide
      {
        "id": "tool_id_unique",
        "name": "Nom Tool",
        "type": "framework",           // framework|library|platform|model
        "maturity": "stable"           // experimental|beta|stable
      }
    ],
    "author": "Auteur Complet",
    "reading_time": 15,                // Minutes entier
    "complexity_level": "intermediate", // beginner|intermediate|advanced
    "connected_articles": [],          // ⚠️ TOUJOURS VIDE - Pipeline remplit automatiquement
    "centrality_score": 0              // ⚠️ TOUJOURS 0 - Pipeline calcule automatiquement
  },
  "suggested_connections": [           // ⚠️ OPTIONNEL mais recommandé pour qualité
    {
      "target_id": "art_XXX",          // ⚠️ VÉRIFIER existence article cible
      "type": "builds_on",             // builds_on|contradicts|implements|questions|similar_to
      "strength": 0.75,                // ⚠️ 0.25-1.0 float uniquement
      "reasoning": "Explication détaillée de la connexion conceptuelle entre les articles.",
      "confidence": 0.85               // ⚠️ 0.0-1.0 float uniquement
    }
  ]
}
```

### 🗂️ Mapping Domaines - Anti-Erreurs
```typescript
// Mapping automatique corrigeant erreurs courantes
const DOMAIN_MAPPING_AUTO = {
  // Erreurs fréquentes → Corrections
  'education': 'recherche',           // ❌ education n'existe pas
  'society': 'ethique',               // ❌ society n'existe pas  
  'industry_4_0': 'usage_professionnel', // ❌ industry_4_0 n'existe pas
  'green_ai': 'frugalite',            // ❌ green_ai n'existe pas
  'deep_learning': 'technique',       // ❌ deep_learning n'existe pas
  'regulation': 'ethique',            // ❌ regulation n'existe pas
  
  // Domaines valides (Phase 1 ACCOMPLIE)
  'technique': 'technique',           // ✅ Valide
  'ethique': 'ethique',              // ✅ Valide
  'usage_professionnel': 'usage_professionnel', // ✅ Valide
  'recherche': 'recherche',          // ✅ Valide
  'philosophie': 'philosophie',      // ✅ Valide
  'frugalite': 'frugalite'          // ✅ Valide
}
```

### 🛡️ Validation Zod Intégrée - Templates Robustes
```typescript
// Schéma validation automatique (intégré dans tous templates)
const ArticleSchema = z.object({
  id: z.string().regex(/^art_\d{3}$/),           // art_001, art_002, etc.
  title: z.string().min(10),                     // Minimum 10 caractères
  url: z.string().url(),                         // URL valide obligatoire
  primary_domain: z.enum(['technique', 'ethique', 'usage_professionnel', 'recherche', 'philosophie', 'frugalite']),
  interest_level: z.number().int().min(1).max(5), // 1-5 entier strict
  connected_articles: z.array(z.string()).length(0), // ⚠️ TOUJOURS VIDE
  centrality_score: z.literal(0),                // ⚠️ TOUJOURS 0
  // ... autres validations strictes
});

// Validation connexions suggérées
const SuggestedConnectionSchema = z.object({
  target_id: z.string().regex(/^art_\d{3}$/),
  type: z.enum(['builds_on', 'contradicts', 'implements', 'questions', 'similar_to']),
  strength: z.number().min(0.25).max(1.0),      // Range strict 0.25-1.0
  confidence: z.number().min(0.0).max(1.0),     // Range strict 0.0-1.0
});
```

## 🎯 Guide d'Usage Phase 1 ACCOMPLIE

### Pour n8n Workflow Complet
1. **Créer fichier .md** dans `input_data/` avec blocs JSON validés
2. **Utiliser template LLM robuste** ci-dessus pour chaque article  
3. **Lancer batch import** : `npm run batch-import -- --input input_data/articles.md`
4. **Workflow automatique** : parsing récursif → validation Zod → backup → import → embeddings → connexions → validation

### Pour Ajout Article Individuel  
1. **Créer fichier JSON** avec template anti-erreurs selon domaine
2. **Remplir tous champs obligatoires** avec validation
3. **Lancer ajout sécurisé** : `npm run add-complete -- --input article.json`
4. **Workflow automatique** : validation → backup → import → Phase 1 ACCOMPLIE complet

### Pour Tests et Développement
1. **Template test minimal** avec validation Zod
2. **Utiliser scripts Phase 1 ACCOMPLIE** : 
   - `npm run generate-embeddings` (si nouveaux articles)
   - `npm run enrich-connections` (architecture triple)
   - `npm run validate-triple` (validation empirique)

### Workflow Phase 1 ACCOMPLIE vs Versions Précédentes
**Phase 1 ACCOMPLIE (Actuel - Robuste)** :
- ✅ **Parser récursif** : JSON malformé → Correction automatique brace counting
- ✅ **Mapping domaines** : Correction automatique erreurs fréquentes
- ✅ **Validation Zod** : Runtime strict avec messages erreurs clairs
- ✅ **Configuration centralisée** : scripts/config/paths.ts évite duplication
- ✅ **Tests sécurisés** : TestRunner environnement isolé
- ✅ **Workflow CQ** : Guide 381 lignes pour modifications majeures

**Versions Précédentes (Obsolètes)** :
- ❌ Input malformé cassait le pipeline
- ❌ IDs dupliqués non détectés
- ❌ Domaines invalides acceptés
- ❌ Process.cwd() duplication corruption
- ❌ Pas de tests sécurisés

---

---

## 📝 Template Liens Annotés → JSON Robuste

### 🔗 De Liens Simples vers Articles Structurés
```markdown
// INPUT : Liste liens annotés (format humain)
- https://arxiv.org/abs/2024.12345 - "Efficient Attention Mechanisms" - TECHNIQUE - Optimisation algorithmes attention, réduction O(n²) → O(n log n)
- https://link.springer.com/article/bias-2024 - "Algorithmic Bias in Hiring" - ETHIQUE - Discrimination automatisée recrutement, régulation EU AI Act
- https://hbr.org/2024/supply-chain-ai - "Supply Chain AI Cases" - USAGE_PROFESSIONNEL - Cas usage Boeing/Toyota, ROI 15-25%

// OUTPUT : JSON structuré complet (automatique)
```

### 🤖 Template Transformation Automatique
```json
{
  "article": {
    "id": "art_XXX",                    // ⚠️ Auto-incrémenté par pipeline
    "title": "{{ EXTRACT_FROM_ANNOTATION }}", // "Efficient Attention Mechanisms"
    "url": "{{ URL }}",                 // https://arxiv.org/abs/2024.12345
    "source_type": "{{ AUTO_DETECT }}",// academic (arxiv) | blog (hbr) | academic (springer)
    "date": "{{ FETCH_OR_CURRENT }}",  // Extraction automatique si possible
    "summary": "{{ LLM_GENERATE_FROM_ANNOTATION }}", // Expansion annotation → résumé
    "perspective": "{{ LLM_ANALYZE_CONTEXT }}", // Perspective analytique déduite
    "interest_level": "{{ AUTO_CALCULATE }}", // Basé sur source + annotation
    "primary_domain": "{{ ANNOTATION_DOMAIN }}", // TECHNIQUE → technique
    "secondary_domains": ["{{ LLM_DEDUCE }}"], // Déduit du contenu/annotation
    "concepts": [{{ LLM_EXTRACT_CONCEPTS }}], // Extraction automatique concepts
    "tools_mentioned": [{{ LLM_EXTRACT_TOOLS }}], // Si outils détectés
    "author": "{{ FETCH_OR_UNKNOWN }}",
    "reading_time": "{{ ESTIMATE }}",   // Estimation basée type source
    "complexity_level": "{{ AUTO_DEDUCE }}", // arxiv → advanced, hbr → beginner
    "connected_articles": [],           // ⚠️ TOUJOURS VIDE
    "centrality_score": 0               // ⚠️ TOUJOURS 0
  },
  "suggested_connections": [            // ⚠️ Connexions intelligentes basées articles existants
    {
      "target_id": "{{ SEMANTIC_SEARCH }}", // Recherche similarité dans base
      "type": "{{ DEDUCE_RELATION_TYPE }}", // Analyse contextuelle
      "strength": "{{ CALCULATE_SEMANTIC }}", // Similarité embeddings
      "reasoning": "{{ LLM_EXPLAIN_CONNECTION }}", // Explication automatique
      "confidence": "{{ CONFIDENCE_SCORE }}" // Score confiance prédiction
    }
  ]
}
```

### 🎯 Exemple Concret - Liens → JSON
```markdown
INPUT:
- https://arxiv.org/abs/2024.08123 - "Sparse Attention for LLMs" - TECHNIQUE - Réduction complexité attention O(n²)→O(n log n), économie énergie 40%
```

```json
OUTPUT:
{
  "article": {
    "id": "art_113",
    "title": "Sparse Attention for Large Language Models",
    "url": "https://arxiv.org/abs/2024.08123",
    "source_type": "academic",
    "date": "2024-08-15",
    "summary": "Novel sparse attention mechanism reducing computational complexity from O(n²) to O(n log n) while maintaining model performance. Demonstrates 40% energy reduction in large-scale language model training.",
    "perspective": "Technical breakthrough enabling more sustainable and accessible large language model training through computational efficiency.",
    "interest_level": 4,
    "primary_domain": "technique",
    "secondary_domains": ["frugalite", "nlp"],
    "concepts": [
      {
        "id": "sparse_attention_llm",
        "name": "Sparse Attention for LLMs",
        "type": "technical",
        "controversy_level": 0
      }
    ],
    "tools_mentioned": [],
    "author": "Research Team",
    "reading_time": 12,
    "complexity_level": "advanced",
    "connected_articles": [],
    "centrality_score": 0
  },
  "suggested_connections": [
    {
      "target_id": "art_050",
      "type": "similar_to", 
      "strength": 0.85,
      "reasoning": "Both papers focus on attention mechanism optimization in large language models, with complementary approaches to computational efficiency.",
      "confidence": 0.90
    }
  ]
}
```

---

**🚀 Templates Phase 1 ACCOMPLIE optimisés pour workflow n8n sécurisé avec génération automatique de connexions intelligentes via Transformers.js !**