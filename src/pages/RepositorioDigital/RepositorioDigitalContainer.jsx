import { useState } from 'react';
import RepositorioDigital from './Acuses/components/RepositorioDigital';
import OficiosRespuesta from './OficiosRespuesta/components/OficiosRespuesta';
import './RepositorioDigitalContainer.css';

export default function RepositorioDigitalContainer({ setPageTitle }) {
  const [activeTab, setActiveTab] = useState('acuses');

  return (
    <div className="rdc-container">
      <div className="rdc-tabs">
        <button
          className={`rdc-tab ${activeTab === 'acuses' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('acuses')}
        >
          <i className="bx bx-archive" />
          Acuses
        </button>
        <button
          className={`rdc-tab ${activeTab === 'oficios' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('oficios')}
        >
          <i className="bx bx-file" />
          Oficios de Respuesta
        </button>
      </div>

      <div className="rdc-content">
        {activeTab === 'acuses' && (
          <RepositorioDigital setPageTitle={setPageTitle} />
        )}
        {activeTab === 'oficios' && (
          <OficiosRespuesta setPageTitle={setPageTitle} />
        )}
      </div>
    </div>
  );
}
