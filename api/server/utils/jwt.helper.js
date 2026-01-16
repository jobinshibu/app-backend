import jwt from 'jsonwebtoken';
import UserService from '../services/user.js';
import config from '../config.js';

function decodeToken(token) {
  return jwt.decode(token.replace('Bearer ', ''));
}

async function getAuthUser(req, token) {
  try {
    const user = await UserService.getUserById(token.payload.id);
    
    req.user = user;
    if (!user) return true;
    
    return false;
  } catch (e) {
    return null;
  }
}

const expiresIn = '365d';

function getJWTToken(data) {
  const token = `Bearer ${jwt.sign(data, config.jwtSecret, { expiresIn })}`;
  return token;
}

function getJWTTokenVerify(token, key) {
  return jwt.verify(token, key);
}
export { decodeToken, getJWTToken, getAuthUser, getJWTTokenVerify };
