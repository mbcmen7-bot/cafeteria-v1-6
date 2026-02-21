import { CommissionConfig } from '../../lib/shared_mock_state';

export function calculatePointsToDeduct(orderTotal: number): number {
  return Math.floor(orderTotal / 0.003);
}

export function calculateCommissions(points: number, config: CommissionConfig, hasMarketer: boolean) {
  const directMarketerPoints = hasMarketer 
    ? Math.floor(points * (config.rate_direct_parent_percent / 100))
    : 0;
    
  const grandparentMarketerPoints = hasMarketer
    ? Math.floor(points * (config.rate_grandparent_percent / 100))
    : 0;
    
  const ownerPoints = Math.floor(points * (config.rate_owner_percent / 100));
  
  return {
    directMarketerPoints,
    grandparentMarketerPoints,
    ownerPoints
  };
}
