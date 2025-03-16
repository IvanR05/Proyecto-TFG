export class Guardia {
    constructor({ id = 0, tipo = '', inicio = null, fin = null, observaciones = '', ausencias = '', id_aula = '' }) {
        this.id = id;
        this.tipo = tipo;
        this.inicio = inicio;
        this.fin = fin;
        this.observaciones = observaciones;
        this.ausencias = ausencias;
        this.id_aula = id_aula;
    }

}