import { combineActionParams } from '../src/generators/actions'

describe('Test actions module', () => {
  describe('Test combineActionParams', () => {
    it.only('Should combine right', () => {
      const res = combineActionParams('', [
        {
          name: 'limit',
          schema: {
            type: 'integer'
          }
        },
        {
          name: 'offset',
          schema: {
            type: 'integer'
          }
        }
      ])
      expect(res).toEqual({ limit: { type: 'number' }, offset: { type: 'number' } })
    })
  })
})
