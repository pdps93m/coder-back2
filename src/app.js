import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import mongoose from 'mongoose'
import usersRouter from './routes/users.js'
import productosRouter from './routes/productos.js'
import cartsRouter from './routes/carts.js'
import cookieParser from 'cookie-parser'
import MongoStore from 'connect-mongo'
import handlebars from 'express-handlebars'
import sessionRouter from './routes/sessions.routes.js'
import passwordRouter from './routes/password.routes.js'
import purchaseRouter from './routes/purchase.routes.js'
import ordersRouter from './routes/orders.routes.js'
import viewsRouter from './routes/views.router.js'
import passport from 'passport'
import initializePassport from './config/passport.config.js'

const app = express()

mongoose.connect(process.env.MONGODB_URL, {})
    .then(() => {})
    .catch(err => console.error('Error conectando a MongoDB:', err))


app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(session({
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URL,
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

app.engine('handlebars', handlebars.engine({
    helpers: {
        eq: function (a, b) {
            return a === b;
        },
        gt: function (a, b) {
            return a > b;
        },
        lt: function (a, b) {
            return a < b;
        },
        and: function (a, b) {
            return a && b;
        },
        or: function (a, b) {
            return a || b;
        },
        multiply: function (a, b) {
            return a * b;
        }
    }
}))
app.set('view engine', 'handlebars')
app.set('views', './src/views')

app.use(express.static('src/public'))

app.use('/api/users', usersRouter)
app.use('/api/productos', productosRouter)
app.use('/api/carts', cartsRouter)
app.use('/api/sessions', sessionRouter)
app.use('/api/password', passwordRouter)
app.use('/api/purchase', purchaseRouter)
app.use('/api/orders', ordersRouter)

app.use('/', viewsRouter)

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {})
