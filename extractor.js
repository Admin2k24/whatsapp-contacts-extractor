const wppconnect = require("@wppconnect-team/wppconnect");
const sqlite3 = require("sqlite3").verbose();

// ====== SETUP DO BANCO DE DADOS ======
const db = new sqlite3.Database("./clientes.db", (err) => {
  if (err) {
    console.error("❌ Erro ao conectar ao banco de dados:", err);
  } else {
    console.log("✅ Banco de dados conectado\n");
  }
});

// Criar tabela de contatos se não existir
db.run(`
  CREATE TABLE IF NOT EXISTS contatos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT UNIQUE NOT NULL,
    nome TEXT,
    data_adicao DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ====== CONECTAR AO WHATSAPP ======
console.log("🔌 Conectando ao WhatsApp...\n");

wppconnect
  .create({
    session: "extractor-session",
    multiDevice: true,
    headless: false,
    folderNameToken: "./tokens",
  })
  .then((client) => {
    console.log("✅ WhatsApp conectado com sucesso!\n");

    // ====== EXTRAIR CONTATOS ======
    client.getAllChats().then((chats) => {
      console.log(`📱 Total de conversas encontradas: ${chats.length}\n`);
      console.log("Extraindo contatos...\n");
      console.log("-----------------------------------");

      let count = 0;

      chats.forEach((chat) => {
        // Pegar o identificador único
        const numero = chat.id._serialized;
        const nome = chat.name || "Sem nome";

        // Filtrar: apenas contatos individuais (não grupos)
        if (numero && !numero.includes("@g.us")) {
          db.run(
            `INSERT OR IGNORE INTO contatos (numero, nome) VALUES (?, ?)`,
            [numero, nome],
            (err) => {
              if (err) {
                console.error(`❌ Erro ao salvar ${nome}:`, err);
              } else {
                count++;
                console.log(`✅ ${count}. ${nome}`);
              }
            }
          );
        }
      });

      // Aguardar um pouco para terminar as inserções
      setTimeout(() => {
        console.log("-----------------------------------\n");
        console.log("✅ Extração concluída!\n");

        // Mostrar estatísticas
        db.all("SELECT COUNT(*) as total FROM contatos", (err, rows) => {
          if (!err) {
            console.log(`📊 Total de contatos salvos: ${rows[0].total}\n`);
          }

          // Listar todos os contatos
          db.all(
            "SELECT numero, nome FROM contatos ORDER BY nome",
            (err, rows) => {
              if (err) {
                console.error("Erro ao listar contatos:", err);
              } else {
                console.log("📋 LISTA DE CONTATOS:");
                console.log("-----------------------------------");
                rows.forEach((row, index) => {
                  console.log(`${index + 1}. ${row.nome}`);
                  console.log(`   📞 ${row.numero}\n`);
                });
                console.log("-----------------------------------\n");
              }

              // Fechar conexões
              db.close();
              client.close();
              console.log("✅ Pronto! Contatos salvos em 'clientes.db'");
              console.log("💡 Execute 'node view-contacts.js' para ver os contatos depois\n");
              process.exit(0);
            }
          );
        });
      }, 3000);
    });
  })
  .catch((error) => {
    console.error("❌ Erro ao conectar:", error);
    process.exit(1);
  });
