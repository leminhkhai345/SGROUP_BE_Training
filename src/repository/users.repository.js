import pool from "../config/db.config.js";

const findAll = async({sortBy = "id", order = "ASC"} = {}) => {
    const validColumns = ["id", "name", "email", "created_at"];
    if (!validColumns.includes(sortBy)) {
        throw new Error(`Invalid sortBy column: ${sortBy}`);
    }
    const validOrders = ["asc", "desc"];
    if (typeof order !== "string" || !validOrders.includes(order.toLowerCase())) {
        throw new Error(`Invalid order: ${order}`);
    }
    const data = await pool.query(`SELECT id, name, email, role, phone, dob, avt_url FROM users WHERE is_deleted = FALSE ORDER BY ${sortBy} ${order}`);
    return data.rows;
}


const findById = async(id)  => {
    const result = await pool.query("SELECT id, name, email, role, phone, dob, avt_url FROM users WHERE id = $1 AND is_deleted = FALSE", [id]);
    return result.rows[0] || null;
}


const findByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND is_deleted = FALSE", [email]);
  return result.rows[0] || null;
};

const create = async({name, email, password_hash, role, phone, dob, avt_url}) => {
    const result = await pool.query(
      `INSERT INTO users(name, email, password_hash, role, phone, dob, avt_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role`,
      [name, email, password_hash, role, phone ?? null, dob ?? null, avt_url ?? null]
    );
    return result.rows[0];
}

const update = async (id, { name, email, phone, dob}) => {
  const result = await pool.query(
    `UPDATE users 
     SET name = COALESCE($1, name), 
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         dob = COALESCE($4, dob),
         updated_at = NOW()
     WHERE id = $5 AND is_deleted = FALSE RETURNING id, name, email, role, phone, dob, avt_url`,
    [name ?? null, email ?? null, phone ?? null, dob ?? null, id]
  );
  return result.rows[0] || null;
};

const deleteById = async (id) => {
  const result = await pool.query(
    `UPDATE users
     SET is_deleted = TRUE, updated_at = NOW()
     WHERE id = $1 AND is_deleted = FALSE RETURNING id, name, email, role`,
    [id]
  );
  return result.rows[0] || null;
};

const updateAvatar = async (id, avt_url, previousKey) => {
    const result = await pool.query(
    `UPDATE users 
     SET avt_url = $1, updated_at = NOW()
     WHERE id = $2 AND is_deleted = FALSE AND avt_url IS NOT DISTINCT FROM $3 RETURNING id, name, email, role, phone, dob, avt_url`,
    [avt_url, id, previousKey ?? null]
  );
  return result.rows[0] || null;
}

export {findAll, findByEmail, findById, create, deleteById, update, updateAvatar};
