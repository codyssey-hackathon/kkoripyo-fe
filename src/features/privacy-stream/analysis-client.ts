import { apiOrigin } from '@/lib/env'
import { createAnalysisClient } from './analysis-api'

export const analysisClient = createAnalysisClient(apiOrigin)
