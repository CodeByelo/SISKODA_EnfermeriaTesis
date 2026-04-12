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
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F6F78' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD0D7DE' } },
      left: { style: 'thin', color: { argb: 'FFD0D7DE' } },
      bottom: { style: 'thin', color: { argb: 'FFD0D7DE' } },
      right: { style: 'thin', color: { argb: 'FFD0D7DE' } },
    };
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    });
    if (rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      });
    }
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
  columns: Array<{ header: string; key: string; width?: number }>,
  rows: Record<string, string | number>[]
) => {
  const worksheet = workbook.addWorksheet(title);
  worksheet.columns = columns;
  worksheet.addRows(rows);
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  styleWorksheet(worksheet);
  return worksheet;
};

const applyLowStockHighlight = (worksheet: ExcelJS.Worksheet, stockKey: string, minKey: string) => {
  const stockColumn = worksheet.columns.find((column) => column.key === stockKey);
  const minColumn = worksheet.columns.find((column) => column.key === minKey);

  if (!stockColumn?.number || !minColumn?.number) {
    return;
  }

  const stockColumnNumber = stockColumn.number;
  const minColumnNumber = minColumn.number;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const stockValue = Number(row.getCell(stockColumnNumber).value ?? 0);
    const minValue = Number(row.getCell(minColumnNumber).value ?? 0);

    if (stockValue <= minValue) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEE2E2' },
        };
        cell.font = {
          ...(cell.font ?? {}),
          color: { argb: 'FF991B1B' },
        };
      });
    }
  });
};

router.get('/consultas-por-prioridad', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT prioridad, COUNT(*)::int as cantidad
      FROM consultas
      GROUP BY prioridad;
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
      SELECT 
        TRIM(UNNEST(string_to_array(medicamentos, E'\n'))) AS medicamento,
        COUNT(*)::int as uso
      FROM consultas
      WHERE medicamentos IS NOT NULL AND medicamentos != ''
      GROUP BY medicamento
      ORDER BY uso DESC
      LIMIT 10;
    `);
    res.json(result.rows.filter((row) => row.medicamento?.trim()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener medicamentos' });
  }
});

router.get('/consultas-por-dia', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE(creado_en) as fecha,
        COUNT(*)::int as total
      FROM consultas
      WHERE creado_en >= NOW() - INTERVAL '14 days'
      GROUP BY fecha
      ORDER BY fecha ASC;
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
      FROM inventario
      WHERE stock_actual > 0
      ORDER BY stock_actual DESC
      LIMIT 10;
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
      dateConditions.push(`c.creado_en >= $${dateParams.length}::date`);
    }

    if (toDate) {
      dateParams.push(toDate);
      dateConditions.push(`c.creado_en < ($${dateParams.length}::date + INTERVAL '1 day')`);
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
          nombre,
          categoria,
          COALESCE(stock_actual, 0) as stock_actual,
          COALESCE(stock_minimo, 0) as stock_minimo,
          unidad_medida,
          lote,
          fecha_vencimiento,
          actualizado_en
        FROM inventario
        WHERE COALESCE(stock_actual, 0) > 0
        ORDER BY nombre
      `),
      pool.query(`
        SELECT DATE(c.creado_en) as dia, COUNT(*)::int as total
        FROM consultas c
        WHERE c.creado_en >= NOW() - INTERVAL '14 days'
        GROUP BY dia
        ORDER BY dia
      `),
      pool.query(`
        SELECT 
          nombre,
          apellido,
          carnet_uni,
          codigo_empleado,
          tipo_paciente,
          email,
          telefono,
          carrera_depto,
          categoria,
          cargo,
          creado_en
        FROM expedientes
        ORDER BY creado_en DESC
      `),
      pool.query(`
        SELECT TRIM(UNNEST(string_to_array(medicamentos, E'\n'))) as medicamento, COUNT(*)::int as veces
        FROM consultas
        WHERE medicamentos IS NOT NULL AND medicamentos != ''
        GROUP BY medicamento
        ORDER BY veces DESC
        LIMIT 10
      `),
      pool.query(
        `
          SELECT
            c.id,
            c.creado_en,
            c.prioridad,
            e.tipo_paciente,
            e.nombre,
            e.apellido,
            e.carnet_uni,
            e.codigo_empleado,
            e.email,
            e.telefono,
            e.carrera_depto,
            e.categoria,
            e.cargo,
            c.motivo,
            c.sintomas,
            c.diagnostico,
            c.medicamentos,
            c.notas_recom
          FROM consultas c
          INNER JOIN expedientes e ON e.id = c.paciente_id
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
    resumenSheet.mergeCells('A1:D1');
    resumenSheet.getCell('A1').value = 'Reporte General de Enfermeria';
    resumenSheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF16324F' } };
    resumenSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    resumenSheet.mergeCells('A2:D2');
    resumenSheet.getCell('A2').value = `Generado: ${formatDate(new Date())}`;
    resumenSheet.getCell('A2').alignment = { horizontal: 'center' };
    resumenSheet.getCell('A2').font = { italic: true, color: { argb: 'FF475569' } };

    resumenSheet.addRows([
      [],
      ['Indicador', 'Valor'],
      ['Periodo exportado', fromDate || toDate ? `${fromDate ?? 'Inicio'} al ${toDate ?? 'Hoy'}` : 'Historico completo'],
      ['Prioridades registradas', consultasPrioridad.rowCount],
      ['Insumos con stock', stock.rowCount],
      ['Dias con consultas en tendencia', tendencia.rowCount],
      ['Expedientes exportados', expedientes.rowCount],
      ['Medicamentos en ranking', medicamentos.rowCount],
      ['Consultas completas', consultasCompletas.rowCount],
      ['Columnas sensibles', isAdmin ? 'Incluidas' : 'Ocultas por rol'],
    ]);
    resumenSheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ['A4', 'B4'].forEach((cellRef) => {
      const cell = resumenSheet.getCell(cellRef);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D7DE' } },
        left: { style: 'thin', color: { argb: 'FFD0D7DE' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D7DE' } },
        right: { style: 'thin', color: { argb: 'FFD0D7DE' } },
      };
    });
    resumenSheet.columns = [{ width: 34 }, { width: 22 }, { width: 18 }, { width: 18 }];

    addTableSheet(
      workbook,
      'Consultas_Prioridad',
      [
        { header: 'Prioridad', key: 'prioridad' },
        { header: 'Total de consultas', key: 'total' },
      ],
      consultasPrioridad.rows.map((row) => ({
        prioridad: row.prioridad,
        total: row.total,
      }))
    );

    const stockSheet = addTableSheet(
      workbook,
      'Stock_Insumos',
      [
        { header: 'Insumo', key: 'nombre' },
        { header: 'Categoria', key: 'categoria' },
        { header: 'Stock actual', key: 'stock_actual' },
        { header: 'Stock minimo', key: 'stock_minimo' },
        { header: 'Unidad de medida', key: 'unidad_medida' },
        { header: 'Lote', key: 'lote' },
        { header: 'Fecha de vencimiento', key: 'fecha_vencimiento' },
        { header: 'Ultima actualizacion', key: 'actualizado_en' },
      ],
      stock.rows.map((row) => ({
        nombre: row.nombre,
        categoria: row.categoria ?? '',
        stock_actual: row.stock_actual,
        stock_minimo: row.stock_minimo,
        unidad_medida: row.unidad_medida,
        lote: row.lote ?? '',
        fecha_vencimiento: formatDay(row.fecha_vencimiento),
        actualizado_en: formatDate(row.actualizado_en),
      }))
    );
    applyLowStockHighlight(stockSheet, 'stock_actual', 'stock_minimo');

    addTableSheet(
      workbook,
      'Tendencia_14d',
      [
        { header: 'Dia', key: 'dia' },
        { header: 'Total de consultas', key: 'total' },
      ],
      tendencia.rows.map((row) => ({
        dia: formatDay(row.dia),
        total: row.total,
      }))
    );

    const expedienteColumns = [
      { header: 'Nombre', key: 'nombre' },
      { header: 'Apellido', key: 'apellido' },
      { header: 'Carnet', key: 'carnet_uni' },
      { header: 'Codigo de empleado', key: 'codigo_empleado' },
      { header: 'Tipo de paciente', key: 'tipo_paciente' },
      { header: 'Carrera o departamento', key: 'carrera_depto' },
      { header: 'Categoria', key: 'categoria' },
      { header: 'Cargo', key: 'cargo' },
      { header: 'Fecha de registro', key: 'creado_en' },
    ];

    if (isAdmin) {
      expedienteColumns.splice(5, 0, { header: 'Correo', key: 'email' }, { header: 'Telefono', key: 'telefono' });
    }

    addTableSheet(
      workbook,
      'Expedientes',
      expedienteColumns,
      expedientes.rows.map((row) => ({
        nombre: row.nombre,
        apellido: row.apellido,
        carnet_uni: row.carnet_uni,
        codigo_empleado: row.codigo_empleado ?? '',
        tipo_paciente: row.tipo_paciente,
        email: row.email ?? '',
        telefono: row.telefono ?? '',
        carrera_depto: row.carrera_depto,
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
      medicamentos.rows.map((row) => ({
        medicamento: row.medicamento,
        veces: row.veces,
      }))
    );

    const consultasColumns = [
      { header: 'ID consulta', key: 'id' },
      { header: 'Fecha', key: 'creado_en' },
      { header: 'Prioridad', key: 'prioridad' },
      { header: 'Tipo de paciente', key: 'tipo_paciente' },
      { header: 'Nombre', key: 'nombre' },
      { header: 'Apellido', key: 'apellido' },
      { header: 'Carnet', key: 'carnet_uni' },
      { header: 'Codigo de empleado', key: 'codigo_empleado' },
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
      consultasColumns.splice(9, 0, { header: 'Correo', key: 'email' }, { header: 'Telefono', key: 'telefono' });
    }

    addTableSheet(
      workbook,
      'Consultas_Completas',
      consultasColumns,
      consultasCompletas.rows.map((row) => ({
        id: row.id,
        creado_en: formatDate(row.creado_en),
        prioridad: row.prioridad,
        tipo_paciente: row.tipo_paciente,
        nombre: row.nombre,
        apellido: row.apellido,
        carnet_uni: row.carnet_uni ?? '',
        codigo_empleado: row.codigo_empleado ?? '',
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
