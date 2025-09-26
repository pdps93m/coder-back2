import express from 'express'
import session from 'express-session'
import mongoose from 'mongoose'
import usersRouter from './routes/users.js'
import productosRouter from './routes/productos.js'
import cookieParser from 'cookie-parser'
import MongoStore from 'connect-mongo'
import handlebears from 'express-handlebars'
import bcrypt from 'bcrypt'
import sessionRouter from './routes/sessions.routes.js'
import viewsRouter from './routes/views.router.js'


const app = express()



mongoose.connect('mongodb://localhost:27017/back2DB', {})


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

app.engine('handlebars', handlebears.engine())
app.set('view engine', 'handlebars')
app.set('views', './src/views')



app.post('/cookies', (req, res) => {
    let { clave, valor } = req.body
    res.cookie(clave, valor)
    res.json({ mensaje: 'Cookie ok' })
})

app.get('/cookies', (req, res) => {
    res.json({
        cookies: req.cookies
    })
})

app.use('/api/users', usersRouter)
app.use('/api/productos', productosRouter)

app.use('/', viewsRouter)
app.use('/api/sessions', sessionRouter)

const PORT = 8080
app.listen(PORT, () => {
    console.log(`escuchando en ${PORT}`)
})


//const mongoUrl = 'mongodb://localhost:27017/recupero-password'
//mongoose.connect(mongoUrl, {})

// const app = express()

// app.use(express.json())
//app.use(express.urlencoded({ extended: true }))


// handlebars
// app.engine('handlebars', exphbs.engine({
//     extname: '.handlebars'
//}))
//app.set('view engine', 'handlebars')
//app.use(express.static('public'))

//app.use('/api/usuarios', usuariosRouter)
//app.use('/', viewsRouter)

//const PORT = 8080
//app.listen(PORT, () => {
//    console.log(`escuchando en ${PORT}`)
//})


/*app.use(session({
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/nuestroprimerlogginDB',
        collectionName: 'sessions',
        ttl: 3600
    }),
    secret: 'coderhouse',
    resave: true,
    saveUninitialized: true
})) */

    /*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
----------- REEVER QUE EN MI CODIGO USO USUARIO/OS Y NO USER -----------*/

/*app.engine('handlebars', handlebears.engine())
app.set('view engine', 'handlebars')
app.set('views', './src/views')*/ // !!!!!!!!!!!!!!!!!! Verificar la ruta

/*app.use('/', viewsRouter)
app.use('/api/sessions', sessionRouter)*/

/*const PORT = 8080
app.listen(PORT, () => {
    console.log(`escuchando en ${PORT}`)
})*/

/*const createHash = (password) => bcrypt.hashSync(password, bcrypt.genSaltSync(10))

const isValidPassword = (user, password) => bcrypt.compareSync(password, user.password)

app.post('/login', (req, res) => { 
    const { username, password } = req.body
    if (!username || !password) {
        return res.status(400).json({ error: 'todos los campos son requeridos' })
    }

    const user = users.find(u => u.username === username)
    if (!user) {
        return res.status(404).json({ message: 'no existe el usuario' })
    }

    if (!isValidPassword(user, password)) {
        return res.status(404).json({ message: 'password incorrecto' })
    }

})
*/

/*app.post('/register', (req, res) => {
    const { username, password } = req.body
    if (!username || !password) {
        return res.status(400).json({ error: 'todos los campos son requeridos' })
    }

    const user = users.find(u => u.username === username)
    if (user) {
        return res.status(400).json({ message: 'el usuario ya existe' })
    }

    const hashedPassword = createHash(password)

    users.push({ username, password: hashedPassword })

    res.status(201).json({ message: 'usuario creado' })
})*/

/*app.get('/users', (req, res) => {
    res.json(users)
})

export default app; */



