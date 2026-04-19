import pool from './src/db';

async function checkSchema() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('expedientes', 'personas', 'consultas', 'usuarios')
      ORDER BY table_name, ordinal_position;
    `);
    console.log('--- Schema Info ---');
    console.table(res.rows);
    
    const countRes = await pool.query('SELECT COUNT(*) FROM expedientes');
    console.log('Total expedientes:', countRes.rows[0].count);
    
    const sampleRes = await pool.query('SELECT id FROM expedientes LIMIT 5');
    console.log('Sample IDs from expedientes:', sampleRes.rows);

    const userRes = await pool.query(`
      SELECT u.email, u.role, p.tipo_miembro 
      FROM usuarios u 
      JOIN personas p ON p.id = u.persona_id 
      WHERE u.role <> p.tipo_miembro::text
    `);
    console.log('--- Role Mismatches ---');
    console.table(userRes.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkSchema();
