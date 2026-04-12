import { Router } from 'express';
import ExcelJS from 'exceljs';
import type { AuthRequest } from './auth';
import pool from './db';

const router = Router();

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-VE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatDay = (value: Date | string | null | undefined) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-VE', {
    dateStyle: 'medium',
  }).format(date);
};

const styleWorksheet = (worksheet: ExcelJS.Worksheet) => {
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F6F78' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  worksheet.columns.forEach((column) => {
    let maxLength = 14;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value == null ? '' : String(cell.value);
      maxLength = Math.max(maxLength, cellValue.length + 2);
    });
    column.width = Math.min(maxLength, 34);
  });
};

const addTableSheet = (
  workbook: ExcelJS.Workbook,
  title: string,
  columns: Array<{ header: string; key: string }>,
  rows: Record<string, string | number>[]
) => {
  const worksheet = workbook.addWorksheet(title);
  worksheet.columns = columns;
  worksheet.addRows(rows);
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  styleWorksheet(worksheet);
  return worksheet;
};

router.get('/consultas-por-prioridad', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT prioridad, COUNT(*)::int as cantidad
      FROM consultas
      GROUP BY prioridad
      ORDER BY cantidad DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener datos de prioridad' });
  }
});

router.get('/medicamentos-mas-usados', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT nombre_medicamento as medicamento, SUM(cantidad)::int as uso
      FROM consulta_medicamentos
      GROUP BY nombre_medicamento
      ORDER BY uso DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener medicamentos' });
  }
});

router.get('/consultas-por-dia', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT DATE(fecha_consulta) as fecha, COUNT(*)::int as total
      FROM consultas
      WHERE fecha_consulta >= NOW() - INTERVAL '14 days'
      GROUP BY fecha
      ORDER BY fecha ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tendencia' });
  }
});

router.get('/stock-por-insumo', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT nombre, stock_actual
      FROM inventario_items
      WHERE stock_actual > 0
      ORDER BY stock_actual DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener stock de insumos' });
  }
});

router.get('/excel', async (req: AuthRequest, res) => {
  try {
    const { desde, hasta } = req.query;
    const fromDate = typeof desde === 'string' && desde ? desde : null;
    const toDate = typeof hasta === 'string' && hasta ? hasta : null;
    const dateConditions: string[] = [];
    const dateParams: Array<string> = [];

    if (fromDate) {
      dateParams.push(fromDate);
      dateConditions.push(`c.fecha_consulta >= $${dateParams.length}::date`);
    }

    if (toDate) {
      dateParams.push(toDate);
      dateConditions.push(`c.fecha_consulta < ($${dateParams.length}::date + INTERVAL '1 day')`);
    }

    const whereClause = dateConditions.length > 0 ? `WHERE ${dateConditions.join(' AND ')}` : '';
    const isAdmin = req.user?.role === 'admin';

    const [consultasPrioridad, stock, tendencia, expedientes, medicamentos, consultasCompletas] = await Promise.all([
      pool.query(`
        SELECT prioridad, COUNT(*)::int as total
        FROM consultas
        GROUP BY prioridad
        ORDER BY total DESC
      `),
      pool.query(`
        SELECT
          ii.nombre,
          ii.categoria,
          ii.stock_actual,
          ii.stock_minimo,
          ii.unidad_medida,
          MIN(il.fecha_vencimiento) as fecha_vencimiento,
          MAX(ii.actualizado_en) as actualizado_en
        FROM inventario_items ii
        LEFT JOIN inventario_lotes il ON il.inventario_item_id = ii.id
        GROUP BY ii.id, ii.nombre, ii.categoria, ii.stock_actual, ii.stock_minimo, ii.unidad_medida
        ORDER BY ii.nombre
      `),
      pool.query(`
        SELECT DATE(c.fecha_consulta) as dia, COUNT(*)::int as total
        FROM consultas c
        WHERE c.fecha_consulta >= NOW() - INTERVAL '14 days'
        GROUP BY dia
        ORDER BY dia
      `),
      pool.query(`
        SELECT
          p.nombres as nombre,
          p.apellidos as apellido,
          p.codigo_institucional,
          p.tipo_miembro,
          p.correo_institucional as email,
          p.telefono,
          p.carrera_depto,
          p.categoria,
          p.cargo,
          e.creado_en
        FROM expedientes e
        INNER JOIN personas p ON p.id = e.persona_id
        ORDER BY e.creado_en DESC
      `),
      pool.query(`
        SELECT nombre_medicamento as medicamento, SUM(cantidad)::int as veces
        FROM consulta_medicamentos
        GROUP BY nombre_medicamento
        ORDER BY veces DESC
        LIMIT 10
      `),
      pool.query(
        `
          SELECT
            c.id,
            c.creado_en,
            c.prioridad,
            p.tipo_miembro,
            p.nombres as nombre,
            p.apellidos as apellido,
            p.codigo_institucional,
            p.correo_institucional as email,
            p.telefono,
            p.carrera_depto,
            p.categoria,
            p.cargo,
            c.motivo,
            c.sintomas,
            c.diagnostico,
            (
              SELECT string_agg(cm.nombre_medicamento, E'\n' ORDER BY cm.id)
              FROM consulta_medicamentos cm
              WHERE cm.consulta_id = c.id
            ) as medicamentos,
            c.notas_recomendacion as notas_recom
          FROM consultas c
          INNER JOIN expedientes e ON e.id = c.expediente_id
          INNER JOIN personas p ON p.id = e.persona_id
          ${whereClause}
          ORDER BY c.creado_en DESC
        `,
        dateParams
      ),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WebSistema Nurse';
    workbook.created = new Date();

    const resumenSheet = workbook.addWorksheet('Resumen');
    resumenSheet.getCell('A1').value = 'Reporte General de Enfermeria';
    resumenSheet.getCell('A2').value = `Generado: ${formatDate(new Date())}`;
    resumenSheet.addRows([
      [],
      ['Indicador', 'Valor'],
      ['Periodo exportado', fromDate || toDate ? `${fromDate ?? 'Inicio'} al ${toDate ?? 'Hoy'}` : 'Historico completo'],
      ['Prioridades registradas', consultasPrioridad.rowCount],
      ['Insumos en inventario', stock.rowCount],
      ['Dias con consultas en tendencia', tendencia.rowCount],
      ['Expedientes exportados', expedientes.rowCount],
      ['Medicamentos en ranking', medicamentos.rowCount],
      ['Consultas completas', consultasCompletas.rowCount],
      ['Columnas sensibles', isAdmin ? 'Incluidas' : 'Ocultas por rol'],
    ]);

    addTableSheet(
      workbook,
      'Consultas_Prioridad',
      [
        { header: 'Prioridad', key: 'prioridad' },
        { header: 'Total de consultas', key: 'total' },
      ],
      consultasPrioridad.rows.map((row) => ({ prioridad: row.prioridad, total: row.total }))
    );

    addTableSheet(
      workbook,
      'Stock_Insumos',
      [
        { header: 'Insumo', key: 'nombre' },
        { header: 'Categoria', key: 'categoria' },
        { header: 'Stock actual', key: 'stock_actual' },
        { header: 'Stock minimo', key: 'stock_minimo' },
        { header: 'Unidad', key: 'unidad_medida' },
        { header: 'Vencimiento cercano', key: 'fecha_vencimiento' },
      ],
      stock.rows.map((row) => ({
        nombre: row.nombre,
        categoria: row.categoria ?? '',
        stock_actual: row.stock_actual,
        stock_minimo: row.stock_minimo,
        unidad_medida: row.unidad_medida,
        fecha_vencimiento: formatDay(row.fecha_vencimiento),
      }))
    );

    addTableSheet(
      workbook,
      'Tendencia_14d',
      [
        { header: 'Dia', key: 'dia' },
        { header: 'Total de consultas', key: 'total' },
      ],
      tendencia.rows.map((row) => ({ dia: formatDay(row.dia), total: row.total }))
    );

    const expedienteColumns = [
      { header: 'Nombre', key: 'nombre' },
      { header: 'Apellido', key: 'apellido' },
      { header: 'Codigo institucional', key: 'codigo_institucional' },
      { header: 'Tipo de miembro', key: 'tipo_miembro' },
      { header: 'Carrera o departamento', key: 'carrera_depto' },
      { header: 'Categoria', key: 'categoria' },
      { header: 'Cargo', key: 'cargo' },
      { header: 'Fecha de registro', key: 'creado_en' },
    ];

    if (isAdmin) {
      expedienteColumns.splice(4, 0, { header: 'Correo', key: 'email' }, { header: 'Telefono', key: 'telefono' });
    }

    addTableSheet(
      workbook,
      'Expedientes',
      expedienteColumns,
      expedientes.rows.map((row) => ({
        nombre: row.nombre,
        apellido: row.apellido,
        codigo_institucional: row.codigo_institucional ?? '',
        tipo_miembro: row.tipo_miembro,
        email: row.email ?? '',
        telefono: row.telefono ?? '',
        carrera_depto: row.carrera_depto ?? '',
        categoria: row.categoria ?? '',
        cargo: row.cargo ?? '',
        creado_en: formatDate(row.creado_en),
      }))
    );

    addTableSheet(
      workbook,
      'Top_Medicamentos',
      [
        { header: 'Medicamento', key: 'medicamento' },
        { header: 'Veces registrado', key: 'veces' },
      ],
      medicamentos.rows.map((row) => ({ medicamento: row.medicamento, veces: row.veces }))
    );

    const consultasColumns = [
      { header: 'ID consulta', key: 'id' },
      { header: 'Fecha', key: 'creado_en' },
      { header: 'Prioridad', key: 'prioridad' },
      { header: 'Tipo de miembro', key: 'tipo_miembro' },
      { header: 'Nombre', key: 'nombre' },
      { header: 'Apellido', key: 'apellido' },
      { header: 'Codigo institucional', key: 'codigo_institucional' },
      { header: 'Carrera o departamento', key: 'carrera_depto' },
      { header: 'Categoria', key: 'categoria' },
      { header: 'Cargo', key: 'cargo' },
      { header: 'Motivo', key: 'motivo' },
      { header: 'Sintomas', key: 'sintomas' },
      { header: 'Diagnostico', key: 'diagnostico' },
      { header: 'Medicamentos', key: 'medicamentos' },
      { header: 'Notas y recomendaciones', key: 'notas_recom' },
    ];

    if (isAdmin) {
      consultasColumns.splice(8, 0, { header: 'Correo', key: 'email' }, { header: 'Telefono', key: 'telefono' });
    }

    addTableSheet(
      workbook,
      'Consultas_Completas',
      consultasColumns,
      consultasCompletas.rows.map((row) => ({
        id: row.id,
        creado_en: formatDate(row.creado_en),
        prioridad: row.prioridad,
        tipo_miembro: row.tipo_miembro,
        nombre: row.nombre,
        apellido: row.apellido,
        codigo_institucional: row.codigo_institucional ?? '',
        email: row.email ?? '',
        telefono: row.telefono ?? '',
        carrera_depto: row.carrera_depto ?? '',
        categoria: row.categoria ?? '',
        cargo: row.cargo ?? '',
        motivo: row.motivo ?? '',
        sintomas: row.sintomas ?? '',
        diagnostico: row.diagnostico ?? '',
        medicamentos: row.medicamentos ?? '',
        notas_recom: row.notas_recom ?? '',
      }))
    );

    const fileDate = new Intl.DateTimeFormat('sv-SE').format(new Date());
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Disposition', `attachment; filename="Reporte_Enfermeria_${fileDate}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Error generando Excel:', err);
    res.status(500).json({ error: 'Error generando Excel' });
  }
});

export default router;
