// src/context/useAuth.js
import { useContext } from 'react';
import { AuthContext } from './AuthContext'; // Importa el objeto Contexto

// Exportamos el hook para consumir el contexto
export const useAuth = () => useContext(AuthContext);