import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Paper, Typography, TextField, Button, Grid,
  Box, IconButton, FormControl, InputLabel, Select, MenuItem,
  List, ListItem, ListItemText, ListItemSecondaryAction, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const AddProject = () => {
  const navigate = useNavigate();
  const [project, setProject] = useState({
    title: '',
    description: '',
    startDate: '',
    expectedEndDate: '',
    status: 'planning',
    budget: {
      estimated: 0,
      spent: 0,
      breakdown: []
    },
    team: [],
    resources: [],
    timeline: {
      milestones: []
    },
    risks: [],
    progress: {
      completed: 0,
      planned: 0
    },
    analytics: {
      performanceIndex: 1,
      scheduleVariance: 0,
      costVariance: 0,
      riskIndex: 0,
      qualityMetrics: {
        defects: 0,
        rework: 0,
        compliance: 100
      },
      forecast: {
        completionDate: null,
        finalCost: null,
        confidence: 0.95,
        delayProbability: 0
      },
      trends: [],
      recommendations: []
    }
  });

  // States for temporary form data
  const [budgetItem, setBudgetItem] = useState({ category: '', amount: '', spent: '' });
  const [teamMember, setTeamMember] = useState({ role: 'worker', skills: '' });
  const [resource, setResource] = useState({ name: '', type: '', quantity: 0, cost: 0 });
  const [milestone, setMilestone] = useState({ title: '', description: '', plannedDate: '' });
  const [risk, setRisk] = useState({ description: '', impact: 'low', mitigation: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBudgetAdd = () => {
    if (budgetItem.category && budgetItem.amount) {
      const amount = Number(budgetItem.amount);
      const spent = Number(budgetItem.spent || 0);
      
      setProject(prev => {
        const newBreakdown = [...prev.budget.breakdown, {
          category: budgetItem.category,
          amount,
          spent
        }];
        
        // Update total budget
        const totalEstimated = newBreakdown.reduce((sum, item) => sum + item.amount, 0);
        const totalSpent = newBreakdown.reduce((sum, item) => sum + (item.spent || 0), 0);
        
        return {
          ...prev,
          budget: {
            ...prev.budget,
            estimated: totalEstimated,
            spent: totalSpent,
            breakdown: newBreakdown
          }
        };
      });
      
      setBudgetItem({ category: '', amount: '', spent: '' });
    }
  };

  const handleTeamAdd = () => {
    if (teamMember.role) {
      setProject(prev => ({
        ...prev,
        team: [...prev.team, {
          ...teamMember,
          skills: teamMember.skills.split(',').map(skill => skill.trim())
        }]
      }));
      setTeamMember({ role: 'worker', skills: '' });
    }
  };

  const handleMilestoneAdd = () => {
    if (milestone.title && milestone.plannedDate) {
      setProject(prev => ({
        ...prev,
        timeline: {
          milestones: [...prev.timeline.milestones, {
            ...milestone,
            status: 'pending'
          }]
        }
      }));
      setMilestone({ title: '', description: '', plannedDate: '' });
    }
  };

  const handleRiskAdd = () => {
    if (risk.description && risk.impact) {
      setProject(prev => ({
        ...prev,
        risks: [...prev.risks, {
          ...risk,
          status: 'identified'
        }]
      }));
      setRisk({ description: '', impact: 'low', mitigation: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!project.title || !project.description || !project.startDate || !project.expectedEndDate) {
        alert('Please fill in all required fields');
        return;
      }

      // Calculate initial progress based on dates
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.expectedEndDate);
      const today = new Date();
      const totalDuration = endDate - startDate;
      const elapsed = today - startDate;
      const plannedProgress = Math.max(0, Math.min(100, Math.round((elapsed / totalDuration) * 100)));

      // Format dates to ISO string
      const formattedProject = {
        ...project,
        startDate: startDate.toISOString(),
        expectedEndDate: endDate.toISOString(),
        progress: {
          completed: Math.max(0, plannedProgress - 5), // Slightly behind schedule initially
          planned: plannedProgress
        },
        budget: {
          estimated: Number(project.budget.estimated) || 0,
          spent: Number(project.budget.spent) || 0,
          breakdown: project.budget.breakdown.map(item => ({
            category: item.category,
            amount: Number(item.amount) || 0,
            spent: Number(item.spent) || 0
          }))
        },
        analytics: {
          performanceIndex: 1,
          scheduleVariance: 0,
          costVariance: 0,
          riskIndex: 0,
          qualityMetrics: {
            defects: 0,
            rework: 0,
            compliance: 100
          },
          forecast: {
            completionDate: null,
            finalCost: null,
            confidence: 0.95,
            delayProbability: 0
          },
          trends: [],
          recommendations: [{
            type: 'Project Setup',
            priority: 'medium',
            impact: {
              schedule: 0.1,
              cost: 0.1,
              quality: 0.1
            },
            status: 'pending'
          }, {
            type: 'Resource Planning',
            priority: 'high',
            impact: {
              schedule: 0.2,
              cost: 0.15,
              quality: 0.1
            },
            status: 'pending'
          }]
        }
      };

      console.log('Sending project data:', formattedProject);

      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/projects', formattedProject, {
        headers: { Authorization: token }
      });

      console.log('Project created successfully:', response.data);
      navigate('/home');
    } catch (error) {
      console.error('Error creating project:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        alert(error.response.data.message || 'Error creating project');
      } else {
        alert('Error connecting to server');
      }
    }
  };

  // Budget Handlers
  const handleAddBudgetItem = () => {
    if (budgetItem.category && budgetItem.amount) {
      const amount = Number(budgetItem.amount);
      const spent = Number(budgetItem.spent || 0);
      
      setProject(prev => {
        const newBreakdown = [...prev.budget.breakdown, {
          category: budgetItem.category,
          amount,
          spent
        }];
        
        // Update total budget and spent
        const totalEstimated = newBreakdown.reduce((sum, item) => sum + item.amount, 0);
        const totalSpent = newBreakdown.reduce((sum, item) => sum + (item.spent || 0), 0);
        
        return {
          ...prev,
          budget: {
            ...prev.budget,
            estimated: totalEstimated,
            spent: totalSpent,
            breakdown: newBreakdown
          }
        };
      });
      
      setBudgetItem({ category: '', amount: '', spent: '' });
    }
  };

  // Team Handlers
  const handleAddTeamMember = () => {
    if (teamMember.role && teamMember.skills) {
      setProject(prev => ({
        ...prev,
        team: [...prev.team, {
          ...teamMember,
          skills: teamMember.skills.split(',').map(s => s.trim())
        }]
      }));
      setTeamMember({ role: 'worker', skills: '' });
    }
  };

  // Resource Handlers
  const handleAddResource = () => {
    if (resource.name && resource.type) {
      setProject(prev => ({
        ...prev,
        resources: [...prev.resources, {
          ...resource,
          quantity: Number(resource.quantity),
          cost: Number(resource.cost),
          allocated: 0
        }]
      }));
      setResource({ name: '', type: '', quantity: 0, cost: 0 });
    }
  };

  // Milestone Handlers
  const handleAddMilestone = () => {
    if (milestone.title && milestone.plannedDate) {
      setProject(prev => ({
        ...prev,
        timeline: {
          milestones: [...prev.timeline.milestones, {
            ...milestone,
            status: 'pending'
          }]
        }
      }));
      setMilestone({ title: '', description: '', plannedDate: '' });
    }
  };

  // Risk Handlers
  const handleAddRisk = () => {
    if (risk.description && risk.impact) {
      setProject(prev => ({
        ...prev,
        risks: [...prev.risks, {
          ...risk,
          status: 'identified'
        }]
      }));
      setRisk({ description: '', impact: 'low', mitigation: '' });
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create New Project
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Project Title"
                      value={project.title}
                      onChange={(e) => setProject({ ...project, title: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      multiline
                      rows={3}
                      label="Description"
                      value={project.description}
                      onChange={(e) => setProject({ ...project, description: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      required
                      type="date"
                      label="Start Date"
                      InputLabelProps={{ shrink: true }}
                      value={project.startDate}
                      onChange={(e) => setProject({ ...project, startDate: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      required
                      type="date"
                      label="Expected End Date"
                      InputLabelProps={{ shrink: true }}
                      value={project.expectedEndDate}
                      onChange={(e) => setProject({ ...project, expectedEndDate: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Budget Section */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Budget Breakdown</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Category"
                      value={budgetItem.category}
                      onChange={(e) => setBudgetItem({ ...budgetItem, category: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Amount"
                      value={budgetItem.amount}
                      onChange={(e) => setBudgetItem({ ...budgetItem, amount: Number(e.target.value) })}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Spent"
                      value={budgetItem.spent}
                      onChange={(e) => setBudgetItem({ ...budgetItem, spent: Number(e.target.value) })}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleBudgetAdd}
                      startIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
                <List>
                  {project.budget.breakdown.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${item.category}: $${item.amount.toLocaleString()}`}
                        secondary={`Spent: $${(item.spent || 0).toLocaleString()} (${((item.spent / item.amount) * 100 || 0).toFixed(1)}% used)`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => {
                            const newBreakdown = project.budget.breakdown.filter((_, i) => i !== index);
                            setProject({
                              ...project,
                              budget: {
                                ...project.budget,
                                breakdown: newBreakdown,
                                estimated: newBreakdown.reduce((acc, curr) => acc + curr.amount, 0)
                              }
                            });
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                  Total Budget: ${project.budget.estimated.toLocaleString()}
                </Typography>
              </Paper>
            </Grid>

            {/* Team Section */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Team Requirements</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Role"
                      value={teamMember.role}
                      onChange={(e) => setTeamMember({ ...teamMember, role: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Count"
                      value={teamMember.count || 1}
                      onChange={(e) => setTeamMember({ ...teamMember, count: Number(e.target.value) })}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Required Skills (comma-separated)"
                      value={teamMember.skills}
                      onChange={(e) => setTeamMember({ ...teamMember, skills: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleTeamAdd}
                      startIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
                <List>
                  {project.team.map((member, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${member.role} (${member.count})`}
                        secondary={`Skills: ${member.skills.join(', ')}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => {
                            setProject({
                              ...project,
                              team: project.team.filter((_, i) => i !== index)
                            });
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Milestones Section */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Project Milestones</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Milestone Title"
                      value={milestone.title}
                      onChange={(e) => setMilestone({ ...milestone, title: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={milestone.description}
                      onChange={(e) => setMilestone({ ...milestone, description: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Planned Date"
                      InputLabelProps={{ shrink: true }}
                      value={milestone.plannedDate}
                      onChange={(e) => setMilestone({ ...milestone, plannedDate: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleMilestoneAdd}
                      startIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
                <List>
                  {project.timeline.milestones.map((milestone, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={milestone.title}
                        secondary={`${milestone.description} - Due: ${new Date(milestone.plannedDate).toLocaleDateString()}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => {
                            setProject({
                              ...project,
                              timeline: {
                                ...project.timeline,
                                milestones: project.timeline.milestones.filter((_, i) => i !== index)
                              }
                            });
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Risk Assessment */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Risk Assessment</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Risk Description"
                      value={risk.description}
                      onChange={(e) => setRisk({ ...risk, description: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      select
                      label="Impact Level"
                      value={risk.impact}
                      onChange={(e) => setRisk({ ...risk, impact: e.target.value })}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Mitigation Strategy"
                      value={risk.mitigation}
                      onChange={(e) => setRisk({ ...risk, mitigation: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleRiskAdd}
                      startIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
                <List>
                  {project.risks.map((risk, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={risk.description}
                        secondary={`Impact: ${risk.impact} - Mitigation: ${risk.mitigation}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => {
                            setProject({
                              ...project,
                              risks: project.risks.filter((_, i) => i !== index)
                            });
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/home')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                >
                  Create Project
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Container>
  );
};

export default AddProject;
