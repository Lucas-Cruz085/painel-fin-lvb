export type ItemMenu = {
  to: "/dashboard" | "/lgpd" | "/logs" | "/usuarios";
  label: string;
  somenteAdmin: boolean;
};

export const ITENS_MENU: ItemMenu[] = [
  { to: "/dashboard", label: "Dashboard", somenteAdmin: false },
  { to: "/lgpd", label: "LGPD", somenteAdmin: false },
  { to: "/logs", label: "Logs", somenteAdmin: true },
  { to: "/usuarios", label: "Gestão de usuários", somenteAdmin: true },
];

export function itensVisiveis(admin: boolean) {
  return ITENS_MENU.filter((item) => admin || !item.somenteAdmin);
}

export function rotaRestrita(caminho: string) {
  return caminho === "/logs" || caminho === "/usuarios";
}