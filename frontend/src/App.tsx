import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Inicio from "./pages/inicio/inicio";
import Login from "./pages/login/login";
import Registro from "./pages/registro/registro";
import Perfil from "./pages/perfil/perfil";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./Components/ProtectedRoute"; 

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<Inicio />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />

            {/*Envolver rutas privadas con ProtectedRoute */}
            <Route element={<ProtectedRoute />}>
              <Route path="/perfil" element={<Perfil />} />
              {/* <Route path="/otra-ruta-privada" element={<OtroComponente />} /> */}
            </Route>

          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;