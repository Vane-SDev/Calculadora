
// // Realizar una operación matemática
// const resultado = math.evaluate('8^2*(5-7)');

// // Mostrar el resultado en la consola
// console.log('Resultado:', resultado);
function agregar(valor) {
    const pantalla = document.getElementById('pantalla');
    const indice = document.getElementById('indice').value;
    
    if (indice) {
        if (valor === '√') {
            pantalla.value += `sqrt(${indice}, `;
        } else {
            pantalla.value += valor;
        }
        document.getElementById('indice').value = ''; // Limpia el campo de índice
    } else {
        pantalla.value += valor;
    }
}


function borrar() {
    document.getElementById('pantalla').value = '';
}
function calcular() {
    let valorPantalla = document.getElementById('pantalla').value;
    let resultado;

    try {
        // Reemplazar "^" con "**" para las potencias
        valorPantalla = valorPantalla.replace(/\^/g, '**');
        // Reemplazar el símbolo de porcentaje (%) con "/100"
        valorPantalla = valorPantalla.replace(/%/g, '/100');
        
        // Buscar y calcular todas las raíces con cualquier índice
        const regex = /(\d+(?:\.\d+)?)√(\d+(?:\.\d+)?)/g;
        valorPantalla = valorPantalla.replace(regex, function (match, indice, radicando) {
            return Math.pow(parseFloat(radicando), 1 / parseFloat(indice));
        });
        valorPantalla = valorPantalla.replace(/\*\*/g, '^');
        // Calcular la expresión con Math.js
        resultado = math.evaluate(valorPantalla);


    } catch (error) {
        console.error("Error en la expresión matemática:", error);
        resultado = "Error";
    }

    document.getElementById('pantalla').value = resultado;
}




function retroceder() {
    const pantalla = document.getElementById('pantalla');
    pantalla.value = pantalla.value.slice(0, -1);
}

function agregarParentesis(valor) {
    const pantalla = document.getElementById('pantalla');
    pantalla.value += valor;
}

function quitarParentesis() {
    const pantalla = document.getElementById('pantalla');
    const valorActual = pantalla.value;

    if (valorActual.endsWith(')')) {
        pantalla.value = valorActual.slice(0, -1);
    } else {
        pantalla.value += ')';
    }
}

function cambiarSigno() {
    const pantalla = document.getElementById('pantalla');
    let valorActual = pantalla.value;

    if (valorActual.startsWith('-')) {
        valorActual = valorActual.substring(1);
    } else {
        valorActual = '-' + valorActual;
    }

    pantalla.value = valorActual;
}

document.addEventListener('keydown', function (event) {
    const tecla = event.key;
    const pantalla = document.getElementById('pantalla');

    if (tecla === '-' || (event.shiftKey && tecla === '-')) {
        if (pantalla.value === '') {
            pantalla.value = '-';
        } else {
            agregar(tecla);
        }
        event.preventDefault();
    } else {
        switch (tecla) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
            case '+':
            case '-':
            case '*':
            case '/':
            case '%':
            case '(':
            case ')':
                agregar(tecla);
                break;
            case 'Enter':
                calcular();
                break;
            case 'Backspace':
                retroceder('⇦');
                break;
            case 'id21':
                cambiarSigno();
                break;
            default:
        }
    }
});