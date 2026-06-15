export function calculateOvr(
  pac: number,
  sho: number,
  pas: number,
  dri: number,
  def: number,
  phy: number
): number {
  return Math.round((pac + sho + pas + dri + def + phy) / 6);
}
