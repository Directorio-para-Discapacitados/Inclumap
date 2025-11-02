import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Inicio from "./pages/inicio/inicio";
import Login from "./pages/login/login";
import Registro from "./pages/registro/registro";
import Perfil from "./pages/perfil/perfil";
import { AuthProvider } from "./context/AuthContext";
import ChatWidget from "./Components/ChatWidget";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/perfil" element={<Perfil />} />

                    {/* --- RUTAS AÑADIDAS --- */}
          {/* Ruta temporal para Lugares Guardados */}
          <Route 
            path="/guardados" 
            element={
              <div style={{padding: '2rem'}}>
                <h2>⭐ Mis Lugares Guardados</h2>
                <p>Aquí se listarán los lugares que has marcado como favoritos.</p>
              </div>
            } 
          />
          {/* Ruta temporal para Ajustes */}
          <Route 
            path="/ajustes" 
            element={
              <div style={{padding: '2rem'}}>
                <h2>⚙️ Ajustes</h2>
                <p>Aquí podrás configurar tu cuenta.</p>
              </div>
            } 
          />
          {/* --- FIN DE RUTAS AÑADIDAS --- */}

        </Routes>
      </main>
      <ChatWidget />
      </Router>
    </AuthProvider>
  );
}

export default App;