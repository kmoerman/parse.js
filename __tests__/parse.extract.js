// basic

const parsers = require('../parse.js')

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

// composites
const
  { capture
  , map
  } = parsers

describe('parse.extract', () => {


  test('capture/base', () => {

    const a = capture(char('a'))

    expect(a.parse('a'))
      .toEqual({index: 1, value: 'a'})

    expect(() => a.parse('b'))
      .toThrow(Error)

    expect(capture(string('abcd')).parse('abcd'))
      .toEqual({index: 4,  value: 'abcd'})

    const integer = capture(either(char('0'), sequence(maybe(char('-')), char.between('1','9'), repeat(char.between('0','9')))), parseInt)

    expect(integer.parse('7'))
      .toEqual({index: 1, value: 7})

    expect(integer.parse('-3'))
      .toEqual({index: 2, value: -3})

    expect(() => capture(char.between('0','9'), () => undefined.undefined).parse('7'))
      .toThrow(Error)

  })


  test('capture/compound', () => {

    const ab = either(capture(char('a')), capture(char('b')))

    expect(ab.parse('a'))
      .toEqual({index: 1, value: 'a'})

    expect(ab.parse('b'))
      .toEqual({index: 1, value: 'b'})

    expect(() => ab.parse('c'))
      .toThrow(Error)


    const abc = char('abc')

    expect(repeat(capture(abc)).parse('abaca'))
      .toEqual({index: 5, value: ['a','b','a','c','a']})


    const comma = char(',')
    const parser = separate(capture(abc), comma)

    expect(parser.parse('a,b,b,a,c'))
      .toEqual({index: 9, value:['a','b','b','a','c']})

    const num = char.between('0','9')
    const nums = separate(capture(num, parseInt), comma)

    expect(nums.parse('3,1,4,1,5'))
      .toEqual({index: 9, value: [3,1,4,1,5]})


    const mixed = separate(many.one(capture(num, parseInt), capture(abc), char('xy')), comma)

    expect(mixed.parse('3a5,1b3b,xy,6a,pq'))
      .toEqual({index: 14, value: [3,'a',5,1,'b',3,'b',6,'a']})

    expect(capture(fail))

  })


  test('map', () => {
    const p = map(char('abc'), x => x+x)
    expect(p.parse('a'))
      .toEqual({index: 1})

    const q = map(capture(char('abc')), x => x+x)
    expect(q.parse('b'))
      .toEqual({index: 1, value: 'bb'})

    const r = map(capture(char('abc')), x => undefined.undefined)
    expect(() => r.parse('b'))
      .toThrow(Error)
  })


  test('capture/nested', () => {

    const blank = either(char(' '), char.between('\t','\r'))
    const blanks = repeat(either(char(' '), char.between('\t','\r')))
    const left  = char('(')
    const right = char(')')

    const token = repeat.one(subtract(char.any(), either(blank, left, right)))

    const flat = recursive(x =>
      sequence(blanks, left, many(capture(token), blank, x) ,right))

    const nested = recursive(x =>
      sequence(blanks, left, many(capture(token), blank, map(x, v => v)), right))

    const expression = `
      (define (f x)
        (* 2 x))
    `

    expect(flat.parse(expression))
      .toEqual({index: 37, value: ['define', 'f', 'x', '*', '2', 'x']})

    expect(nested.parse(expression))
      .toEqual({index: 37, value: ['define', ['f', 'x'], ['*', '2', 'x']]})

  })

})
