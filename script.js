// script.js
document.addEventListener("DOMContentLoaded", function () {
  const pantallaCientifica = document.getElementById("pantalla");
  const pantallaBasica = document.getElementById("pantallaBasica");

  let pantallaActual = null;
  let calculadoraActual = "basica";

  // --- Variables y Lógica para Modo Angular (DEG/RAD) ---
  let anguloModoActual = "RAD";
  let btnAnguloModoElem; // Se inicializará en inicializarCalculadoras o cambiarCalculadora

  // --- Importar funciones DEG/RAD personalizadas a Math.js ---
  try {
    math.import(
      {
        sind: function (angle) {
          return math.sin(math.unit(angle, "deg"));
        },
        cosd: function (angle) {
          return math.cos(math.unit(angle, "deg"));
        },
        tand: function (angle) {
          return math.tan(math.unit(angle, "deg"));
        },
        asind: function (value) {
          return math.number(math.asin(value), "deg");
        },
        acosd: function (value) {
          return math.number(math.acos(value), "deg");
        },
        atand: function (value) {
          return math.number(math.atan(value), "deg");
        },
      },
      { override: false }
    );
    console.log("Funciones DEG/RAD personalizadas importadas a math.js");
  } catch (e) {
    console.error("Error al importar funciones DEG/RAD a math.js:", e);
  }

  // Verificaciones iniciales de elementos (opcional, pueden ir dentro de inicializar)
  if (document.getElementById("calculadoraCientifica")) {
    // Solo verificar si el contenedor existe
    if (!pantallaCientifica) {
      console.warn(
        "ADVERTENCIA: Elemento #pantalla (de la calc. científica) no encontrado."
      );
    }
    // btnAnguloModoElem se busca en inicializarCalculadoras y cambiarCalculadora
  }
  if (document.getElementById("calculadoraBasica")) {
    if (!pantallaBasica) {
      console.warn("ADVERTENCIA: Elemento #pantallaBasica no encontrado.");
    }
  }

  // --- Función para manejar porcentajes ---
  function manejarPorcentajes(expresion) {
    expresion = expresion.replace(
      /(\d+(?:\.\d+)?)\s*([\+\-])\s*(\d+(?:\.\d+)?)%/g,
      (match, num1, operador, num2) => {
        return `${num1} ${operador} (${num1} * ${num2} / 100)`;
      }
    );
    expresion = expresion.replace(
      /(\d+(?:\.\d+)?)\s*([\*\/])\s*(\d+(?:\.\d+)?)%/g,
      (match, num1, operador, num2) => {
        return `${num1} ${operador} (${num2} / 100)`;
      }
    );
    return expresion.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
  }

  // --- Funciones de la Calculadora (operan sobre pantallaActual) ---
  function agregar(valor) {
    if (!pantallaActual) {
      console.error(
        "Error: pantallaActual no está definida en agregar(). Tipo calc:",
        calculadoraActual
      );
      return;
    }
    const valorPrevio = pantallaActual.value;
    if (
      [
        "Error",
        "Error Sintaxis",
        "Error (Div/0)",
        "Error (Infinito)",
        "Error (No num)",
        "Error: Tipo desconocido",
        "Error Sintaxis Raíz",
      ].includes(valorPrevio)
    ) {
      pantallaActual.value = "";
    }
    pantallaActual.value += valor;
  }

  function borrar() {
    if (!pantallaActual) return;
    pantallaActual.value = "";
  }

  function calcular() {
    if (!pantallaActual) return;
    let valorPantalla = pantallaActual.value;
    let resultado;

    if (valorPantalla === "") {
      resultado = "";
      pantallaActual.value = resultado;
      return;
    }

    try {
      // --- Transformaciones ANTES de math.evaluate ---
      valorPantalla = valorPantalla.replace(/ln\(/g, "log(");
      valorPantalla = valorPantalla.replace(
        /(?<![a-zA-Z0-9_])log\(/g,
        "log10("
      );

      //trigonometría
      if (anguloModoActual === "DEG" && calculadoraActual === "cientifica") {
        valorPantalla = valorPantalla.replace(
          /(?<![a-zA-Z0-9_])sin\(/g,
          "sind("
        );
        valorPantalla = valorPantalla.replace(
          /(?<![a-zA-Z0-9_])cos\(/g,
          "cosd("
        );
        valorPantalla = valorPantalla.replace(
          /(?<![a-zA-Z0-9_])tan\(/g,
          "tand("
        );
        valorPantalla = valorPantalla.replace(
          /(?<![a-zA-Z0-9_])asin\(/g,
          "asind("
        );
        valorPantalla = valorPantalla.replace(
          /(?<![a-zA-Z0-9_])acos\(/g,
          "acosd("
        );
        valorPantalla = valorPantalla.replace(
          /(?<![a-zA-Z0-9_])atan\(/g,
          "atand("
        );
      }

      valorPantalla = valorPantalla.replace(
        /(\d+(?:\.\d+)?|\([^\)]+\))\s*nCr\s*(\d+(?:\.\d+)?|\([^\)]+\))/g,
        (match, n, k) => {
          console.log(
            `Transformando nCr: '${match}' a 'combinations(${n}, ${k})'`
          );
          return `combinations(${n}, ${k})`;
        }
      );

      valorPantalla = valorPantalla.replace(
        /(\d+(?:\.\d+)?|\([^\)]+\))\s*nPr\s*(\d+(?:\.\d+)?|\([^\)]+\))/g,
        (match, n, k) => {
          console.log(
            `Transformando nPr: '${match}' a 'permutations(${n}, ${k})'`
          );
          return `permutations(${n}, ${k})`;
        }
      );

      //Porcentaje

      if (valorPantalla.includes("%")) {
        valorPantalla = manejarPorcentajes(valorPantalla);
      }

      //Raices
      valorPantalla = valorPantalla.replace(
        /(\d+(?:\.\d+)?)√(\d+(\.\d+)?)/g,
        (match, indiceStr, radicandoStr) => {
          const indice = indiceStr ? parseFloat(indiceStr) : 2;
          const radicando = parseFloat(radicandoStr);
          if (isNaN(indice) || isNaN(radicando) || indice <= 0) {
            return "Error Sintaxis Raíz";
          }
          return `nthRoot(${radicando}, ${indice})`;
        }
      );

      console.log("Para evaluar con math.js:", valorPantalla);
      resultado = math.evaluate(valorPantalla);
      console.log("Resultado crudo de math.evaluate:", resultado);

      if (typeof resultado === "number" && isFinite(resultado)) {
        const epsilon = 1e-14;
        if (Math.abs(resultado) < epsilon) resultado = 0;
        else if (Math.abs(resultado - 1) < epsilon) resultado = 1;
        else if (Math.abs(resultado + 1) < epsilon) resultado = -1;
        else if (Math.abs(resultado - 0.5) < epsilon) resultado = 0.5;
        else if (Math.abs(resultado + 0.5) < epsilon) resultado = -0.5;
      }

      if (typeof resultado === "number") {
        if (!isFinite(resultado)) {
          resultado = "Error (Infinito)";
        } else if (resultado === 0) {
          // Ya ajustado, no hacer nada más para el 0
        } else if (
          Math.abs(resultado) > 1e12 ||
          (Math.abs(resultado) < 1e-9 && resultado !== 0)
        ) {
          resultado = math.format(resultado, {
            notation: "exponential",
            precision: 7,
          });
        } else {
          resultado = math.format(resultado, { precision: 14 });
          resultado = parseFloat(resultado);
        }
      } else if (typeof resultado === "undefined") {
        resultado = "Error";
      } else if (typeof resultado === "object" && resultado.toString) {
        if (resultado.isFraction) {
          resultado = resultado.toString();
        } else if (resultado.isComplex) {
          const realPart = math.format(resultado.re, {
            notation: "fixed",
            precision: 5,
          });
          const imagPartAbs = math.format(Math.abs(resultado.im), {
            notation: "fixed",
            precision: 5,
          });
          if (Math.abs(resultado.im) < 1e-9) {
            resultado = realPart;
          } else if (
            Math.abs(resultado.re) < 1e-9 &&
            Math.abs(resultado.im) >= 1e-9
          ) {
            resultado = `${resultado.im >= 0 ? "" : "-"} ${imagPartAbs}i`;
          } else {
            resultado = `${realPart} ${
              resultado.im >= 0 ? "+" : "-"
            } ${imagPartAbs}i`;
          }
          if (Math.abs(resultado.re) < 1e-9 && Math.abs(resultado.im) < 1e-9) {
            resultado = "0";
          }
        } else {
          resultado = "Error: Tipo desconocido";
        }
      }
    } catch (error) {
      console.error("Error en la expresión matemática:", error.message);
      if (error.message.toLowerCase().includes("division by zero")) {
        resultado = "Error (Div/0)";
      } else if (
        error.message.toLowerCase().includes("invalid or unexpected token") ||
        error.message.toLowerCase().includes("unexpected end of expression") ||
        error.message.toLowerCase().includes("value expected") ||
        error.message.toLowerCase().includes("parenthesis mismatch") ||
        error.message.toLowerCase().includes("undefined symbol") ||
        valorPantalla === "Error Sintaxis Raíz"
      ) {
        resultado = "Error Sintaxis";
      } else {
        resultado = "Error";
      }
    }
    pantallaActual.value = resultado.toString();
  }

  function retroceder() {
    if (!pantallaActual) return;
    pantallaActual.value = pantallaActual.value.slice(0, -1);
  }

  function agregarParentesis(valor) {
    if (!pantallaActual) return;
    pantallaActual.value += valor;
  }

  function quitarParentesis() {
    if (!pantallaActual) return;
    const valorActual = pantallaActual.value;
    if (valorActual.endsWith(")")) {
      pantallaActual.value = valorActual.slice(0, -1);
    } else {
      pantallaActual.value += ")";
    }
  }

  function cambiarSigno() {
    if (!pantallaActual) return;
    let valorActual = pantallaActual.value;
    if (valorActual.startsWith("-")) {
      pantallaActual.value = valorActual.substring(1);
    } else if (valorActual !== "" && valorActual !== "0") {
      pantallaActual.value = "-" + valorActual;
    } else if (valorActual === "") {
      pantallaActual.value = "-";
    }
  }

  // Dentro de tu DOMContentLoaded, reemplaza la función convertirAFraccion existente:

  function convertirAFraccion() {
    if (
      !pantallaActual ||
      pantallaActual.value.toLowerCase().includes("error") ||
      pantallaActual.value.trim() === ""
    ) {
      console.log("ConvertirAFraccion: Pantalla vacía o con error.");
      return;
    }

    let valorActual = pantallaActual.value.trim();
    let nuevoValor = "Error"; // Valor por defecto si algo falla

    // Regex para N/D (numerador / denominador)
    const regexFraccionSimple = /^\s*(-?\d+)\s*\/\s*(\d+)\s*$/;
    // Regex para W N/D (entero numerador / denominador)
    const regexNumeroMixto = /^\s*(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)\s*$/;

    const matchMixto = valorActual.match(regexNumeroMixto);
    const matchSimple = valorActual.match(regexFraccionSimple);

    try {
      if (matchMixto) {
        // ESTADO ACTUAL: Número Mixto (ej: "1 3/4" o "-2 1/3")
        // ACCIÓN: Convertir a Fracción Impropia (ej: "7/4" o "-7/3")
        console.log("Detectado Mixto -> a Impropia:", valorActual);
        const signoStr = matchMixto[1];
        const W = parseFloat(matchMixto[2]);
        const N_parte = parseFloat(matchMixto[3]); // Numerador de la parte fraccionaria
        const D_parte = parseFloat(matchMixto[4]); // Denominador de la parte fraccionaria

        if (D_parte === 0) throw new Error("Denominador cero en mixto");
        if (N_parte >= D_parte || N_parte < 0 || D_parte < 0)
          throw new Error("Fracción mal formada en mixto");

        const numeradorImpropio = W * D_parte + N_parte;
        nuevoValor = `${signoStr}${numeradorImpropio}/${D_parte}`;
      } else if (matchSimple) {
        // ESTADO ACTUAL: Fracción Simple N/D (ej: "7/4" o "3/4" o "4/1")
        console.log("Detectada Fracción Simple:", valorActual);
        const N = parseFloat(matchSimple[1]);
        const D = parseFloat(matchSimple[2]);

        if (D === 0) throw new Error("Denominador cero");

        if (Math.abs(N) >= D && D !== 1 && N % D !== 0) {
          // Es Impropia y no es un entero exacto (ej. 7/4, no 4/2 ni 3/1)
          // ACCIÓN: Convertir a Número Mixto (ej: "1 3/4")
          console.log("Impropia N/D -> a Mixta");
          const signo = N < 0 ? "-" : "";
          const absN = Math.abs(N);
          const W = Math.floor(absN / D);
          const nuevoN_parte = absN % D;

          nuevoValor = `${signo}${W} ${nuevoN_parte}/${D}`;
        } else {
          // Es Propia (ej. 3/4) o Entera (ej. 4/1, 6/2), convertir a DECIMAL
          console.log("Propia N/D o Entera -> a Decimal");
          const decimal = N / D;
          nuevoValor = formatearNumeroParaPantalla(decimal); // Usaremos una función de formateo consistente
        }
      } else {
        // ESTADO ACTUAL: Decimal o Expresión
        // ACCIÓN: Convertir a Fracción N/D (simplificada)
        console.log(
          "Detectado Decimal/Expresión -> a Fracción N/D:",
          valorActual
        );
        const numeroAEvaluar = math.evaluate(valorActual);
        if (typeof numeroAEvaluar !== "number" || !isFinite(numeroAEvaluar)) {
          throw new Error("Valor no es numérico finito");
        }
        const fraccion = math.fraction(numeroAEvaluar); // math.fraction ya simplifica

        if (fraccion.d === 1) {
          // Es un entero
          nuevoValor = fraccion.n.toString();
        } else {
          // Es una fracción propia o impropia
          nuevoValor = `${fraccion.n}/${fraccion.d}`;
        }
      }
      pantallaActual.value = nuevoValor;
    } catch (error) {
      console.error("Error en convertirAFraccion:", error.message);
      pantallaActual.value = "Error";
    }
  }
  // No olvides: window.convertirAFraccion = convertirAFraccion;

  // Función de ayuda para formatear el número decimal consistentemente (puedes ajustarla)
  // Esta es similar a la lógica que tienes en calcular() para formatear el resultado final.
  function formatearNumeroParaPantalla(numero) {
    if (typeof numero !== "number" || !isFinite(numero)) return "Error";

    const epsilon = 1e-14; // Misma tolerancia que en calcular()
    let resultadoTemporal = numero;

    if (Math.abs(resultadoTemporal) < epsilon) resultadoTemporal = 0;
    else if (Math.abs(resultadoTemporal - 1) < epsilon) resultadoTemporal = 1;
    else if (Math.abs(resultadoTemporal + 1) < epsilon) resultadoTemporal = -1;
    else if (Math.abs(resultadoTemporal - 0.5) < epsilon)
      resultadoTemporal = 0.5;
    else if (Math.abs(resultadoTemporal + 0.5) < epsilon)
      resultadoTemporal = -0.5;

    if (resultadoTemporal === 0) return "0";

    let formateado;
    if (
      Math.abs(resultadoTemporal) > 1e12 ||
      (Math.abs(resultadoTemporal) < 1e-9 && resultadoTemporal !== 0)
    ) {
      formateado = math.format(resultadoTemporal, {
        notation: "exponential",
        precision: 7,
      });
    } else {
      formateado = math.format(resultadoTemporal, { precision: 14 });
      formateado = parseFloat(formateado).toString(); // Quitar ceros decimales innecesarios
    }
    return formateado;
  }

  // --- Funciones de Memoria ---
  function actualizarIndicadorMemoria() {
    let indicadorElem = null;
    if (calculadoraActual === "basica") {
      indicadorElem = document.getElementById("memoriaIndicadorBasica");
    } else if (calculadoraActual === "cientifica") {
      indicadorElem = document.getElementById("memoriaIndicadorCientifica");
    }
    if (indicadorElem) {
      if (memoria !== 0) {
        indicadorElem.textContent = "M";
        indicadorElem.style.visibility = "visible";
      } else {
        indicadorElem.textContent = "";
        indicadorElem.style.visibility = "hidden";
      }
    }
    console.log("Memoria ahora es:", memoria);
  }

  function memoryClear() {
    memoria = 0;
    actualizarIndicadorMemoria();
  }

  function memoryRecall() {
    if (!pantallaActual) return;
    const valorPrevio = pantallaActual.value;
    if (
      ["Error", "Error Sintaxis", "Error (Div/0)", "Error (Infinito)"].includes(
        valorPrevio
      ) ||
      valorPrevio === "0" ||
      valorPrevio === ""
    ) {
      pantallaActual.value = memoria.toString();
    } else {
      agregar(memoria.toString()); // O reemplazar: pantallaActual.value = memoria.toString();
    }
  }

  function memoryStore() {
    if (!pantallaActual) return;
    try {
      const valorAEvaluar = math.evaluate(pantallaActual.value || "0");
      if (typeof valorAEvaluar === "number" && isFinite(valorAEvaluar)) {
        memoria = valorAEvaluar;
        actualizarIndicadorMemoria();
      } else {
        pantallaActual.value = "Error MS";
      }
    } catch (e) {
      console.error("MS: Error al evaluar:", e);
      pantallaActual.value = "Error MS";
    }
  }

  function memoryAdd() {
    if (!pantallaActual) return;
    try {
      const valorAEvaluar = math.evaluate(pantallaActual.value || "0");
      if (typeof valorAEvaluar === "number" && isFinite(valorAEvaluar)) {
        memoria = math.add(memoria, valorAEvaluar);
        actualizarIndicadorMemoria();
      } else {
        pantallaActual.value = "Error M+";
      }
    } catch (e) {
      console.error("M+: Error al evaluar:", e);
      pantallaActual.value = "Error M+";
    }
  }

  function memorySubtract() {
    if (!pantallaActual) return;
    try {
      const valorAEvaluar = math.evaluate(pantallaActual.value || "0");
      if (typeof valorAEvaluar === "number" && isFinite(valorAEvaluar)) {
        memoria = math.subtract(memoria, valorAEvaluar);
        actualizarIndicadorMemoria();
      } else {
        pantallaActual.value = "Error M-";
      }
    } catch (e) {
      console.error("M-: Error al evaluar:", e);
      pantallaActual.value = "Error M-";
    }
  }

  // --- Funciones para Solver de Polinomios ---
  let miModalPolinomios;
  const modalPolinomioElement = document.getElementById("polinomioModal");
  if (modalPolinomioElement) {
    miModalPolinomios = new bootstrap.Modal(modalPolinomioElement);
    modalPolinomioElement.addEventListener("hidden.bs.modal", function () {
      if (
        document.activeElement &&
        modalPolinomioElement.contains(document.activeElement)
      ) {
        document.activeElement.blur();
      }
      const triggerButtonPoly = document.querySelector(
        'input[type="button"][value="P(x)"]'
      );
      if (triggerButtonPoly) {
        triggerButtonPoly.focus();
      }
    });
  } else {
    console.warn(
      "Elemento del modal #polinomioModal no encontrado al inicializar."
    );
  }

  function configurarInputsPolinomio() {
    const gradoSelect = document.getElementById("gradoPolinomio");
    if (!gradoSelect) {
      console.warn("Select 'gradoPolinomio' no encontrado.");
      return;
    }
    const grado = parseInt(gradoSelect.value);
    const uiParts = {
      coefA_row: document.getElementById("coefA")?.parentElement?.parentElement,
      coefB_row: document.getElementById("coefB")?.parentElement?.parentElement,
      coefC_row: document.getElementById("coefC")?.parentElement?.parentElement,
      coefD_row: document.getElementById("coefD")?.parentElement?.parentElement,
      label_a_text: document.querySelector("#label_a label"),
      coefA_input: document.getElementById("coefA"),
      label_b_text: document.querySelector("#label_b label"),
      coefB_input: document.getElementById("coefB"),
      label_c_text: document.querySelector("#label_c label"),
      coefC_input: document.getElementById("coefC"),
      label_d_text: document.querySelector("#label_d label"),
      coefD_input: document.getElementById("coefD"),
      raicesOutput: document.getElementById("raicesOutput"),
    };
    if (uiParts.coefA_row)
      uiParts.coefA_row.style.display = grado === 3 ? "" : "none";
    if (uiParts.coefB_row)
      uiParts.coefB_row.style.display = grado >= 2 ? "" : "none";
    if (uiParts.coefC_row)
      uiParts.coefC_row.style.display = grado >= 1 ? "" : "none";
    if (uiParts.coefD_row)
      uiParts.coefD_row.style.display = grado >= 1 ? "" : "none";
    if (grado === 1) {
      if (uiParts.label_c_text) uiParts.label_c_text.textContent = "a (x):";
      if (uiParts.coefC_input)
        uiParts.coefC_input.placeholder = "Coeficiente de x (a)";
      if (uiParts.label_d_text)
        uiParts.label_d_text.textContent = "b (constante):";
      if (uiParts.coefD_input)
        uiParts.coefD_input.placeholder = "Término constante (b)";
    } else if (grado === 2) {
      if (uiParts.label_b_text) uiParts.label_b_text.textContent = "a (x²):";
      if (uiParts.coefB_input)
        uiParts.coefB_input.placeholder = "Coeficiente de x² (a)";
      if (uiParts.label_c_text) uiParts.label_c_text.textContent = "b (x):";
      if (uiParts.coefC_input)
        uiParts.coefC_input.placeholder = "Coeficiente de x (b)";
      if (uiParts.label_d_text)
        uiParts.label_d_text.textContent = "c (constante):";
      if (uiParts.coefD_input)
        uiParts.coefD_input.placeholder = "Término constante (c)";
    } else {
      if (uiParts.label_a_text) uiParts.label_a_text.textContent = "a (x³):";
      if (uiParts.coefA_input)
        uiParts.coefA_input.placeholder = "Coeficiente de x³ (a)";
      if (uiParts.label_b_text) uiParts.label_b_text.textContent = "b (x²):";
      if (uiParts.coefB_input)
        uiParts.coefB_input.placeholder = "Coeficiente de x² (b)";
      if (uiParts.label_c_text) uiParts.label_c_text.textContent = "c (x):";
      if (uiParts.coefC_input)
        uiParts.coefC_input.placeholder = "Coeficiente de x (c)";
      if (uiParts.label_d_text)
        uiParts.label_d_text.textContent = "d (constante):";
      if (uiParts.coefD_input)
        uiParts.coefD_input.placeholder = "Término constante (d)";
    }
    if (uiParts.raicesOutput) uiParts.raicesOutput.innerHTML = "";
  }
  function abrirModalPolinomios() {
    if (miModalPolinomios) {
      configurarInputsPolinomio();
      miModalPolinomios.show();
      setTimeout(() => {
        const gs = document.getElementById("gradoPolinomio");
        if (gs) gs.focus();
      }, 200);
    } else {
      console.error("Modal polinomios no definido.");
      alert("Error: Solver no disponible.");
    }
  }
  function resolverPolinomioDesdeModal() {
    const gradoSelect = document.getElementById("gradoPolinomio");
    if (!gradoSelect) return;
    const grado = parseInt(gradoSelect.value);
    const raicesOutput = document.getElementById("raicesOutput");
    if (!raicesOutput) return;
    raicesOutput.innerHTML = "";
    let a_poly, b_poly, c_poly, d_poly;
    let raices = [];
    try {
      if (grado === 1) {
        a_poly = parseFloat(document.getElementById("coefC").value);
        b_poly = parseFloat(document.getElementById("coefD").value);
        if (isNaN(a_poly) || isNaN(b_poly))
          throw new Error("Coeficientes inválidos.");
        if (math.equal(a_poly, 0)) {
          raicesOutput.innerHTML = math.equal(b_poly, 0)
            ? "<p>Infinitas soluciones</p>"
            : "<p>Sin solución</p>";
          return;
        }
        raices = [-b_poly / a_poly];
      } else if (grado === 2) {
        a_poly = parseFloat(document.getElementById("coefB").value);
        b_poly = parseFloat(document.getElementById("coefC").value);
        c_poly = parseFloat(document.getElementById("coefD").value);
        if (isNaN(a_poly) || isNaN(b_poly) || isNaN(c_poly))
          throw new Error("Coeficientes inválidos.");
        if (math.equal(a_poly, 0)) {
          if (math.equal(b_poly, 0)) {
            raicesOutput.innerHTML = math.equal(c_poly, 0)
              ? "<p>Infinitas soluciones</p>"
              : "<p>Sin solución</p>";
            return;
          }
          raices = [-c_poly / b_poly];
        } else {
          const disc = math.subtract(math.pow(b_poly, 2), 4 * a_poly * c_poly);
          if (math.largerEq(disc, 0)) {
            const r1 = math.divide(
              math.add(-b_poly, math.sqrt(disc)),
              2 * a_poly
            );
            const r2 = math.divide(
              math.subtract(-b_poly, math.sqrt(disc)),
              2 * a_poly
            );
            raices = math.equal(r1, r2) ? [r1] : [r1, r2];
          } else {
            const realP = -b_poly / (2 * a_poly);
            const imagP = math.divide(
              math.sqrt(math.multiply(disc, -1)),
              2 * a_poly
            );
            raices = [math.complex(realP, imagP), math.complex(realP, -imagP)];
          }
        }
      } else if (grado === 3) {
        a_poly = parseFloat(document.getElementById("coefA").value);
        b_poly = parseFloat(document.getElementById("coefB").value);
        c_poly = parseFloat(document.getElementById("coefC").value);
        d_poly = parseFloat(document.getElementById("coefD").value);
        if (isNaN(a_poly) || isNaN(b_poly) || isNaN(c_poly) || isNaN(d_poly))
          throw new Error("Coeficientes inválidos.");
        if (math.equal(a_poly, 0)) {
          raicesOutput.innerHTML = "<p>a=0, usar solver grado 2.</p>";
          return;
        }
        const Bn = b_poly / a_poly,
          Cn = c_poly / a_poly,
          Dn = d_poly / a_poly;
        const p = (3 * Cn - Bn * Bn) / 3,
          q = (2 * Bn * Bn * Bn - 9 * Bn * Cn + 27 * Dn) / 27;
        const delta = (q / 2) * (q / 2) + (p / 3) * (p / 3) * (p / 3);
        const prec = 1e-9;
        if (
          math.abs(delta) < prec &&
          math.abs(p) < prec &&
          math.abs(q) < prec
        ) {
          const y0 = 0;
          raices = [y0 - Bn / 3, y0 - Bn / 3, y0 - Bn / 3];
        } else if (math.abs(delta) < prec) {
          const y1 = -2 * math.cbrt(q / 2),
            y2 = math.cbrt(q / 2);
          raices = [y1 - Bn / 3, y2 - Bn / 3, y2 - Bn / 3];
        } else if (delta > 0) {
          const u_s_d = math.sqrt(delta);
          const u_b_c = math.add(-q / 2, u_s_d);
          const v_b_c = math.subtract(-q / 2, u_s_d);
          const u_r = math.cbrt(u_b_c);
          const v_r = math.cbrt(v_b_c);
          const y1_r = math.add(u_r, v_r);
          const y2_r_re = math.divide(math.multiply(math.add(u_r, v_r), -1), 2);
          const y2_r_im = math.divide(
            math.multiply(math.subtract(u_r, v_r), math.sqrt(3)),
            2
          );
          raices = [
            y1_r - Bn / 3,
            math.complex(y2_r_re - Bn / 3, y2_r_im),
            math.complex(y2_r_re - Bn / 3, -y2_r_im),
          ];
        } else {
          const r_cub = math.sqrt(-math.pow(p / 3, 3));
          let phi_arg = -q / (2 * r_cub);
          if (phi_arg > 1) phi_arg = 1;
          if (phi_arg < -1) phi_arg = -1;
          const phi = math.acos(phi_arg);
          const two_cbrt_r = 2 * math.cbrt(r_cub);
          const y1_r = two_cbrt_r * math.cos(phi / 3);
          const y2_r = two_cbrt_r * math.cos((phi + 2 * math.pi) / 3);
          const y3_r = two_cbrt_r * math.cos((phi + 4 * math.pi) / 3);
          raices = [y1_r - Bn / 3, y2_r - Bn / 3, y3_r - Bn / 3];
        }
      }
      if (raices.length > 0) {
        raicesOutput.innerHTML = raices
          .map((r, i) => {
            let rs;
            if (typeof r === "number") {
              rs = math.format(r, { notation: "fixed", precision: 5 });
            } else if (
              r &&
              typeof r.re !== "undefined" &&
              typeof r.im !== "undefined"
            ) {
              const rp = math.format(r.re, { notation: "fixed", precision: 5 });
              const ipa = math.format(Math.abs(r.im), {
                notation: "fixed",
                precision: 5,
              });
              if (Math.abs(r.im) < 1e-9) {
                rs = rp;
              } else if (Math.abs(r.re) < 1e-9 && Math.abs(r.im) >= 1e-9) {
                rs = `${r.im >= 0 ? "" : "-"} ${ipa}i`;
              } else {
                rs = `${rp} ${r.im >= 0 ? "+" : "-"} ${ipa}i`;
              }
              if (Math.abs(r.re) < 1e-9 && Math.abs(r.im) < 1e-9) {
                rs = "0";
              }
            } else {
              rs = String(r);
            }
            return `<p>x<sub>${i + 1}</sub> = ${rs}</p>`;
          })
          .join("");
      } else if (raicesOutput.innerHTML === "") {
        raicesOutput.innerHTML =
          "<p>No se encontraron raíces o grado no soportado.</p>";
      }
    } catch (e) {
      console.error("Error al resolver polinomio:", e);
      raicesOutput.innerHTML = `<p class="text-danger">Error: ${
        e.message || "Error desconocido"
      }</p>`;
    }
  }
  // FIN CÓDIGO DE POLINOMIOS

  // --- Funciones de la Calculadora Financiera ---
  function setFinancialResult(elementId, value) {
    const elem = document.getElementById(elementId);
    if (!elem) return;
    if (typeof value === "number" && isFinite(value)) {
      elem.value = value.toFixed(2);
    } else {
      elem.value = "";
    }
  }
  function getFinancialInput(elementId, defaultValue = 0) {
    const elem = document.getElementById(elementId);
    const val = parseFloat(elem?.value);
    return isNaN(val) ? defaultValue : val;
  }
  function calcularPV() {
    const fv = getFinancialInput("fv");
    const rate = getFinancialInput("rate") / 100;
    const n = getFinancialInput("n");
    const pmt = getFinancialInput("pmt");
    try {
      if (n <= 0 && !(n === 0 && pmt === 0 && math.equal(rate, 0)))
        throw new Error("N debe ser > 0.");
      let pv_calc;
      if (math.equal(rate, 0)) {
        pv_calc = -(fv + pmt * n);
      } else {
        pv_calc =
          (pmt * (1 - Math.pow(1 + rate, -n))) / rate +
          fv / Math.pow(1 + rate, n);
      }
      setFinancialResult("pv", pv_calc);
    } catch (error) {
      setFinancialResult("pv", "");
      console.error("Error en calcularPV:", error.message);
    }
  }
  function calcularFV() {
    const pv = getFinancialInput("pv");
    const rate = getFinancialInput("rate") / 100;
    const n = getFinancialInput("n");
    const pmt = getFinancialInput("pmt");
    try {
      if (n < 0) throw new Error("N no puede ser negativo.");
      let fv_calc;
      if (math.equal(rate, 0)) {
        fv_calc = -(pv + pmt * n);
      } else {
        fv_calc =
          pv * Math.pow(1 + rate, n) +
          pmt * ((Math.pow(1 + rate, n) - 1) / rate);
      }
      setFinancialResult("fv", fv_calc);
    } catch (error) {
      setFinancialResult("fv", "");
      console.error("Error en calcularFV:", error.message);
    }
  }
  function calcularPMT() {
    const pv = getFinancialInput("pv");
    const fv = getFinancialInput("fv");
    const rate = getFinancialInput("rate") / 100;
    const n = getFinancialInput("n");
    try {
      if (n <= 0) throw new Error("N debe ser > 0.");
      let pmt_calc;
      if (math.equal(rate, 0)) {
        if (n === 0) throw new Error("N y Tasa no pueden ser 0 para PMT");
        pmt_calc = -(pv + fv) / n;
      } else {
        let num = fv - pv * Math.pow(1 + rate, n);
        let den = (Math.pow(1 + rate, n) - 1) / rate;
        if (Math.abs(den) < 1e-10) throw new Error("Tasa inválida para PMT.");
        pmt_calc = num / den;
      }
      setFinancialResult("pmt", pmt_calc);
    } catch (error) {
      setFinancialResult("pmt", "");
      console.error("Error en calcularPMT:", error.message);
    }
  }
  function calcularN() {
    const pv = getFinancialInput("pv");
    const fv = getFinancialInput("fv");
    const rate = getFinancialInput("rate") / 100;
    const pmt = getFinancialInput("pmt");
    try {
      if (rate < 0)
        throw new Error("La tasa no puede ser negativa para calcular N.");
      let n_calc;
      if (math.equal(rate, 0)) {
        if (math.equal(pmt, 0))
          throw new Error("PMT y Tasa no pueden ser 0 para N");
        n_calc = -(pv + fv) / pmt;
        if (n_calc < 0) throw new Error("N negativo, verificar entradas.");
      } else {
        if (pmt !== 0) {
          const term1 = pmt - fv * rate;
          const term2 = pmt + pv * rate;
          if (term1 === 0 && term2 === 0)
            throw new Error("Valores indeterminados para N");
          if (term1 * term2 <= 0)
            throw new Error("Cálculo de N no posible (log de neg/cero)");
          n_calc = Math.log(term1 / term2) / Math.log(1 + rate);
        } else if (pv !== 0 && fv !== 0) {
          if (pv * fv >= 0)
            throw new Error("PV y FV deben tener signos opuestos si PMT=0");
          n_calc = Math.log(-fv / pv) / Math.log(1 + rate);
        } else {
          throw new Error("Valores insuficientes para calcular N");
        }
        if (n_calc < 0) throw new Error("N negativo, verificar entradas.");
      }
      setFinancialResult("n", n_calc);
    } catch (error) {
      setFinancialResult("n", "");
      console.error("Error en calcularN:", error.message);
    }
  }
  function calcularRate() {
    const pv = getFinancialInput("pv");
    const fv = getFinancialInput("fv");
    const n = getFinancialInput("n");
    const pmt = getFinancialInput("pmt");
    const resultOutput = document.getElementById("rate");
    if (!resultOutput) return;
    if (n <= 0) {
      resultOutput.value = "";
      console.error("Error en calcularRate: N debe ser > 0");
      return;
    }
    let rate_calc = 0.1;
    const MAX_ITERATIONS = 100;
    const PRECISION = 1e-7;
    try {
      if (pmt === 0) {
        if (pv === 0) {
          resultOutput.value = "";
          console.error("PV no puede ser 0 si PMT es 0 para calcular tasa.");
          return;
        }
        if ((fv > 0 && pv > 0 && fv < pv) || (fv < 0 && pv < 0 && fv > pv)) {
          throw new Error("FV y PV implican tasa negativa si PMT=0.");
        }
        let baseRate = fv / pv;
        if (baseRate < 0) baseRate = -baseRate;
        rate_calc = Math.pow(baseRate, 1 / n) - 1;
        if (pv > 0 && fv > 0 && fv < pv) {
          throw new Error("Caso de depreciación no manejado.");
        }
        setFinancialResult("rate", rate_calc * 100);
        return;
      }
      for (let i = 0; i < MAX_ITERATIONS; i++) {
        let f_val, df_val;
        const term_N = Math.pow(1 + rate_calc, n);
        const term_N_m1 = Math.pow(1 + rate_calc, n - 1);
        if (Math.abs(rate_calc) < 1e-10) {
          f_val = pv + pmt * n + fv;
          df_val = n * pv + (pmt * n * (n - 1)) / 2 - n * fv;
          if (Math.abs(df_val) < 1e-10) df_val = pv > 0 ? -1e-10 : 1e-10;
        } else {
          f_val = pv * term_N + (pmt * (term_N - 1)) / rate_calc + fv;
          df_val =
            n * pv * term_N_m1 +
            (pmt * (n * term_N_m1 * rate_calc - (term_N - 1))) /
              (rate_calc * rate_calc) -
            n * fv * Math.pow(1 + rate_calc, -n - 1);
        }
        if (Math.abs(df_val) < 1e-10) {
          throw new Error("Derivada cero (Rate)");
        }
        const new_rate = rate_calc - f_val / df_val;
        if (Math.abs(new_rate - rate_calc) < PRECISION) {
          setFinancialResult("rate", new_rate * 100);
          return;
        }
        rate_calc = new_rate;
        if (rate_calc < -0.9999) {
          throw new Error("Tasa fuera de rango.");
        }
      }
      throw new Error("Tasa no convergió");
    } catch (error) {
      console.error("Error en calcularRate:", error.message);
      setFinancialResult("rate", "");
    }
  }
  function limpiarFinanciera() {
    ["pv", "fv", "pmt", "n", "rate"].forEach((id) => {
      const elem = document.getElementById(id);
      if (elem) elem.value = "";
    });
  }
  // FIN DE FUNCIONES FINANCIERAS

  // --- Funciones para el Modo Angular ---
  function cambiarAnguloModo() {
    if (anguloModoActual === "RAD") {
      anguloModoActual = "DEG";
      if (btnAnguloModoElem) btnAnguloModoElem.value = "DEG";
    } else {
      anguloModoActual = "RAD";
      if (btnAnguloModoElem) btnAnguloModoElem.value = "RAD";
    }
    console.log("Modo angular cambiado a:", anguloModoActual);
  }
  // Ya no se necesitan presionarSin, etc. si los botones llaman a agregar() y calcular() hace la transformación.

  // --- Inicialización de Calculadoras y Sidebar ---
  function inicializarCalculadoras() {
    const sidebarCollapse = document.getElementById("sidebarCollapse");
    if (sidebarCollapse) {
      sidebarCollapse.addEventListener("click", () => {
        document.getElementById("sidebar")?.classList.toggle("active");
        document.getElementById("content")?.classList.toggle("active");
      });
    }

    document
      .getElementById("calcularPV")
      ?.addEventListener("click", calcularPV);
    document
      .getElementById("calcularFV")
      ?.addEventListener("click", calcularFV);
    document
      .getElementById("calcularPMT")
      ?.addEventListener("click", calcularPMT);
    document.getElementById("calcularN")?.addEventListener("click", calcularN);
    document
      .getElementById("calcularRate")
      ?.addEventListener("click", calcularRate);
    document
      .getElementById("limpiarFinanciera")
      ?.addEventListener("click", limpiarFinanciera);

    btnAnguloModoElem = document.getElementById("btnAnguloModo"); // Asegurar que se obtiene aquí también

    cambiarCalculadora("basica");
  }

  function cambiarCalculadora(tipo) {
    console.log("Cambiando a calculadora:", tipo); // Debug

    // Ocultar todas las calculadoras
    document.querySelectorAll(".calculadora-container").forEach((calc) => {
      calc.style.display = "none";
    });

    // Mostrar la calculadora seleccionada
    const contenedores = {
      basica: "calculadoraBasica",
      cientifica: "calculadoraCientifica",
      financiera: "calculadoraFinanciera",
      tabla: "tablaDerivadas",
    };

    const contenedorId = contenedores[tipo];
    console.log("Intentando mostrar contenedor:", contenedorId); // Debug

    const contenedor = document.getElementById(contenedorId);
    if (contenedor) {
      contenedor.style.display = "block";
      console.log("Contenedor encontrado y mostrado"); // Debug

      // Actualizar la pantalla actual
      if (tipo === "basica") {
        pantallaActual = document.getElementById("pantallaBasica");
      } else if (tipo === "cientifica") {
        pantallaActual = pantallaCientifica;
        if (!btnAnguloModoElem) {
          btnAnguloModoElem = document.getElementById("btnAnguloModo");
        }
        if (btnAnguloModoElem) btnAnguloModoElem.value = anguloModoActual;
      } else {
        pantallaActual = null;
      }
      if (pantallaActual) {
        pantallaActual.value = "";
      }
    } else {
      console.error("No se encontró el contenedor:", contenedorId);
    }

    calculadoraActual = tipo;

    // Actualizar clase activa en el menú
    document.querySelectorAll("#sidebar .nav-link").forEach((link) => {
      link.classList.remove("active");
    });

    const linkActivo = document.querySelector(
      `a[onclick*="cambiarCalculadora('${tipo}')"]`
    );
    if (linkActivo) {
      linkActivo.classList.add("active");
    }

    // En móviles, cerrar el sidebar después de seleccionar
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById("sidebar");
      if (sidebar) {
        sidebar.classList.remove("active");
      }
    }
  }

  // --- Exponer funciones al ámbito global ---
  window.agregar = agregar;
  window.borrar = borrar;
  window.calcular = calcular;
  window.retroceder = retroceder;
  window.agregarParentesis = agregarParentesis;
  window.quitarParentesis = quitarParentesis;
  window.cambiarSigno = cambiarSigno;
  window.convertirAFraccion = convertirAFraccion;

  window.abrirModalPolinomios = abrirModalPolinomios;
  window.resolverPolinomioDesdeModal = resolverPolinomioDesdeModal;
  window.configurarInputsPolinomio = configurarInputsPolinomio;

  window.cambiarCalculadora = cambiarCalculadora;

  window.calcularPV = calcularPV;
  window.calcularFV = calcularFV;
  window.calcularPMT = calcularPMT;
  window.calcularN = calcularN;
  window.calcularRate = calcularRate;
  window.limpiarFinanciera = limpiarFinanciera;

  window.cambiarAnguloModo = cambiarAnguloModo;
  // Ya no se exponen presionarSin, etc.

  if (document.getElementById("gradoPolinomio")) {
    configurarInputsPolinomio();
  }

  // --- EventListener para el Teclado ---
  function manejarTeclado(e) {
    const esInputDelModalActivo =
      document.querySelector("#polinomioModal.show .modal-body input:focus") ||
      document.querySelector(
        '#calculadoraFinanciera.calculadora-container[style*="block"] input:focus'
      );

    if (esInputDelModalActivo) {
      if (document.querySelector("#polinomioModal.show") && e.key === "Enter") {
        e.preventDefault();
        resolverPolinomioDesdeModal();
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (miModalPolinomios && document.querySelector("#polinomioModal.show"))
          miModalPolinomios.hide();
      }
      return;
    }

    if (calculadoraActual !== "basica" && calculadoraActual !== "cientifica")
      return;
    if (!pantallaActual) return;

    const tecla = e.key;
    let prevenirAccionPorDefecto = true;

    const NumpadKeyMap = {
      Numpad0: "0",
      Numpad1: "1",
      Numpad2: "2",
      Numpad3: "3",
      Numpad4: "4",
      Numpad5: "5",
      Numpad6: "6",
      Numpad7: "7",
      Numpad8: "8",
      Numpad9: "9",
      NumpadAdd: "+",
      NumpadSubtract: "-",
      NumpadMultiply: "*",
      NumpadDivide: "/",
      NumpadDecimal: ".",
      NumpadEnter: "=",
    };

    const teclaMapeada = NumpadKeyMap[tecla] || tecla;

    if (teclaMapeada >= "0" && teclaMapeada <= "9") {
      agregar(teclaMapeada);
    } else {
      switch (teclaMapeada) {
        case ".":
          agregar(teclaMapeada);
          break;
        case "+":
          agregar(teclaMapeada);
          break;
        case "-":
          agregar(teclaMapeada);
          break;
        case "*":
          agregar(teclaMapeada);
          break;
        case "/":
          agregar(teclaMapeada);
          break;
        case "%":
          agregar(teclaMapeada);
          break;
        case "^":
          agregar(teclaMapeada);
          break;
        case "(":
          agregarParentesis(teclaMapeada);
          break;
        case ")":
          quitarParentesis();
          break;
        case "Enter":
        case "=":
          calcular();
          break;
        case "Backspace":
          retroceder();
          break;
        case "Delete":
        case "Escape":
          borrar();
          break;
        default:
          prevenirAccionPorDefecto = false;
          break;
      }
    }

    if (prevenirAccionPorDefecto) {
      e.preventDefault();
    }
  }

  document.addEventListener("keydown", manejarTeclado);
  inicializarCalculadoras();

  console.log(
    "Calculadora Multifuncional completamente lista con modo angular."
  );
});
