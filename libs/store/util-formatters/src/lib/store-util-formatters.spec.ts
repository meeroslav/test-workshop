import { formatRating } from './store-util-formatters';

describe('formatRating', () => {
  it('should work', () => {
    expect(formatRating(0.23234234)).toEqual('2.3 / 10');
  });
});
