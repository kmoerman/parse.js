
function parser (f) {

  // TODO wrapper cleanup

  f.ci = (index, env) => f(index, { ...env, ci: true  })
  f.cd = (index, env) => f(index, { ...env, ci: false })

  f.ci.cd = f
  f.cd.ci = f

  ;[f, f.ci, f.cd].forEach(F => F.parse = (input, index=0) => {
    const r = F(index, { input, level: 0 })
    //console.log(r, r instanceof result)
    return r.orThrowOut()
  })

  return f
}

parser.force = function (p) {
  if (typeof p === 'string' || p instanceof String) {
    switch (p.length) {
      case 0 : return epsilon
      case 1 : return char(p)
      default: return string(p)
    }
  }
  else if (typeof p === 'number'  || p instanceof Number) {
    return parser.force(p + '')
  }
  else if (p instanceof Array) {
    return sequence(...p.map(parser.force))
  }
  else return p
}


// PARSER RESULTS //////////////////////////////////////////////////////////////
function result (index, value) {
  this.index = index
  this.value = value
}

function error (m) {
  this.message = m
}

error.prototype = Object.create(result.prototype)
error.prototype.constructor = error
error.prototype.index = -1

function empty (index) {
  this.index = index
}

empty.prototype = Object.create(result.prototype)
empty.prototype.constructor = empty

function list (index, values) {
  this.index = index
  this.value = values
}

list.prototype = Object.create(result.prototype)
list.prototype.constructor = list

const ignore = function () { return this }
const id     = x => x

result.prototype.or = ignore
error.prototype.or  = id

result.prototype.and = id
error.prototype.and  = ignore

result.prototype.orThrow = ignore
error.prototype.orThrow  = function () { throw this }

result.prototype.orThrowOut = ignore
error.prototype.orThrowOut  = function () { throw new Error (this.message) }

result.prototype.invert = function (index) { return new error ('not') }
error.prototype.invert  = function (index) { return new empty (index) }

result.prototype.append = function (that) { return that.prepend([this.value]) }
error.prototype.append  = ignore
empty.prototype.append  = id
list.prototype.append   = function (that) { return that.prepend(this.value) }

result.prototype.prepend = function (values) { return new list (this.index, [...values, this.value]) }
empty.prototype.prepend  = function (values) { return new list (this.index, values) }
list.prototype.prepend   = function (values) { return new list (this.index, values.concat(this.value)) }

result.prototype.capture = function (value) { return new result (this.index, value) }
error.prototype.capture  = ignore

result.prototype.map = function (f) {
  try {
      const value = f(this.value)
      return new result (this.index, value)
  } catch (e) {
      return new error (e.toString())
  }
}
empty.prototype.map = ignore
error.prototype.map = ignore

// BASE PARSERS ////////////////////////////////////////////////////////////////
function char (CS) {
  const cs = CS.toLowerCase()
  return parser(function (index, {input, ci}) {
    if (index >= input.length)
      return new error ('unexpected end of input')
    if ((ci && cs.indexOf(input[index].toLowerCase()) >= 0) || (!ci && CS.indexOf(input[index]) >= 0))
      return new empty (index+1)
    else
      return new error (`expected characters [${Array.from(CS).join(',')}] ${ci ? '[ci]' : ''}`)
  })
}

char.any = function (n=1) {
  if (n < 0 || !Number.isInteger(n))
    throw new Error (`invalid number of characters: ${n}`)

  return parser(function (index, {input}) {
    if (index+n > input.length)
      return new error ('unexpected end of input')
    else
      return new empty (index+n)
  })
}

char.between = function (A,B) {

  const A_ = A.charCodeAt(0)
  const B_ = B.charCodeAt(0)
  const LO = Math.min(A_,B_)
  const HI = Math.max(A_,B_)

  const a_ = A[0].toLowerCase().charCodeAt(0)
  const b_ = B[0].toLowerCase().charCodeAt(0)
  const lo = Math.min(a_,b_)
  const hi = Math.max(a_,b_)

  return parser(function (index, {input, ci=false}) {
    if (index >= input.length)
      return new error ('unexpected end of input')
    const c = ci ? input[index].toLowerCase().charCodeAt(0) : input.charCodeAt(index)
    if ((!ci && c >= LO && c <= HI) || (ci && c >= lo && c <= hi))
      return new empty (index+1)
    else
      return new error (`expected character ${A[0]} - ${B[0]}${ci ? '[ci]' : ''}`)
  })
}

function string (S) {
  const N = S.length
  const s = S.toLowerCase()

  return parser(function (index, {input, ci=false}) {
    if (index+N > input.length)
      return new error ('unexpected end of input')

    const x = input.substr(index, N)
    if ((ci && x.toLowerCase() === s) || (!ci && x === S))
      return new empty (index+N)
    else
      return new error (`expected string ${S}${ci ? '[ci]' : ''}`)
  })
}

function either (...ps_) {
  const ps = ps_.map(parser.force)
  return parser((index, env) => {
    const N = ps.length
    let found = false
    let i = 0
    while (!found && i < N) {
      const result = ps[i++](index, env)
      found = result.or(false)
    }
    return found || new error ('either')
  })
}

function sequence (...ps_) {
  const ps = ps_.map(parser.force)
  return parser((index, env) => {
    try {
      return ps.reduce((result, p) => result.append(p(result.index, env).orThrow()), new empty (index))
    }
    catch (e) {
      return new error ('sequence')
    }
  })
}

function repeat (p_) {
  const p = parser.force(p_)

  return parser((index, env) => {

    let $result = new empty (index)
    const N = env.input.length
    try {
      while (index < N) {
        $result = $result.append(p(index, env).orThrow())
        index = $result.index
      }
    }
    catch (e) {}

    return $result
  })
}

function recursive (f) {
  const p = parser.force(f(parser((index, env) => p(index, { ...env, level: env.level+1}))))
  return p
}

function predicate (f, e) {
  return parser((index, env) => (f(index, env) && new empty (index)) || new error (e))
}

function not (p_) {
  const p = parser.force(p_)
  return parser((index, env) => p(index, env).invert(index))
}

function lookahead (p_) {
  const p = parser.force(p_)
  return parser((index, env) => p(index, env).and(new empty (index)))
}


// EXTRACTORS //////////////////////////////////////////////////////////////////
function capture (p_, ...fs) {
  const p = parser.force(p_)
  return parser(function (index, env) {

    try {
      const _result = p(index, env).orThrow()
      try {
        const value = fs.reduce((x,f) => f(x), env.input.substring(index, _result.index))
        return _result.capture(value)
      }
      catch (e) {
        // failure of mappings fs
        return new error (e)
      }
    }
    catch (e) {
      // parser failure
      return e
    }
  })
}

function map (p_, ...fs) {
  const p = parser.force(p_)
  return parser(function (index, env) {
    return p(index, env).map(x => fs.reduce((y,f) => f(y), x))
  })
}


// COMPOSITE COMBINATORS ///////////////////////////////////////////////////////
//const repeat    = x => recursive(r => either(sequence(x, r), epsilon))
const separate  = (x,sep) => sequence(x, repeat(sequence(sep, x)))
const start     = predicate(index => index === 0, 'input start expected')
const end       = predicate((index, {input}) => index >= input.length, 'input end expected')
const full      = p => sequence(start, p, end)
const subtract  = (a,...b) => sequence(not(either(...b)), a)
const between   = (a,b=a) => sequence(a, repeat(not.strict(b)), b)
const until     = x => sequence(repeat(not.strict(x)), x)
const many      = (...xs) => repeat(either(...xs))
const epsilon   = char.any(0)
const maybe     = x => either(x, epsilon)
const fail      = not(epsilon)

//separate.strict = (x,sep) => separate(sequence(not(sep), x), sep)
repeat.one      = x => sequence(x, repeat(x))
many.one        = (...xs) => repeat.one(either(...xs))
not.strict      = x => subtract(char.any(), x)
char.one        = char.any(1)
char.not        = c => subtract(char.any(), char(c))
char.outside    = (a,b) => subtract(char.any(), char.between(a,b))


// MODULE DEFINITION ///////////////////////////////////////////////////////////
module.exports =
  // BASE
  { char
  , string
  , either
  , sequence
  , repeat
  , recursive
  , not
  , lookahead

  // COMPOSITE
  , separate
  , start
  , end
  , full
  , subtract
  , between
  , until
  , many
  , epsilon
  , maybe
  , fail
  , empty : full(epsilon)

  // EXTRACTORS
  , capture
  , map
  }
