import './App.css';
import MainLayout from './layouts/MainLayout';
import PrivateRoute from './components/PrivateRoute'
import UserPage from './pages/UserPage';
import LoginPage from './pages/LoginPage';
import { Routes, Route } from 'react-router-dom';
import EstacionesPage from './pages/EstacionesPage';
import DashboardPage from './pages/DashboardPage'
import OperadoresPage from './pages/OperadoresPage';
import EmpresaPage from './pages/EmpresaPage';
import IngredientesPage from './pages/IngredientesPage';
import FormulasPage from './pages/FormulasPages';
import ProduccionPage from './pages/ProduccionPage';
import InventarioPage from './pages/InventarioPage';
import DetalleFormulaPage from './pages/DetalleFormulaPage';
import DetalleProduccionPage from './pages/DetalleProduccionPage';



function App() {
    return (
        <Routes>

            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            
            <Route element={<PrivateRoute />}>
                
                {/* Capa de Layout: Renderiza el MainLayout para todas las rutas internas protegidas */}
                <Route element={<MainLayout />}>


                    <Route path="dashboard" element={<DashboardPage />} /> 
                    <Route path="usuarios" element={<UserPage />} />
                    <Route path="estaciones" element={<EstacionesPage />} />
                    <Route path="operadores" element={<OperadoresPage />} />
                    <Route path="empresa" element={<EmpresaPage />} />
                    <Route path="ingredientes" element={<IngredientesPage />} />
                    <Route path="formulas" element={<FormulasPage />} />
                    <Route path='produccion' element={<ProduccionPage />} />
                    <Route path='inventario' element={<InventarioPage/>} />
                    <Route path="/detalle-formula/:id" element={<DetalleFormulaPage />} />
                    <Route path="/detalle-produccion/:folio" element={<DetalleProduccionPage />} />

                    <Route path="*" element={<div>Página no encontrada</div>} />

                </Route>
            </Route>
            
            <Route path="*" element={<div>Página no encontrada</div>} />

        </Routes>
    );
}


export default App
