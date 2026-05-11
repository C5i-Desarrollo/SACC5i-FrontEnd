import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { menuConfig } from '../../../config/menuConfig';
import './Sidebar.css';

const Sidebar = ({ isHidden, activeSection, onSectionChange }) => {
    const { user } = useAuth();
    const [expandedMenu, setExpandedMenu] = useState(null);

    if (!user) return null;

    const menuItems = menuConfig[user.rol] || [];
    const homeSection = 'Dashboard';

    const handleMenuClick = (item) => {
        if (item.submenu) {
            setExpandedMenu(expandedMenu === item.section ? null : item.section);
        } else {
            onSectionChange(item.section);
        }
    };

    return (
        <section id="sidebar" className={isHidden ? 'hide' : ''}>
            <a href="#" className="brand" onClick={(e) => { e.preventDefault(); onSectionChange(homeSection); }}>
                <img
                    src={isHidden ? '/img/icono1.svg' : '/img/Logo1.png'}
                    alt="Logo"
                    className="brand-logo"
                />
            </a>

            <ul className="side-menu top">
                {menuItems.map((item, index) => (
                    <li
                        key={index}
                        className={`${activeSection === item.section && !item.submenu ? 'active' : ''
                            } ${item.submenu ? 'has-submenu' : ''}`}
                    >
                        <a href="#" onClick={(e) => {
                            e.preventDefault();
                            handleMenuClick(item);
                        }}>
                            <i className={`bx ${item.icon} bx-sm`}></i>
                            <span className="text">{item.label}</span>
                            {item.submenu && (
                                <i className={`bx ${expandedMenu === item.section ? 'bx-chevron-down' : 'bx-chevron-right'
                                    }`} style={{ marginLeft: 'auto', fontSize: '14px' }}></i>
                            )}
                        </a>

                        {item.submenu && expandedMenu === item.section && (
                            <ul className="submenu">
                                {item.submenu.map((subitem, subindex) => (
                                    <li
                                        key={subindex}
                                        className={activeSection === subitem.section ? 'active' : ''}
                                    >
                                        <a href="#" onClick={(e) => {
                                            e.preventDefault();
                                            onSectionChange(subitem.section);
                                        }}>
                                            <span className="text">{subitem.label}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default Sidebar;