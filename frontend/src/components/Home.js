import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Paper,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Divider,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TimelineIcon from '@mui/icons-material/Timeline';
import GroupIcon from '@mui/icons-material/Group';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LogoutIcon from '@mui/icons-material/Logout';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/projects', {
        headers: { Authorization: token }
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const getStatusColor = (progress) => {
    if (progress >= 90) return theme.palette.success.main;
    if (progress >= 60) return theme.palette.info.main;
    if (progress >= 30) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        flexWrap: 'wrap',
        gap: 2 
      }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 'bold', 
            color: theme.palette.primary.main,
            mb: 0.5
          }}>
            Construction Project Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {projects.length} Active Projects
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/add-project')}
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              py: 1.5,
              px: 3,
              boxShadow: theme.shadows[3]
            }}
          >
            New Project
          </Button>
          <Button
            variant="outlined"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              py: 1.5,
              px: 3
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Projects Grid */}
      <Grid container spacing={3}>
        {projects.map(project => {
          const progress = project.progress?.completed || 0;
          return (
            <Grid item xs={12} md={6} lg={4} key={project._id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 2,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                      {project.title}
                    </Typography>
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '2.5em'
                    }}
                  >
                    {project.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" sx={{ color: getStatusColor(progress) }}>
                        {progress}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={progress} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 1,
                        bgcolor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getStatusColor(progress)
                        }
                      }} 
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={4}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 1, 
                          textAlign: 'center',
                          bgcolor: theme.palette.grey[50],
                          borderRadius: 1
                        }}
                      >
                        <GroupIcon color="primary" sx={{ mb: 0.5 }} />
                        <Typography variant="body2">{project.team?.length || 0}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 1, 
                          textAlign: 'center',
                          bgcolor: theme.palette.grey[50],
                          borderRadius: 1
                        }}
                      >
                        <TimelineIcon color="primary" sx={{ mb: 0.5 }} />
                        <Typography variant="body2">{project.timeline?.milestones?.length || 0}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 1, 
                          textAlign: 'center',
                          bgcolor: theme.palette.grey[50],
                          borderRadius: 1
                        }}
                      >
                        <AttachMoneyIcon color="primary" sx={{ mb: 0.5 }} />
                        <Typography variant="body2">
                          ${((project.budget?.estimated || 0) / 1000).toFixed(1)}k
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      size="small" 
                      label={`Due ${formatDate(project.expectedEndDate)}`}
                      sx={{ bgcolor: theme.palette.grey[100] }}
                    />
                    <Chip 
                      size="small" 
                      label={project.status || 'Active'}
                      sx={{ 
                        bgcolor: theme.palette.success.light,
                        color: theme.palette.success.dark
                      }}
                    />
                  </Box>

                  {project.analytics && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: theme.palette.grey[50], borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Analytics
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">
                          Delay Risk: {(project.analytics.delayProbability * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2">
                          Performance: {project.analytics.performanceIndex?.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>

                <Divider />
                
                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <Button
                    onClick={() => navigate(`/project/${project._id}`)}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderRadius: 1.5,
                      textTransform: 'none'
                    }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );

};

export default Home;
