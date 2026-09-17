import pool from "../config/db.config.js";

const findAll = async({sortBy = "id", order = "ASC"}) => {
    const validColumns = ["id", "name", "email", "created_at"];
    if (!validColumns.includes(sortBy)) {
        throw new Error(`Invalid sortBy column: ${sortBy}`);
    }
    const validOrders = ["asc", "desc"];
    if (!validOrders.includes(order.toLowerCase())) {
        throw new Error(`Invalid order: ${order}`);
    }
    const data = await pool.query(`SELECT name, email, role FROM users ORDER BY ${sortBy} ${order}`);
    return data.rows;
}


const findById = async(id)  => {
    const result = await pool.query("SELECT name, email, role FROM users WHERE id = $1", [id]);
    return result.rows[0] || null;
}


const findByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0] || null;
};

const create = async({name, email, password_hash, role}) => {
    const result = await pool.query("INSERT INTO users(name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING name, email, role", [name, email, password_hash, role]);
    return result.rows[0];
}

const update = async (id, { name, email}) => {
  const result = await pool.query(
    `UPDATE users 
     SET name = COALESCE($1, name), 
         email = COALESCE($2, email)
     WHERE id = $3 RETURNING name, email, role`,
    [name ?? null, email ?? null, id]
  );
  return result.rows[0] || null;
};

const deleteById = async (id) => {
  const result = await pool.query(
    "DELETE FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

export {findAll, findByEmail, findById, create, deleteById, update};