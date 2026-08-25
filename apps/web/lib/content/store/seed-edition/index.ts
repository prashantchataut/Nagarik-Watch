import type { StoredArticle } from '../json-store'
import { editionPolitics } from './politics'
import { editionSociety } from './society'
import { editionBusiness } from './business'
import { editionSports } from './sports'
import { editionEntertainment } from './entertainment'
import { editionWorld } from './world'
import { editionOpinion } from './opinion'
import { editionLiterature } from './literature'
import { editionTechnology } from './technology'
import { editionHealth } from './health'
import { editionEducation } from './education'
import { editionInterview } from './interview'
import { editionPhotoStory } from './photo-story'
import { editionVideo } from './video'
import { editionDiaspora } from './diaspora'
import { editionService } from './service'
import { editionAugust } from './august'

/** July 2026 original edition: 5 full stories × 15 categories. */
export function buildEditionArticles(): StoredArticle[] {
  return [
    ...editionPolitics(),
    ...editionSociety(),
    ...editionBusiness(),
    ...editionSports(),
    ...editionEntertainment(),
    ...editionWorld(),
    ...editionOpinion(),
    ...editionLiterature(),
    ...editionTechnology(),
    ...editionHealth(),
    ...editionEducation(),
    ...editionInterview(),
    ...editionPhotoStory(),
    ...editionVideo(),
    ...editionDiaspora(),
    ...editionService(),
    ...editionAugust(),
  ]
}
