import { z } from 'zod'

/**
 * Schémas Zod pour validation runtime stricte
 * Prévient corruption par données n8n malformées
 */

// Types de base
export const PrimaryDomainSchema = z.enum([
  'technique', 
  'ethique', 
  'usage_professionnel', 
  'recherche', 
  'philosophie', 
  'frugalite'
])

export const SecondaryDomainSchema = z.enum([
  'deep_learning',
  'nlp', 
  'computer_vision',
  'robotics',
  'bias_fairness',
  'privacy',
  'transparency',
  'accountability',
  'healthcare',
  'education',
  'finance',
  'industry_4_0',
  'green_ai',
  'edge_computing',
  'regulation',
  'society'
])

export const SourceTypeSchema = z.enum(['github', 'arxiv', 'blog', 'academic', 'news'])
export const InterestLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
export const ComplexityLevelSchema = z.enum(['beginner', 'intermediate', 'advanced'])
export const ConnectionTypeSchema = z.enum(['builds_on', 'contradicts', 'implements', 'questions', 'similar_to'])
export const ToolMaturitySchema = z.enum(['experimental', 'beta', 'stable', 'deprecated'])
export const ConceptTypeSchema = z.enum(['technical', 'philosophical', 'methodological'])
export const ToolTypeSchema = z.enum(['framework', 'library', 'platform', 'model'])

// Structures complexes
export const ConceptSchema = z.object({
  id: z.string().min(1, "ID concept obligatoire"),
  name: z.string().min(1, "Nom concept obligatoire"),
  type: ConceptTypeSchema,
  controversy_level: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
})

export const ToolSchema = z.object({
  id: z.string().min(1, "ID outil obligatoire"),
  name: z.string().min(1, "Nom outil obligatoire"),
  type: ToolTypeSchema,
  maturity: ToolMaturitySchema
})

export const SuggestedConnectionSchema = z.object({
  target_id: z.string().min(1, "Target ID obligatoire"),
  type: ConnectionTypeSchema,
  strength: z.number().min(0).max(1, "Force entre 0 et 1"),
  reasoning: z.string().min(1, "Raisonnement obligatoire"),
  confidence: z.number().min(0).max(1, "Confiance entre 0 et 1")
})

export const ConnectionSchema = z.object({
  source_id: z.string().min(1, "Source ID obligatoire"),
  target_id: z.string().min(1, "Target ID obligatoire"),
  type: ConnectionTypeSchema,
  strength: z.number().min(0).max(1, "Force entre 0 et 1"),
  auto_detected: z.boolean(),
  reasoning: z.string().optional()
})

// Article principal
export const ArticleSchema = z.object({
  id: z.string().min(1, "ID article obligatoire"),
  title: z.string().min(1, "Titre obligatoire"),
  url: z.string().url({ message: "URL invalide" }),
  source_type: SourceTypeSchema,
  date: z.string().datetime({ message: "Date ISO invalide" }),
  
  // Contenu éditorial
  summary: z.string().min(10, "Résumé trop court (min 10 chars)"),
  perspective: z.string().min(5, "Perspective trop courte (min 5 chars)"),
  interest_level: InterestLevelSchema,
  
  // Tags hiérarchiques
  primary_domain: PrimaryDomainSchema,
  secondary_domains: z.array(SecondaryDomainSchema).min(1, "Au moins un domaine secondaire"),
  concepts: z.array(ConceptSchema).min(1, "Au moins un concept"),
  tools_mentioned: z.array(ToolSchema),
  
  // Métadonnées
  author: z.string().optional(),
  reading_time: z.number().int().positive("Temps lecture > 0"),
  complexity_level: ComplexityLevelSchema,
  
  // Relations (calculées)
  connected_articles: z.array(z.string()),
  centrality_score: z.number().min(0).max(1, "Centralité entre 0 et 1"),
  
  // Connexions suggérées
  suggested_connections: z.array(SuggestedConnectionSchema).optional()
})

// Structure de données
export const ArticleDataSchema = z.object({
  articles: z.array(ArticleSchema),
  last_updated: z.string().datetime({ message: "Date ISO invalide" }),
  total_articles: z.number().int().nonnegative("Total articles >= 0")
})

export const ConnectionDataSchema = z.object({
  connections: z.array(ConnectionSchema),
  generated_at: z.string().datetime({ message: "Date ISO invalide" }),
  total_connections: z.number().int().nonnegative("Total connexions >= 0"),
  connection_index: z.record(z.string(), z.array(z.string())),
  last_processed: z.record(z.string(), z.string().datetime({ message: "Date ISO invalide" }))
})

// Input pour n8n
export const NewArticleInputSchema = z.object({
  article: ArticleSchema.omit({ centrality_score: true }),
  suggested_connections: z.array(SuggestedConnectionSchema)
})

// Types d'export (inférés)
export type ValidatedArticle = z.infer<typeof ArticleSchema>
export type ValidatedConnection = z.infer<typeof ConnectionSchema>
export type ValidatedArticleData = z.infer<typeof ArticleDataSchema>
export type ValidatedConnectionData = z.infer<typeof ConnectionDataSchema>
export type ValidatedNewArticleInput = z.infer<typeof NewArticleInputSchema>

/**
 * Validation avec logs détaillés
 */
export function validateArticleInput(data: unknown): ValidatedNewArticleInput {
  try {
    return NewArticleInputSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map((err: z.ZodIssue) => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      throw new Error(`Validation article échouée: ${details}`)
    }
    throw error
  }
}

export function validateArticleData(data: unknown): ValidatedArticleData {
  try {
    return ArticleDataSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map((err: z.ZodIssue) => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      throw new Error(`Validation données articles échouée: ${details}`)
    }
    throw error
  }
}

export function validateConnectionData(data: unknown): ValidatedConnectionData {
  try {
    return ConnectionDataSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map((err: z.ZodIssue) => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      throw new Error(`Validation données connexions échouée: ${details}`)
    }
    throw error
  }
}

/**
 * Validation partielle pour mise à jour (optionals)
 */
export const PartialArticleSchema = ArticleSchema.partial().extend({
  id: z.string().min(1, "ID obligatoire")
})

export function validatePartialArticle(data: unknown): z.infer<typeof PartialArticleSchema> {
  try {
    return PartialArticleSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map((err: z.ZodIssue) => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      throw new Error(`Validation article partiel échouée: ${details}`)
    }
    throw error
  }
}