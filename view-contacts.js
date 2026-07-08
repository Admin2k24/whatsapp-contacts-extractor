const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./clientes.db", (err) => {
  if (err) {
    console.error("❌ Erro ao conectar ao banco de dados:", err);
    process.exit(1);
  }

  console.log("✅ Conectado ao banco de dados\n");

  // Contar total de contatos
  db.get("SELECT COUNT(*) as total FROM contatos", (err, row) => {
    if (err) {
      console.error("Erro ao contar contatos:", err);
      return;
    }

    console.log(`📊 TOTAL DE CONTATOS: ${row.total}\n`);

    // Listar todos os contatos
    db.all(
      "SELECT id, numero, nome, data_adicao FROM contatos ORDER BY nome",
      (err, rows) => {
        if (err) {
          console.error("Erro ao listar contatos:", err);
          db.close();
          return;
        }

        if (rows.length === 0) {
          console.log("Nenhum contato encontrado. Execute 'node extractor.js' primeiro!\n");
          db.close();
          return;
        }

        console.log("📋 LISTA COMPLETA DE CONTATOS:");
        console.log("-----------------------------------");
        rows.forEach((row) => {
          console.log(`Nome: ${row.nome}`);
          console.log(`Número: ${row.numero}`);
          console.log(`Adicionado em: ${row.data_adicao}`);
          console.log("-----------------------------------");
        });

        // Exportar para CSV
        exportToCSV(rows);

        db.close();
      }
    );
  });
});

// Função para exportar para CSV
function exportToCSV(rows) {
  const fs = require("fs");
  const csv = "Nome,Número,Data Adição\n" +
    rows.map(row => `"${row.nome}","${row.numero}","${row.data_adicao}"`).join("\n");

  fs.writeFileSync("contatos.csv", csv);
  console.log("\n✅ Contatos exportados para 'contatos.csv'\n");
}
