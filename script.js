// script.js
document.addEventListener("DOMContentLoaded", function () {
  // Referencias a pantallas (la científica es 'pantalla', la básica es 'pantallaBasica')
  const pantallaCientifica = document.getElementById("pantalla");
  const pantallaBasica = document.getElementById("pantallaBasica");
  // const indiceInput = document.getElementById("indice"); // Sigue disponible si lo necesitas

  let pantallaActual = null; // Se asignará en cambiarCalculadora()
  let calculadoraActual = "basica";

  try {
    math.import(
      {
        ln: function (x) {
          // Definimos nuestra función 'ln'
          return math.log(x); // Hacemos que llame a math.log(x), que es el logaritmo natural
        },
        // Para que el botón "log" que escribe "log(" funcione como logaritmo base 10
        log: function (x) {
          return math.log10(x); // math.log10(x) es logaritmo base 10
        },
        // Si en el futuro añades sind, cosd, etc., irían aquí también, separados por comas:
        // sind: function(angle) { return math.sin(math.unit(angle, 'deg')); },
        // cosd: function(angle) { return math.cos(math.unit(angle, 'deg')); }
      },
      { override: false }
    ); // 'override: false' es más seguro si no estás segura si 'ln' podría existir
    console.log(
      "Función 'ln' personalizada importada a math.js (ln(x) ahora llama a math.log(x))"
    );
  } catch (e) {
    console.error("Error al importar función 'ln' a math.js:", e);
  }


  if (!pantallaCientifica) {
    console.warn(
      "ADVERTENCIA: Elemento #pantalla (de la calc. científica) no encontrado."
    );
  }
  if (!pantallaBasica) {
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
    if (!pantallaActual) return; // Asegúrate que pantallaActual esté definida y sea el input correcto
    let valorPantalla = pantallaActual.value;
    let resultado;

    if (valorPantalla === "") {
      resultado = "";
      pantallaActual.value = resultado;
      return;
    }

    try {
      // 1. Manejo especial para SUMA o RESTA de porcentajes:
      valorPantalla = valorPantalla.replace(
        /(\d+(?:\.\d+)?)\s*([\+\-])\s*(\d+(?:\.\d+)?)%/g,
        (match, num1, operador, num2) => {
          return `${num1} ${operador} (${num1} * ${num2} / 100)`;
        }
      );

      // 2. Manejo general para otros porcentajes (multiplicación, división, o porcentaje solo):
      valorPantalla = valorPantalla.replace(
        /(\d+(?:\.\d+)?)%/g,
        (match, num) => `(${num}/100)`
      );

      // 3. Raíces (N√M o √M):
      valorPantalla = valorPantalla.replace(
        /(\d+(?:\.\d+)?)√(\d+(\.\d+)?)/g,
        // ------ CALLBACK CORREGIDO AQUÍ ------
        (match, indiceStr, radicandoStr) => {
          console.log("--- Depurando Raíz (Callback Corregido) ---");
          console.log("Match completo de la regex:", match);
          console.log("String para índice (indiceStr):", indiceStr);
          console.log("String para radicando (radicandoStr):", radicandoStr); // Este debería tener el valor correcto

          const indice = indiceStr ? parseFloat(indiceStr) : 2;
          const radicando = parseFloat(radicandoStr);

          console.log("Índice parseado:", indice);
          console.log("Radicando parseado:", radicando);

          if (isNaN(indice) || isNaN(radicando) || indice <= 0) {
            console.error('CONDICIÓN DE "Error Raíz" CUMPLIDA!');
            return "Error Raíz";
          }
          const reemplazo = `nthRoot(${radicando}, ${indice})`;
          console.log("Reemplazo generado:", reemplazo);
          return reemplazo;
        }
      );

      // El console.log para ver la cadena final antes de evaluar:
      console.log(
        "Para evaluar con math.js (después de procesar raíces):",
        valorPantalla
      );

      resultado = math.evaluate(valorPantalla); // Solo una llamada a evaluate aquí

      // Formateo de resultado
      if (typeof resultado === "number") {
        if (!isFinite(resultado)) {
          resultado = "Error (Infinito)";
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
        error.message.toLowerCase().includes("undefined symbol")
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
  let miModalPolinomios;

  const modalPolinomioElement = document.getElementById("polinomioModal");
  if (modalPolinomioElement) {
    miModalPolinomios = new bootstrap.Modal(modalPolinomioElement);

    // Manejar foco cuando el modal se cierra para accesibilidad
    modalPolinomioElement.addEventListener("hidden.bs.modal", function () {
      // Quitar foco de cualquier elemento dentro del modal que pudiera tenerlo
      if (
        document.activeElement &&
        modalPolinomioElement.contains(document.activeElement)
      ) {
        document.activeElement.blur();
      }
      // Devolver el foco al botón que abrió el modal (P(x))
      // Para mayor robustez, considera darle un ID a tu botón P(x) y usar getElementById
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

    for (const part in uiParts) {
      if (!uiParts[part] && part !== "raicesOutput") {
        console.warn(
          `Elemento del modal para polinomios no encontrado: ${part}`
        );
      }
    }

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
        const gradoSelect = document.getElementById("gradoPolinomio");
        if (gradoSelect) gradoSelect.focus();
      }, 200);
    } else {
      console.error("La instancia del modal de polinomios no está definida.");
      alert("Error: El solucionador de polinomios no está disponible.");
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
            ? "<p>Infinitas soluciones (0x + 0 = 0)</p>"
            : "<p>Sin solución (0x + b = 0, b≠0)</p>";
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
              ? "<p>Infinitas soluciones (0x² + 0x + 0 = 0)</p>"
              : "<p>Sin solución (0x² + 0x + c = 0, c≠0)</p>";
            return;
          }
          raices = [-c_poly / b_poly];
        } else {
          const discriminante = math.subtract(
            math.pow(b_poly, 2),
            4 * a_poly * c_poly
          );
          if (math.largerEq(discriminante, 0)) {
            const raiz1 = math.divide(
              math.add(-b_poly, math.sqrt(discriminante)),
              2 * a_poly
            );
            const raiz2 = math.divide(
              math.subtract(-b_poly, math.sqrt(discriminante)),
              2 * a_poly
            );
            raices = math.equal(raiz1, raiz2) ? [raiz1] : [raiz1, raiz2];
          } else {
            const parteReal = -b_poly / (2 * a_poly);
            const parteImaginaria = math.divide(
              math.sqrt(math.multiply(discriminante, -1)),
              2 * a_poly
            );
            raices = [
              math.complex(parteReal, parteImaginaria),
              math.complex(parteReal, -parteImaginaria),
            ];
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
          raicesOutput.innerHTML =
            "<p>a=0, se reduce a ecuación cuadrática. Usa el solver de grado 2.</p>";
          return;
        }

        const B_norm = b_poly / a_poly;
        const C_norm = c_poly / a_poly;
        const D_norm = d_poly / a_poly;

        const p_val = C_norm - math.pow(B_norm, 2) / 3;
        const q_val =
          (2 * math.pow(B_norm, 3)) / 27 - (B_norm * C_norm) / 3 + D_norm;

        const delta_term1 = math.pow(q_val / 2, 2);
        const delta_term2 = math.pow(p_val / 3, 3);
        const delta = math.add(delta_term1, delta_term2);

        const precision = 1e-9;

        if (
          math.abs(delta) < precision &&
          math.abs(p_val) < precision &&
          math.abs(q_val) < precision
        ) {
          const y_r = 0;
          raices = [y_r - B_norm / 3, y_r - B_norm / 3, y_r - B_norm / 3];
        } else if (math.abs(delta) < precision) {
          const y1_r = -2 * math.cbrt(q_val / 2);
          const y2_r = math.cbrt(q_val / 2);
          raices = [y1_r - B_norm / 3, y2_r - B_norm / 3, y2_r - B_norm / 3];
        } else if (delta > 0) {
          const u_sqrt_delta = math.sqrt(delta);
          const u_base_cub = math.add(-q_val / 2, u_sqrt_delta);
          const v_base_cub = math.subtract(-q_val / 2, u_sqrt_delta);

          const u_res = math.cbrt(u_base_cub);
          const v_res = math.cbrt(v_base_cub);

          const y1_r = math.add(u_res, v_res);
          const y2_r_real = math.divide(
            math.multiply(math.add(u_res, v_res), -1),
            2
          );
          const y2_r_imag = math.divide(
            math.multiply(math.subtract(u_res, v_res), math.sqrt(3)),
            2
          );

          raices = [
            y1_r - B_norm / 3,
            math.complex(y2_r_real - B_norm / 3, y2_r_imag),
            math.complex(y2_r_real - B_norm / 3, -y2_r_imag),
          ];
        } else {
          const p_term_abs_cubed_root = math.sqrt(
            math.pow(math.abs(p_val / 3), 3)
          );
          let phi_arg_val = -q_val / (2 * p_term_abs_cubed_root);
          if (phi_arg_val > 1) phi_arg_val = 1;
          if (phi_arg_val < -1) phi_arg_val = -1;

          const phi_val = math.acos(phi_arg_val);
          const two_cbrt_r_val = 2 * math.cbrt(p_term_abs_cubed_root);

          const y1_r = two_cbrt_r_val * math.cos(phi_val / 3);
          const y2_r = two_cbrt_r_val * math.cos((phi_val + 2 * math.pi) / 3);
          const y3_r = two_cbrt_r_val * math.cos((phi_val + 4 * math.pi) / 3);
          raices = [y1_r - B_norm / 3, y2_r - B_norm / 3, y3_r - B_norm / 3];
        }
      }

      if (raices.length > 0) {
        raicesOutput.innerHTML = raices
          .map((raiz, i) => {
            let raizStr;
            if (typeof raiz === "number") {
              raizStr = math.format(raiz, { notation: "fixed", precision: 5 });
            } else if (
              raiz &&
              typeof raiz.re !== "undefined" &&
              typeof raiz.im !== "undefined"
            ) {
              const realPart = math.format(raiz.re, {
                notation: "fixed",
                precision: 5,
              });
              const imagPartAbs = math.format(Math.abs(raiz.im), {
                notation: "fixed",
                precision: 5,
              });
              if (Math.abs(raiz.im) < 1e-9) {
                raizStr = realPart;
              } else if (
                Math.abs(raiz.re) < 1e-9 &&
                Math.abs(raiz.im) >= 1e-9
              ) {
                raizStr = `${raiz.im >= 0 ? "" : "-"} ${imagPartAbs}i`;
              } else {
                raizStr = `${realPart} ${
                  raiz.im >= 0 ? "+" : "-"
                } ${imagPartAbs}i`;
              }
              if (Math.abs(raiz.re) < 1e-9 && Math.abs(raiz.im) < 1e-9) {
                raizStr = "0";
              }
            } else {
              raizStr = String(raiz);
            }
            return `<p>x<sub>${i + 1}</sub> = ${raizStr}</p>`;
          })
          .join("");
      } else if (raicesOutput.innerHTML === "") {
        raicesOutput.innerHTML =
          "<p>No se encontraron raíces o el grado no es soportado.</p>";
      }
    } catch (e) {
      console.error("Error al resolver polinomio:", e);
      raicesOutput.innerHTML = `<p class="text-danger">Error: ${
        e.message || "Error desconocido"
      }</p>`;
    }
  }
  // FIN DEL CÓDIGO DE POLINOMIOS

  // --- Funciones de la Calculadora Financiera ---
  function setFinancialResult(elementId, value) {
    const elem = document.getElementById(elementId);
    if (!elem) return;
    if (typeof value === "number" && isFinite(value)) {
      elem.value = value.toFixed(2); // Ajusta decimales según necesidad
    } else {
      elem.value = ""; // Dejar vacío en caso de error o NaN
      console.error(`Error o valor no numérico para ${elementId}:`, value);
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
      if (n <= 0) throw new Error("N debe ser > 0");
      let pv_calc;
      if (rate === 0) {
        pv_calc = -(fv + pmt * n);
      } else {
        pv_calc =
          (pmt * (1 - Math.pow(1 + rate, -n))) / rate +
          fv / Math.pow(1 + rate, n);
      }
      setFinancialResult("pv", pv_calc);
    } catch (error) {
      setFinancialResult("pv", "Error"); // Aunque queramos evitarlo, si hay error de lógica lo pasamos.
      console.error("Error en calcularPV:", error);
    }
  }

  function calcularFV() {
    const pv = getFinancialInput("pv");
    const rate = getFinancialInput("rate") / 100;
    const n = getFinancialInput("n");
    const pmt = getFinancialInput("pmt");

    try {
      if (n < 0) throw new Error("N no puede ser negativo"); // n=0 podría ser válido si pv = -fv
      let fv_calc;
      if (rate === 0) {
        fv_calc = -(pv + pmt * n);
      } else {
        fv_calc =
          pv * Math.pow(1 + rate, n) +
          pmt * ((Math.pow(1 + rate, n) - 1) / rate);
      }
      setFinancialResult("fv", fv_calc);
    } catch (error) {
      setFinancialResult("fv", "Error");
      console.error("Error en calcularFV:", error);
    }
  }

  function calcularPMT() {
    const pv = getFinancialInput("pv");
    const fv = getFinancialInput("fv");
    const rate = getFinancialInput("rate") / 100;
    const n = getFinancialInput("n");

    try {
      if (n <= 0) throw new Error("N debe ser > 0");
      if (rate === 0) {
        if (n === 0)
          throw new Error("N y Tasa no pueden ser 0 simultáneamente para PMT");
        pmt_calc = -(pv + fv) / n;
      } else {
        let numerador = fv - pv * Math.pow(1 + rate, n);
        let denominador = (Math.pow(1 + rate, n) - 1) / rate;
        if (Math.abs(denominador) < 1e-10)
          throw new Error("División por cero o tasa inválida para PMT.");
        pmt_calc = numerador / denominador;
      }
      setFinancialResult("pmt", pmt_calc);
    } catch (error) {
      setFinancialResult("pmt", "Error");
      console.error("Error en calcularPMT:", error);
    }
  }

  function calcularN() {
    const pv = getFinancialInput("pv");
    const fv = getFinancialInput("fv");
    const rate = getFinancialInput("rate") / 100;
    const pmt = getFinancialInput("pmt");

    try {
      if (rate < 0)
        throw new Error(
          "La tasa no puede ser negativa para calcular N de esta forma."
        );
      let n_calc;
      if (rate === 0) {
        if (pmt === 0)
          throw new Error("PMT y Tasa no pueden ser 0 simultáneamente para N");
        n_calc = -(pv + fv) / pmt;
        if (n_calc < 0)
          throw new Error("Resultado N negativo, verificar entradas.");
      } else {
        // Sign convention: PV is outflow (negative), PMT and FV are inflows (positive)
        // Or PV is inflow (positive), PMT and FV are outflows (negative)
        // Assuming standard formula where we solve for N:
        if (pmt !== 0) {
          // N = ln((PMT - FV*rate) / (PMT + PV*rate)) / ln(1 + rate)
          // Esta fórmula es sensible a los signos y valores de PV, FV, PMT.
          // Para que el logaritmo sea de un número positivo:
          // (PMT - FV*rate) y (PMT + PV*rate) deben tener el mismo signo.
          const term1 = pmt - fv * rate;
          const term2 = pmt + pv * rate;
          if (term1 === 0 && term2 === 0)
            throw new Error("Valores indeterminados para N");
          if (term1 * term2 <= 0)
            throw new Error(
              "Cálculo de N no posible con estos valores (log de neg/cero)"
            );
          n_calc = Math.log(term1 / term2) / Math.log(1 + rate);
        } else if (pv !== 0 && fv !== 0) {
          // PMT es 0
          if (pv * fv >= 0)
            throw new Error("PV y FV deben tener signos opuestos si PMT=0");
          n_calc = Math.log(-fv / pv) / Math.log(1 + rate);
        } else {
          throw new Error("Valores insuficientes o inválidos para calcular N");
        }
        if (n_calc < 0)
          throw new Error("Resultado N negativo, verificar entradas.");
      }
      setFinancialResult("n", n_calc);
    } catch (error) {
      setFinancialResult("n", "Error");
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

    // Método de Newton-Raphson para encontrar la tasa
    let rate_calc = 0.1; // Valor inicial para la tasa (10%)
    const MAX_ITERATIONS = 100;
    const PRECISION = 1e-7;

    try {
      // Caso especial: si no hay pagos periódicos y conocemos pv, fv, n
      if (pmt === 0) {
        if (pv === 0) {
          resultOutput.value = "";
          console.error("PV no puede ser 0 si PMT es 0 para calcular tasa.");
          return;
        }
        // FV = PV * (1+rate)^N  => (FV/PV)^(1/N) = 1+rate => rate = (FV/PV)^(1/N) - 1
        // Asegurarse que FV/PV sea positivo. Si son de signo opuesto, está bien. Si son del mismo signo, debe ser crecimiento.
        if ((fv > 0 && pv > 0 && fv < pv) || (fv < 0 && pv < 0 && fv > pv)) {
          throw new Error("FV y PV implican tasa negativa si PMT=0.");
        }
        let baseRate = fv / pv;
        if (baseRate < 0) baseRate = -baseRate; // Tomar absoluto para la potencia, el signo se infiere

        rate_calc = Math.pow(baseRate, 1 / n) - 1;

        // Si PV es negativo (inversión) y FV positivo (retorno), la tasa es positiva.
        // Si PV es positivo y FV negativo, indica una pérdida, pero la fórmula da tasa positiva, necesita ajuste de convención.
        // Generalmente, se asume que PV y FV tienen signos opuestos.
        if (pv > 0 && fv > 0 && fv < pv) {
          // Depreciación con ambos positivos
          // No es una tasa de crecimiento simple
          throw new Error(
            "Caso de depreciación no manejado para cálculo directo de tasa sin PMT."
          );
        }

        setFinancialResult("rate", rate_calc * 100);
        return;
      }

      // Iteraciones para Newton-Raphson (cuando PMT no es cero)
      for (let i = 0; i < MAX_ITERATIONS; i++) {
        let f_val, df_val;
        const term_plus_rate_N = Math.pow(1 + rate_calc, n);
        const term_plus_rate_N_minus_1 = Math.pow(1 + rate_calc, n - 1);

        if (Math.abs(rate_calc) < 1e-10) {
          // Si la tasa es muy cercana a 0, usar la aproximación lineal
          f_val = pv + pmt * n + fv; // Ecuación para tasa = 0
          // Derivada de f(r) = PV*(1+r)^N + PMT*((1+r)^N-1)/r + FV  respecto a r evaluada en r=0 (usando L'Hopital para el término de PMT)
          // d/dr (PMT*((1+r)^N-1)/r) en r=0 es PMT*N*(N-1)/2  (Esto es incorrecto)
          // La derivada de PMT * sum_{k=1 to N} (1+r)^-k es -PMT * sum_{k=1 to N} k*(1+r)^(-k-1)
          // Cerca de r=0, ( (1+r)^N - 1 ) / r  aprox N + N*(N-1)/2 * r
          // Entonces PMT * (N + N*(N-1)/2 * r)
          // Derivada de esto es PMT * N*(N-1)/2
          // Derivada de PV*(1+r)^N es N*PV*(1+r)^(N-1) -> N*PV en r=0
          // Derivada de FV*(1+r)^-N es -N*FV*(1+r)^(-N-1) -> -N*FV en r=0
          // Esto se está complicando, el Newton-Raphson para tasas es notoriamente sensible.
          df_val =
            n * pv * (n > 0 ? term_plus_rate_N_minus_1 : 1) -
            n * fv * (n > 0 ? Math.pow(1 + rate_calc, -n - 1) : 1) +
            pmt *
              (n * (n > 0 ? term_plus_rate_N_minus_1 : 1) * (n > 0 ? 1 : 0) -
                ((n > 0 ? term_plus_rate_N : 1) - 1) * (n > 0 ? 1 : 0)); // Aproximación muy cruda
          if (Math.abs(df_val) < 1e-10) df_val = 1e-10; // Evitar división por cero exacta
        } else {
          f_val =
            pv * term_plus_rate_N +
            (pmt * (term_plus_rate_N - 1)) / rate_calc +
            fv;
          df_val =
            n * pv * term_plus_rate_N_minus_1 +
            (pmt *
              (n * term_plus_rate_N_minus_1 * rate_calc -
                (term_plus_rate_N - 1))) /
              (rate_calc * rate_calc) -
            n * fv * Math.pow(1 + rate_calc, -n - 1); // Añadido término de FV para la derivada
        }

        if (Math.abs(df_val) < 1e-10) {
          throw new Error("Derivada cero, no se puede continuar (Rate)");
        }

        const new_rate = rate_calc - f_val / df_val;
        if (Math.abs(new_rate - rate_calc) < PRECISION) {
          setFinancialResult("rate", new_rate * 100);
          return;
        }
        rate_calc = new_rate;
        if (rate_calc < -0.99) {
          // Evitar tasas menores a -99% que no tienen sentido
          throw new Error("Tasa calculada fuera de rango razonable.");
        }
      }
      throw new Error(
        "Tasa no convergió después de " + MAX_ITERATIONS + " iteraciones"
      );
    } catch (error) {
      console.error("Error en calcularRate:", error.message);
      setFinancialResult("rate", "Error");
    }
  }

  function limpiarFinanciera() {
    ["pv", "fv", "pmt", "n", "rate"].forEach((id) => {
      const elem = document.getElementById(id);
      if (elem) elem.value = "";
    });
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
        pantallaActual = pantallaCientifica; // Usar la const definida arriba
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

    if (window.innerWidth <= 768) {
      document.getElementById("sidebar")?.classList.remove("active");
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
  // Exponer funciones financieras si son llamadas desde HTML (aunque los listeners se añaden en JS)
  window.calcularPV = calcularPV;
  window.calcularFV = calcularFV;
  window.calcularPMT = calcularPMT;
  window.calcularN = calcularN;
  window.calcularRate = calcularRate;
  window.limpiarFinanciera = limpiarFinanciera;

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
      return; // No procesar más para el teclado de la calculadora principal si el foco está en un modal o input financiero
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

  console.log("Calculadora Multifuncional completamente lista.");
});
