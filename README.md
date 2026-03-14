# 🔧 Hidrauldiesel — Sistema de Gestão de Oficina

Sistema web de gestão para oficinas mecânicas, desenvolvido com foco em simplicidade operacional e integração com o ERP **Bling**. Interface moderna, responsiva e 100% no navegador — sem dependências de framework ou backend próprio.

---

## ✨ Funcionalidades

| Módulo | Descrição |
|---|---|
| 🔐 **Login** | Autenticação com redirecionamento inteligente para a página de origem |
| 📊 **Dashboard** | Visão geral da oficina com KPIs e atividade recente |
| 📋 **Ordens de Serviço** | Lista completa com filtros por status, busca em tempo real e paginação |
| 📝 **Orçamento / OS** | Detalhe da OS com stepper de status visual e fluxo de aprovação |
| 👥 **Clientes** | Lista de clientes sincronizada via Bling |
| 📦 **Estoque** | Controle de peças com alertas de nível crítico e baixo |
| 🛠️ **Serviços** | Catálogo de serviços com categorias e faturamento por período |
| 👨‍🔧 **Mecânicos** | Cadastro e gestão da equipe técnica |
| 💰 **Comissionamento** | Cálculo e acompanhamento de comissões por mecânico |

---

## 🎨 Design

- Fonte: [DM Sans](https://fonts.google.com/specimen/DM+Sans) + [DM Mono](https://fonts.google.com/specimen/DM+Mono)
- Sidebar fixa com navegação completa
- Paleta de status com cores semânticas:

| Status | Cor |
|---|---|
| Orçamento | `#7C3AED` roxo |
| Aprovado pelo Cliente | `#22C55E` verde |
| Em Execução | `#EAB308` amarelo |
| Serviço Finalizado | `#F97316` laranja |
| Faturada | `#1D4ED8` azul |
| Encerrada | `#DC2626` vermelho |
| Cancelada | `#6B7280` cinza |

---

## 🔄 Integração com Bling

Os módulos de **Clientes**, **Estoque** e **Serviços** são alimentados via API do [Bling ERP](https://www.bling.com.br/). A sidebar conta com um botão de sincronização manual disponível em todas as páginas.

> Dados gerenciados diretamente no Bling — o sistema consome e exibe, sem duplicar cadastros.

---

## 🗂️ Estrutura do projeto

```
/
├── hd-auth.js               # Guard de autenticação (injetado em todas as páginas)
├── hd-login.html/css/js     # Tela de login
├── hd-dashboard.html/css/js # Dashboard principal
├── hd-lista-os.html/css/js  # Lista de Ordens de Serviço
├── hd-orcamento.html/css/js # Detalhe / edição de OS
├── hd-clientes.html/css/js  # Clientes (via Bling)
├── hd-estoque.html/css/js   # Estoque (via Bling)
├── hd-servicos.html/css/js  # Serviços (via Bling)
├── hd-mecanicos.html/css/js # Mecânicos
├── hd-comissionamento.html/css/js # Comissionamento
└── imagens/                 # Assets visuais
```

---

## 🚀 Como rodar

Não há build, servidor ou dependências para instalar. Basta abrir o arquivo `hd-login.html` em qualquer navegador moderno — ou servir a pasta com qualquer servidor estático:

```bash
# Com Python
python -m http.server 5500

# Com Node.js (npx)
npx serve .
```

Acesse `http://localhost:5500/hd-login.html` e pronto.

---

## 🛠️ Stack

- **HTML5** semântico
- **CSS3** com custom properties (variáveis de design)
- **JavaScript** vanilla — sem jQuery, sem frameworks
- **Google Fonts** via CDN
- **Bling API** para dados de clientes, estoque e serviços

---

## 📌 Status do projeto

> Em desenvolvimento ativo. A integração real com a API do Bling e a persistência de dados das OS estão em roadmap.

---

<p align="center">Feito com dedicação para a equipe da <strong>Hidrauldiesel</strong> 🔩</p>
