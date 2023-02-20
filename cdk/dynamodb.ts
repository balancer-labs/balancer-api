import { Stack } from 'aws-cdk-lib';
import { PredefinedMetric, ScalableTarget, ServiceNamespace } from "aws-cdk-lib/aws-applicationautoscaling";

export interface Capacities {
  read: {
    min: number,
    max: number
  },
  write: {
    min: number,
    max: number
  }
}

export function autoScaleSecondaryIndex(scope: Stack, indexName: string, capacities: Capacities, targetUtilizationPercent: number) {
  const readScaling = new ScalableTarget(scope, `${indexName}ReadScaling`, {
    serviceNamespace: ServiceNamespace.DYNAMODB,
    minCapacity: capacities.read.min,
    maxCapacity: capacities.read.max,
    resourceId: `table/pools/index/${indexName}`,
    scalableDimension: 'dynamodb:index:ReadCapacityUnits'
  });

  readScaling.scaleToTrackMetric(`${indexName}ReadScalingMetric`, {
    targetValue: targetUtilizationPercent,
    predefinedMetric: PredefinedMetric.DYNAMODB_READ_CAPACITY_UTILIZATION
  });

  const writeScaling = new ScalableTarget(scope, `${indexName}WriteScaling`, {
    serviceNamespace: ServiceNamespace.DYNAMODB,
    minCapacity: capacities.write.min,
    maxCapacity: capacities.write.max,
    resourceId: `table/pools/index/${indexName}`,
    scalableDimension: 'dynamodb:index:WriteCapacityUnits'
  });

  writeScaling.scaleToTrackMetric(`${indexName}WriteScalingMetric`, {
    targetValue: targetUtilizationPercent,
    predefinedMetric: PredefinedMetric.DYNAMODB_WRITE_CAPACITY_UTILIZATION
  });
}