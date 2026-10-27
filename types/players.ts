export type Player = {
  id: string;
  photo?: string;
  name: string;
  ovr: number;
  position: string;
  mvps: number;
  isMvp?: boolean;
  foot: "L" | "R";
  form: "hot" | "cold" | "neutral";
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
};