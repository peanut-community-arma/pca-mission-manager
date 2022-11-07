import postgres from "postgres";

const sql = postgres({
  transform: {
    column: {
      to: postgres.fromCamel,
      from: postgres.toCamel,
    },
  },
});

export default sql;
