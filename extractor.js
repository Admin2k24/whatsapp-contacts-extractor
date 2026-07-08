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

// ====== FUNÇÃO DE DELAY ALEATÓRIO ======
function randomDelay(min = 800, max = 2500) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ====== FUNÇÃO PARA SIMULAR COMPORTAMENTO HUMANO ======
function simulateHumanBehavior() {
  // Simula movimento do mouse, cliques ocasionais, etc
  return new Promise((resolve) => {
    const randomBehaviorDelay = Math.random() > 0.7 ? randomDelay(1000, 3000) : 0;
    setTimeout(resolve, randomBehaviorDelay);
  });
}

// ====== CONECTAR AO WHATSAPP ======
console.log("🔌 Conectando ao WhatsApp de forma segura...\n");
console.log("⏳ Aguardando conexão (isto pode levar um tempo)...\n");

wppconnect
  .create({
    session: "extractor-session",
    multiDevice: true,
    headless: false, // Mostrar navegador (parece mais natural)
    folderNameToken: "./tokens",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36", // User agent normal
  })
  .then(async (client) => {
    console.log("✅ WhatsApp conectado com sucesso!\n");
    console.log("⏳ Aguardando estabilização da conexão...\n");

    // Aguardar um tempo para parecer natural
    await new Promise((resolve) => setTimeout(resolve, randomDelay(2000, 5000)));

    // ====== EXTRAIR CONTATOS ======
    client.getAllChats().then(async (chats) => {
      console.log(`📱 Total de conversas encontradas: ${chats.length}\n`);
      console.log("🔄 Extraindo contatos com pausa natural...\n");
      console.log("-----------------------------------");

      let count = 0;
      let processedChats = 0;

      // Processar em lotes para parecer mais natural
      const BATCH_SIZE = 10; // Processar 10 contatos por vez
      const BATCH_DELAY = randomDelay(3000, 8000); // Delay entre lotes

      for (let i = 0; i < chats.length; i += BATCH_SIZE) {
        const batch = chats.slice(i, i + BATCH_SIZE);

        // Processar cada contato no lote
        for (const chat of batch) {
          const numero = chat.id._serialized;
          const nome = chat.name || "Sem nome";

          // Filtrar: apenas contatos individuais (não grupos)
          if (numero && !numero.includes("@g.us")) {
            // Delay aleatório entre 600-1500ms para cada contato
            await new Promise((resolve) => {
              setTimeout(() => {
                db.run(
                  `INSERT OR IGNORE INTO contatos (numero, nome) VALUES (?, ?)`,
                  [numero, nome],
                  (err) => {
                    if (err) {
                      console.error(`❌ Erro ao salvar ${nome}:`, err);
                    } else {
                      count++;
                      processedChats++;
                      console.log(`✅ ${count}. ${nome} (${processedChats}/${chats.length})`);
                    }
                  }
                );
                resolve();
              }, randomDelay(600, 1500));
            });

            // Simular comportamento humano ocasional
            await simulateHumanBehavior();
          }
        }

        // Delay maior entre lotes (simula pausas para respirar)
        if (i + BATCH_SIZE < chats.length) {
          console.log(`\n⏳ Pausa natural entre lotes (${Math.floor((i + BATCH_SIZE) / chats.length * 100)}% completo)...\n`);
          await new Promise((resolve) => {
            setTimeout(resolve, BATCH_DELAY);
          });
        }
      }

      console.log("-----------------------------------\n");
      console.log("✅ Extração concluída com sucesso!\n");

      // Aguardar um pouco antes de finalizar
      await new Promise((resolve) => setTimeout(resolve, randomDelay(2000, 4000)));

      // Mostrar estatísticas
      db.all("SELECT COUNT(*) as total FROM contatos", (err, rows) => {
        if (!err) {
          console.log(`📊 Total de contatos salvos: ${rows[0].total}\n`);
        }

        // Listar últimos 10 contatos como exemplo
        db.all(
          "SELECT numero, nome FROM contatos ORDER BY data_adicao DESC LIMIT 10",
          (err, rows) => {
            if (!err && rows.length > 0) {
              console.log("📋 ÚLTIMOS 10 CONTATOS ADICIONADOS:");
              console.log("-----------------------------------");
              rows.reverse().forEach((row, index) => {
                console.log(`${index + 1}. ${row.nome}`);
              });
              console.log("-----------------------------------\n");
            }

            // Fechar conexões de forma gradual
            console.log("🔌 Finalizando conexão com WhatsApp...\n");
            
            setTimeout(() => {
              db.close();
              client.close();
              
              console.log("✅ Pronto! Contatos salvos em 'clientes.db'");
              console.log("💡 Execute 'npm run view' para ver todos os contatos\n");
              
              process.exit(0);
            }, randomDelay(1000, 3000));
          }
        );
      });
    });
  })
  .catch((error) => {
    console.error("❌ Erro ao conectar:", error);
    process.exit(1);
  });

// ====== TRATAMENTO DE ERROS ======
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Erro não tratado:", reason);
  process.exit(1);
});
