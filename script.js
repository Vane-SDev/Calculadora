// script.js
document.addEventListener("DOMContentLoaded", function () {
  const pantallaCientifica = document.getElementById("pantalla");
  const pantallaBasica = document.getElementById("pantallaBasica");

  let pantallaActual = null;
  let calculadoraActual = "basica";

  // --- Variables y Lógica para Modo Angular (DEG/RAD) ---
  let anguloModoActual = "RAD";
  let btnAnguloModoElem = document.getElementById("btnAnguloModo"); // Intentar inicializar aquí

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

  if (!btnAnguloModoElem && document.getElementById("calculadoraCientifica")) {
    console.warn("ADVERTENCIA: Botón #btnAnguloModo no encontrado al inicio.");
  }
  if (!pantallaCientifica && document.getElementById("calculadoraCientifica")) {
    console.warn(
      "ADVERTENCIA: Elemento #pantalla (de la calc. científica) no encontrado."
    );
  }
  if (!pantallaBasica && document.getElementById("calculadoraBasica")) {
    console.warn("ADVERTENCIA: Elemento #pantallaBasica no encontrado.");
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
      // 1. Transformar "ln(" a "log(" (math.js usa log para natural)
      valorPantalla = valorPantalla.replace(/ln\(/g, "log(");

      // 2. Transformar "log(" (que el usuario entiende como base 10) a "log10("
      valorPantalla = valorPantalla.replace(
        /(?<![a-zA-Z0-9_])log\(/g,
        "log10("
      );

      // 3. Si estamos en modo DEG (y en la calculadora científica), transformar funciones trigonométricas
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
      // --- Fin Transformaciones para UX ---

      if (valorPantalla.includes("%")) {
        valorPantalla = manejarPorcentajes(valorPantalla);
      }

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

      console.log("Resultado crudo de math.evaluate:", resultado); // Log para ver el valor antes de ajustar

      // ****** NUEVO: Ajuste inteligente para valores cercanos a exactos ******
      if (typeof resultado === "number" && isFinite(resultado)) {
        const epsilon = 1e-14; // Una tolerancia pequeña para la comparación

        // Ajustar a 0
        if (Math.abs(resultado) < epsilon) {
          resultado = 0;
          console.log("Resultado ajustado a 0 exacto.");
        }
        // Ajustar a 1
        else if (Math.abs(resultado - 1) < epsilon) {
          resultado = 1;
          console.log("Resultado ajustado a 1 exacto.");
        }
        // Ajustar a -1
        else if (Math.abs(resultado + 1) < epsilon) {
          // resultado - (-1) es resultado + 1
          resultado = -1;
          console.log("Resultado ajustado a -1 exacto.");
        }
        // Ajustar a 0.5
        else if (Math.abs(resultado - 0.5) < epsilon) {
          resultado = 0.5;
          console.log("Resultado ajustado a 0.5 exacto.");
        }
        // Ajustar a -0.5
        else if (Math.abs(resultado + 0.5) < epsilon) {
          resultado = -0.5;
          console.log("Resultado ajustado a -0.5 exacto.");
        }
        // Podrías añadir más ajustes si lo ves necesario para otros valores comunes, por ejemplo:
        // else if (Math.abs(resultado - math.sqrt(2)/2) < epsilon) {
        //     resultado = math.evaluate('sqrt(2)/2'); // Para mantener la precisión de math.js
        //     console.log("Resultado ajustado a sqrt(2)/2 exacto.");
        // }
        // else if (Math.abs(resultado - math.sqrt(3)/2) < epsilon) {
        //     resultado = math.evaluate('sqrt(3)/2');
        //     console.log("Resultado ajustado a sqrt(3)/2 exacto.");
        // }
      }

      if (typeof resultado === "number") {
        if (!isFinite(resultado)) {
          resultado = "Error (Infinito)";
        } else if (resultado === 0) {
          // Mostrar 0 simplemente como "0"
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

  function convertirAFraccion() {
    if (
      !pantallaActual ||
      pantallaActual.value === "" ||
      pantallaActual.value.toLowerCase().includes("error")
    )
      return;
    try {
      const valorActual = pantallaActual.value;
      const numeroAEvaluar = math.evaluate(valorActual);
      if (typeof numeroAEvaluar === "number" && isFinite(numeroAEvaluar)) {
        const fraccion = math.fraction(numeroAEvaluar);
        pantallaActual.value =
          fraccion.d === 1
            ? fraccion.n.toString()
            : `${fraccion.n}/${fraccion.d}`;
      } else {
        pantallaActual.value = "Error (No num)";
      }
    } catch (error) {
      console.error("Error al convertir a fracción:", error);
      pantallaActual.value = "Error";
    }
  }

  // --- Funciones para Solver de Polinomios ---
  // (Aquí va el código completo de las funciones: miModalPolinomios, configurarInputsPolinomio,
  // abrirModalPolinomios, resolverPolinomioDesdeModal que te pasé en el Turno 51/53/55)
  // ... (ASEGÚRATE DE PEGAR TU CÓDIGO COMPLETO DEL SOLVER DE POLINOMIOS AQUÍ) ...
  // COMIENZO DEL CÓDIGO DE POLINOMIOS (PEGAR AQUÍ EL DEL TURNO 55)
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
  // (Aquí va el código completo de las funciones: setFinancialResult, getFinancialInput,
  // calcularPV, calcularFV, calcularPMT, calcularN, calcularRate, limpiarFinanciera)
  // ... (ASEGÚRATE DE PEGAR TU CÓDIGO COMPLETO DE CALCULADORA FINANCIERA AQUÍ) ...
  function setFinancialResult(elementId, value) {
    const elem = document.getElementById(elementId);
    if (!elem) return;
    if (typeof value === "number" && isFinite(value)) {
      elem.value = value.toFixed(2);
    } else {
      elem.value = "";
      // console.error(`Error o valor no numérico para ${elementId}:`, value);
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
        } // Evitar división por cero, y usar una derivada más simple para r=0
        else {
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
        } // Evitar tasa < -100%
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

  // ****** NUEVO: Funciones para el Modo Angular ******
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

    btnAnguloModoElem = document.getElementById("btnAnguloModo"); // Asegurar que se obtiene aquí

    cambiarCalculadora("basica");
  }

  function cambiarCalculadora(tipo) {
    document.querySelectorAll(".calculadora-container").forEach((calc) => {
      if (calc) calc.style.display = "none";
    });

    const contenedores = {
      basica: "calculadoraBasica",
      cientifica: "calculadoraCientifica",
      financiera: "calculadoraFinanciera",
      tabla: "tablaDerivadas",
    };

    const contenedorId = contenedores[tipo];
    const contenedor = document.getElementById(contenedorId);

    if (contenedor) {
      contenedor.style.display = "block";
      if (tipo === "basica") {
        pantallaActual = document.getElementById("pantallaBasica");
      } else if (tipo === "cientifica") {
        pantallaActual = pantallaCientifica;
        if (!btnAnguloModoElem) {
          // Intentar obtenerlo de nuevo si no se obtuvo al inicio
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
      console.warn(
        `Contenedor no encontrado para el tipo: ${tipo} con ID: ${contenedorId}`
      );
      pantallaActual = null;
    }

    calculadoraActual = tipo;

    document.querySelectorAll("#sidebar .nav-link").forEach((link) => {
      link.classList.remove("active");
    });
    const linkActivo = document.querySelector(
      `#sidebar a[onclick*="cambiarCalculadora('${tipo}')"]`
    );
    if (linkActivo) {
      linkActivo.classList.add("active");
    }

    if (
      window.innerWidth <= 768 &&
      document.getElementById("sidebar")?.classList.contains("active")
    ) {
      // Solo cerrar si está activo
      document.getElementById("sidebar")?.classList.remove("active");
      document.getElementById("content")?.classList.remove("active"); // Sincronizar content
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
  // Ya no necesitamos presionarSin, presionarCos, etc., porque los botones llaman a agregar()
  // y calcular() se encarga de la lógica DEG/RAD.

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
        // También cerrar otros modales si los hubiera y estuvieran abiertos
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
