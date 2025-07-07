import _ from 'lodash'

interface HasHits {
  hits: number
}

export function myAwesomeLogic(creeps: HasHits[]) {
  return _.sumBy(creeps, c => c.hits)
}
