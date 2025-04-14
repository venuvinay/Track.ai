import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Alert,
  Grid, Divider, Chip, LinearProgress
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar,
  RadialBarChart, RadialBar
} from 'recharts';

const ProjectAnalytics = ({ project }) => {
  const [chartData, setChartData] = useState({
    progressData: [],
    resourceUtilization: [],
    costAnalysis: [],
    performanceTrend: []
  });

  useEffect(() => {
    if (project) {
      // Calculate dates based on project timeline
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.expectedEndDate);
      const today = new Date();
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));

      
      // Create 5 evenly spaced data points
      const dataPoints = 5;
      const progressData = [];
      
      for (let i = 0; i < dataPoints; i++) {
        const pointDate = new Date(startDate);
        const daysOffset = (i * totalDays) / (dataPoints - 1);
        pointDate.setDate(startDate.getDate() + daysOffset);
        
        const isInPast = pointDate <= today;
        const dayProgress = (daysOffset / totalDays) * 100;
        
        // Calculate actual progress
        let actualProgress = 0;
        if (isInPast) {
          // For past dates, interpolate between 0 and current progress
          const progressRatio = Math.min(1, daysOffset / elapsedDays);
          actualProgress = (project.progress?.completed || 0) * progressRatio;
        }
        
        // Calculate planned progress
        const plannedProgress = dayProgress;
        
        progressData.push({
          date: pointDate.toLocaleDateString(),
          actual: Math.round(actualProgress),
          planned: Math.round(plannedProgress)
        });
      }

      // Calculate resource utilization with real data
      const resourceData = [];
      if (project.resources?.length > 0) {
        project.resources.forEach(resource => {
          const allocated = resource.allocated || 0;
          const quantity = resource.quantity || 1;
          const efficiency = resource.efficiency || 0.8;
          
          resourceData.push({
            name: resource.name,
            utilization: Math.round(((allocated / quantity) * efficiency * 100))
          });
        });
      } else {
        // Default data with realistic values
        const defaultUtilization = Math.max(30, Math.min(90, project.progress?.completed || 60));
        resourceData.push(
          { name: 'Labor', utilization: defaultUtilization },
          { name: 'Equipment', utilization: Math.round(defaultUtilization * 0.8) },
          { name: 'Materials', utilization: Math.round(defaultUtilization * 0.9) }
        );
      }

      // Calculate cost data with actual spent amounts
      const totalBudget = project.budget?.estimated || 0;
      const totalSpent = project.budget?.spent || 0;
      
      let costData = [];
      if (project.budget?.breakdown?.length > 0) {
        // Use actual budget breakdown with spent amounts
        costData = project.budget.breakdown.map(item => ({
          category: item.category,
          planned: item.amount || 0,
          actual: item.spent || 0
        }));
      } else {
        // Generate realistic default data
        const laborRatio = 0.5;
        const materialsRatio = 0.3;
        const equipmentRatio = 0.2;
        
        costData = [
          {
            category: 'Labor',
            planned: Math.round(totalBudget * laborRatio),
            actual: Math.round(totalSpent * laborRatio)
          },
          {
            category: 'Materials',
            planned: Math.round(totalBudget * materialsRatio),
            actual: Math.round(totalSpent * materialsRatio)
          },
          {
            category: 'Equipment',
            planned: Math.round(totalBudget * equipmentRatio),
            actual: Math.round(totalSpent * equipmentRatio)
          }
        ];
      }

      // Calculate performance data
      const performanceData = [];
      for (let i = 0; i < dataPoints; i++) {
        const pointDate = new Date(startDate);
        const daysOffset = (i * totalDays) / (dataPoints - 1);
        pointDate.setDate(startDate.getDate() + daysOffset);
        
        const isInPast = pointDate <= today;
        const dayProgress = (daysOffset / totalDays) * 100;
        
        // Calculate performance based on actual vs planned progress
        let performance = 1.0; // Default to neutral performance
        if (isInPast && dayProgress > 0) {
          const expectedProgress = dayProgress;
          const actualProgress = progressData[i].actual;
          performance = actualProgress / expectedProgress;
        }
        
        // Get resource utilization for this time point
        const resourceUtil = resourceData.reduce((sum, r) => sum + r.utilization, 0) / resourceData.length;
        
        performanceData.push({
          date: pointDate.toLocaleDateString(),
          performance: Math.max(0.5, Math.min(1.5, performance)), // Keep between 0.5 and 1.5
          resourceUtilization: resourceUtil
        });
      }

      setChartData({
        progressData,
        resourceUtilization: resourceData,
        costAnalysis: costData.map(item => ({
          name: item.category,
          planned: item.planned,
          actual: item.actual || 0
        })),
        performanceTrend: performanceData
      });
    }
  }, [project]);



  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>Project Analytics</Typography>
        
        {/* Analytics Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, bgcolor: 'primary.light', color: 'white' }}>
              <Typography variant="h6" gutterBottom>Progress</Typography>
              <Typography variant="h4">{project.progress?.completed || 0}%</Typography>
              <Typography variant="body2">vs {project.progress?.planned || 0}% planned</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, bgcolor: 'success.light', color: 'white' }}>
              <Typography variant="h6" gutterBottom>Budget</Typography>
              <Typography variant="h4">${(project.budget?.spent || 0).toLocaleString()}</Typography>
              <Typography variant="body2">of ${(project.budget?.estimated || 0).toLocaleString()}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, bgcolor: 'warning.light', color: 'white' }}>
              <Typography variant="h6" gutterBottom>Resources</Typography>
              <Typography variant="h4">{project.resources?.length || 0}</Typography>
              <Typography variant="body2">Active Resources</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, bgcolor: 'info.light', color: 'white' }}>
              <Typography variant="h6" gutterBottom>Timeline</Typography>
              <Typography variant="h4">{project.timeline?.milestones?.length || 0}</Typography>
              <Typography variant="body2">Total Milestones</Typography>
            </Paper>
          </Grid>
        </Grid>
      
      {/* Main Analytics Grid */}
      <Grid container spacing={3}>
        {/* Progress Tracking */}
        <Grid item xs={12} lg={6}>
          <Paper 
            sx={{ 
              p: 3, 
              height: '100%',
              minHeight: 400,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" gutterBottom>Progress Tracking</Typography>
            <Box sx={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <LineChart data={chartData?.progressData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="planned" stroke="#8884d8" name="Planned Progress" />
                  <Line type="monotone" dataKey="actual" stroke="#82ca9d" name="Actual Progress" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Resource Utilization */}
        <Grid item xs={12} lg={6}>
          <Paper 
            sx={{ 
              p: 3, 
              height: '100%',
              minHeight: 400,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" gutterBottom>Resource Utilization</Typography>
            <Box sx={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={chartData?.resourceUtilization || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="utilization" fill="#8884d8" name="Utilization %" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Cost Analysis */}
        <Grid item xs={12} lg={6}>
          <Paper 
            sx={{ 
              p: 3, 
              height: '100%',
              minHeight: 400,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" gutterBottom>Cost Analysis</Typography>
            <Box sx={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <BarChart 
                  data={chartData?.costAnalysis || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis 
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    formatter={(value) => `$${value.toLocaleString()}`}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  <Bar dataKey="planned" fill="#8884d8" name="Planned Budget" />
                  <Bar dataKey="actual" fill="#82ca9d" name="Actual Spent" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            {/* Budget Summary */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Budget: ${(project.budget?.estimated || 0).toLocaleString()}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Total Spent: ${(project.budget?.spent || 0).toLocaleString()} 
                ({Math.round(((project.budget?.spent || 0) / (project.budget?.estimated || 1)) * 100)}%)
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Performance Trend */}
        <Grid item xs={12} lg={6}>
          <Paper 
            sx={{ 
              p: 3, 
              height: '100%',
              minHeight: 400,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
        <Typography variant="h6" gutterBottom>Performance Trend</Typography>
        <Box sx={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <LineChart data={chartData?.performanceTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="performance" stroke="#8884d8" name="Performance Index" />
              <Line type="monotone" dataKey="resourceUtilization" stroke="#82ca9d" name="Resource Utilization" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
          </Paper>
        </Grid>

        {/* Forecast and Recommendations */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Forecast & Recommendations</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Predicted Completion: {project.analytics?.forecast?.completionDate ? 
                  new Date(project.analytics.forecast.completionDate).toLocaleDateString() :
                  new Date(project.expectedEndDate).toLocaleDateString()}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Final Cost Estimate: ${(project.analytics?.forecast?.finalCost || project.budget?.estimated || 100000).toLocaleString()}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Confidence Level: {((project.analytics?.forecast?.confidence || 
                  (project.progress?.completed > 50 ? 0.9 : 0.7)) * 100).toFixed(1)}%
              </Typography>
              {(project.analytics?.forecast?.delayProbability || 
                (project.progress?.completed < project.progress?.planned ? 0.6 : 0.2)) > 0.3 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Project has a {((project.analytics?.forecast?.delayProbability || 
                    (project.progress?.completed < project.progress?.planned ? 0.6 : 0.2)) * 100).toFixed(1)}% chance of delay
                </Alert>
              )}
            </Box>
            <Typography variant="subtitle1" gutterBottom>Recommendations:</Typography>
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              {(project.analytics?.recommendations || (() => {
                const recommendations = [];
                const progress = project.progress?.completed || 0;
                const planned = project.progress?.planned || 0;
                const budget = project.budget || {};
                const resources = project.resources || [];

                // Check for schedule delays
                if (progress < planned) {
                  recommendations.push({
                    type: 'Schedule Recovery Plan',
                    priority: 'high',
                    impact: { schedule: 0.25, cost: 0.15, quality: 0.1 }
                  });
                }

                // Check budget overruns
                if ((budget.spent || 0) > (budget.estimated || 0) * 0.8) {
                  recommendations.push({
                    type: 'Cost Control Measures',
                    priority: 'high',
                    impact: { schedule: 0.1, cost: 0.3, quality: 0.05 }
                  });
                }

                // Check resource utilization
                const underutilizedResources = resources.filter(r => 
                  (r.allocated || 0) / (r.quantity || 1) < 0.7
                );
                if (underutilizedResources.length > 0) {
                  recommendations.push({
                    type: 'Resource Optimization',
                    priority: 'medium',
                    impact: { schedule: 0.2, cost: 0.15, quality: 0.1 }
                  });
                }

                // Quality recommendations based on milestones
                if (project.timeline?.milestones?.some(m => m.status === 'delayed')) {
                  recommendations.push({
                    type: 'Quality Assurance Review',
                    priority: 'medium',
                    impact: { schedule: 0.1, cost: 0.1, quality: 0.25 }
                  });
                }

                // If no specific issues, add general optimization
                if (recommendations.length === 0) {
                  recommendations.push({
                    type: 'Process Optimization',
                    priority: 'medium',
                    impact: { schedule: 0.1, cost: 0.1, quality: 0.15 }
                  });
                }

                return recommendations;
              })()).map((rec, index) => (
                <Box component="li" key={index} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                    {rec.type} (Priority: {rec.priority.toUpperCase()})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Impact: Schedule {(rec.impact.schedule * 100).toFixed(0)}%, 
                    Cost {(rec.impact.cost * 100).toFixed(0)}%, 
                    Quality {(rec.impact.quality * 100).toFixed(0)}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Project Forecast */}
        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 3,
              bgcolor: 'background.paper',
              boxShadow: 2
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>Project Forecast</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Predicted Completion
                  </Typography>
                  <Typography variant="h6">
                    {project.analytics?.forecast?.completionDate ? 
                      new Date(project.analytics.forecast.completionDate).toLocaleDateString() :
                      new Date(project.expectedEndDate).toLocaleDateString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'success.light', color: 'white', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Final Cost Estimate
                  </Typography>
                  <Typography variant="h6">
                    ${(project.analytics?.forecast?.finalCost || project.budget?.estimated || 100000).toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'info.light', color: 'white', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Confidence Level
                  </Typography>
                  <Typography variant="h6">
                    {((project.analytics?.forecast?.confidence || 
                      (project.progress?.completed > 50 ? 0.9 : 0.7)) * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {(project.analytics?.forecast?.delayProbability || 
              (project.progress?.completed < project.progress?.planned ? 0.6 : 0.2)) > 0.3 && (
              <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
                Project has a {((project.analytics?.forecast?.delayProbability || 
                  (project.progress?.completed < project.progress?.planned ? 0.6 : 0.2)) * 100).toFixed(1)}% chance of delay
              </Alert>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>Recommendations</Typography>
              <Grid container spacing={2}>
                {(project.analytics?.recommendations || (() => {
                  const recommendations = [];
                  const progress = project.progress?.completed || 0;
                  const planned = project.progress?.planned || 0;
                  const budget = project.budget || {};
                  const resources = project.resources || [];

                  if (progress < planned) {
                    recommendations.push({
                      type: 'Schedule Recovery Plan',
                      priority: 'high',
                      impact: { schedule: 0.25, cost: 0.15, quality: 0.1 }
                    });
                  }

                  if ((budget.spent || 0) > (budget.estimated || 0) * 0.8) {
                    recommendations.push({
                      type: 'Cost Control Measures',
                      priority: 'high',
                      impact: { schedule: 0.1, cost: 0.3, quality: 0.05 }
                    });
                  }

                  const underutilizedResources = resources.filter(r => 
                    (r.allocated || 0) / (r.quantity || 1) < 0.7
                  );
                  if (underutilizedResources.length > 0) {
                    recommendations.push({
                      type: 'Resource Optimization',
                      priority: 'medium',
                      impact: { schedule: 0.2, cost: 0.15, quality: 0.1 }
                    });
                  }

                  if (project.timeline?.milestones?.some(m => m.status === 'delayed')) {
                    recommendations.push({
                      type: 'Quality Assurance Review',
                      priority: 'medium',
                      impact: { schedule: 0.1, cost: 0.1, quality: 0.25 }
                    });
                  }

                  if (recommendations.length === 0) {
                    recommendations.push({
                      type: 'Process Optimization',
                      priority: 'medium',
                      impact: { schedule: 0.1, cost: 0.1, quality: 0.15 }
                    });
                  }

                  return recommendations;
                })()).map((rec, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        bgcolor: rec.priority === 'high' ? 'error.light' : 'warning.light',
                        color: 'white'
                      }}
                    >
                      <Typography variant="subtitle1" gutterBottom>
                        {rec.type}
                      </Typography>
                      <Typography variant="body2">
                        Priority: {rec.priority.toUpperCase()}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption">
                          Impact: Schedule {(rec.impact.schedule * 100).toFixed(0)}%, 
                          Cost {(rec.impact.cost * 100).toFixed(0)}%, 
                          Quality {(rec.impact.quality * 100).toFixed(0)}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(rec.impact.schedule + rec.impact.cost + rec.impact.quality) * 100 / 3}
                          sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.3)' }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  </Container>
  );
};

export default ProjectAnalytics;
