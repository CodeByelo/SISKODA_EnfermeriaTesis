export interface Expediente {
  id: string;
  tipo_paciente: "Estudiante" | "Profesor" | "Personal Administrativo";
  carnet_uni: string | null;
  codigo_empleado: string | null;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  carrera_depto: string | null;
  categoria: string | null;
  cargo: string | null;
  creado_en: string;
  actualizado_en: string;
}

// Para el formulario: permite string vacío antes de validar
export interface ExpedienteForm {
  tipo_paciente: "" | "Estudiante" | "Profesor" | "Personal Administrativo";
  carnet_uni: string;
  codigo_empleado: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  carrera_depto: string;
  categoria: string;
  cargo: string;
}
