import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PerfilModal from '../UI/PerfilModal';
import './Sidebar.css';

const links = [
  { to: '/', label: 'Panel general', imagen: '/icons/panel.png', color: '#C97C46' },
  { to: '/productos', label: 'Productos', imagen: '/icons/productos.png', color: '#2E9E5B' },
  { to: '/inventario', label: 'Inventario', imagen: '/icons/inventario.png', color: '#21808A', soloAdmin: true },
  { to: '/ventas', label: 'Ventas', imagen: '/icons/ventas.png', color: '#DFA424' },
  { to: '/reportes', label: 'Reportes', imagen: '/icons/reportes.png', color: '#852A25', soloAdmin: true },
  { to: '/usuarios', label: 'Usuarios', imagen: '/icons/usuarios.png', color: '#6B5C4D', soloAdmin: true },
];

export default function Sidebar() {
  const { usuario, logout, esAdministrador } = useAuth();
  const [modalPerfil, setModalPerfil] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const location = useLocation();

  const linksVisibles = links.filter((l) => !l.soloAdmin || esAdministrador);

  // Cierra el menú deslizable automáticamente al navegar a otra página
  // (para no tener que cerrarlo a mano después de cada clic en el celular).
  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  return (
    <>
      <button
        className="hamburger-btn"
        onClick={() => setMenuAbierto(true)}
        aria-label="Abrir menú"
      >
        ☰
      </button>

      {menuAbierto && <div className="sidebar-overlay" onClick={() => setMenuAbierto(false)} />}

      <aside className={`sidebar${menuAbierto ? ' abierto' : ''}`}>
        <button className="sidebar-close-btn" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú">×</button>

        <div className="sidebar-brand">
          <img src="/logo-glorita.png" alt="Exclusivos Glorita" className="brand-logo" />
          <div className="brand-name">Exclusivos Glorita</div>
          <div className="brand-sub">Gestión artesanal</div>
        </div>

        <nav className="sidebar-nav">
          {linksVisibles.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              style={({ isActive }) => (isActive
                ? { background: `${link.color}1F`, borderLeft: `3px solid ${link.color}`, color: link.color }
                : { borderLeft: '3px solid transparent' })}
            >
              <span className="sidebar-icon">
                {link.imagen
                  ? <img src={link.imagen} alt="" className="sidebar-icon-img" />
                  : <span style={{ background: `${link.color}26`, color: link.color, width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{link.icon}</span>}
              </span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-user" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', padding: 0, font: 'inherit' }} onClick={() => setModalPerfil(true)} title="Mi perfil">
            <div className="user-avatar">
              {usuario?.fotoUrl
                ? <img src={usuario.fotoUrl} alt={usuario?.nombre} />
                : (usuario?.nombre?.charAt(0) || '?')}
            </div>
            <div>
              <div className="user-name">{usuario?.nombre}</div>
              <div className="user-role">{usuario?.rol}</div>
            </div>
          </button>
          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>
            Cerrar sesión
          </button>
        </div>

        <PerfilModal open={modalPerfil} onClose={() => setModalPerfil(false)} />
      </aside>
    </>
  );
}
