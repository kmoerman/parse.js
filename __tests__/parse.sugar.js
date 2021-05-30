const { either, sequence, repeat, recursive, not, lookahead } = require('../parse.js')

describe('parse.sugar', () => {

  test('base', () => {
    const p = either('a', 3, 'word')

    expect(p.parse('a'))
      .toEqual({index: 1})

    expect(p.parse('3'))
      .toEqual({index: 1})

    expect(p.parse('word'))
      .toEqual({index: 4})
  })

  test('combined', () => {

    const _1234 = sequence(1,2,34)
    expect(_1234.parse('1234'))
      .toEqual({index: 4})

    const abcs = repeat('abc')
    expect(abcs.parse('abcabcdef'))
      .toEqual({index: 6})

    const arec = recursive(x => ['a', either(x, '')])
    expect(arec.parse('aaaaaab'))
      .toEqual({index: 6})

    const na = not('a')

    expect(na.parse('b'))
      .toEqual({index: 0})

    expect(() => na.parse('a'))
      .toThrow(Error)

    expect(lookahead(7).parse('7'))
      .toEqual({index: 0})

  })

})
