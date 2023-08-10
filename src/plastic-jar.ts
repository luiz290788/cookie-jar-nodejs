import cookieParser from 'cookie-parser'
import cookieSession from 'cookie-session'
import express, { NextFunction, Request, Response } from 'express'
import passport from 'passport'
import { SESSION_SECRET } from './session-secret'

const app = express()


app.use(cookieParser())

app.use(
  cookieSession({
    name: 'session',
    keys: [SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
  })
)
  
app.use(passport.initialize())
app.use(passport.session())
passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user: Express.User, done) => done(null, user))

const authenticatedMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    next()
  } else {
    res.sendStatus(400)
  }
}


app.get('/give-me-cookies', authenticatedMiddleware, (req, res) => {
  console.log(`serving cookies to ${req.session?.passport?.user?.name}`)
  res.send({ 
    cookies: [4, 3, 2, 1],
    owner: req.session?.passport?.user?.name
  })
})

app.listen(9090, () => {
  console.log('plastic jar on 9090')
})