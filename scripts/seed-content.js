#!/usr/bin/env node
// Seed de conteúdo de demonstração usando usuários já existentes
// Uso:    node scripts/seed-content.js
// Limpar: node scripts/seed-content.js --clean

const PB_URL   = process.env.PB_URL   || "http://localhost/pb";
const PB_EMAIL = process.env.PB_EMAIL || "admin@empresa.com";
const PB_PASS  = process.env.PB_PASS  || "Admin@2024!";
const CLEAN    = process.argv.includes("--clean");

let token = "";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, method = "GET", body) {
  await sleep(120);
  const res = await fetch(`${PB_URL}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: token },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { throw new Error(`${method} ${path} → non-JSON: ${text.slice(0,100)}`); }
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${data.message}`);
  return data;
}

async function getAll(col, extra = "") {
  const d = await api(`/collections/${col}/records?perPage=200&skipTotal=1${extra}`);
  return d.items || [];
}

async function create(col, body) {
  return api(`/collections/${col}/records`, "POST", body);
}

async function deleteAll(col) {
  const items = await getAll(col);
  for (const item of items) {
    try { await api(`/collections/${col}/records/${item.id}`, "DELETE"); } catch {}
  }
  console.log(`  🗑  ${col}: ${items.length} removidos`);
}

async function login() {
  const d = await api("/admins/auth-with-password", "POST", { identity: PB_EMAIL, password: PB_PASS });
  token = d.token;
  console.log("✓ Admin autenticado");
}

async function clean() {
  console.log("\n🧹 Limpando conteúdo de demo...");
  const cols = [
    "post_comments","post_reactions","posts",
    "announcements","articles","wiki_articles",
    "ticket_comments","tickets","tasks",
    "events","job_applications","job_postings",
    "benefits","achievements","useful_links",
    "trainings","polls","wall_cards","spaces",
  ];
  for (const c of cols) { try { await deleteAll(c); } catch {} }
  console.log("\n✅ Limpeza concluída!");
}

async function seed() {
  console.log("\n🌱 Criando conteúdo de demonstração...\n");

  // ── busca usuários existentes ─────────────────────────────────────────────
  const allUsers = await getAll("users");
  if (!allUsers.length) { console.error("❌ Nenhum usuário encontrado. Crie usuários antes de rodar o seed."); process.exit(1); }

  const byEmail = {};
  const byRole  = {};
  allUsers.forEach((u) => {
    byEmail[u.email] = u.id;
    if (!byRole[u.role]) byRole[u.role] = [];
    byRole[u.role].push(u.id);
  });

  const guiId = byEmail["guilherme@empresa.com"] || byRole["admin"]?.[0] || allUsers[0].id;
  const anaId = byEmail["ana.paula@empresa.com"] || byRole["rh"]?.[0]    || allUsers[1]?.id || guiId;
  const carId = byEmail["carlos@empresa.com"]    || byRole["ti"]?.[0]    || allUsers[2]?.id || guiId;
  const ferId = byEmail["fernanda@empresa.com"]  || byRole["user"]?.[0]  || allUsers[3]?.id || guiId;
  const robId = byEmail["roberto@empresa.com"]   || byRole["user"]?.[1]  || allUsers[4]?.id || guiId;
  const julId = byEmail["juliana@empresa.com"]   || byRole["rh"]?.[1]    || allUsers[5]?.id || anaId;
  const marId = byEmail["marcos@empresa.com"]    || byRole["user"]?.[2]  || allUsers[6]?.id || guiId;
  const patId = byEmail["patricia@empresa.com"]  || byRole["user"]?.[3]  || allUsers[7]?.id || guiId;

  console.log(`Usando ${allUsers.length} usuários existentes.`);

  // ── ESPAÇOS ───────────────────────────────────────────────────────────────
  console.log("\n🏢 Criando espaços (grupos)...");
  const spaces = await getAll("spaces");
  let geralId;
  if (spaces.length) {
    geralId = spaces.find((s) => s.name === "Geral")?.id || spaces[0].id;
    console.log(`  ℹ  ${spaces.length} espaços já existem`);
  } else {
    const spaceDefs = [
      { name:"Geral",       description:"Canal geral da empresa",              icon:"🏢", color:"#7c3aed", author:guiId },
      { name:"TI",          description:"Equipe de Tecnologia da Informação",  icon:"💻", color:"#2563eb", author:guiId },
      { name:"RH",          description:"Recursos Humanos",                    icon:"👥", color:"#db2777", author:anaId },
      { name:"Comercial",   description:"Time de Vendas e Comercial",          icon:"💼", color:"#16a34a", author:ferId },
      { name:"Marketing",   description:"Time de Marketing e Comunicação",     icon:"📢", color:"#ea580c", author:patId },
    ];
    const created = [];
    for (const s of spaceDefs) created.push(await create("spaces", s));
    geralId = created[0].id;
    console.log(`  ✓ ${spaceDefs.length} espaços criados`);
  }

  // ── POSTS (FEED) ──────────────────────────────────────────────────────────
  console.log("\n📰 Criando posts no feed...");
  const postDefs = [
    { author:guiId, content:"🚀 Bem-vindos à nova Intranet! Aqui vocês encontram tudo: comunicados, documentos, chamados, wiki e muito mais. Qualquer dúvida, estou à disposição.", space:geralId },
    { author:anaId, content:"📢 Lembrete: a pesquisa de clima organizacional fecha na sexta-feira. Sua participação é fundamental! Acesse em Pesquisas 👆", space:geralId },
    { author:patId, content:"🎉 Acabamos de fechar mais um grande contrato! Parabéns à equipe comercial pela dedicação. Vocês são incríveis! 💪", space:geralId },
    { author:carId, content:"⚠️ Comunicado TI: amanhã às 22h faremos manutenção nos servidores. O sistema ficará indisponível por ~2 horas. Planeje seus acessos com antecedência.", space:geralId },
    { author:ferId, content:"Alguém tem a planilha de metas do Q2 atualizada? Preciso para a reunião de hoje à tarde 🙏", space:geralId },
    { author:robId, content:"Bom dia equipe! Mais uma semana com muita energia. Vamos com tudo! ☕🔥", space:geralId },
    { author:marId, content:"📊 Fechamento do mês: batemos 112% da meta de receita! Excelente resultado. Detalhes no relatório mensal que enviei por email.", space:geralId },
    { author:julId, content:"🎂 Não se esqueçam: amanhã é aniversário da nossa colega Fernanda! Café às 15h para comemorar juntos 🎂🥳", space:geralId },
    { author:guiId, content:"Dica: use Cmd+K para busca global na intranet — pessoas, documentos, wiki, chamados. Super útil no dia a dia! 🔍", space:geralId },
    { author:anaId, content:"📋 Novo colaborador chegando semana que vem! Thiago Silva vem com bagagem incrível em sistemas financeiros. Preparem a recepção! 👋", space:geralId },
    { author:carId, content:"Deploy do novo sistema em produção concluído com sucesso ✅ Zero erros, zero downtime. Orgulho do time! 🎯", space:geralId },
    { author:patId, content:"Campanha de março atingiu 2,3M de impressões orgânicas 📈 Record histórico da empresa nas redes sociais. Obrigada à equipe toda!", space:geralId },
  ];
  for (const p of postDefs) await create("posts", { ...p, pinned:false });
  console.log(`  ✓ ${postDefs.length} posts criados`);

  // ── AVISOS ────────────────────────────────────────────────────────────────
  console.log("\n📣 Criando avisos...");
  const avisosDefs = [
    { title:"🔴 URGENTE: Manutenção nos servidores amanhã", content:"O sistema ficará em manutenção amanhã das 22h às 00h. Salve todos os trabalhos. Contato de emergência: carlos@empresa.com", category:"TI",    priority:"urgent", pinned:true,  author:carId },
    { title:"Novo benefício: Gympass a partir de junho",    content:"Parceria com o Gympass! A partir de junho todos os colaboradores terão acesso à rede de academias com 70% de desconto. Cadastre-se com o RH.",    category:"RH",    priority:"high",   pinned:true,  author:anaId },
    { title:"Reunião All-Hands — Resultados Q1 2025",       content:"Convidamos todos para a reunião geral do Q1. Data: 30/05 às 14h, Sala de Reuniões A + link Teams. Agenda: resultados financeiros, metas Q2 e novidades.", category:"Geral", priority:"normal", pinned:false, author:guiId },
    { title:"Política de home office atualizada",           content:"A partir de junho, todos os colaboradores elegíveis poderão trabalhar remotamente até 3 dias por semana. Consulte o documento completo em Documentos > RH.", category:"RH",    priority:"normal", pinned:false, author:anaId },
    { title:"Confraternização de fim de semestre — 28/06",  content:"Confraternização confirmada! 28 de junho, a partir das 19h, no Terraço do Edifício. Open bar e petiscos por conta da empresa. Confirme presença com o RH até 20/06.", category:"Geral", priority:"normal", pinned:false, author:julId },
  ];
  for (const a of avisosDefs) await create("announcements", a);
  console.log(`  ✓ ${avisosDefs.length} avisos criados`);

  // ── ARTIGOS ───────────────────────────────────────────────────────────────
  console.log("\n📄 Criando notícias e blog...");
  const artigoDefs = [
    { title:"Empresa registra crescimento de 35% no Q1", content:"<p>A empresa encerrou o primeiro trimestre de 2025 com crescimento de 35% em relação ao mesmo período do ano anterior, superando as expectativas do mercado.</p><p>O CEO destacou que o resultado é fruto do trabalho em equipe. \"Esse número nos enche de orgulho e nos motiva a continuar crescendo de forma sustentável\", afirmou.</p><p>Para o Q2, a empresa planeja expandir para mais dois estados e lançar duas novas linhas de produto.</p>", type:"news", status:"published", tags:"resultados,crescimento,q1", author:guiId },
    { title:"Parceria com Microsoft moderniza infraestrutura", content:"<p>Anunciamos parceria estratégica com a Microsoft Brasil para modernizar toda a infraestrutura tecnológica. O acordo prevê migração para Azure, Microsoft 365 e treinamento da equipe de TI.</p><p>A implantação começa em julho com duração de 6 meses.</p>", type:"news", status:"published", tags:"tecnologia,microsoft,parceria", author:carId },
    { title:"Programa de Desenvolvimento Profissional 2025", content:"<p>O RH lança o Programa de Desenvolvimento Profissional 2025 com bolsas de estudo, cursos certificados e mentoria interna para todos os colaboradores.</p><p>Inscrições abertas até 15 de junho. Cada colaborador pode se inscrever em até dois programas.</p>", type:"news", status:"published", tags:"rh,treinamento,desenvolvimento", author:anaId },
    { title:"Como aumentar sua produtividade com técnicas modernas", content:"<p>Produtividade não é sobre trabalhar mais — é sobre trabalhar de forma mais inteligente.</p><h2>Técnica Pomodoro</h2><p>Blocos de 25 minutos com 5 de pausa. Após 4 blocos, pause 20 minutos. Mantém foco e previne fadiga mental.</p><h2>Deep Work</h2><p>Reserve 2-3 horas diárias para trabalho profundo sem interrupções. Desative notificações.</p><h2>Regra dos 2 minutos</h2><p>Se uma tarefa leva menos de 2 minutos, faça agora.</p>", type:"blog", status:"published", tags:"produtividade,dicas,gestao", author:guiId },
    { title:"5 ferramentas de TI que estamos usando em 2025", content:"<p>As ferramentas que mais impactaram nosso trabalho este ano:</p><h2>1. PocketBase</h2><p>Backend open-source que substituiu 3 serviços. Simples, rápido, realtime nativo.</p><h2>2. Next.js 15</h2><p>App Router que tornou o frontend muito mais performático.</p><h2>3. Docker + nginx</h2><p>Containerização total com proxy reverso seguro.</p><h2>4. Tailwind CSS v4</h2><p>Workflow de CSS muito mais simples.</p><h2>5. GitHub Actions</h2><p>CI/CD automatizado, zero downtime.</p>", type:"blog", status:"published", tags:"ti,ferramentas,tecnologia", author:carId },
    { title:"Onboarding eficiente: o que aprendemos em 3 anos", content:"<p>Já onboardamos mais de 40 pessoas nos últimos 3 anos. Aqui está o que funciona de verdade:</p><h2>Primeiro dia</h2><p>Reunião de boas-vindas com o time, tour pelo escritório, acesso a todos os sistemas no primeiro dia. Sem exceção.</p><h2>Primeira semana</h2><p>Buddy designado, 1:1 diário com o gestor, lista de leituras obrigatórias.</p><h2>Primeiro mês</h2><p>Projeto piloto com entrega real, feedback semanal estruturado.</p>", type:"blog", status:"published", tags:"rh,onboarding,cultura", author:anaId },
  ];
  for (const a of artigoDefs) await create("articles", a);
  console.log(`  ✓ ${artigoDefs.length} artigos criados`);

  // ── WIKI ──────────────────────────────────────────────────────────────────
  console.log("\n📚 Criando wiki...");
  const wikiDefs = [
    { title:"Como abrir um chamado de TI", category:"Tutorial", tags:"chamado,ti,suporte", content:"<p>Para abrir um chamado de suporte técnico, acesse <strong>Chamados</strong> no menu lateral e clique em <strong>Novo chamado</strong>.</p><h2>Campos obrigatórios</h2><ul><li><strong>Título:</strong> descreva brevemente o problema</li><li><strong>Descrição:</strong> detalhe o que está acontecendo, quando começou e o que já tentou</li><li><strong>Prioridade:</strong> use critério — apenas emergências são alta prioridade</li></ul><p>O time de TI responde em até 4 horas em dias úteis.</p>", author:carId },
    { title:"Política de senhas corporativas", category:"Política", tags:"senha,segurança,acesso", content:"<p>Para garantir a segurança dos sistemas da empresa, todos os colaboradores devem seguir a política de senhas abaixo.</p><h2>Requisitos</h2><ul><li>Mínimo de 12 caracteres</li><li>Pelo menos uma letra maiúscula, uma minúscula, um número e um símbolo</li><li>Não reutilizar as últimas 5 senhas</li><li>Trocar a cada 90 dias</li></ul><h2>Nunca faça</h2><ul><li>Compartilhar sua senha com colegas</li><li>Usar a mesma senha em sistemas pessoais e corporativos</li><li>Anotar senhas em post-its ou documentos não seguros</li></ul>", author:carId },
    { title:"Processo de solicitação de férias", category:"Processo", tags:"ferias,rh,solicitacao", content:"<p>O processo de solicitação de férias deve ser feito com pelo menos <strong>30 dias de antecedência</strong>.</p><h2>Passo a passo</h2><ol><li>Converse com seu gestor sobre o período desejado</li><li>Acesse o Portal RH (link em Links Úteis)</li><li>Preencha o formulário de solicitação</li><li>Aguarde a aprovação do gestor (prazo: 5 dias úteis)</li><li>Você receberá confirmação por email</li></ol><h2>Regras importantes</h2><ul><li>Férias podem ser parceladas em até 3 períodos, sendo um deles mínimo de 14 dias</li><li>Período de férias não pode coincidir com fechamento fiscal (dez/jan)</li></ul>", author:anaId },
    { title:"FAQ — Perguntas frequentes sobre benefícios", category:"FAQ", tags:"beneficios,plano,vale", content:"<h2>Plano de Saúde</h2><p><strong>Q: Como agendar consultas?</strong><br>Acesse amil.com.br ou ligue 0800-722-2645. Seu cartão é o CPF.</p><p><strong>Q: Posso incluir dependentes?</strong><br>Sim. Cônjuge e filhos até 24 anos. Solicite ao RH.</p><h2>Vale Refeição/Alimentação</h2><p><strong>Q: Qual o saldo mensal?</strong><br>R$ 35/dia útil para VR e R$ 600/mês para VA.</p><p><strong>Q: Quando cai?</strong><br>Todo dia 25 do mês (ou dia útil anterior).</p><h2>Gympass</h2><p><strong>Q: Como ativar?</strong><br>Acesse gympass.com, cadastre com seu email corporativo e selecione o plano empresa.</p>", author:anaId },
    { title:"Guia de uso da intranet", category:"Tutorial", tags:"intranet,guia,tutorial", content:"<p>Bem-vindo à Intranet Corporativa! Este guia explica as principais funcionalidades.</p><h2>Feed (página inicial)</h2><p>Compartilhe atualizações, projetos e novidades com toda a empresa ou com grupos específicos.</p><h2>Notícias</h2><p>Comunicados oficiais da empresa. Apenas RH e Diretoria podem publicar.</p><h2>Wiki</h2><p>Base de conhecimento colaborativa. Tutoriais, processos e FAQs.</p><h2>Chamados</h2><p>Abra tickets de suporte para TI, RH ou Facilities.</p><h2>Chat</h2><p>Mensagens diretas e canais por equipe. Integrado ao sistema.</p>", author:guiId },
  ];
  for (const w of wikiDefs) await create("wiki_articles", w);
  console.log(`  ✓ ${wikiDefs.length} artigos wiki criados`);

  // ── CHAMADOS ──────────────────────────────────────────────────────────────
  console.log("\n🎫 Criando chamados...");
  const ticketDefs = [
    { title:"Computador não liga após atualização", description:"Após a atualização do Windows de ontem, meu notebook não está ligando. Já tentei retirar a bateria e religar, sem sucesso.", category:"hardware", priority:"alta",   status:"aberto",       author:ferId  },
    { title:"Acesso ao sistema ERP negado",         description:"Desde segunda-feira não consigo acessar o módulo Financeiro do ERP. Aparece 'permissão negada' mesmo com login correto.", category:"acesso",   priority:"alta",   status:"em_andamento", author:marId  },
    { title:"Configurar impressora na sala 3",      description:"A impressora HP da sala 3 precisa ser configurada nos computadores novos que chegaram semana passada. São 4 máquinas.", category:"hardware", priority:"media",  status:"aberto",       author:robId  },
    { title:"Email corporativo travando no celular",description:"O app de email no iPhone está travando ao abrir anexos PDF acima de 5MB. Versão iOS 17.4, app Exchange.", category:"software", priority:"media",  status:"resolvido",    author:patId  },
    { title:"Solicitar licença do Adobe Photoshop", description:"Preciso do Photoshop para o projeto de identidade visual do novo produto. Favor providenciar licença para meu usuário.", category:"software", priority:"baixa",  status:"aberto",       author:patId  },
  ];
  for (const t of ticketDefs) await create("tickets", t);
  console.log(`  ✓ ${ticketDefs.length} chamados criados`);

  // ── TAREFAS ───────────────────────────────────────────────────────────────
  console.log("\n✅ Criando tarefas...");
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7*864e5).toISOString().split("T")[0];
  const taskDefs = [
    { title:"Preparar apresentação Q2",          description:"Montar slides com resultados Q1 e metas Q2 para o All-Hands", status:"pendente",    priority:"alta",  assignee:guiId, created_by:guiId, due_date:nextWeek },
    { title:"Revisar contratos de fornecedores", description:"Revisar 3 contratos que vencem em junho e negociar renovação", status:"em_andamento",priority:"alta",  assignee:marId, created_by:anaId, due_date:nextWeek },
    { title:"Atualizar manual de onboarding",    description:"Incluir seção sobre a nova intranet e processos digitais",    status:"em_andamento",priority:"media", assignee:julId, created_by:anaId, due_date:nextWeek },
    { title:"Migrar servidor de arquivos",       description:"Migrar 2TB de arquivos do servidor antigo para o Azure Files", status:"pendente",    priority:"alta",  assignee:carId, created_by:guiId, due_date:nextWeek },
    { title:"Campanha Instagram — junho",        description:"Criar calendário editorial e artes para o mês de junho",     status:"concluida",   priority:"media", assignee:patId, created_by:patId, due_date:today },
    { title:"Entrevistas de desligamento",       description:"Conduzir 2 entrevistas agendadas para esta semana",          status:"pendente",    priority:"media", assignee:anaId, created_by:anaId, due_date:nextWeek },
    { title:"Corrigir bug no relatório mensal",  description:"O PDF exportado está cortando a última coluna.",             status:"em_andamento",priority:"alta",  assignee:carId, created_by:guiId, due_date:today },
  ];
  for (const t of taskDefs) await create("tasks", t);
  console.log(`  ✓ ${taskDefs.length} tarefas criadas`);

  // ── EVENTOS ───────────────────────────────────────────────────────────────
  console.log("\n📅 Criando eventos...");
  const now = new Date();
  const d = (offset, h = 9) => { const dt = new Date(now); dt.setDate(dt.getDate()+offset); dt.setHours(h,0,0,0); return dt.toISOString(); };
  const eventDefs = [
    { title:"All-Hands Q1 — Resultados",         description:"Reunião geral com toda a empresa para apresentação dos resultados do primeiro trimestre.", start:d(3,14),  end:d(3,15),   category:"Reunião",         author:guiId, location:"Auditório + Teams" },
    { title:"Treinamento LGPD",                   description:"Treinamento obrigatório sobre a Lei Geral de Proteção de Dados. Presença obrigatória para todos.", start:d(5,9),   end:d(5,11),  category:"Treinamento",     author:carId, location:"Sala de Treinamento A" },
    { title:"1:1 Gestores — Sprint Review",       description:"Reunião quinzenal de alinhamento entre gestores de área.", start:d(7,10),  end:d(7,11),  category:"Reunião",         author:anaId, location:"Sala 2" },
    { title:"Happy Hour do time",                 description:"Confraternização informal para comemorar os resultados do mês. Open bar por conta da empresa!", start:d(8,18),  end:d(8,21),  category:"Social",          author:patId, location:"Terraço do Edifício" },
    { title:"Workshop de Design Thinking",        description:"Workshop prático de metodologia de inovação com facilitador externo. Vagas limitadas!", start:d(12,9),  end:d(12,17), category:"Treinamento",     author:anaId, location:"Sala de Inovação" },
    { title:"Revisão orçamentária Q2",            description:"Reunião do comitê financeiro para revisão e ajuste do orçamento do segundo trimestre.", start:d(14,14), end:d(14,16), category:"Reunião",         author:marId, location:"Sala Diretoria" },
    { title:"Confraternização fim de semestre",   description:"Festa de encerramento do primeiro semestre. Open bar, DJ e muita comemoração!", start:d(33,19), end:d(33,23), category:"Social",          author:julId, location:"Terraço do Edifício" },
  ];
  for (const e of eventDefs) await create("events", { title:e.title, description:e.description, start:e.start, end:e.end, category:e.category, author:e.author, location:e.location });
  console.log(`  ✓ ${eventDefs.length} eventos criados`);

  // ── VAGAS ─────────────────────────────────────────────────────────────────
  console.log("\n💼 Criando vagas...");
  const vagasDefs = [
    { title:"Desenvolvedor Full Stack Sênior",     description:"<p>Buscamos um desenvolvedor full stack com experiência em React, Node.js e bancos de dados relacionais para integrar o time de TI.</p><h2>Requisitos</h2><ul><li>5+ anos com React e TypeScript</li><li>Experiência com APIs REST e GraphQL</li><li>Conhecimento em Docker e CI/CD</li></ul><h2>Oferecemos</h2><ul><li>CLT, salário a combinar</li><li>Home Office 3x/semana</li><li>Gympass + Plano de Saúde</li></ul>",    department:"TI",         type:"CLT",         status:"open",   salary:"R$ 12.000–18.000", author:guiId, deadline: d(30).split("T")[0] },
    { title:"Analista de RH Pleno",                description:"<p>Vaga para analista de RH com foco em recrutamento e seleção, responsável por conduzir processos seletivos end-to-end.</p><h2>Requisitos</h2><ul><li>3+ anos em recrutamento</li><li>Experiência com ferramentas ATS</li><li>Boa comunicação e negociação</li></ul>",                                                                                                                                department:"RH",         type:"CLT",         status:"open",   salary:"R$ 4.500–6.000",  author:anaId, deadline: d(25).split("T")[0] },
    { title:"Designer UX/UI",                      description:"<p>Buscamos designer criativo para desenvolver interfaces de produtos digitais e materiais de marketing.</p><h2>Requisitos</h2><ul><li>Portfolio com projetos digitais</li><li>Figma avançado</li><li>Noções de HTML/CSS</li></ul>",                                                                                                                                                                          department:"Marketing",  type:"CLT",         status:"open",   salary:"R$ 6.000–9.000",  author:patId, deadline: d(20).split("T")[0] },
    { title:"Estágio em Marketing Digital",        description:"<p>Estágio para estudantes de Marketing, Publicidade ou Comunicação interessados em aprender marketing digital na prática.</p><h2>Atividades</h2><ul><li>Gestão de redes sociais</li><li>Criação de conteúdo</li><li>Análise de métricas</li></ul>",                                                                                                                                                          department:"Marketing",  type:"Estágio",     status:"open",   salary:"R$ 1.800 + VT",   author:patId, deadline: d(15).split("T")[0] },
    { title:"Controller Financeiro",               description:"<p>Vaga para controller com experiência em planejamento orçamentário, fechamento contábil e análise de resultados.</p>",                                                                                                                                                                                                                                                                                   department:"Financeiro", type:"CLT",         status:"closed", salary:"R$ 9.000–13.000", author:marId, deadline: d(-5).split("T")[0] },
  ];
  for (const v of vagasDefs) {
    const statusPt = v.status === "open" ? "aberta" : "encerrada";
    await create("job_postings", { title:v.title, description:v.description, department:v.department, type:v.type, status:statusPt, author:v.author, deadline:v.deadline });
  }
  console.log(`  ✓ ${vagasDefs.length} vagas criadas`);

  // ── BENEFÍCIOS ────────────────────────────────────────────────────────────
  console.log("\n🎁 Criando benefícios...");
  const beneDefs = [
    { title:"Plano de Saúde Amil",         description:"Plano de saúde empresarial com cobertura nacional, sem carência para funcionários. Dependentes podem ser incluídos com coparticipação.", category:"Saúde",          icon:"🏥", author:anaId },
    { title:"Vale Refeição e Alimentação", description:"R$ 35/dia útil de VR (Sodexo) + R$ 600/mês de VA. Aceito em mais de 150.000 estabelecimentos no Brasil.", category:"Alimentação",    icon:"🍽️", author:anaId },
    { title:"Gympass — Rede de Academias", description:"Acesso a mais de 35.000 academias e estúdios no Brasil com planos a partir de R$ 29,90/mês para o colaborador.", category:"Qualidade de Vida",icon:"💪", author:anaId },
    { title:"Bolsa de Estudos (60%)",      description:"Reembolso de 60% do valor de graduação, pós-graduação ou cursos de idiomas relevantes para o cargo. Limite de R$ 800/mês.", category:"Educação",       icon:"📚", author:anaId },
    { title:"Day Off no aniversário",      description:"Folga remunerada no dia do aniversário do colaborador (ou no dia útil mais próximo).", category:"Qualidade de Vida",icon:"🎂", author:anaId },
    { title:"Previdência Privada",         description:"Plano de previdência privada com contribuição da empresa de até 4% do salário bruto, acima da contribuição do colaborador.", category:"Financeiro",     icon:"💰", author:anaId },
    { title:"Seguro de Vida",              description:"Seguro de vida em grupo com cobertura de 36x o salário bruto para morte e invalidez.", category:"Saúde",          icon:"🛡️", author:anaId },
    { title:"Kit Home Office",             description:"R$ 2.000 para colaboradores em home office comprarem equipamentos e melhorar o setup em casa. Válido a cada 2 anos.", category:"Home Office",    icon:"🖥️", author:carId },
  ];
  for (const b of beneDefs) await create("benefits", b);
  console.log(`  ✓ ${beneDefs.length} benefícios criados`);

  // ── CONQUISTAS ────────────────────────────────────────────────────────────
  console.log("\n🏆 Criando conquistas...");
  const achDefs = [
    { title:"Funcionário do Mês — Abril",           description:"Reconhecimento pelo desempenho excepcional em abril, contribuindo com resultados acima da meta.", icon:"🏆", recipient:ferId, author:guiId },
    { title:"5 Anos de Casa",                       description:"Celebrando 5 anos de dedicação e contribuição. Muito obrigado, Roberto!", icon:"⭐", recipient:robId, author:anaId },
    { title:"Projeto Entregue com Zero Bugs",       description:"Reconhecimento pelo projeto de migração entregue no prazo e sem nenhum bug reportado em produção.", icon:"🚀", recipient:carId, author:guiId },
    { title:"Melhor NPS do Trimestre",              description:"A equipe Comercial atingiu o maior NPS da história da empresa: 87 pontos! Parabéns, Fernanda!", icon:"📈", recipient:ferId, author:guiId },
    { title:"Mentora do Mês",                       description:"Reconhecimento pela excelência em onboarding e mentoria dos novos colaboradores no trimestre.", icon:"💡", recipient:anaId, author:guiId },
  ];
  for (const a of achDefs) await create("achievements", a);
  console.log(`  ✓ ${achDefs.length} conquistas criadas`);

  // ── LINKS ÚTEIS ───────────────────────────────────────────────────────────
  console.log("\n🔗 Criando links úteis...");
  const linkDefs = [
    { title:"Sistema ERP",              url:"https://erp.empresa.com",          description:"Sistema de gestão empresarial integrado",               category:"Sistemas",      icon:"💼", author:guiId, order:1 },
    { title:"Portal RH",                url:"https://rh.empresa.com",           description:"Solicitar férias, holerites e documentos de RH",         category:"RH",            icon:"👥", author:anaId, order:2 },
    { title:"Microsoft Teams",          url:"https://teams.microsoft.com",      description:"Reuniões, chat e colaboração",                           category:"Comunicação",   icon:"💬", author:carId, order:3 },
    { title:"Google Drive Corporativo", url:"https://drive.google.com",         description:"Armazenamento e colaboração em documentos",              category:"Ferramentas",   icon:"📁", author:guiId, order:4 },
    { title:"Power BI — Dashboards",    url:"https://app.powerbi.com",          description:"Dashboards de performance e KPIs",                      category:"Relatórios",    icon:"📊", author:marId, order:5 },
    { title:"Portal Sodexo",            url:"https://portal.sodexo.com.br",     description:"Consultar saldo e extrato do cartão benefícios",         category:"Benefícios",    icon:"💳", author:anaId, order:6 },
    { title:"Amil — Plano de Saúde",    url:"https://www.amil.com.br",          description:"Agendar consultas e verificar cobertura",               category:"Benefícios",    icon:"🏥", author:anaId, order:7 },
    { title:"GitHub Corporativo",       url:"https://github.com/empresa",       description:"Repositórios de código da empresa",                     category:"Desenvolvimento",icon:"💻", author:carId, order:8 },
  ];
  for (const l of linkDefs) await create("useful_links", l);
  console.log(`  ✓ ${linkDefs.length} links criados`);

  // ── TREINAMENTOS ──────────────────────────────────────────────────────────
  console.log("\n🎓 Criando treinamentos...");
  const trainDefs = [
    { title:"LGPD — Lei Geral de Proteção de Dados",  description:"Treinamento obrigatório sobre LGPD: princípios, direitos dos titulares e obrigações da empresa.", category:"Compliance",  duration:"2h",   author:carId },
    { title:"Comunicação Não-Violenta",               description:"Aprenda a se comunicar de forma empática e assertiva. Baseado na metodologia CNV de Marshall Rosenberg.", category:"Soft Skills", duration:"3h",   author:anaId },
    { title:"Excel Avançado para Análise de Dados",   description:"Tabela Dinâmica, Power Query, funções de lookup e criação de dashboards.",                            category:"Tecnologia",  duration:"6h",   author:guiId },
    { title:"Gestão de Conflitos e Negociação",       description:"Ferramentas práticas para identificar, mediar e resolver conflitos no ambiente profissional.",         category:"Liderança",   duration:"4h",   author:anaId },
    { title:"Segurança da Informação — Básico",       description:"Boas práticas digitais: senhas, phishing, uso seguro de dispositivos e navegação segura.",            category:"Compliance",  duration:"1h30", author:carId },
  ];
  for (const t of trainDefs) await create("trainings", t);
  console.log(`  ✓ ${trainDefs.length} treinamentos criados`);

  // ── MURAL ─────────────────────────────────────────────────────────────────
  console.log("\n📌 Criando mural...");
  const muralDefs = [
    { message:"Parabéns Fernanda pelos 3 anos de empresa! Você é um exemplo de dedicação! 🎉🎂", type:"parabens",    recipient:ferId, author:anaId, emoji:"🎂" },
    { message:"Bem-vindo ao time, Carlos! Estamos animados com sua chegada. Vai adorar trabalhar aqui! 🚀", type:"boas_vindas", recipient:carId, author:guiId, emoji:"👋" },
    { message:"Obrigada a toda equipe pelo apoio durante minha licença. Voltei renovada! ❤️", type:"recado",       author:julId, emoji:"❤️" },
    { message:"Parabéns ao time de TI pela entrega dentro do prazo! Vocês são demais! 💪💻", type:"conquista",    author:patId, emoji:"🏆" },
  ];
  for (const m of muralDefs) await create("wall_cards", m);
  console.log(`  ✓ ${muralDefs.length} cards criados`);

  // ── PESQUISAS ─────────────────────────────────────────────────────────────
  console.log("\n📊 Criando pesquisas...");
  const pollDefs = [
    { question:"Como você avalia o ambiente de trabalho nos últimos 3 meses?", options:["Excelente 🌟","Bom 👍","Regular 😐","Precisa melhorar 👎"],   status:"ativa",    author:anaId, deadline:d(15).split("T")[0]+"T23:59:59Z" },
    { question:"Qual formato de trabalho você prefere?",                       options:["Presencial 100%","Híbrido (2-3x/semana)","Home Office 100%","Indiferente"], status:"ativa",    author:anaId, deadline:d(10).split("T")[0]+"T23:59:59Z" },
    { question:"O que você mais valoriza nos benefícios da empresa?",          options:["Plano de Saúde","Vale Refeição/Alimentação","Gympass","Bolsa de Estudos"],  status:"encerrada", author:anaId },
  ];
  for (const p of pollDefs) await create("polls", p);
  console.log(`  ✓ ${pollDefs.length} pesquisas criadas`);

  // ── CLASSIFICADOS ─────────────────────────────────────────────────────────
  console.log("\n🛍️  Criando classificados...");
  const classifDefs = [
    { title:"Bicicleta Trek aro 29 — seminova",  description:"Bike em ótimo estado, usada por 1 ano. Revisada recentemente, com acessórios. Motivo da venda: mudança para apartamento.", price:2800, category:"Esportes",    condition:"Seminovo", author:robId },
    { title:"Monitor Samsung 27\" 4K",           description:"Monitor 4K 27 polegadas, 60Hz, HDR. Cabo HDMI e DisplayPort incluídos. Nota fiscal disponível.", price:1500, category:"Eletrônicos",  condition:"Seminovo", author:carId },
    { title:"Curso de inglês — 10 aulas",        description:"Vendo 10 créditos de aula no Cambly que não vou utilizar. R$ 30/aula (paguei R$ 45). Transferência fácil.", price:300,  category:"Serviços",    condition:"Novo",     author:ferId },
    { title:"Sofá 3 lugares — cinza",             description:"Sofá retrátil e reclinável em tecido suede cinza. 2,20m. Retirar no Brooklin. Motivo: reforma.", price:1200, category:"Móveis",      condition:"Usado",    author:patId },
    { title:"PS5 com 3 jogos",                   description:"PlayStation 5 em perfeito estado com FIFA 24, Spider-Man 2 e Hogwarts Legacy. Um controle extra. Nota fiscal.", price:4500, category:"Eletrônicos",  condition:"Seminovo", author:marId },
  ];
  for (const c of classifDefs) {
    try { await create("marketplace_items", { title:c.title, description:c.description, price:c.price, category:c.category, condition:c.condition, status:"available", author:c.author }); } catch {}
  }
  console.log(`  ✓ ${classifDefs.length} classificados criados`);

  // ── RESUMO ────────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(52));
  console.log("🎉 Conteúdo de demonstração criado com sucesso!\n");
  console.log("Para remover tudo: node scripts/seed-content.js --clean\n");
}

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
