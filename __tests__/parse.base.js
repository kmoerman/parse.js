const { char, string, either, sequence, repeat, recursive, not, lookahead } = require('../parse.js')

describe('parse.base', () => {

  test('characters single', () => {

    expect(char('X').parse('XYZ'))
      .toEqual({index: 1})

    expect(() => char('Y').parse('XYZ'))
      .toThrow(Error)

    expect(char.any().parse('YY', 1))
      .toEqual({index: 2})

    expect(() => char.any().parse('YY', 2))
      .toThrow(Error)

    expect(char.any().parse('a'))
      .toEqual({index: 1})

    expect(char.not('x').parse('u'))
      .toEqual({index: 1})

    expect(() => char(1.5))
      .toThrow(Error)

    expect(() => char.any(-2))
      .toThrow(Error)

  })


  test('characters multiple', () => {

    expect(char('XY').parse('XYZ'))
      .toEqual({index: 1})

    expect(char('XY').parse('XYZ', 1))
      .toEqual({index: 2})

    expect(() => char('Z').parse('XYZ'))
      .toThrow(Error)

    expect(char.between('A','F').parse('C'))
      .toEqual({index:1})

    expect(char.outside('A','F').parse('G'))
      .toEqual({index:1})

  })


  test('string', () => {
    const input = 'AbC def'

    expect(string('AbC').parse(input))
      .toEqual({index:3})

    expect(string('DEF').ci.parse(input, 4))
      .toEqual({index:7})

    expect(() => string('GHI').ci.parse(input, 4))
      .toThrow(Error)

    expect(() => char('def').parse(input))
      .toThrow(Error)
  })


  test('choice', () => {

    const parser = either(string('ab'), string('00'), string('de'))

    expect(parser.parse('abc'))
      .toEqual({index:2})

    expect(parser.parse('def'))
      .toEqual({index:2})

    expect(() => parser.parse('ghi'))
      .toThrow(Error)

  })


  test('char case-independence', () => {
    const a = string('aaa')
    const b = string('bbb')

    const ab = either(a,b)
    const ab_ci = ab.ci

    expect(ab.parse('aaa'))
      .toEqual({index: 3})

    expect(() => ab.parse('BBB'))
      .toThrow(Error)

    expect(ab_ci.parse('BBB'))
      .toEqual({index: 3})

    expect(ab_ci.parse('BBB'))
      .toEqual({index: 3})

    expect(() => ab_ci.cd.parse('BBB'))
      .toThrow(Error)

  })


  test('char case-independence', () => {

    const abc = char("abc").ci

    expect(abc.parse("B"))
      .toEqual({index: 1})

    expect(() => char("ABC").cd.parse("b"))
      .toThrow(Error)

    expect(() => abc.parse("D"))
      .toThrow(Error)
  })


  test('sequence', () => {

    const digits = sequence(char.between('1', '9'), char.between('0', '9'))

    expect(digits.parse('12abc'))
      .toEqual({index: 2})

    expect(() => number.parse('0123abc'))
      .toThrow(Error)

    expect(() => parser.parse('ghi0123'))
      .toThrow(Error)
  })


  test('repeat/basic', () => {
    const parser = repeat(string('abc'))

    expect(parser.parse('abcabcabc'))
      .toEqual({index: 9})

    expect(parser.parse('abcabcdef'))
      .toEqual({index: 6})

    expect(parser.parse('def'))
      .toEqual({index: 0})

    expect(repeat.one(string('abc')).parse('abcabc'))
      .toEqual({index: 6})

    expect(() => repeat.one(string('abc')).parse('def'))
      .toThrow(Error)

  })

  test('recursive', () => {
    const L = char('(')
    const R = char(')')
    const number = char.between('0','9')

    const parens = recursive(p => sequence(L, either(p,number), R))

    expect(parens.parse('(((2)))'))
      .toEqual({index: 7})

    expect(parens.parse('((((((3))))))'))
      .toEqual({index: 13})

    expect(() => parens.parse('3'))
      .toThrow(Error)

    const numbers1 = recursive(p => repeat.one(sequence(L, either(number,p), R)))
    const numbers2 = recursive(p => repeat.one(sequence(L, either(p,number), R)))

    expect(numbers1.parse('((3)(4))'))
      .toEqual({index: 8})
    expect(numbers2.parse('((3)(4))'))
      .toEqual({index: 8})

  })


  test('not', () => {
    const abc = string('abc')

    expect(not(abc).parse('123'))
      .toEqual({index: 0})

    expect(() => not(abc).parse('abc'))
      .toThrow(Error)

    const p = not(either(string("begin"),string("end")))
    expect(() => p.parse("end"))
      .toThrow(Error)

    expect(p.parse("middle"))
      .toEqual({index: 0})

  })

  test('lookahead', () => {
    const abcd = string('abcd')

    expect(abcd.parse('abcd'))
      .toEqual({index: 4})

    expect(lookahead(abcd).parse('abcd'))
      .toEqual({index: 0})

    expect(() => lookahead(abcd).parse('ab'))
      .toThrow(Error)
  })

})
