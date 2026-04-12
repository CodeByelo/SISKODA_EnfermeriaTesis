export interface ConsultaForm {
  tipo_paciente: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;

  // Estudiante
  carnet_uni: string;
  carrera: string;
  semestre_anio: string;

  // Profesor / Personal
  codigo_empleado: string;
  departamento: string;
  categoria: string;
  cargo: string;
  extension: string;

  // Consulta
  motivo: string;
  sintomas: string;
  prioridad: 'Normal' | 'Urgente';
  antecedentes: string;
  alergias: string;
  temperatura: string;
  tension_arterial: string;
  frecuencia_cardiaca: string;

  // Tratamiento
  diagnostico: string;
  medicamentos: string[];
  notas_recom: string;
}
