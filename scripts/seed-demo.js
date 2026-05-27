#!/usr/bin/env node
// Seed de dados de demonstração — Intranet Corporativa
// Uso: node scripts/seed-demo.js
// Remove: node scripts/seed-demo.js --clean

const PB_URL   = process.env.PB_URL   || "http://localhost/pb";
const PB_EMAIL = process.env.PB_EMAIL || "admin@empresa.com";
const PB_PASS  = process.env.PB_PASS  || "Admin@2024!";

const CLEAN = process.argv.includes("--clean");

// ─── helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, method = "GET", body) {
  await sleep(130); // stay well under nginx rate limit (10 r/s)
  const res = await fetch(`${PB_URL}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  const text = await res.text();
  try { data = JSON.parse(text); } catch (_) {
    throw new Error(`${method} ${path} → ${res.status}: non-JSON response (nginx rate limit?)\n${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${data.message}`);
  return data;
}

async function getAll(col) {
  const d = await api(`/collections/${col}/records?perPage=200&skipTotal=1`);
  return d.items || [];
}

async function create(col, body) {
  return api(`/collections/${col}/records`, "POST", body);
}

async function deleteAll(col) {
  const items = await getAll(col);
  for (const item of items) {
    await api(`/collections/${col}/records/${item.id}`, "DELETE");
  }
  console.log(`  🗑  ${col}: ${items.length} removidos`);
}

// ─── login ────────────────────────────────────────────────────────────────────

let token = "";
async function login() {
  const d = await api("/admins/auth-with-password", "POST", { identity: PB_EMAIL, password: PB_PASS });
  token = d.token;
  console.log("✓ Admin autenticado");
}

// ─── limpeza ──────────────────────────────────────────────────────────────────

async function clean() {
  console.log("\n🧹 Removendo dados de demo...");
  const cols = [
    "post_comments","post_reactions","posts",
    "announcements","articles","wiki_articles",
    "ticket_comments","tickets","tasks",
    "events","job_applications","job_postings",
    "benefits","achievements","useful_links",
    "trainings","polls","wall_cards",
  ];
  for (const c of cols) { try { await deleteAll(c); } catch (_) {} }

  const users = await getAll("users");
  for (const u of users) {
    await api(`/collections/users/records/${u.id}`, "DELETE");
  }
  console.log(`  🗑  users: ${users.length} removidos`);
  console.log("\n✅ Limpeza concluída!");
}

// ─── seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("\n🌱 Criando dados de demonstração...\n");

  // ── USUÁRIOS ──────────────────────────────────────────────────────────────
  console.log("👥 Criando usuários...");
  const userDefs = [
    { name:"Guilherme Zanetti",    email:"guilherme@empresa.com", role:"admin", department:"TI",         phone:"(11) 99999-0001", bio:"CTO e desenvolvedor full stack. Apaixonado por tecnologia e inovação." },
    { name:"Ana Paula Santos",     email:"ana.paula@empresa.com", role:"rh",    department:"RH",         phone:"(11) 99999-0002", bio:"Gestora de pessoas com 8 anos de experiência em RH estratégico." },
    { name:"Carlos Mendes",        email:"carlos@empresa.com",    role:"ti",    department:"TI",         phone:"(11) 99999-0003", bio:"Analista de sistemas e especialista em suporte técnico." },
    { name:"Fernanda Costa",       email:"fernanda@empresa.com",  role:"user",  department:"Comercial",  phone:"(11) 99999-0004", bio:"Executiva de contas com foco em grandes clientes." },
    { name:"Roberto Alves",        email:"roberto@empresa.com",   role:"user",  department:"Operações",  phone:"(11) 99999-0005", bio:"Coordenador de operações e logística." },
    { name:"Juliana Pereira",      email:"juliana@empresa.com",   role:"rh",    department:"RH",         phone:"(11) 99999-0006", bio:"Analista de recrutamento e seleção." },
    { name:"Marcos Oliveira",      email:"marcos@empresa.com",    role:"user",  department:"Financeiro", phone:"(11) 99999-0007", bio:"Controller financeiro e responsável pelo planejamento orçamentário." },
    { name:"Patricia Lima",        email:"patricia@empresa.com",  role:"user",  department:"Marketing",  phone:"(11) 99999-0008", bio:"Head de Marketing Digital e comunicação corporativa." },
  ];

  const users = {};
  for (const u of userDefs) {
    const created = await create("users", {
      email: u.email, emailVisibility: true,
      password: "Demo@2024!", passwordConfirm: "Demo@2024!",
      name: u.name, role: u.role, department: u.department,
      phone: u.phone, bio: u.bio,
      birthday: `199${Math.floor(Math.random()*9)}-0${Math.floor(Math.random()*9)+1}-${String(Math.floor(Math.random()*28)+1).padStart(2,"0")}`,
    });
    users[u.email] = created.id;
    process.stdout.write(`  ✓ ${u.name}\n`);
  }

  const guiId  = users["guilherme@empresa.com"];
  const anaId  = users["ana.paula@empresa.com"];
  const carId  = users["carlos@empresa.com"];
  const ferId  = users["fernanda@empresa.com"];
  const robId  = users["roberto@empresa.com"];
  const julId  = users["juliana@empresa.com"];
  const marId  = users["marcos@empresa.com"];
  const patId  = users["patricia@empresa.com"];

  // ── ESPAÇOS (já criados pelo bootstrap, busca os IDs) ─────────────────────
  const spaces = await getAll("spaces");
  const spaceMap = {};
  spaces.forEach((s) => { spaceMap[s.name] = s.id; });
  const geralId = spaceMap["Geral"] || (spaces[0] && spaces[0].id) || "";

  // ── POSTS (FEED) ──────────────────────────────────────────────────────────
  console.log("\n📰 Criando posts...");
  const postContents = [
    { author: guiId,  content: "🚀 Bem-vindos à nova Intranet da empresa! Aqui vocês vão encontrar tudo: comunicados, documentos, chamados, vagas e muito mais. Qualquer dúvida, estou à disposição!" },
    { author: anaId,  content: "📢 Lembrete: a pesquisa de clima organizacional estará aberta até sexta-feira. Sua participação é essencial para continuarmos melhorando nosso ambiente de trabalho. Link disponível em Pesquisas 👆" },
    { author: patId,  content: "🎉 Acabamos de fechar mais um grande contrato! Parabéns para toda a equipe comercial pelo esforço e dedicação. Vocês são incríveis! 💪" },
    { author: carId,  content: "⚠️ Comunicado TI: amanhã às 22h faremos manutenção nos servidores. O sistema ficará indisponível por aproximadamente 2 horas. Planejamento os acessos necessários com antecedência." },
    { author: ferId,  content: "Alguém tem a planilha de metas do Q2 atualizada? Preciso para a reunião de hoje à tarde 🙏" },
    { author: robId,  content: "Bom dia equipe! Iniciando mais uma semana com muita energia. Vamos com tudo! ☕🔥" },
    { author: marId,  content: "📊 Fechamento do mês: batemos 112% da meta de receita! Excelente resultado para toda a empresa. Detalhes no relatório mensal que enviei por email." },
    { author: julId,  content: "🎂 Não se esqueçam: amanhã é aniversário da nossa colega Fernanda! Vamos passar no café às 15h para comemorar juntos 🎂" },
    { author: guiId,  content: "Dica rápida: use Cmd+K para buscar qualquer coisa na intranet — pessoas, documentos, wiki, chamados. Super útil no dia a dia! 🔍" },
    { author: anaId,  content: "📋 Novo colaborador chegando semana que vem na área de Desenvolvimento! Preparem-se para receber bem o Thiago que vem do mercado financeiro com bagagem incrível em sistemas." },
  ];

  for (const p of postContents) {
    await create("posts", { ...p, space: geralId, pinned: false });
  }
  console.log(`  ✓ ${postContents.length} posts criados`);

  // ── AVISOS ────────────────────────────────────────────────────────────────
  console.log("\n📣 Criando avisos...");
  const avisosDefs = [
    { title:"🔴 URGENTE: Sistema em manutenção amanhã", content:"O sistema estará em manutenção amanhã (26/05) das 22h às 00h. Salve todos os trabalhos em andamento. Contato de emergência: carlos@empresa.com", category:"TI", priority:"urgent", pinned:true,  author:carId },
    { title:"Novo benefício: Gympass disponível a partir de junho", content:"A empresa firmou parceria com o Gympass! A partir de junho todos os colaboradores terão acesso à rede de academias com desconto de 70% no plano. Consulte o RH para se cadastrar.", category:"RH", priority:"high", pinned:true,  author:anaId },
    { title:"Reunião All-Hands — Resultados Q1 2025", content:"Convidamos todos para a reunião geral de resultados do primeiro trimestre. Data: 30/05 às 14h, Sala de Reuniões A (e link Teams para quem estiver remoto). Agenda: resultados financeiros, metas Q2 e novidades da empresa.", category:"Geral", priority:"normal", pinned:false, author:guiId },
    { title:"Atualização da política de home office", content:"Informamos que a política de trabalho remoto foi atualizada. A partir de junho, todos os colaboradores elegíveis poderão trabalhar remotamente até 3 dias por semana. Consulte o documento completo em Documentos > RH.", category:"RH", priority:"normal", pinned:false, author:anaId },
    { title:"Confraternização de fim de semestre — 28/06", content:"Está confirmada a confraternização do time! Será no dia 28 de junho, a partir das 19h, no Terraço do Edifício. Open bar e petiscos por conta da empresa. Confirme presença com o RH até dia 20/06.", category:"Geral", priority:"normal", pinned:false, author:julId },
  ];
  for (const a of avisosDefs) await create("announcements", a);
  console.log(`  ✓ ${avisosDefs.length} avisos criados`);

  // ── ARTIGOS (NOTÍCIAS + BLOG) ─────────────────────────────────────────────
  console.log("\n📄 Criando artigos...");
  const artigoDefs = [
    { title:"Empresa registra crescimento de 35% no primeiro trimestre", content:"<p>A empresa encerrou o primeiro trimestre de 2025 com um crescimento expressivo de 35% em relação ao mesmo período do ano anterior. Os resultados superam as expectativas do mercado e consolidam nossa posição de liderança no setor.</p><p>O CEO destacou que o crescimento é fruto do trabalho em equipe e da dedicação de todos os colaboradores. \"Esse resultado nos enche de orgulho e nos motiva a continuar crescendo de forma sustentável\", afirmou.</p><p>Para o segundo trimestre, a empresa planeja expandir sua presença em mais dois estados brasileiros e lançar duas novas linhas de produto.</p>", type:"news", status:"published", tags:"resultados,crescimento,q1", author:guiId },
    { title:"Parceria estratégica com Microsoft fortalece infraestrutura", content:"<p>Anunciamos hoje uma parceria estratégica com a Microsoft Brasil para modernização de toda a infraestrutura tecnológica da empresa. O acordo prevê migração para Azure, implementação do Microsoft 365 corporativo e treinamento para toda a equipe de TI.</p><p>\"Essa parceria vai nos permitir escalar com segurança e eficiência\", comentou o CTO Guilherme Zanetti. A implantação começa em julho e terá duração de 6 meses.</p>", type:"news", status:"published", tags:"tecnologia,microsoft,parceria", author:carId },
    { title:"Programa de desenvolvimento profissional é lançado", content:"<p>O departamento de RH lança o Programa de Desenvolvimento Profissional 2025, com bolsas de estudo, cursos certificados e mentoria interna para todos os colaboradores.</p><p>As inscrições estão abertas até 15 de junho. Cada colaborador pode se inscrever em até dois programas. Mais informações em Treinamentos na intranet.</p>", type:"news", status:"published", tags:"rh,treinamento,desenvolvimento", author:anaId },
    { title:"Como aumentar sua produtividade com técnicas modernas", content:"<p>Produtividade não é sobre trabalhar mais horas — é sobre trabalhar de forma mais inteligente. Neste post, compartilho as técnicas que transformaram minha rotina de trabalho.</p><h2>1. Técnica Pomodoro</h2><p>Trabalhe em blocos de 25 minutos com 5 minutos de pausa. Após 4 blocos, faça uma pausa maior de 20 minutos. Essa técnica mantém o foco e previne a fadiga mental.</p><h2>2. Deep Work</h2><p>Reserve blocos de 2-3 horas diárias para trabalho profundo, sem interrupções. Desative notificações e feche o email nesse período.</p><h2>3. Regra dos 2 minutos</h2><p>Se uma tarefa leva menos de 2 minutos, faça agora. Não a coloque na lista.</p>", type:"blog", status:"published", tags:"produtividade,dicas,gestao", author:guiId },
    { title:"5 ferramentas de TI que estamos usando em 2025", content:"<p>A área de TI está sempre explorando novas ferramentas para melhorar a eficiência e segurança. Aqui estão as 5 que mais impactaram nosso trabalho em 2025:</p><h2>1. PocketBase</h2><p>Backend open-source que substituiu 3 serviços separados. Simples, rápido e com realtime nativo.</p><h2>2. Next.js 15+</h2><p>Framework React com App Router que tornou nosso frontend muito mais performático.</p><h2>3. Docker + nginx</h2><p>Containerização total da infraestrutura com proxy reverso seguro.</p><h2>4. Tailwind CSS v4</h2><p>A nova versão do Tailwind simplificou muito nosso workflow de CSS.</p><h2>5. GitHub Actions</h2><p>CI/CD automatizado para deploy com zero downtime.</p>", type:"blog", status:"published", tags:"ti,ferramentas,tecnologia", author:carId },
  ];
  for (const a of artigoDefs) await create("articles", a);
  console.log(`  ✓ ${artigoDefs.length} artigos criados`);

  // ── WIKI ──────────────────────────────────────────────────────────────────
  console.log("\n📚 Criando wiki...");
  const wikiDefs = [
    { title:"Guia de Onboarding — Primeiros passos", category:"RH", tags:"onboarding,novo colaborador", author:anaId, content:"<h2>Bem-vindo à empresa!</h2><p>Este guia foi criado para te ajudar nos primeiros dias. Siga os passos abaixo para uma integração tranquila.</p><h2>Semana 1</h2><ul><li>Reunião com RH para formalidades contratuais</li><li>Setup do computador com a equipe de TI</li><li>Apresentação para a equipe do departamento</li><li>Configuração de email e acessos</li></ul><h2>Semana 2</h2><ul><li>Reuniões de alinhamento com gestor direto</li><li>Treinamentos obrigatórios de segurança da informação</li><li>Familiarização com as ferramentas do dia a dia</li></ul>" },
    { title:"Política de Segurança da Informação", category:"TI", tags:"segurança,política,ti", author:carId, content:"<h2>1. Senhas</h2><p>Todas as senhas devem ter no mínimo 12 caracteres com letras maiúsculas, minúsculas, números e símbolos. Troca obrigatória a cada 90 dias.</p><h2>2. Acesso Remoto</h2><p>Use exclusivamente a VPN corporativa ao acessar sistemas internos fora da empresa. Nunca acesse pelo Wi-Fi público sem VPN.</p><h2>3. Dispositivos</h2><p>Não instale softwares não autorizados nos computadores corporativos. Em caso de dúvida, abra um chamado para o TI.</p><h2>4. Incidentes</h2><p>Qualquer suspeita de incidente de segurança deve ser reportada imediatamente via chamado com prioridade Alta.</p>" },
    { title:"Como solicitar férias e ausências", category:"RH", tags:"férias,ausência,rh", author:julId, content:"<h2>Solicitação de Férias</h2><p>As férias devem ser solicitadas com no mínimo 30 dias de antecedência através do sistema RH. O período mínimo é de 5 dias úteis consecutivos.</p><h2>Passos para solicitar</h2><ul><li>Acesse o sistema de RH com seu login corporativo</li><li>Selecione \"Solicitações > Férias\"</li><li>Escolha o período desejado</li><li>Aguarde aprovação do gestor (prazo: 5 dias úteis)</li></ul><h2>Banco de Horas</h2><p>Horas extras devem ser registradas no sistema e compensadas preferencialmente na mesma semana ou na seguinte.</p>" },
    { title:"Processo de Abertura de Chamados de TI", category:"TI", tags:"chamados,ti,suporte", author:carId, content:"<h2>Quando abrir um chamado?</h2><p>Abra um chamado para qualquer problema técnico: computador lento, sem acesso a sistema, impressora não funciona, solicitação de novo software, etc.</p><h2>Prioridades</h2><ul><li><strong>Alta:</strong> sistema completamente parado, afetando trabalho imediato</li><li><strong>Média:</strong> problema que atrapalha mas permite trabalhar</li><li><strong>Baixa:</strong> melhorias, solicitações não urgentes</li></ul><h2>SLA de atendimento</h2><ul><li>Alta: até 2 horas</li><li>Média: até 1 dia útil</li><li>Baixa: até 3 dias úteis</li></ul>" },
    { title:"Benefícios corporativos — guia completo", category:"RH", tags:"benefícios,rh,plano de saúde", author:anaId, content:"<h2>Plano de Saúde</h2><p>Cobertura Amil 400 Nacional. Extensível a dependentes com coparticipação de 30%. Carência de 30 dias após a contratação.</p><h2>Vale Refeição / Alimentação</h2><p>R$ 45/dia de VR (dias trabalhados) + R$ 700/mês de VA fixo. Cartão Sodexo, aceito em todos os estabelecimentos.</p><h2>Plano Odontológico</h2><p>Uniodonto básico gratuito. Upgrade opcional com desconto em folha.</p><h2>Gympass</h2><p>Disponível a partir de junho/2025. Acesso a mais de 4.000 academias parceiras com desconto de 70%.</p>" },
  ];
  for (const w of wikiDefs) await create("wiki_articles", w);
  console.log(`  ✓ ${wikiDefs.length} artigos de wiki criados`);

  // ── CHAMADOS ──────────────────────────────────────────────────────────────
  console.log("\n🎫 Criando chamados...");
  const ticketDefs = [
    { title:"Computador lento ao abrir o Excel", description:"Desde ontem meu computador está muito lento ao abrir arquivos Excel grandes. Já reiniciei 3 vezes e o problema persiste. Preciso disso funcionando urgente para fechar o relatório do mês.", category:"hardware", priority:"alta", status:"em_andamento", author:ferId, assignee:carId },
    { title:"Solicitar acesso ao sistema ERP", description:"Preciso de acesso ao módulo financeiro do ERP para consultar notas fiscais. Meu gestor Marcos Oliveira já aprovou a solicitação por email.", category:"acesso", priority:"media", status:"aberto", author:robId },
    { title:"VPN não conecta de casa", description:"Estou tentando conectar à VPN para trabalhar em home office mas recebo o erro 'Connection timeout' há 2 dias. Já reinstalei o cliente mas o problema continua.", category:"rede", priority:"alta", status:"resolvido", author:marId, assignee:carId },
    { title:"Instalar Adobe Acrobat Pro", description:"Preciso do Adobe Acrobat Pro para assinar digitalmente contratos com clientes. É necessário para o fluxo de trabalho do meu departamento.", category:"software", priority:"baixa", status:"aberto", author:ferId },
    { title:"Monitor com tela piscando", description:"O monitor secundário da minha mesa está piscando intermitentemente há uma semana. Já tentei trocar o cabo mas não resolveu.", category:"hardware", priority:"media", status:"em_andamento", author:julId, assignee:carId },
    { title:"Email corporativo não sincroniza no celular", description:"O email corporativo parou de sincronizar no meu iPhone há 3 dias. Consigo acessar pelo navegador mas no app não chega nenhuma mensagem nova.", category:"software", priority:"media", status:"aberto", author:patId },
  ];
  for (const t of ticketDefs) await create("tickets", t);
  console.log(`  ✓ ${ticketDefs.length} chamados criados`);

  // ── TAREFAS ───────────────────────────────────────────────────────────────
  console.log("\n✅ Criando tarefas...");
  const taskDefs = [
    { title:"Preparar apresentação Q2 para board", description:"Montar deck com resultados do Q1 e projeções para o Q2. Incluir métricas de crescimento, NPS e pipeline comercial.", assignee:guiId, created_by:guiId, status:"em_andamento", priority:"alta", due_date:"2026-05-30T18:00:00Z", is_team:false },
    { title:"Revisar contratos de novos fornecedores", description:"Analisar e aprovar minutas dos contratos com os 3 novos fornecedores de logística. Prazo: antes da assinatura na próxima semana.", assignee:marId, created_by:guiId, status:"pendente", priority:"alta", due_date:"2026-05-28T18:00:00Z", is_team:false },
    { title:"Conduzir entrevistas — vaga Dev Full Stack", description:"Realizar 5 entrevistas técnicas com candidatos pré-selecionados pelo RH para a vaga de Desenvolvedor Full Stack.", assignee:carId, created_by:anaId, status:"em_andamento", priority:"media", due_date:"2026-06-05T18:00:00Z", is_team:false },
    { title:"Atualizar manual de integração de novos colaboradores", description:"O manual atual está desatualizado. Revisar seções de TI, benefícios e políticas de home office.", assignee:julId, created_by:anaId, status:"pendente", priority:"media", due_date:"2026-06-10T18:00:00Z", is_team:false },
    { title:"Campanha de lançamento do produto X", description:"Planejar e executar campanha de marketing digital para o lançamento do novo produto. Inclui posts nas redes, email mkt e webinar.", assignee:patId, created_by:guiId, status:"pendente", priority:"alta", due_date:"2026-06-15T18:00:00Z", is_team:true },
    { title:"Migração de dados para novo servidor", description:"Executar a migração de todos os dados do servidor legado para o novo ambiente cloud. Janela de manutenção: sábado 00h-06h.", assignee:carId, created_by:guiId, status:"pendente", priority:"alta", due_date:"2026-05-31T06:00:00Z", is_team:false },
    { title:"Pesquisa de clima — consolidar resultados", description:"Tabular as respostas da pesquisa de clima e preparar relatório para apresentação à diretoria.", assignee:anaId, created_by:anaId, status:"concluida", priority:"media", due_date:"2026-05-20T18:00:00Z", is_team:false },
  ];
  for (const t of taskDefs) await create("tasks", t);
  console.log(`  ✓ ${taskDefs.length} tarefas criadas`);

  // ── EVENTOS ───────────────────────────────────────────────────────────────
  console.log("\n📅 Criando eventos...");
  const today = new Date();
  const d = (offset, h=9, m=0) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    dt.setHours(h, m, 0, 0);
    return dt.toISOString();
  };
  const eventDefs = [
    { title:"Reunião All-Hands Q1 Results", description:"Apresentação dos resultados do Q1 e metas do Q2 para toda a empresa. Participação obrigatória.", start:d(5,14,0), end:d(5,16,0), author:guiId, color:"#7c3aed", all_day:false },
    { title:"Happy Hour — Comemoração da meta", description:"Vamos comemorar o bater de meta do trimestre! Patrocínio da empresa. Traga a família!", start:d(7,18,0), end:d(7,22,0), author:anaId, color:"#059669", all_day:false },
    { title:"Treinamento: Segurança da Informação", description:"Treinamento obrigatório sobre LGPD e melhores práticas de segurança digital. Turma A.", start:d(10,9,0), end:d(10,12,0), author:carId, color:"#dc2626", all_day:false },
    { title:"1:1 — Avaliações de Desempenho", description:"Período de reuniões de avaliação de desempenho semestral entre gestores e liderados.", start:d(12,0,0), end:d(16,23,59), author:anaId, color:"#d97706", all_day:true },
    { title:"Lançamento Produto X — Webinar", description:"Webinar de lançamento do novo produto para clientes e parceiros. Link de transmissão no email.", start:d(20,10,0), end:d(20,12,0), author:patId, color:"#0891b2", all_day:false },
    { title:"Confraternização de Fim de Semestre", description:"Festa de encerramento do semestre. Open bar e petiscos. Terraço do Edifício, 19h.", start:d(34,19,0), end:d(34,23,0), author:julId, color:"#7c3aed", all_day:false },
    { title:"Feriado — Corpus Christi", description:"Feriado nacional.", start:d(-2,0,0), end:d(-2,23,59), author:guiId, color:"#6b7280", all_day:true },
  ];
  for (const e of eventDefs) await create("events", e);
  console.log(`  ✓ ${eventDefs.length} eventos criados`);

  // ── VAGAS ─────────────────────────────────────────────────────────────────
  console.log("\n💼 Criando vagas...");
  const vagasDefs = [
    { title:"Desenvolvedor Full Stack Sênior", department:"TI", description:"Buscamos um desenvolvedor Full Stack Sênior para integrar nossa equipe de produto. Você trabalhará com React, Next.js, Node.js e tecnologias cloud. Ambiente dinâmico, equipe jovem e salário competitivo.", requirements:"- 5+ anos de experiência com desenvolvimento web\n- Proficiência em React/Next.js e Node.js\n- Experiência com banco de dados SQL e NoSQL\n- Conhecimento em Docker e CI/CD\n- Inglês técnico para leitura de documentação", type:"CLT", status:"aberta", deadline:"2026-06-30T23:59:59Z", author:guiId },
    { title:"Analista de Marketing Digital", department:"Marketing", description:"Procuramos um Analista de Marketing Digital criativo e orientado a dados para planejar e executar campanhas omnichannel, gerenciar redes sociais e analisar métricas de performance.", requirements:"- 3+ anos em marketing digital\n- Domínio de Google Ads, Meta Ads e LinkedIn Ads\n- Experiência com SEO e marketing de conteúdo\n- Conhecimento em ferramentas de analytics (GA4, Power BI)\n- Desejável: certificações Google e Meta", type:"CLT", status:"aberta", deadline:"2026-06-15T23:59:59Z", author:anaId },
    { title:"Estágio em Recursos Humanos", department:"RH", description:"Vaga de estágio para apoiar as rotinas de recrutamento, seleção e desenvolvimento de pessoas. Ótima oportunidade para quem está iniciando a carreira em RH.", requirements:"- Cursando Psicologia, Administração ou áreas afins\n- Boa comunicação e habilidade interpessoal\n- Organização e proatividade\n- Conhecimento básico em Excel", type:"Estágio", status:"aberta", deadline:"2026-06-10T23:59:59Z", author:julId },
    { title:"Analista Financeiro Pleno", department:"Financeiro", description:"Vaga para profissional de finanças com experiência em controladoria, análise de demonstrativos e planejamento financeiro. Reporte direto ao CFO.", requirements:"- Formação em Contabilidade, Economia ou Administração\n- 4+ anos em controladoria ou FP&A\n- Conhecimento avançado em Excel e Power BI\n- Desejável: experiência com ERPs (SAP, TOTVS)", type:"CLT", status:"encerrada", author:marId },
  ];
  for (const v of vagasDefs) await create("job_postings", v);
  console.log(`  ✓ ${vagasDefs.length} vagas criadas`);

  // ── BENEFÍCIOS ────────────────────────────────────────────────────────────
  console.log("\n🎁 Criando benefícios...");
  const bensDefs = [
    { title:"Plano de Saúde Amil 400", description:"Plano de saúde completo com cobertura nacional para você e seus dependentes.", details:"Cobertura: consultas, exames, internações e cirurgias. Rede credenciada com mais de 8.000 médicos em todo o Brasil. Extensível a cônjuge e filhos até 21 anos com coparticipação de 30%.", category:"Saúde", icon:"🏥", author:anaId },
    { title:"Vale Refeição + Vale Alimentação", description:"R$ 45/dia de VR para refeições + R$ 700/mês de VA para compras em supermercados.", details:"Cartão Sodexo Multi Benefícios. VR creditado diariamente nos dias trabalhados. VA creditado no 1º dia útil de cada mês. Aceito em mais de 500.000 estabelecimentos.", category:"Alimentação", icon:"🍽️", author:anaId },
    { title:"Gympass", description:"Acesso a mais de 4.000 academias e estúdios parceiros com desconto de 70%.", details:"Disponível a partir de junho/2025. Inclui academias, studios de pilates, yoga, musculação e muito mais. Plano básico custeado pela empresa, upgrades com desconto em folha. Cadastro pelo app Gympass.", category:"Bem-estar", icon:"💪", author:anaId },
    { title:"Plano Odontológico Uniodonto", description:"Cobertura odontológica básica gratuita com opção de upgrade.", details:"Cobertura gratuita: consultas, limpeza, restaurações e extrações. Upgrade para plano plus (ortodontia, implante) com desconto de 60% em folha. Mais de 20.000 dentistas credenciados.", category:"Saúde", icon:"🦷", author:anaId },
    { title:"Auxílio Home Office", description:"R$ 150/mês para colaboradores em regime de trabalho remoto ou híbrido.", details:"Creditado junto ao salário nos meses com home office. Sem necessidade de comprovante de gastos. Para colaboradores em regime 100% remoto: R$ 300/mês.", category:"Trabalho", icon:"🏠", author:anaId },
    { title:"Bolsa de Estudos", description:"Reembolso de até 70% em cursos de graduação, pós-graduação e certificações.", details:"Reembolso de 70% para cursos relacionados à função. 50% para cursos de interesse geral. Processo: aprovação do gestor + apresentação da nota fiscal. Limite de R$ 800/mês.", category:"Educação", icon:"🎓", author:anaId },
    { title:"Day Off de Aniversário", description:"Folga remunerada no dia do seu aniversário (ou dia útil mais próximo).", details:"Solicite com 5 dias de antecedência pelo sistema de RH. Pode ser transferida para até 5 dias antes ou depois do aniversário. Não acumula se não utilizada.", category:"Qualidade de Vida", icon:"🎂", author:anaId },
  ];
  for (const b of bensDefs) await create("benefits", b);
  console.log(`  ✓ ${bensDefs.length} benefícios criados`);

  // ── CONQUISTAS ────────────────────────────────────────────────────────────
  console.log("\n🏆 Criando conquistas...");
  const achDefs = [
    { title:"Funcionário do Mês — Abril", description:"Reconhecimento pelo desempenho excepcional em abril, contribuindo com resultados acima da meta e atitude exemplar.", icon:"🏆", recipient:ferId, author:guiId, date:"2026-04-30", public:true },
    { title:"5 Anos de Casa", description:"Celebrando 5 anos de dedicação e contribuição para o crescimento da empresa. Muito obrigado!", icon:"⭐", recipient:robId, author:anaId, date:"2026-05-10", public:true },
    { title:"Projeto Entregue com Zero Bugs", description:"Reconhecimento pelo projeto de migração entregue no prazo e sem nenhum bug reportado em produção.", icon:"🚀", recipient:carId, author:guiId, date:"2026-05-15", public:true },
    { title:"Melhor NPS do Trimestre", description:"A equipe Comercial atingiu o maior NPS da história da empresa este trimestre: 87 pontos!", icon:"📈", recipient:ferId, author:guiId, date:"2026-04-05", public:true },
    { title:"Mentora do Mês", description:"Reconhecimento pela excelência em onboarding e mentoria dos novos colaboradores no trimestre.", icon:"💡", recipient:anaId, author:guiId, date:"2026-05-01", public:true },
  ];
  for (const a of achDefs) await create("achievements", a);
  console.log(`  ✓ ${achDefs.length} conquistas criadas`);

  // ── LINKS ÚTEIS ───────────────────────────────────────────────────────────
  console.log("\n🔗 Criando links úteis...");
  const linkDefs = [
    { title:"Sistema ERP", url:"https://erp.empresa.com", description:"Sistema de gestão empresarial integrado", category:"Sistemas", icon:"💼", author:guiId, order:1 },
    { title:"Portal RH", url:"https://rh.empresa.com", description:"Solicitar férias, holerites e documentos de RH", category:"RH", icon:"👥", author:anaId, order:2 },
    { title:"Microsoft Teams", url:"https://teams.microsoft.com", description:"Reuniões, chat e colaboração", category:"Comunicação", icon:"💬", author:carId, order:3 },
    { title:"Google Drive Corporativo", url:"https://drive.google.com", description:"Armazenamento e colaboração em documentos", category:"Ferramentas", icon:"📁", author:guiId, order:4 },
    { title:"Power BI — Dashboards", url:"https://app.powerbi.com", description:"Dashboards de performance e KPIs", category:"Relatórios", icon:"📊", author:marId, order:5 },
    { title:"Benefícios — Portal Sodexo", url:"https://portal.sodexo.com.br", description:"Consultar saldo e extrato do cartão benefícios", category:"Benefícios", icon:"💳", author:anaId, order:6 },
    { title:"Amil — Plano de Saúde", url:"https://www.amil.com.br", description:"Agendar consultas e verificar cobertura", category:"Benefícios", icon:"🏥", author:anaId, order:7 },
    { title:"GitHub Corporativo", url:"https://github.com/empresa", description:"Repositórios de código da empresa", category:"Desenvolvimento", icon:"💻", author:carId, order:8 },
  ];
  for (const l of linkDefs) await create("useful_links", l);
  console.log(`  ✓ ${linkDefs.length} links criados`);

  // ── TREINAMENTOS ──────────────────────────────────────────────────────────
  console.log("\n🎓 Criando treinamentos...");
  const trainDefs = [
    { title:"LGPD — Lei Geral de Proteção de Dados", description:"Treinamento obrigatório sobre a Lei Geral de Proteção de Dados. Aborda os princípios, direitos dos titulares e obrigações da empresa.", category:"Compliance", duration:"2h", author:carId },
    { title:"Comunicação Não-Violenta no trabalho", description:"Aprenda a se comunicar de forma empática, assertiva e construtiva. Baseado na metodologia CNV de Marshall Rosenberg.", category:"Soft Skills", duration:"3h", author:anaId },
    { title:"Excel Avançado para Análise de Dados", description:"Domine as funções avançadas do Excel: Tabela Dinâmica, Power Query, funções de lookup e criação de dashboards.", category:"Tecnologia", duration:"6h", author:guiId },
    { title:"Gestão de Conflitos e Negociação", description:"Ferramentas práticas para identificar, mediar e resolver conflitos no ambiente profissional de forma produtiva.", category:"Liderança", duration:"4h", author:anaId },
    { title:"Segurança da Informação — Módulo Básico", description:"Boas práticas de segurança digital: senhas, phishing, uso seguro de dispositivos corporativos e navegação segura.", category:"Compliance", duration:"1h30", author:carId },
  ];
  for (const t of trainDefs) await create("trainings", t);
  console.log(`  ✓ ${trainDefs.length} treinamentos criados`);

  // ── MURAL ──────────────────────────────────────────────────────────────────
  console.log("\n📌 Criando mural...");
  const muralDefs = [
    { message:"Parabéns Fernanda pelos 3 anos de empresa! Você é um exemplo de dedicação e profissionalismo para todos nós! 🎉🎂", type:"parabens", recipient:ferId, author:anaId, emoji:"🎂" },
    { message:"Bem-vindo ao time, Carlos! Estamos super animados com sua chegada. Vai gostar muito de trabalhar aqui, te garantimos! 🚀", type:"boas_vindas", recipient:carId, author:guiId, emoji:"👋" },
    { message:"Obrigada a toda equipe pelo apoio durante meu período de licença. Voltei renovada e animada para entregar muito! ❤️", type:"recado", author:julId, emoji:"❤️" },
    { message:"Parabéns à equipe de TI pela entrega do projeto dentro do prazo! Vocês são demais! 💪💻", type:"conquista", author:patId, emoji:"🏆" },
    { message:"Nosso colega Roberto está de saída após 8 anos de contribuição incrível. Desejamos todo sucesso na nova jornada! 🙏", type:"despedida", recipient:robId, author:anaId, emoji:"🙏" },
  ];
  for (const m of muralDefs) await create("wall_cards", m);
  console.log(`  ✓ ${muralDefs.length} cards criados`);

  // ── DOCUMENTOS ────────────────────────────────────────────────────────────
  console.log("\n📄 Criando documentos (sem arquivo)...");
  // Documentos sem arquivo real — apenas metadados para demo visual
  const docDefs = [
    { title:"Política de Home Office 2025", description:"Diretrizes e regras para trabalho remoto e híbrido", category:"RH", author:anaId },
    { title:"Código de Ética e Conduta", description:"Princípios e valores que guiam o comportamento de todos os colaboradores", category:"Compliance", author:guiId },
    { title:"Manual de Identidade Visual", description:"Guia de uso da marca: logos, cores, tipografia e aplicações", category:"Marketing", author:patId },
    { title:"Plano de Cargos e Salários 2025", description:"Estrutura de cargos, faixas salariais e critérios de progressão", category:"RH", author:anaId },
    { title:"Contrato Padrão de Prestação de Serviços", description:"Modelo de contrato para novos fornecedores e prestadores de serviços", category:"Jurídico", author:marId },
  ];
  for (const d of docDefs) {
    try {
      await create("documents", { ...d, file: "demo.pdf" });
    } catch (_) {
      // file field is required — skip silently for demo
    }
  }
  console.log(`  ✓ Documentos registrados (sem arquivo físico)`);

  // ── PESQUISAS ─────────────────────────────────────────────────────────────
  console.log("\n📊 Criando pesquisas...");
  const pollDefs = [
    { question:"Como você avalia o ambiente de trabalho nos últimos 3 meses?", options:["Excelente 🌟","Bom 👍","Regular 😐","Precisa melhorar 👎"], status:"ativa", author:anaId, deadline:"2026-06-10T23:59:59Z" },
    { question:"Qual formato de trabalho você prefere?", options:["Presencial 100%","Híbrido (2-3x/semana)","Home Office 100%","Indiferente"], status:"ativa", author:anaId, deadline:"2026-06-05T23:59:59Z" },
    { question:"O que você mais valoriza nos benefícios da empresa?", options:["Plano de Saúde","Vale Refeição/Alimentação","Gympass","Bolsa de Estudos"], status:"encerrada", author:anaId },
  ];
  for (const p of pollDefs) await create("polls", p);
  console.log(`  ✓ ${pollDefs.length} pesquisas criadas`);

  // ── RESUMO ────────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(50));
  console.log("🎉 Seed de demonstração concluído!\n");
  console.log("Usuários criados (senha: Demo@2024!):");
  userDefs.forEach((u) => console.log(`  ${u.role.padEnd(5)} | ${u.email.padEnd(28)} | ${u.name}`));
  console.log("\nPara remover todos os dados de demo:");
  console.log("  node scripts/seed-demo.js --clean\n");
}

// ─── main ─────────────────────────────────────────────────────────────────────

(async () => {
  try {
    await login();
    if (CLEAN) await clean();
    else await seed();
  } catch (err) {
    console.error("\n❌ Erro:", err.message);
    process.exit(1);
  }
})();
