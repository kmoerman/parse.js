const parsers = require('../parse.js')

// basic
const { char, string, either, sequence, repeat, recursive, not, lookahead } = parsers

// composites
const
  { separate
  , start
  , end
  , full
  , subtract
  , between
  , until
  , many
  , epsilon
  , maybe
  , empty
  , fail
  } = parsers


describe('parse.composite', () => {


  test('separate', () => {

    const ab = either(char('a'), char('b'))
    const comma = char(',')

    const parser = separate(ab, comma)

    expect(parser.parse('a,b,b,a,b'))
      .toEqual({index: 9})

    expect(parser.parse('a,b,b,a,b,stop'))
      .toEqual({index: 9})

    expect(parser.parse('a,stop'))
      .toEqual({index: 1})

    expect(() => parser.parse(',stop'))
      .toThrow(Error)

    expect(() => separate(ab, comma).parse(',stop'))
      .toThrow(Error)

    const any = char.not('x')
    const parser2 = separate(any, comma)

    expect(parser2.parse('a,b,c,d,e'))
      .toEqual({index: 9})
  /*
    expect(() => parser2.parse(',,,,,'))
      .toThrow(Error)

    const epsilons = separate(epsilon, comma)
    expect(epsilons.parse(',,,,'))
      .toEqual({index: 4})
  */
  })


  test('separate/complex', () => {
    const wsp       = either(char(' '), char.between('\t','\r'))
    const alpha     = repeat.one(char.between('a','z').ci)
    const sentence  = sequence(separate(alpha, wsp), char('.'))
    const sentences = separate(sentence, wsp)

    expect(sentences.parse('This is a JEST test. It tests parser combinators.'))
      .toEqual({index: 49})
  })


  test('extremities', () => {

    const abc = string('abc')

    expect(abc.parse('abcdef'))
      .toEqual({index:3})

    expect(() => sequence(start, abc).parse('_abc', 1))
      .toThrow(Error)

    expect(sequence(abc, end).parse('_abc', 1))
      .toEqual({index: 4})

    expect(full(abc).parse('abc'))
      .toEqual({index:3})

    expect(() => full(abc).parse('abcdef'))
      .toThrow(Error)

    expect(full(abc).parse('abc'))
      .toEqual({index: 3})
  })


  test('subtract', () => {

    const ab = either(string('ab'),string('cd'))
    const abcd = either(string('ab'),string('bc'),string('cd'))

    const p = subtract(abcd, ab)

    expect(p.parse('bc'))
      .toEqual({index: 2})

    expect(ab.parse('ab'))
      .toEqual({index: 2})

    expect(() => p.parse('ab'))
      .toThrow(Error)

  })

  test('between', () => {

    const left = char('(')
    const right = char(')')

    const p = between(left, right)

    expect(p.parse('(123456)789)'))
      .toEqual({index: 8})

    expect(() => p.parse('(123456'))
      .toThrow(Error)

    expect(between(char('"')).parse('"quoted string" unquoted tail'))
      .toEqual({index: 15})

  })

  test('until', () => {
    const to = char(';')

    expect(until(to).parse('123 456; 789'))
      .toEqual({index: 8})
  })

  test('many', () => {
    const x = char('x').ci
    const y = char('y')

    const p = many(x,y)
    expect(p.parse('xyXxyxyxxXXy'))
      .toEqual({index: 12})

    expect(p.parse('xyXxYxyxxXXy'))
      .toEqual({index:4})

    expect(p.parse('YxyxxXXy'))
      .toEqual({index: 0})

    const p1 = many.one(x,y)
    expect(p1.parse('xyXxyxyxxXXy'))
      .toEqual({index: 12})

    expect(() => p1.parse('YxyxxXXy'))
      .toThrow(Error)
  })

  test('epsilon', () => {
    expect(epsilon.parse('abc'))
      .toEqual({index: 0})

    expect(epsilon.parse(''))
      .toEqual({index: 0})

    expect(maybe(char('7')).parse('7'))
      .toEqual({index: 1})

    expect(maybe(char('7')).parse('8'))
      .toEqual({index: 0})

    expect(empty.parse(''))
      .toEqual({index: 0})

    expect(() => empty.parse('x'))
      .toThrow(Error)

    expect(() => fail.parse('x'))
      .toThrow(Error)

    expect(() => fail.parse(''))
      .toThrow(Error)
  })

  test('epsilon/composite', () => {
    const integer = either(char('0'), sequence(maybe(char('-')), char.between('1','9'), repeat(char.between('0','9'))))

    expect(integer.parse('-123'))
      .toEqual({index: 4})

    expect(integer.parse('123'))
      .toEqual({index: 3})

    expect(integer.parse('0'))
      .toEqual({index: 1})

    expect(() => full(integer).parse('02'))
      .toThrow()

    expect(() => integer.parse('-0'))
      .toThrow()

    expect(() => integer.parse('-'))
      .toThrow()

  })


})
