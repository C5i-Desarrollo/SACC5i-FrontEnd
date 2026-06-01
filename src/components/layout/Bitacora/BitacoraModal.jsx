import React, { useState, useEffect } from 'react';

export default function BitacoraModal({ documentoId, onClose, baseUrl }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${baseUrl}/documentos-municipio/${documentoId}/historial`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setHistorial(data.data || []);
      } catch (error) {
        console.error("Error cargando bitácora:", error);
      } finally {
        setLoading(false);
      }
    };

    if (documentoId) fetchHistorial();
  }, [documentoId, baseUrl]);

  // Formateador de fechas para que se vea como en tu diseño (ej. "29 may 2026 | 17:19")
  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-MX', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }).replace(',', ' |');
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3>Bitácora de Seguimiento</h3>
          <button onClick={onClose} style={styles.closeBtn}>✖</button>
        </div>
        
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Historial de movimientos del documento.
        </p>

        {loading ? (
          <p>Cargando historial...</p>
        ) : historial.length === 0 ? (
          <p>No hay registros en la bitácora.</p>
        ) : (
          <div style={styles.timeline}>
            {historial.map((item, index) => (
              <div key={item.id} style={styles.timelineItem}>
                <div style={styles.timelineIcon}>
                  <i className='bx bx-calendar'></i>
                </div>
                <div style={styles.timelineContent}>
                  <span style={styles.date}>{formatearFecha(item.fecha_registro)}</span>
                  <h4 style={styles.statusTitle}>Cambio a: {item.estatus_nuevo}</h4>
                  
                  {item.observaciones && (
                    <div style={styles.observationsBox}>
                      <p style={{ margin: 0, color: '#444' }}>{item.observaciones}</p>
                    </div>
                  )}
                  
                  <div style={styles.operatorPill}>
                    Operador: {item.operador}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1000
  },
  modal: {
    backgroundColor: '#fff', padding: '20px 30px', borderRadius: '12px',
    width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' },
  timeline: { position: 'relative', paddingLeft: '30px', marginTop: '10px' },
  timelineItem: { position: 'relative', paddingBottom: '25px' },
  timelineIcon: {
    position: 'absolute', left: '-30px', top: '0',
    backgroundColor: '#4a90e2', color: '#fff',
    width: '28px', height: '28px', borderRadius: '50%',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 2, boxShadow: '0 0 0 4px #fff'
  },
  timelineContent: {
    borderLeft: '2px solid #e0e0e0', paddingLeft: '20px', marginLeft: '-16px', paddingBottom: '10px'
  },
  date: { fontSize: '12px', color: '#888', fontWeight: 'bold' },
  statusTitle: { margin: '5px 0', fontSize: '16px', color: '#333' },
  observationsBox: {
    backgroundColor: '#f9f9f9', border: '1px solid #eee',
    borderRadius: '6px', padding: '10px', marginTop: '8px', marginBottom: '8px'
  },
  operatorPill: {
    display: 'inline-block', backgroundColor: '#f0f0f0', color: '#555',
    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', marginTop: '5px'
  }
};