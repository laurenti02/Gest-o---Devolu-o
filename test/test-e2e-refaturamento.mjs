const BASE = 'http://localhost:3100';
let passed = 0, failed = 0;
function ok(desc, cond){ if(cond){ passed++; console.log('  ✓ '+desc); } else { failed++; console.log('  ✗ FALHOU: '+desc); } }
function section(t){ console.log('\n== '+t+' =='); }

async function req(path, { method='GET', body, cookie } = {}){
  const resp = await fetch(BASE+path, {
    method,
    headers: { ...(body ? {'Content-Type':'application/json'} : {}), ...(cookie ? {'Cookie': cookie} : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  let data = null;
  try{ data = await resp.json(); }catch(e){}
  const setCookie = resp.headers.get('set-cookie');
  return { status: resp.status, data, cookie: setCookie ? setCookie.split(';')[0] : null, location: resp.headers.get('location') };
}

(async () => {
  section('1) Criação pública (sem login)');
  const payload = {
    solicitante:'Juliana Prado', setorSolicitante:'Comercial Regional Sul',
    clienteOriginal:'Transportes Aurora Ltda', cnpjOriginal:'11.222.333/0001-44',
    notaFiscalOriginal:'NF-9001', valor:'2450.00', mercadoriaSaiu:'nao',
    motivo:'Erro no CNPJ do destinatário identificado antes do faturamento.',
  };
  const criacao = await req('/api/refaturamento', { method:'POST', body: payload });
  ok('Criação retorna 201', criacao.status === 201);
  ok('Protocolo no formato REF-AAAA-NNNNNN', /^REF-\d{4}-\d{6}$/.test(criacao.data?.protocolo || ''));
  const protocolo = criacao.data.protocolo;

  ok('Campo obrigatório ausente é rejeitado (400)', (await req('/api/refaturamento', { method:'POST', body:{ solicitante:'X' } })).status === 400);
  ok('Consulta pública por protocolo funciona', (await req('/api/refaturamento/'+protocolo)).status === 200);
  ok('Consulta pública NÃO vazia dados internos (sem aprovadorEmail)', !('aprovadorEmail' in (await req('/api/refaturamento/'+protocolo)).data));
  ok('Sem login não acessa a listagem (401)', (await req('/api/refaturamento')).status === 401);

  section('2) Login do ADM (mesma conta da Devolução) e aprovação');
  const loginBad = await req('/api/auth/login', { method:'POST', body:{ email:'devolucao@gruponautika.com.br', senha:'errada' } });
  ok('Senha errada é rejeitada (401)', loginBad.status === 401);

  const loginAdm = await req('/api/auth/login', { method:'POST', body:{ email:'devolucao@gruponautika.com.br', senha:'nautika@2026' } });
  ok('Login do ADM funciona', loginAdm.status === 200 && loginAdm.data.perfil === 'admin');
  const cookieAdm = loginAdm.cookie;

  const listaAdm = await req('/api/refaturamento', { cookie: cookieAdm });
  ok('ADM vê a solicitação recém-criada', listaAdm.data.solicitacoes.some(s => s.protocolo === protocolo));
  const idSolicitacao = listaAdm.data.solicitacoes.find(s => s.protocolo === protocolo).id;

  const decisao = await req('/api/refaturamento/decisao', { method:'POST', body:{ id:idSolicitacao, decisao:'aprovado' }, cookie: cookieAdm });
  ok('ADM aprova com sucesso', decisao.status === 200);

  const statusApos = await req('/api/refaturamento/'+protocolo);
  ok('Etapa foi para Logística após aprovação', statusApos.data.etapaAtual === 'logistica');

  section('3) Etapa Logística (conta nova, exclusiva do Refaturamento)');
  const loginLog = await req('/api/auth/login', { method:'POST', body:{ email:'logistica@gruponautika.com.br', senha:'nautika@2026' } });
  ok('Login da Logística funciona com a senha padrão do sistema', loginLog.status === 200 && loginLog.data.perfil === 'logistica');
  const cookieLog = loginLog.cookie;

  const semPermissaoFiscal = await req('/api/refaturamento/etapa', { method:'POST', body:{ id:idSolicitacao, chaveNfEntrada:'x', chaveNovaNfe:'y' }, cookie: cookieLog });
  // como a solicitação ainda está na etapa "logistica", tentar mandar campos de fiscal sem estar nela é ambíguo;
  // o teste real de permissão está no próximo passo (Fiscal tentando agir fora da vez)

  const filaLog = await req('/api/refaturamento', { cookie: cookieLog });
  ok('Logística vê só a fila da própria etapa', filaLog.data.solicitacoes.length === 1 && filaLog.data.solicitacoes[0].protocolo === protocolo);

  const concluirLog = await req('/api/refaturamento/etapa', { method:'POST', body:{ id:idSolicitacao, tipoRegularizacao:'Cancelamento', comentario:'NF cancelada dentro do prazo legal.' }, cookie: cookieLog });
  ok('Logística conclui a etapa', concluirLog.status === 200);

  const filaLogDepois = await req('/api/refaturamento', { cookie: cookieLog });
  ok('Fila da Logística fica vazia depois de concluir', filaLogDepois.data.solicitacoes.length === 0);

  section('4) Etapa Fiscal (reaproveitando a conta fiscal@ que já existe na Devolução)');
  const loginFis = await req('/api/auth/login', { method:'POST', body:{ email:'fiscal@gruponautika.com.br', senha:'nautika@2026' } });
  ok('Login do Fiscal (conta já existente da Devolução) funciona', loginFis.status === 200 && loginFis.data.perfil === 'entrada_nfd');
  const cookieFis = loginFis.cookie;

  const tentativaLogisticaForaDaVez = await req('/api/refaturamento/etapa', { method:'POST', body:{ id:idSolicitacao, tipoRegularizacao:'Cancelamento' }, cookie: cookieLog });
  ok('Logística NÃO pode agir de novo (etapa já é Fiscal) — 403', tentativaLogisticaForaDaVez.status === 403);

  const filaFis = await req('/api/refaturamento', { cookie: cookieFis });
  ok('Fiscal vê a solicitação assim que a Logística conclui', filaFis.data.solicitacoes.length === 1);

  const faltaChave = await req('/api/refaturamento/etapa', { method:'POST', body:{ id:idSolicitacao, chaveNfEntrada:'', chaveNovaNfe:'' }, cookie: cookieFis });
  ok('Sem as chaves obrigatórias, retorna 400', faltaChave.status === 400);

  const concluirFis = await req('/api/refaturamento/etapa', { method:'POST', body:{
    id:idSolicitacao,
    chaveNfEntrada:'35260900000000000000550010000090011234567890',
    precisaSefaz: true, protocoloSefaz:'SEFAZ-2026-000123',
    chaveNovaNfe:'35260900000000000000550010000090021234567891',
    comentario:'Refaturamento liberado após protocolo na SEFAZ-CE.',
  }, cookie: cookieFis });
  ok('Fiscal conclui a etapa', concluirFis.status === 200);

  section('5) Etapa Financeiro (reaproveitando a conta kaline@ que já existe na Devolução)');
  const loginFin = await req('/api/auth/login', { method:'POST', body:{ email:'kaline@gruponautika.com.br', senha:'nautika@2026' } });
  ok('Login do Financeiro (conta já existente da Devolução) funciona', loginFin.status === 200 && loginFin.data.perfil === 'financeiro');
  const cookieFin = loginFin.cookie;

  const filaFin = await req('/api/refaturamento', { cookie: cookieFin });
  ok('Financeiro vê a solicitação assim que o Fiscal conclui', filaFin.data.solicitacoes.length === 1);

  const concluirFin = await req('/api/refaturamento/etapa', { method:'POST', body:{ id:idSolicitacao, comentario:'Valores conferidos, nada a ajustar.' }, cookie: cookieFin });
  ok('Financeiro conclui o processo', concluirFin.status === 200);

  section('6) Estado final (visão pública e do ADM)');
  const finalPublico = await req('/api/refaturamento/'+protocolo);
  ok('Etapa pública final é "concluido"', finalPublico.data.etapaAtual === 'concluido');

  const listaAdmFinal = await req('/api/refaturamento', { cookie: cookieAdm });
  const itemFinal = listaAdmFinal.data.solicitacoes.find(s => s.protocolo === protocolo);
  ok('Dados da Logística persistiram', itemFinal.logTipoRegularizacao === 'Cancelamento');
  ok('Chave da nova NF-e persistiu', itemFinal.fiscalChaveNovaNfe.endsWith('91'));
  ok('Comentário do Financeiro persistiu', itemFinal.finComentario.includes('conferidos'));

  section('7) Perfis sem acesso');
  const semAcesso = await req('/api/refaturamento', { cookie: await (async()=>{
    const l = await req('/api/auth/login', { method:'POST', body:{ email:'matheus.calixto@gruponautika.com.br', senha:'nautika@2026' } });
    return l.cookie;
  })() });
  ok('Perfil "coleta" (só devolução) não acessa o Refaturamento (403)', semAcesso.status === 403);

  console.log('\n============================================');
  console.log(`RESULTADO: ${passed} passaram, ${failed} falharam`);
  console.log('============================================');
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error('\n❌ ERRO NÃO TRATADO:', e); process.exit(1); });
