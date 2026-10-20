const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'snapduty_secret_key_jwt_2026_super_secure';

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No se proporcionó token de autenticación. Inicia sesión.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'El usuario asociado a esta sesión ya no existe.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Sesión inválida o expirada. Por favor vuelve a iniciar sesión.'
    });
  }
}

module.exports = authMiddleware;
