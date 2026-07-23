import React from "react";
import Select from "react-select";


const estilosMunicipio = {
  control: (base, state) => ({
    ...base,
    minHeight: "45px",
    backgroundColor: "#ffffff",
    borderColor: state.isFocused ? "#7a1735" : "#d6d6d6",
    borderRadius: "8px",
    boxShadow: state.isFocused
      ? "0 0 0 2px rgba(122, 23, 53, 0.12)"
      : "none",
    cursor: "text",

    "&:hover": {
      borderColor: "#7a1735",
    },
  }),

  menu: (base) => ({
    ...base,
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    overflow: "hidden",
    zIndex: 99999,
  }),

  menuPortal: (base) => ({
    ...base,
    zIndex: 99999,
  }),

  menuList: (base) => ({
    ...base,
    maxHeight: "300px",
    backgroundColor: "#ffffff",
    padding: "4px 0",
  }),

  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#7a1735"
      : state.isFocused
        ? "#f4e6eb"
        : "#ffffff",

    color: state.isSelected ? "#ffffff" : "#222222",
    cursor: "pointer",
    fontSize: "14px",

    "&:active": {
      backgroundColor: "#ead1db",
    },
  }),

  singleValue: (base) => ({
    ...base,
    color: "#222222",
  }),

  input: (base) => ({
    ...base,
    color: "#222222",
  }),

  placeholder: (base) => ({
    ...base,
    color: "#777777",
  }),

  dropdownIndicator: (base) => ({
    ...base,
    color: "#7a1735",

    "&:hover": {
      color: "#5d1028",
    },
  }),
};

function SelectMunicipioBuscable({
  value,
  onChange,
  children,
}) {
  const opciones = React.Children.toArray(children)
    .filter(
      (opcion) =>
        React.isValidElement(opcion) &&
        opcion.props.value
    )
    .map((opcion) => ({
      value: opcion.props.value,
      label: React.Children.toArray(
        opcion.props.children
      )
        .join("")
        .trim(),
    }));

  const opcionSeleccionada =
    opciones.find(
      (opcion) => opcion.value === value
    ) || null;

  return (
    <Select
    classNamePrefix="municipio-select"
      options={opciones}
      value={opcionSeleccionada}
      onChange={(opcion) =>
        onChange({
          target: {
            value: opcion?.value || "",
          },
        })
      }
      placeholder="Buscar o seleccionar municipio..."
      noOptionsMessage={() => "Municipio no encontrado"}
      isSearchable
      isClearable
      styles={estilosMunicipio}
      menuPosition="fixed"
      menuPortalTarget={
        typeof document !== "undefined"
          ? document.body
          : undefined
      }
    />
  );
}

export default function FiltrosControles({
  municipioNombre,
  setMunicipioNombre,

  tipoTramite,
  setTipoTramite,

  terminoBusqueda,
  setTerminoBusqueda,

  estatus,
  setEstatus,

  fecha,
  setFecha,

  mostrarFiltros,
  setMostrarFiltros,

  limpiarFiltros,

  loading,
}) {
  return (
    <>
      {/* PANEL PRINCIPAL */}
      <div className="filtros-panel">
        <div className="grupo-filtro">
          <label>Municipio</label>
          
        <SelectMunicipioBuscable
  value={municipioNombre}
  onChange={(e) =>
    setMunicipioNombre(e.target.value)
  }
>
            <option value="" disabled>Seleccionar municipio...</option> 

            <option value="ACAJETE">ACAJETE</option>
            <option value="ACATLÁN">ACATLÁN</option>
            <option value="ACATENO">ACATENO</option>
            <option value="ACATZINGO">ACATZINGO</option>
            <option value="ACTEOPAN">ACTEOPAN</option>
            <option value="AHUACATLÁN">AHUACATLÁN</option>
            <option value="AHUATLÁN">AHUATLÁN</option>
            <option value="AHUAZOTEPEC">AHUAZOTEPEC</option>
            <option value="AHUEHUETITLA">AHUEHUETITLA</option>
            <option value="AJALPAN">AJALPAN</option>
            <option value="ALBINO ZERTUCHE">ALBINO ZERTUCHE</option>
            <option value="ALJOJUCA">ALJOJUCA</option>
            <option value="ALTEPEXI">ALTEPEXI</option>
            <option value="AMIXTLÁN">AMIXTLÁN</option>
            <option value="AMOZOC">AMOZOC</option>
            <option value="AQUIXTLA">AQUIXTLA</option>
            <option value="ATEMPAN">ATEMPAN</option>
            <option value="ATEXCAL">ATEXCAL</option>
            <option value="ATLIXCO">ATLIXCO</option>
            <option value="ATOYATEMPAN">ATOYATEMPAN</option>
            <option value="ATZALA">ATZALA</option>
            <option value="ATZITZIHUACÁN">ATZITZIHUACÁN</option>
            <option value="ATZITZINTLA">ATZITZINTLA</option>
            <option value="AXUTLA">AXUTLA</option>
            <option value="AYOTOXCO DE GUERRERO">AYOTOXCO DE GUERRERO</option>
            <option value="CALPAN">CALPAN</option>
            <option value="CALTEPEC">CALTEPEC</option>
            <option value="CAMOCUAUTLA">CAMOCUAUTLA</option>
            <option value="CAXHUACAN">CAXHUACAN</option>
            <option value="COATEPEC">COATEPEC</option>
            <option value="COATZINGO">COATZINGO</option>
            <option value="COHETZALA">COHETZALA</option>
            <option value="COHUECAN">COHUECAN</option>
            <option value="CORONANGO">CORONANGO</option>
            <option value="COXCATLÁN">COXCATLÁN</option>
            <option value="COYOMEAPAN">COYOMEAPAN</option>
            <option value="COYOTEPEC">COYOTEPEC</option>
            <option value="CUAPIAXTLA DE MADERO">CUAPIAXTLA DE MADERO</option>
            <option value="CUAUTEMPAN">CUAUTEMPAN</option>
            <option value="CUAUTINCHÁN">CUAUTINCHÁN</option>
            <option value="CUAUTLANCINGO">CUAUTLANCINGO</option>
            <option value="CUAYUCA DE ANDRADE">CUAYUCA DE ANDRADE</option>
            <option value="CUETZALAN DEL PROGRESO">CUETZALAN DEL PROGRESO</option>
            <option value="CUYOACO">CUYOACO</option>
            <option value="CHALCHICOMULA DE SESMA">CHALCHICOMULA DE SESMA</option>
            <option value="CHAPULCO">CHAPULCO</option>
            <option value="CHIAUTLA">CHIAUTLA</option>
            <option value="CHIAUTZINGO">CHIAUTZINGO</option>
            <option value="CHICONCUAUTLA">CHICONCUAUTLA</option>
            <option value="CHICHIQUILA">CHICHIQUILA</option>
            <option value="CHIETLA">CHIETLA</option>
            <option value="CHIGMECATITLÁN">CHIGMECATITLÁN</option>
            <option value="CHIGNAHUAPAN">CHIGNAHUAPAN</option>
            <option value="CHIGNAUTLA">CHIGNAUTLA</option>
            <option value="CHILA">CHILA</option>
            <option value="CHILA DE LA SAL">CHILA DE LA SAL</option>
            <option value="CHILCHOTLA">CHILCHOTLA</option>
            <option value="CHINANTLA">CHINANTLA</option>
            <option value="DOMINGO ARENAS">DOMINGO ARENAS</option>
            <option value="ELOXOCHITLÁN">ELOXOCHITLÁN</option>
            <option value="EPATLÁN">EPATLÁN</option>
            <option value="ESPERANZA">ESPERANZA</option>
            <option value="FRANCISCO Z. MENA">FRANCISCO Z. MENA</option>
            <option value="GENERAL FELIPE ÁNGELES">GENERAL FELIPE ÁNGELES</option>
            <option value="GUADALUPE">GUADALUPE</option>
            <option value="GUADALUPE VICTORIA">GUADALUPE VICTORIA</option>
            <option value="HERMENEGILDO GALEANA">HERMENEGILDO GALEANA</option>
            <option value="HONEY">HONEY</option>
            <option value="HUAQUECHULA">HUAQUECHULA</option>
            <option value="HUATLATLAUCA">HUATLATLAUCA</option>
            <option value="HUAUCHINANGO">HUAUCHINANGO</option>
            <option value="HUEHUETLA">HUEHUETLA</option>
            <option value="HUEHUETLÁN EL CHICO">HUEHUETLÁN EL CHICO</option>
            <option value="HUEHUETLÁN EL GRANDE">HUEHUETLÁN EL GRANDE</option>
            <option value="HUEJOTZINGO">HUEJOTZINGO</option>
            <option value="HUEYAPAN">HUEYAPAN</option>
            <option value="HUEYTAMALCO">HUEYTAMALCO</option>
            <option value="HUEYTLALPAN">HUEYTLALPAN</option>
            <option value="HUITZILAN DE SERDÁN">HUITZILAN DE SERDÁN</option>
            <option value="HUITZILTEPEC">HUITZILTEPEC</option>
            <option value="ATLEQUIZAYAN">ATLEQUIZAYAN</option>
            <option value="IXCAMILPA DE GUERRERO">IXCAMILPA DE GUERRERO</option>
            <option value="IXCAQUIXTLA">IXCAQUIXTLA</option>
            <option value="IXTACAMAXTITLÁN">IXTACAMAXTITLÁN</option>
            <option value="IXTEPEC">IXTEPEC</option>
            <option value="IZÚCAR DE MATAMOROS">IZÚCAR DE MATAMOROS</option>
            <option value="JALPAN">JALPAN</option>
            <option value="JOLALPAN">JOLALPAN</option>
            <option value="JONOTLA">JONOTLA</option>
            <option value="JOPALA">JOPALA</option>
            <option value="JUAN C. BONILLA">JUAN C. BONILLA</option>
            <option value="JUAN GALINDO">JUAN GALINDO</option>
            <option value="JUAN N. MÉNDEZ">JUAN N. MÉNDEZ</option>
            <option value="LAFRAGUA">LAFRAGUA</option>
            <option value="LIBRES">LIBRES</option>
            <option value="LA MAGDALENA TLATLAUQUITEPEC"> LA MAGDALENA TLATLAUQUITEPEC </option>
            <option value="MAZAPILTEPEC DE JUÁREZ">MAZAPILTEPEC DE JUÁREZ </option>
            <option value="MIXTLA">MIXTLA</option>
            <option value="MOLCAXAC">MOLCAXAC</option>
            <option value="CAÑADA MORELOS">CAÑADA MORELOS</option>
            <option value="NAUPAN">NAUPAN</option>
            <option value="NAUZONTLA">NAUZONTLA</option>
            <option value="NEALTICAN">NEALTICAN</option>
            <option value="NICOLÁS BRAVO">NICOLÁS BRAVO</option>
            <option value="NOPALUCAN">NOPALUCAN</option>
            <option value="OCOTEPEC">OCOTEPEC</option>
            <option value="OCOYUCAN">OCOYUCAN</option>
            <option value="OLINTLA">OLINTLA</option>
            <option value="ORIENTAL">ORIENTAL</option>
            <option value="PAHUATLÁN">PAHUATLÁN</option>
            <option value="PALMAR DE BRAVO">PALMAR DE BRAVO</option>
            <option value="PANTEPEC">PANTEPEC</option>
            <option value="PETLALCINGO">PETLALCINGO</option>
            <option value="PIAXTLA">PIAXTLA</option>
            <option value="PUEBLA">PUEBLA</option>
            <option value="QUECHOLAC">QUECHOLAC</option>
            <option value="QUIMIXTLÁN">QUIMIXTLÁN</option>
            <option value="RAFAEL LARA GRAJALES">RAFAEL LARA GRAJALES</option>
            <option value="LOS REYES DE JUÁREZ">LOS REYES DE JUÁREZ</option>
            <option value="SAN ANDRÉS CHOLULA">SAN ANDRÉS CHOLULA</option>
            <option value="SAN ANTONIO CAÑADA">SAN ANTONIO CAÑADA</option>
            <option value="SAN DIEGO LA MESA TOCHIMILTZINGO">SAN DIEGO LA MESA TOCHIMILTZINGO</option>
            <option value="SAN FELIPE TEOTLALCINGO">SAN FELIPE TEOTLALCINGO</option>
            <option value="SAN FELIPE TEPATLÁN">SAN FELIPE TEPATLÁN</option>
            <option value="SAN GABRIEL CHILAC">SAN GABRIEL CHILAC</option>
            <option value="SAN GREGORIO ATZOMPA">SAN GREGORIO ATZOMPA</option>
            <option value="SAN JERÓNIMO TECUANIPAN"> SAN JERÓNIMO TECUANIPAN</option>
            <option value="SAN JERÓNIMO XAYACATLÁN"> SAN JERÓNIMO XAYACATLÁN</option>
            <option value="SAN JOSÉ CHIAPA">SAN JOSÉ CHIAPA</option>
            <option value="SAN JOSÉ MIAHUATLÁN">SAN JOSÉ MIAHUATLÁN</option>
            <option value="SAN JUAN ATENCO">SAN JUAN ATENCO</option>
            <option value="SAN JUAN ATZOMPA">SAN JUAN ATZOMPA</option>
            <option value="SAN MARTÍN TEXMELUCAN">SAN MARTÍN TEXMELUCAN</option>
            <option value="SAN MARTÍN TOTOLTEPEC">SAN MARTÍN TOTOLTEPEC</option>
            <option value="SAN MATÍAS TLALANCALECA">SAN MATÍAS TLALANCALECA</option>
            <option value="SAN MIGUEL IXITLÁN">SAN MIGUEL IXITLÁN</option>
            <option value="SAN MIGUEL XOXTLA">SAN MIGUEL XOXTLA</option>
            <option value="SAN NICOLÁS BUENOS AIRES">SAN NICOLÁS BUENOS AIRES</option>
            <option value="SAN NICOLÁS DE LOS RANCHOS"> SAN NICOLÁS DE LOS RANCHOS </option>
            <option value="SAN PABLO ANICANO">SAN PABLO ANICANO</option>
            <option value="SAN PEDRO CHOLULA">SAN PEDRO CHOLULA</option>
            <option value="SAN PEDRO YELOIXTLAHUACA"> SAN PEDRO YELOIXTLAHUACA </option>
            <option value="SAN SALVADOR EL SECO">SAN SALVADOR EL SECO</option>
            <option value="SAN SALVADOR EL VERDE">SAN SALVADOR EL VERDE</option>
            <option value="SAN SALVADOR HUIXCOLOTLA">SAN SALVADOR HUIXCOLOTLA </option>
            <option value="SAN SEBASTIÁN TLACOTEPEC"> SAN SEBASTIÁN TLACOTEPEC</option>
            <option value="SANTA CATARINA TLALTEMPAN">SANTA CATARINA TLALTEMPAN</option>
            <option value="SANTA INÉS AHUATEMPAN">SANTA INÉS AHUATEMPAN</option>
            <option value="SANTA ISABEL CHOLULA">SANTA ISABEL CHOLULA</option>
            <option value="SANTIAGO MIAHUATLÁN">SANTIAGO MIAHUATLÁN</option>
            <option value="SANTO TOMÁS HUEYOTLIPAN"> SANTO TOMÁS HUEYOTLIPAN</option>
            <option value="SOLTEPEC">SOLTEPEC</option>
            <option value="TECALI DE HERRERA">TECALI DE HERRERA</option>
            <option value="TECAMACHALCO">TECAMACHALCO</option>
            <option value="TECOMATLÁN">TECOMATLÁN</option>
            <option value="TEHUACÁN">TEHUACÁN</option>
            <option value="TEHUITZINGO">TEHUITZINGO</option>
            <option value="TENAMPULCO">TENAMPULCO</option>
            <option value="TEOPANTLÁN">TEOPANTLÁN</option>
            <option value="TEOTLALCO">TEOTLALCO</option>
            <option value="TEPANCO DE LÓPEZ">TEPANCO DE LÓPEZ</option>
            <option value="TEPANGO DE RODRÍGUEZ">TEPANGO DE RODRÍGUEZ</option>
            <option value="TEPATLAXCO DE HIDALGO">TEPATLAXCO DE HIDALGO</option>
            <option value="TEPEACA">TEPEACA</option>
            <option value="TEPEMAXALCO">TEPEMAXALCO</option>
            <option value="TEPEOJUMA">TEPEOJUMA</option>
            <option value="TEPETZINTLA">TEPETZINTLA</option>
            <option value="TEPEXCO">TEPEXCO</option>
            <option value="TEPEXI DE RODRÍGUEZ">TEPEXI DE RODRÍGUEZ</option>
            <option value="TEPEYAHUALCO">TEPEYAHUALCO</option>
            <option value="TEPEYAHUALCO DE CUAUHTÉMOC">TEPEYAHUALCO DE CUAUHTÉMOC</option>
            <option value="TETELA DE OCAMPO">TETELA DE OCAMPO</option>
            <option value="TETELES DE ÁVILA CASTILLO">TETELES DE ÁVILA CASTILLO </option>
            <option value="TEZIUTLÁN">TEZIUTLÁN</option>
            <option value="TIANGUISMANALCO">TIANGUISMANALCO</option>
            <option value="TILAPA">TILAPA</option>
            <option value="TLACOTEPEC DE BENITO JUÁREZ">TLACOTEPEC DE BENITO JUÁREZ</option>
            <option value="TLACUILOTEPEC">TLACUILOTEPEC</option>
            <option value="TLACHICHUCA">TLACHICHUCA</option>
            <option value="TLAHUAPAN">TLAHUAPAN</option>
            <option value="TLALTENANGO">TLALTENANGO</option>
            <option value="TLANEPANTLA">TLANEPANTLA</option>
            <option value="TLAOLA">TLAOLA</option>
            <option value="TLAPACOYA">TLAPACOYA</option>
            <option value="TLAPANALÁ">TLAPANALÁ</option>
            <option value="TLATLAUQUITEPEC">TLATLAUQUITEPEC</option>
            <option value="TLAXCO">TLAXCO</option>
            <option value="TOCHIMILCO">TOCHIMILCO</option>
            <option value="TOCHTEPEC">TOCHTEPEC</option>
            <option value="TOTOLTEPEC DE GUERRERO">TOTOLTEPEC DE GUERRERO</option>
            <option value="TULCINGO">TULCINGO</option>
            <option value="TUZAMAPAN DE GALEANA">TUZAMAPAN DE GALEANA</option>
            <option value="TZICATLACOYAN">TZICATLACOYAN</option>
            <option value="VENUSTIANO CARRANZA">VENUSTIANO CARRANZA</option>
            <option value="VICENTE GUERRERO">VICENTE GUERRERO</option>
            <option value="XAYACATLÁN DE BRAVO">XAYACATLÁN DE BRAVO</option>
            <option value="XICOTEPEC">XICOTEPEC</option>
            <option value="XICOTLÁN">XICOTLÁN</option>
            <option value="XIUTETELCO">XIUTETELCO</option>
            <option value="XOCHIAPULCO">XOCHIAPULCO</option>
            <option value="XOCHILTEPEC">XOCHILTEPEC</option>
            <option value="XOCHITLÁN DE VICENTE SUÁREZ">XOCHITLÁN DE VICENTE SUÁREZ</option>
            <option value="XOCHITLÁN TODOS SANTOS">XOCHITLÁN TODOS SANTOS</option>
            <option value="YAONÁHUAC">YAONÁHUAC</option>
            <option value="YEHUALTEPEC">YEHUALTEPEC</option>
            <option value="ZACAPALA">ZACAPALA</option>
            <option value="ZACAPOAXTLA">ZACAPOAXTLA</option>
            <option value="ZACATLÁN">ZACATLÁN</option>
            <option value="ZAPOTITLÁN">ZAPOTITLÁN</option>
            <option value="ZAPOTITLÁN DE MÉNDEZ">ZAPOTITLÁN DE MÉNDEZ</option>
            <option value="ZARAGOZA">ZARAGOZA</option>
            <option value="ZAUTLA">ZAUTLA</option>
            <option value="ZIHUATEUTLA">ZIHUATEUTLA</option>
            <option value="ZINACATEPEC">ZINACATEPEC</option>
            <option value="ZONGOZOTLA">ZONGOZOTLA</option>
            <option value="ZOQUIAPAN">ZOQUIAPAN</option>

            <option value="TODOS">SELECCIONAR TODOS LOS MUNICIPIOS...</option>
         
          </SelectMunicipioBuscable>
        </div>

        <div className="grupo-filtro">
          <label>Tipo de movimiento</label>
          

          <div className="botones-movimiento">
            <button
              className={`mov-btn ${tipoTramite === "alta" ? "activo-alta" : ""}`}
              onClick={() => setTipoTramite("alta")}
              
            >
              ALTA
            </button>

            <button
              className={`mov-btn ${tipoTramite === "baja" ? "activo-baja" : ""}`}
              onClick={() => setTipoTramite("baja")}
            >
              BAJA
            </button>

            <button
              className={`mov-btn ${tipoTramite === "consulta" ? "activo-consulta" : ""}`}
              onClick={() => setTipoTramite("consulta")}
            >
              CONSULTA
            </button>
          </div>
        </div>
      </div>

      {/* BUSCADOR + MOSTRAR */}
      <div className="search-container">
        <input
  type="text"
  placeholder="Buscar por número de oficio..."
  value={terminoBusqueda}
  onChange={(e) => setTerminoBusqueda(e.target.value)}
/>

        <button
          className="mostrar-btn"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
        >
          {mostrarFiltros ? "Ocultar filtros" : "Mostrar filtros"}
        </button>
      </div>

      {/* FILTROS EXTRA (YA NO ROMPE CSS) */}
      <div className={`extra-filtros ${mostrarFiltros ? "activo" : "oculto"}`}>
        <div className="extra-group">
          <label>Estatus</label>

          <select value={estatus} onChange={(e) => setEstatus(e.target.value)}>
            <option value="">TODOS</option>
            <option value="pendiente">PENDIENTE</option>
            <option value="aprobado">APROBADO</option>
            <option value="rechazado">RECHAZADO</option>
          </select>
        </div>

        <div className="extra-group">
          <label>Fecha</label>

          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        <div className="extra-btn-container">
          <button className="limpiar-btn" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
      </div>
    </>
  );
}