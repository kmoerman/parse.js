const { recursive, maybe } = require('../parse.js')

describe('parse.recursion', () => {


  test('basic', () => {

    const {ping, pong} = recursive(({ping, pong}) =>
      ({ ping: [ 'ping', maybe([',', pong]) ]
       , pong: [ 'pong', maybe([',', ping]) ]
      }))

    expect(ping.parse('ping,pong,ping'))
      .toEqual({index: 14})

    expect(pong.parse('pong,ping,pong,ping'))
      .toEqual({index: 19})

    expect(pong.ci.parse('pOng,pIng,pOng,pIng'))
      .toEqual({index: 19})
  })

  test('ci inernal', () => {

    const {ping, pong} = recursive(({ping, pong}) =>
      ({ ping: [ 'ping', maybe([',', pong.ci]) ]
       , pong: [ 'pong', maybe([',', ping.cd]) ]
      }))

    expect(ping.parse('ping,pOng,ping'))
      .toEqual({index: 14})
  })

  test('missing definition', () => {

    expect(() => {
      const {ping, pong} = recursive(({ping, pong}) =>
        ({ ping: [ 'ping', maybe([',', pong.ci]) ]
        }))
    }).toThrow('undefined mutual recursion: pong')

  })

  test('already defined', () => {

    const as = recursive(as => ['a', maybe(as.ci)])

    expect(as.parse('aAaaAAaaaAaAAa'))
      .toEqual({index: 14})

    const {ping, pong} = recursive(rec =>
      ({ ping: [ 'ping', '(', rec.pong, ')', maybe(rec.ping) ]
       , pong: [ 'pong', maybe(rec.ping) ]
      }))

    expect(ping.parse('ping(pongping(pong))ping(pong) '))
      .toEqual({index: 30})

  })




})
