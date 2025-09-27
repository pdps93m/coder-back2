import express from 'express'
import session from 'express-session'
import mongoose from 'mongoose'
import usersRouter from './routes/users.js'
import productosRouter from './routes/productos.js'
import cookieParser from 'cookie-parser'
import MongoStore from 'connect-mongo'
import handlebars from 'express-handlebars'
import sessionRouter from './routes/sessions.routes.js'
import viewsRouter from './routes/views.router.js'
import passport from 'passport'
import initializePassport from './config/passport.config.js'

const app = express()

mongoose.connect('mongodb://localhost:27017/back2DB', {})
    .then(() => console.log('MongoDB conectado exitosamente'))
    .catch(err => console.error('Error conectando a MongoDB:', err))


app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(session({
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/back2DB',
        collectionName: 'sessions',
        ttl: 3600
    }),
    secret: 'coderhouse',
    resave: true,
    saveUninitialized: true
}))

initializePassport()
app.use(passport.initialize())
app.use(passport.session())

app.engine('handlebars', handlebars.engine())
app.set('view engine', 'handlebars')
app.set('views', './src/views')

app.use('/api/users', usersRouter)
app.use('/api/productos', productosRouter)
app.use('/api/sessions', sessionRouter)

app.use('/', viewsRouter)

const PORT = 8080
app.listen(PORT, () => {
    console.log(`escuchando en ${PORT}`)
})


