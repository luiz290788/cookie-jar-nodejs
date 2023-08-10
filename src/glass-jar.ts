import cookieParser from 'cookie-parser'
import cookieSession from 'cookie-session'
import express, { NextFunction, Request, Response } from 'express'
import proxy from 'express-http-proxy'
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { SESSION_SECRET } from './session-secret'

// passport 0.6.0 assumes the session object has save() and regenerate() methods,
// but cookie-session does not provide these. Work around the issue until it's fixed.
export const ensureSessionCanRegenerate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const session = req.session
  if (!session) {
    return next()
  }

  if (!session.regenerate) {
    session.regenerate = (callback: NextFunction) => callback()
  }

  if (!session.save) {
    session.save = (callback: NextFunction) => callback()
  }

  next()
}
const app = express()

app.use(cookieParser())
app.use(express.json())

app.use(
  cookieSession({
    name: 'session',
    keys: [SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
  })
)

app.use(ensureSessionCanRegenerate)
app.use(passport.initialize())
app.use(passport.session())

passport.use(
  new LocalStrategy((user, password, done) => {
    if (user === 'kevin' && password === 'dunder_mifflin') {
      done(null, { name: 'kevin', role: 'cookie monster' })
    } else {
      done(new Error('wrong credentials'))
    }
  })
)
passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user: Express.User, done) => done(null, user))

app.post('/login', passport.authenticate('local'), (req, res) => {
  res.sendStatus(204)
})

app.post('/logout', (req, res) => {
  req.logOut({ keepSessionInfo: true }, (err) => {
    res.sendStatus(204)
  })
})

const authenticatedMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    next()
  } else {
    res.sendStatus(400)
  }
}

app.get('/give-me-cookies', authenticatedMiddleware, (req, res) => {
  res.send({ 
    cookies: [1, 2, 3, 4],
    owner: req.session?.passport?.user?.name
  })
})

app.use('/plastic-jar', authenticatedMiddleware, proxy('http://plastic-jar:9090'))


app.use(express.static('./src/static'))

app.listen(8080, () => {
  console.log('glass jar on 8080')
})