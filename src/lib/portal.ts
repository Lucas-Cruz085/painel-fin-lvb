import type { LucideIcon } from "lucide-react";
import { LineChart, ShieldCheck, WalletCards } from "lucide-react";

export const PORTAL = {
  nome: "Painel Financeiro",
  marca: "NORMAQ JCB",
  selo: "Portal financeiro",
  titulo: "Contas a pagar e a receber, com a leitura do caixa.",
  paragrafo:
    "Acompanhe títulos, vencimentos e o fluxo de caixa da NORMAQ JCB em um único acesso, com entrada identificada.",
};

export const BENEFICIOS: { titulo: string; texto: string; icone: LucideIcon }[] = [
  {
    titulo: "Indicadores no mesmo lugar",
    texto: "Vencimentos, atrasos e liquidações reunidos para a leitura do dia.",
    icone: WalletCards,
  },
  {
    titulo: "Caixa previsto e realizado",
    texto: "A projeção e o fluxo aparecem juntos, sem planilha paralela.",
    icone: LineChart,
  },
  {
    titulo: "Entrada identificada",
    texto: "O acesso é nominal e a trilha de uso fica disponível para consulta.",
    icone: ShieldCheck,
  },
];

export const LGPD = {
  titulo: "Proteção de dados pessoais",
  paragrafo:
    "Este aviso descreve como o Painel Financeiro NORMAQ JCB trata dados pessoais de quem acessa o sistema e, quando houver, de pessoas naturais identificadas nos títulos. É um rascunho operacional para revisão jurídica e não substitui a política definitiva da empresa.",
  blocos: [
    {
      rotulo: "Controlador",
      titulo: "Quem decide sobre os dados",
      texto:
        "A NORMAQ, concessionária JCB, é a controladora do tratamento feito neste portal. O painel existe para a operação financeira interna. O encarregado pelo tratamento será indicado na versão definitiva deste texto.",
    },
    {
      rotulo: "Acesso",
      titulo: "Dados da conta",
      texto:
        "Tratamos o nome, o identificador de usuário, o papel (administrador ou usuário) e os registros de autenticação, como o horário de entrada. A senha temporária é gerada no servidor, mostrada uma única vez ao administrador e não fica gravada no portal. O provedor de autenticação guarda só o hash da credencial.",
    },
    {
      rotulo: "Operação",
      titulo: "Dados que o painel exibe",
      texto:
        "As telas mostram títulos a pagar e a receber, projetos, valores, datas e status. Se um título identificar uma pessoa natural, como um prestador pessoa física, esse dado é pessoal. Dados de pessoa jurídica, em regra, não são pessoais, mas o contato de um representante pode ser. Nesta versão, os números do dashboard são fictícios e não representam titulares reais.",
    },
    {
      rotulo: "Finalidade",
      titulo: "Para que o dado é usado",
      texto:
        "Autenticar quem entra, montar os indicadores financeiros, aplicar os filtros da operação e manter uma trilha de uso para segurança e prestação de contas. O portal não usa esses dados para publicidade nem para decisão automatizada sobre o titular.",
    },
    {
      rotulo: "Base legal",
      titulo: "Por que o tratamento se sustenta",
      texto:
        "O acesso decorre da relação de trabalho ou do contrato com a empresa. A guarda da trilha atende ao legítimo interesse de proteger o ambiente e apurar o uso. Quando uma norma exigir a conservação do registro, a base é o cumprimento de obrigação legal. O texto definitivo vai apontar a base de cada fluxo.",
    },
    {
      rotulo: "Compartilhamento",
      titulo: "Quem mais vê o dado",
      texto:
        "O conteúdo fica restrito a usuários autorizados da NORMAQ, conforme o papel da conta. O provedor de autenticação processa a credencial para permitir o login. Um operador de hospedagem só recebe o que for necessário para manter o portal no ar. Não há venda de dados nem compartilhamento para marketing.",
    },
    {
      rotulo: "Retenção",
      titulo: "Por quanto tempo",
      texto:
        "A conta permanece enquanto a pessoa tiver acesso autorizado. Os logs ficam pelo prazo necessário à segurança e a eventuais obrigações, e depois são eliminados ou anonimizados. O prazo fechado ainda será definido com o jurídico e publicado neste aviso.",
    },
    {
      rotulo: "Direitos",
      titulo: "O que o titular pode pedir",
      texto:
        "Confirmação do tratamento, acesso, correção de dado incompleto ou desatualizado, anonimização ou eliminação quando couber, informação sobre compartilhamentos e revogação de consentimento se essa for a base usada. O pedido começa com o administrador do sistema, que encaminha ao encarregado.",
    },
    {
      rotulo: "Segurança",
      titulo: "Como o acesso é limitado",
      texto:
        "Sem sessão não há painel. Senha nova tem no mínimo 12 caracteres, com letras, números, caractere especial e ao menos uma maiúscula, sem números em sequência. A temporária é sorteada por gerador criptográfico, não fica armazenada em texto e precisa ser trocada no primeiro acesso. Essa medida atende ao art. 46 da LGPD e ao controle de informação de autenticação que a ISO/IEC 27701 adota a partir da ISO/IEC 27002:2022, controle 5.17. Cada pessoa vê o próprio nome e o papel no menu. As ações previstas para auditoria aparecem na tela de Logs, quando houver registro. A trilha não registra a senha.",
    },
    {
      rotulo: "Contato",
      titulo: "Canal do encarregado",
      texto:
        "O nome e o canal do encarregado entram na versão revisada deste aviso. Até lá, solicitações de titulares são recebidas pelo administrador do sistema, com retorno pelo canal interno da NORMAQ.",
    },
  ],
};