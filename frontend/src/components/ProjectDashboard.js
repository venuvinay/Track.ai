import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Grid, Paper, Typography, Box,
  LinearProgress, Card, CardContent, Alert,
  List, ListItem, ListItemText, Divider,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
} from '@mui/material';
import ProjectAnalytics from './ProjectAnalytics';

const ProjectDashboard = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProject(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project:', error);
        setError(error.response?.data?.message || 'Error fetching project');
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <Container>
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
      </Container>
    );
  }

  if (!project) {
    return (
      <Container>
        <Alert severity="info" sx={{ mt: 4 }}>Project not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>{project.title}</Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {project.description}
        </Typography>

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Progress</Typography>
                <Typography variant="h5">
                  {project.progress?.completed || 0}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={project.progress?.completed || 0}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Budget Status</Typography>
                <Typography variant="h5">
                  ${(project.budget?.spent || 0).toLocaleString()} / ${(project.budget?.estimated || 0).toLocaleString()}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={((project.budget?.spent || 0) / (project.budget?.estimated || 1)) * 100}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Performance Index</Typography>
                <Typography variant="h5">
                  {(project.analytics?.performanceIndex || 1).toFixed(2)}
                </Typography>
                <Box sx={{ 
                  height: 4, 
                  bgcolor: (project.analytics?.performanceIndex || 1) >= 1 ? 'success.main' : 'warning.main',
                  mt: 1 
                }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Risk Index</Typography>
                <Typography variant="h5">
                  {(project.analytics?.riskIndex || 0).toFixed(2)}
                </Typography>
                <Box sx={{ 
                  height: 4, 
                  bgcolor: (project.analytics?.riskIndex || 0) <= 0.3 ? 'success.main' : 
                          (project.analytics?.riskIndex || 0) <= 0.7 ? 'warning.main' : 'error.main',
                  mt: 1 
                }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Analytics Charts */}
        <ProjectAnalytics project={project} />

        {/* Recommendations */}
        {project.analytics?.recommendations && project.analytics.recommendations.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Recommendations</Typography>
            <List>
              {project.analytics.recommendations.map((rec, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={rec.type}
                      secondary={`Priority: ${rec.priority} | Impact: Schedule ${((rec.impact?.schedule || 0) * 100).toFixed(0)}%, Cost ${((rec.impact?.cost || 0) * 100).toFixed(0)}%, Quality ${((rec.impact?.quality || 0) * 100).toFixed(0)}%`}
                    />
                  </ListItem>
                  {index < project.analytics.recommendations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}

        {/* Quality Metrics */}
        {project.analytics?.qualityMetrics && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quality Metrics</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Defects</TableCell>
                    <TableCell align="right">{project.analytics.qualityMetrics.defects || 0}</TableCell>
                    <TableCell align="right">
                      {(project.analytics.qualityMetrics.defects || 0) <= 5 ? '✅' : '⚠️'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Rework</TableCell>
                    <TableCell align="right">{project.analytics.qualityMetrics.rework || 0}%</TableCell>
                    <TableCell align="right">
                      {(project.analytics.qualityMetrics.rework || 0) <= 10 ? '✅' : '⚠️'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Compliance</TableCell>
                    <TableCell align="right">{project.analytics.qualityMetrics.compliance || 0}%</TableCell>
                    <TableCell align="right">
                      {(project.analytics.qualityMetrics.compliance || 0) >= 95 ? '✅' : '⚠️'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Forecast */}
        {project.analytics?.forecast && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Project Forecast</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Predicted Completion</Typography>
                <Typography variant="body1">
                  {project.analytics.forecast.completionDate ? 
                    new Date(project.analytics.forecast.completionDate).toLocaleDateString() : 
                    'Not available'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Final Cost Estimate</Typography>
                <Typography variant="body1">
                  ${(project.analytics.forecast.finalCost || 0).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Confidence Level</Typography>
                <Typography variant="body1">
                  {((project.analytics.forecast.confidence || 0) * 100).toFixed(1)}%
                </Typography>
              </Grid>
              <Grid item xs={12}>
                {(project.analytics.forecast.delayProbability || 0) > 0.3 && (
                  <Alert severity="warning">
                    There is a {((project.analytics.forecast.delayProbability || 0) * 100).toFixed(1)}% chance of project delay.
                    Consider implementing the recommended actions to mitigate risks.
                  </Alert>
                )}
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default ProjectDashboard;
