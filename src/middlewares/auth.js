function checkAuth({ mustBeLoggedIn }) {
    return (req, res, next) => {
        const isLogged = !!req.session.user
        if (mustBeLoggedIn && !isLogged) {
            return res.redirect('/')
        }

        if ( !mustBeLoggedIn && isLogged) {
            return res.redirect('/productos')

        }

        next()
    }
}

function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }

    if (req.user) {
        return next();
    }

    return res.status(401).json({ 
        error: 'Acceso denegado. Se requiere autenticación.' 
    });
}

function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user && (!req.session || !req.session.user)) {
            return res.status(401).json({ 
                error: 'Acceso denegado. Se requiere autenticación.' 
            });
        }

        const userRole = req.user?.role || req.session?.user?.role;

        if (!userRole) {
            return res.status(403).json({ 
                error: 'Acceso denegado. No se pudo determinar el rol del usuario.' 
            });
        }

        const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        
        if (!rolesArray.includes(userRole)) {
            return res.status(403).json({ 
                error: `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesArray.join(', ')}` 
            });
        }

        next();
    };
}

function requireAdmin(req, res, next) {
    return requireRole('admin')(req, res, next);
}

function requireUser(req, res, next) {
    return requireRole('user')(req, res, next);
}

function requireUserOrAdmin(req, res, next) {
    return requireRole(['user', 'admin'])(req, res, next);
}

function requireOwnership(getResourceUserId) {
    return async (req, res, next) => {
        try {
            if (!req.user && (!req.session || !req.session.user)) {
                return res.status(401).json({ 
                    error: 'Acceso denegado. Se requiere autenticación.' 
                });
            }

            const currentUserId = req.user?.id || req.session?.user?.id;
            const resourceUserId = await getResourceUserId(req);

            const userRole = req.user?.role || req.session?.user?.role;
            if (userRole === 'admin') {
                return next();
            }

            if (currentUserId !== resourceUserId.toString()) {
                return res.status(403).json({ 
                    error: 'Acceso denegado. No tienes permisos para acceder a este recurso.' 
                });
            }

            next();
        } catch (error) {
            console.error('Error en verificación de propiedad:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor al verificar permisos.' 
            });
        }
    };
}

export { 
    checkAuth,
    requireAuth,
    requireRole,
    requireAdmin, 
    requireUser,
    requireUserOrAdmin,
    requireOwnership
};
