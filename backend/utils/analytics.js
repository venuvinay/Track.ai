const calculatePerformanceIndex = (project) => {
  const plannedProgress = project.progress.planned || 0;
  const actualProgress = project.progress.completed || 0;
  const resourceUtilization = calculateResourceUtilization(project);
  const budgetEfficiency = project.budget.spent ? project.budget.estimated / project.budget.spent : 1;

  // Weight factors: Progress (50%), Resource Utilization (30%), Budget Efficiency (20%)
  const weightedIndex = (
    0.5 * (actualProgress / (plannedProgress || 1)) +
    0.3 * resourceUtilization +
    0.2 * budgetEfficiency
  );

  // Normalize to a reasonable range (0.5 to 1.5)
  return Math.max(0.5, Math.min(1.5, weightedIndex));
};

const calculateScheduleVariance = (project) => {
  const plannedDuration = new Date(project.expectedEndDate) - new Date(project.startDate);
  const elapsedTime = Date.now() - new Date(project.startDate);
  return (plannedDuration - elapsedTime) / (1000 * 60 * 60 * 24); // Convert to days
};

const calculateCostVariance = (project) => {
  const plannedCost = project.budget.estimated;
  const actualCost = project.budget.spent;
  return plannedCost - actualCost;
};

const calculateRiskIndex = (project) => {
  const riskWeights = {
    low: 1,
    medium: 2,
    high: 3
  };

  return project.risks.reduce((total, risk) => {
    const severity = riskWeights[risk.impact] || 1;
    const probability = risk.probability || 0.5;
    return total + (severity * probability);
  }, 0) / project.risks.length;
};

const calculateQualityMetrics = (project) => {
  const totalMilestones = project.timeline.milestones.length;
  const completedOnTime = project.timeline.milestones.filter(
    m => m.status === 'completed' && (!m.actualDate || new Date(m.actualDate) <= new Date(m.plannedDate))
  ).length;

  return {
    defects: project.analytics.qualityMetrics.defects,
    rework: project.analytics.qualityMetrics.rework,
    compliance: (completedOnTime / totalMilestones) * 100
  };
};

const generateForecast = (project) => {
  const performanceIndex = calculatePerformanceIndex(project);
  const remainingWork = 100 - project.progress.completed;
  const plannedDuration = new Date(project.expectedEndDate) - new Date(project.startDate);
  const estimatedRemainingDuration = (remainingWork / performanceIndex) * plannedDuration;
  
  const completionDate = new Date(Date.now() + estimatedRemainingDuration);
  const finalCost = project.budget.spent + (remainingWork / 100) * project.budget.estimated;
  
  return {
    completionDate,
    finalCost,
    confidence: calculateConfidence(project),
    delayProbability: calculateDelayProbability(project)
  };
};

const calculateConfidence = (project) => {
  const performanceIndex = calculatePerformanceIndex(project);
  const riskIndex = calculateRiskIndex(project);
  const scheduleVariance = Math.abs(calculateScheduleVariance(project));
  
  // Base confidence starts at 0.95 (95%)
  let confidence = 0.95;
  
  // Adjust based on performance
  if (performanceIndex < 1) confidence -= (1 - performanceIndex) * 0.2;
  
  // Adjust based on risks
  confidence -= riskIndex * 0.1;
  
  // Adjust based on schedule variance
  confidence -= (scheduleVariance / 30) * 0.05; // Reduce confidence by 5% for each month of delay
  
  return Math.max(0.1, Math.min(0.95, confidence));
};

const calculateDelayProbability = (project) => {
  const performanceIndex = calculatePerformanceIndex(project);
  const scheduleVariance = calculateScheduleVariance(project);
  const riskIndex = calculateRiskIndex(project);
  
  let probability = 0;
  
  // Increase probability based on performance index
  if (performanceIndex < 1) probability += (1 - performanceIndex) * 0.4;
  
  // Increase probability based on schedule variance
  if (scheduleVariance < 0) probability += Math.min(0.3, Math.abs(scheduleVariance) / 30 * 0.1);
  
  // Increase probability based on risk index
  probability += riskIndex * 0.2;
  
  return Math.min(1, probability);
};

const generateRecommendations = (project) => {
  // Initialize with default recommendation
  const recommendations = [{
    type: 'Project Setup',
    priority: 'medium',
    impact: {
      schedule: 0.1,
      cost: 0.1,
      quality: 0.1
    },
    status: 'pending'
  }];

  const performanceIndex = calculatePerformanceIndex(project);
  const scheduleVariance = calculateScheduleVariance(project);
  const costVariance = calculateCostVariance(project);
  
  // Schedule-related recommendations
  if (scheduleVariance < 0) {
    recommendations.push({
      type: 'Increase resource allocation to critical tasks',
      priority: scheduleVariance < -30 ? 'high' : 'medium',
      impact: {
        schedule: 0.2,
        cost: -0.1,
        quality: 0
      },
      status: 'pending'
    });
  }
  
  // Cost-related recommendations
  if (costVariance < 0) {
    recommendations.push({
      type: 'Review and optimize resource utilization',
      priority: 'high',
      impact: {
        schedule: 0,
        cost: 0.15,
        quality: 0
      },
      status: 'pending'
    });
  }
  
  // Performance-related recommendations
  if (performanceIndex < 0.8) {
    recommendations.push({
      type: 'Conduct team performance review and provide additional training',
      priority: 'medium',
      impact: {
        schedule: 0.1,
        cost: -0.05,
        quality: 0.15
      },
      status: 'pending'
    });
  }
  
  // Risk-related recommendations
  const highRisks = project.risks.filter(r => r.impact === 'high' && r.status === 'identified');
  if (highRisks.length > 0) {
    recommendations.push({
      type: 'Implement mitigation strategies for high-impact risks',
      priority: 'high',
      impact: {
        schedule: 0.1,
        cost: -0.1,
        quality: 0.1
      },
      status: 'pending'
    });
  }
  
  return recommendations;
};

const updateAnalytics = async (project) => {
  // Calculate base metrics
  const resourceUtilization = calculateResourceUtilization(project);
  const performanceIndex = calculatePerformanceIndex(project);
  
  // Calculate actual progress based on multiple factors
  const plannedProgress = project.progress.planned || 0;
  const baseProgress = project.progress.completed || 0;
  const budgetEfficiency = project.budget.spent ? project.budget.estimated / project.budget.spent : 1;
  
  const actualProgress = Math.min(100, Math.round(
    baseProgress * (
      0.4 * performanceIndex +
      0.3 * resourceUtilization +
      0.3 * budgetEfficiency
    )
  ));

  // Calculate actual spent based on progress and efficiency
  const estimatedBudget = project.budget.estimated || 0;
  const actualSpent = Math.round(
    estimatedBudget * (
      0.5 * (actualProgress / 100) +
      0.3 * (1 / resourceUtilization) +
      0.2 * (1 / performanceIndex)
    )
  );

  // Update project with calculated values
  project.progress.completed = actualProgress;
  project.budget.spent = actualSpent;

  // Update analytics
  project.analytics = {
    ...project.analytics,
    performanceIndex,
    scheduleVariance: calculateScheduleVariance(project),
    costVariance: calculateCostVariance(project),
    riskIndex: calculateRiskIndex(project),
    qualityMetrics: calculateQualityMetrics(project),
    resourceUtilization,
    forecast: generateForecast(project),
    recommendations: generateRecommendations(project)
  };

  // Add current state to trends
  project.analytics.trends.push({
    date: new Date(),
    progress: actualProgress,
    cost: actualSpent,
    performance: performanceIndex,
    resourceUtilization
  });

  return project;
};

const calculateResourceUtilization = (project) => {
  if (!project.resources || project.resources.length === 0) return 0.8; // Default utilization

  const utilizations = project.resources.map(resource => {
    const allocated = resource.allocated || 0;
    const quantity = resource.quantity || 1;
    const efficiency = resource.efficiency || 0.8; // Default efficiency
    return (allocated / quantity) * efficiency;
  });

  // Calculate weighted average based on resource cost
  const totalCost = project.resources.reduce((sum, r) => sum + (r.cost || 0), 0);
  const weightedUtilization = project.resources.reduce((sum, resource, index) => {
    const weight = resource.cost ? resource.cost / totalCost : 1 / project.resources.length;
    return sum + (utilizations[index] * weight);
  }, 0);

  // Apply team size factor (larger teams tend to have lower utilization)
  const teamSizeFactor = Math.max(0.8, 1 - (project.team?.length || 0) * 0.02);
  
  return Math.min(1, weightedUtilization * teamSizeFactor);
};

module.exports = {
  updateAnalytics,
  calculatePerformanceIndex,
  calculateScheduleVariance,
  calculateCostVariance,
  calculateRiskIndex,
  generateForecast,
  generateRecommendations
};
