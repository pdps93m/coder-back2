import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

export const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role
        },
        JWT_SECRET, 
        { expiresIn: '1h' }
    )
}

export const authToken = (req, res, next) => {
    const authHeader = req.headers.authorization
    const userAgent = req.headers['user-agent']
    if (!authHeader) {  
        return res.status(401).json({ error: 'falta el token de autenticación' })
    }

    const token = authHeader.split(' ')[1]
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'token no válido' })
        }

        req.user = decoded
        next()
    })
}

export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No hay usuario autenticado' })
        }

        if (Array.isArray(roles)) {
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({ error: 'No tienes permiso para esto' })
            }
        } else {
            if (req.user.role !== roles) {
                return res.status(403).json({ error: 'Acceso denegado' })
            }
        }

        next()
    }
}
