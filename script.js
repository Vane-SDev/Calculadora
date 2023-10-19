console.log("hello world");

function agregar(valor){
    document.getElementById('pantalla').value += valor
}

function borrar(){
    document.getElementById('pantalla').value = ''
}

function calcular(){
    const valorPantalla = document.getElementById('pantalla').value;
    let resultado;

    //Verificar si es raiz cuadrada

if (valorPantalla.includes('√')){
    const numero =parseFloat(valorPantalla.slice(1));
    resultado = Math.sqrt(numero);
}

//verificar si se trata de una potencia

else if(valorPantalla.includes('²')){
    const numero = parseFloat(valorPantalla);
    resultado = Math.pow(numero, 2);
}
// verificar si es porcentaje

else if (valorPantalla.includes('%')) {
    const partes = valorPantalla.split('*');
    if (partes.length === 2) {
        const numero = parseFloat(partes[0]);
        const porcentaje = parseFloat(partes[1].replace('%', '')) / 100;
        if (!Number.isNaN(numero) && !Number.isNaN(porcentaje)) {
            resultado = numero * porcentaje;
        }
    }
}
// para el resto de las operaciones

else{
    console.log(valorPantalla)
    resultado = eval(valorPantalla)
}

    document.getElementById('pantalla').value = resultado
}

function retroceder (){
    const pantalla = document.getElementById('pantalla');
    pantalla.value = pantalla.value.slice(0, -1);
}

function agregarParentesis(valor){
    const pantalla = document.getElementById('pantalla');
    pantalla.value += valor;
}

function quitarParentesis (){
    const pantalla = document.getElementById('pantalla');
    const valorActual = pantalla.value;

    if(valorActual.endsWith(')')){
        // si el caracter es un parentesis de cierre, se elimina
        pantalla.value = valorActual.slice(0, -1);
}else{
    //si no hay parentesis de cierre,  agrego uno
    pantalla.value += ')';
    }
}

function cambiarSigno(){
    const pantalla = document.getElementById('pantalla');
    let valorActual = pantalla.value;

    //verificamos si el valor de la pantalla es un numero

    if(valorActual.startsWith('-')){

        //si el numero ya es negativo, se cambia a positivo
        valorActual = valorActual.substring(1);

        // si es un numero 
    }else{
        valorActual = '-' + valorActual;
    }

    pantalla.value = valorActual;
}

    document.addEventListener('keydown', function(event){

        const tecla = event.key;
        const pantalla = document.getElementById('pantalla');

        // verificamos si la tecla que presiona es guion medio
        if (tecla === '-' || (event.shiftKey && tecla === '-')){
            //verificamos si el guion medio se tiene que interpretar como signo negativo
            if(pantalla.value === ''){
                // si la pantalla está vacía, se añade el signo negativo al principio
                pantalla.value = '-';
            }else{
                //si la pantalla no está vacía, se agrega el guion medio como operador
                agregar(tecla);
            }
            event.preventDefault(); // con esto evitamos que el guion medio se muestre en el campo de entrada
        }else{
            // con esto manejamos las otras teclas
        switch (tecla){
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
                agregar(tecla);
                break;
            case'+':
            case'-':
            case'*':
            case'/':
            case'%':
            case'(':
            case')':
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
                //no se hace nada si no se presiona una tecla no manejada
        }
    }
});