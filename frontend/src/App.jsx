import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./assets/Components/Navbar";
import Inicio from "./pages/inicio";
import Login from "./pages/login";
import Registro from "./pages/registro";
import Perfil from "./pages/perfil";
import "./assets/css/App.css";

function App() {
  return (
    <Router>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/perfil" element={<Perfil />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
