const BASE = 'http://localhost:3300';
let passed = 0, failed = 0;
function ok(desc, cond){ if(cond){ passed++; console.log('  ✓ '+desc); } else { failed++; console.log('  ✗ FALHOU: '+desc); } }
function section(t){ console.log('\n== '+t+' =='); }

async function req(path, { method='GET', body, cookie } = {}){
  const resp = await fetch(BASE+path, {
    method,
    headers: { ...(body ? {'Content-Type':'application/json'} : {}), ...(cookie ? {'Cookie': cookie} : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try{ data = await resp.json(); }catch(e){}
  const setCookie = resp.headers.get('set-cookie');
  return { status: resp.status, data, cookie: setCookie ? setCookie.split(';')[0] : null };
}

(async () => {
  section('1) Servir o front-end do Planner');
  const paginaResp = await fetch(BASE+'/planner');
  const paginaTexto = await paginaResp.text();
  ok('Rota /planner responde 200', paginaResp.status === 200);
  ok('Conteúdo é o HTML do Planner (tem o título)', paginaTexto.includes('Planner') || paginaTexto.includes('planner'));
  ok('Front-end já aponta para os endpoints certos', paginaTexto.includes('/api/planner/auth/login') && paginaTexto.includes('/api/planner/data'));
  ok('Cartão corporativo não existe mais no HTML', !paginaTexto.includes('Controle cartão corporativo') && !paginaTexto.includes('financeiroBody'));

  section('2) Cadastro (signup) — conta própria, sem perfil fixo');
  const email = 'teste.planner+'+Date.now()+'@example.com';
  const signupRuim = await req('/api/planner/auth/signup', { method:'POST', body:{ name:'', email, password:'123456' } });
  ok('Nome vazio é rejeitado (400)', signupRuim.status === 400);

  const signupSenhaCurta = await req('/api/planner/auth/signup', { method:'POST', body:{ name:'Fulano', email, password:'123' } });
  ok('Senha curta é rejeitada (400)', signupSenhaCurta.status === 400);

  const signup = await req('/api/planner/auth/signup', { method:'POST', body:{ name:'Fulano de Tal', email, password:'senha123' } });
  ok('Cadastro funciona', signup.status === 200 && signup.data.email === email);
  const cookiePlanner = signup.cookie;

  const signupDuplicado = await req('/api/planner/auth/signup', { method:'POST', body:{ name:'Outro', email, password:'senha123' } });
  ok('E-mail duplicado é rejeitado (409)', signupDuplicado.status === 409);

  section('3) Sessão do Planner é isolada da Devolução');
  const meDevolucao = await req('/api/auth/login', { method:'POST', body:{ email:'devolucao@gruponautika.com.br', senha:'nautika@2026' } });
  ok('Login da Devolução continua funcionando normalmente', meDevolucao.status === 200 && meDevolucao.data.perfil === 'admin');
  ok('Cookie da Devolução é diferente do cookie do Planner', meDevolucao.cookie.split('=')[0] !== cookiePlanner.split('=')[0]);

  const mePlannerComCookieDevolucao = await req('/api/planner/auth/me', { cookie: meDevolucao.cookie });
  ok('Cookie da Devolução NÃO autentica no Planner (401)', mePlannerComCookieDevolucao.status === 401);

  const meComCookiePlanner = await req('/api/planner/auth/me', { cookie: cookiePlanner });
  ok('Cookie do Planner autentica corretamente no Planner', meComCookiePlanner.status === 200 && meComCookiePlanner.data.email === email);

  section('4) Dados do Planner (carregar, editar, salvar)');
  const dadosIniciais = await req('/api/planner/data', { cookie: cookiePlanner });
  ok('Dados iniciais carregam automaticamente (default)', dadosIniciais.status === 200 && Array.isArray(dadosIniciais.data.tarefas));
  ok('Não existe mais o array "financeiro" nos dados padrão', !('financeiro' in dadosIniciais.data));

  const semLogin = await req('/api/planner/data');
  ok('Sem login não acessa os dados (401)', semLogin.status === 401);

  const novosDados = { ...dadosIniciais.data, mesReferencia: '2026-12', tarefas: [{ id:'x1', tarefa:'Tarefa de teste', responsavel:'Fulano', prioridade:'Alta', prazo:'2026-12-31', status:'Pendente', obs:'' }] };
  const salvar = await req('/api/planner/data', { method:'PUT', body: novosDados, cookie: cookiePlanner });
  ok('Salvar dados funciona', salvar.status === 200);

  const dadosRecarregados = await req('/api/planner/data', { cookie: cookiePlanner });
  ok('Dados salvos persistiram corretamente', dadosRecarregados.data.mesReferencia === '2026-12' && dadosRecarregados.data.tarefas[0].tarefa === 'Tarefa de teste');

  section('5) Login (sessão separada) e troca de senha');
  const loginErrado = await req('/api/planner/auth/login', { method:'POST', body:{ email, password:'senhaerrada' } });
  ok('Senha errada é rejeitada no login (401)', loginErrado.status === 401);

  const login = await req('/api/planner/auth/login', { method:'POST', body:{ email, password:'senha123' } });
  ok('Login funciona com a senha certa', login.status === 200);
  const cookieLogin = login.cookie;

  const trocaSenhaErrada = await req('/api/planner/auth/change-password', { method:'POST', body:{ currentPassword:'errada', newPassword:'novaSenha123' }, cookie: cookieLogin });
  ok('Troca de senha exige a senha atual correta (400)', trocaSenhaErrada.status === 400);

  const trocaSenha = await req('/api/planner/auth/change-password', { method:'POST', body:{ currentPassword:'senha123', newPassword:'novaSenha123' }, cookie: cookieLogin });
  ok('Troca de senha funciona', trocaSenha.status === 200);

  const loginComSenhaAntiga = await req('/api/planner/auth/login', { method:'POST', body:{ email, password:'senha123' } });
  ok('Senha antiga não funciona mais', loginComSenhaAntiga.status === 401);

  const loginComSenhaNova = await req('/api/planner/auth/login', { method:'POST', body:{ email, password:'novaSenha123' } });
  ok('Senha nova já funciona', loginComSenhaNova.status === 200);

  section('6) Logout');
  const logout = await req('/api/planner/auth/logout', { method:'POST', cookie: loginComSenhaNova.cookie });
  ok('Logout funciona', logout.status === 200);

  console.log('\n============================================');
  console.log(`RESULTADO: ${passed} passaram, ${failed} falharam`);
  console.log('============================================');
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error('\n❌ ERRO NÃO TRATADO:', e); process.exit(1); });
