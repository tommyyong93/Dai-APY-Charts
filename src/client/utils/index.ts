export function calculateAPYCompound(supplyRate){
  const ETH_MANTISSA = 10**18;
  const BLOCKS_PER_DAY = 6570;
  const DAYS_PER_YEAR = 365;
  return ((((supplyRate / ETH_MANTISSA * BLOCKS_PER_DAY + 1) ** DAYS_PER_YEAR)) - 1) * 100
}

export function calculateAPYDai(supplyRate){
  const RAY = 10**27
  return 100 * supplyRate/RAY;
}
