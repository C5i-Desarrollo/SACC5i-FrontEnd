import {
  CheckCircle,
  Clock3,
  XCircle,
  Loader
} from "lucide-react";

import "./TarjetasResumen.css";

function TarjetasResumen({ resumen }) {

  const obtenerIcono = (color) => {

    switch (color) {

      case "verde":
        return <CheckCircle size={20} />;

      case "rojo":
        return <XCircle size={20} />;

      case "amarillo":
        return <Clock3 size={20} />;

      case "gris":
        return <Loader size={20} />;

      default:
        return <Clock3 size={20} />;
    }
  };

  return (

    <div className="tarjetas-resumen">

      {resumen.map((item, index) => (

        <div
          key={index}
          className={`tarjeta-resumen ${item.color}`}
        >

          <div className="icono-resumen">
            {obtenerIcono(item.color)}
          </div>

          <div className="info-resumen">

            <span className="tarjeta-cantidad">
              {item.cantidad}
            </span>

            <span className="tarjeta-estado">
              {item.estado}
            </span>

          </div>

        </div>
      ))}

    </div>
  );
}

export default TarjetasResumen;