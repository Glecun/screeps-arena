import { expect, test } from 'bun:test'
import { myAwesomeLogic } from './sample.ts'

test('sample test', () => {
  const dummyCreeps = [{ hits: 10 }, { hits: 10 }, { hits: 10 }, { hits: 10 }, { hits: 2 }]
  const result = myAwesomeLogic(dummyCreeps)
  expect(result).toBe(42)
})
