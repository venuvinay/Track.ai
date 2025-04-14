const router = require('express').Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const { updateAnalytics } = require('../utils/analytics');

// Create new project
router.post('/', auth, async (req, res) => {
  try {
    let project = new Project({
      ...req.body,
      owner: req.user.userId,
      progress: {
        completed: 0,
        planned: calculatePlannedProgress(req.body.startDate, req.body.expectedEndDate)
      }
    });

    // Initialize analytics
    project = await updateAnalytics(project);
    await project.save();

    res.status(201).json(project);
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Helper function to calculate initial analytics
function calculateInitialAnalytics(projectData) {
  const analytics = {
    performanceIndex: 1, // Start with neutral performance
    delayProbability: 0,
    costVariance: 0,
    scheduleVariance: 0
  };

  // Calculate initial delay probability based on project complexity
  if (projectData.risks && projectData.risks.length > 0) {
    const highRisks = projectData.risks.filter(risk => risk.impact === 'high').length;
    const mediumRisks = projectData.risks.filter(risk => risk.impact === 'medium').length;
    analytics.delayProbability = (highRisks * 0.2 + mediumRisks * 0.1);
  }

  // Initialize cost variance
  if (projectData.budget && projectData.budget.breakdown) {
    const totalBudget = projectData.budget.breakdown.reduce((sum, item) => sum + item.amount, 0);
    analytics.costVariance = projectData.budget.estimated - totalBudget;
  }

  return analytics;
}

// Helper function to calculate planned progress
function calculatePlannedProgress(startDate, expectedEndDate) {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(expectedEndDate);
  const totalDuration = end - start;
  const elapsed = today - start;

  if (elapsed <= 0) return 0;
  if (elapsed >= totalDuration) return 100;

  return Math.round((elapsed / totalDuration) * 100);
}

// Get all projects for a user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user.userId },
        { 'team.user': req.user.userId }
      ]
    }).populate('owner', 'username email');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('team.user', 'username email');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update project
router.patch('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.userId
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Update allowed fields
    const updates = req.body;
    const allowedUpdates = [
      'title', 'description', 'status', 'progress',
      'budget', 'team', 'resources', 'timeline', 'risks'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        project[field] = updates[field];
      }
    });

    // Update planned progress
    if (updates.startDate || updates.expectedEndDate) {
      project.progress.planned = calculatePlannedProgress(
        updates.startDate || project.startDate,
        updates.expectedEndDate || project.expectedEndDate
      );
    }

    // Recalculate analytics
    project = await updateAnalytics(project);

    await project.save();
    res.json(project);
  } catch (error) {
    console.error('Project update error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Helper function to calculate project analytics
function calculateProjectAnalytics(project) {
  const analytics = {
    performanceIndex: 0,
    delayProbability: 0,
    costVariance: 0,
    scheduleVariance: 0
  };

  // Calculate Performance Index
  analytics.performanceIndex = project.progress.completed / project.progress.planned || 1;

  // Calculate Cost Variance
  const totalSpent = project.budget.spent || 0;
  const estimatedBudget = project.budget.estimated || 0;
  analytics.costVariance = estimatedBudget - totalSpent;

  // Calculate Schedule Variance
  analytics.scheduleVariance = project.progress.completed - project.progress.planned;

  // Calculate Delay Probability
  let delayFactors = 0;

  // Factor 1: Progress delay
  if (analytics.scheduleVariance < -10) delayFactors += 0.3;

  // Factor 2: Budget overrun
  if (analytics.costVariance < 0) delayFactors += 0.2;

  // Factor 3: High-risk items
  const highRisks = project.risks.filter(risk => 
    risk.impact === 'high' && risk.status !== 'mitigated'
  ).length;
  delayFactors += highRisks * 0.1;

  // Factor 4: Delayed milestones
  const delayedMilestones = project.timeline.milestones.filter(m => 
    m.status === 'delayed'
  ).length;
  delayFactors += delayedMilestones * 0.1;

  analytics.delayProbability = Math.min(delayFactors, 1);

  return analytics;
}

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.userId
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add team member
router.post('/:id/team', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.userId
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.team.push(req.body);
    await project.save();
    res.json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update project budget
router.patch('/:id/budget', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.userId
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Update budget breakdown
    const { category, amount, spent } = req.body;
    const existingItemIndex = project.budget.breakdown.findIndex(item => 
      item.category.toLowerCase() === category.toLowerCase()
    );

    if (existingItemIndex >= 0) {
      // Update existing budget item
      project.budget.breakdown[existingItemIndex] = {
        category,
        amount: Number(amount),
        spent: Number(spent)
      };
    } else {
      // Add new budget item
      project.budget.breakdown.push({
        category,
        amount: Number(amount),
        spent: Number(spent)
      });
    }

    // Update total budget and spent
    project.budget.estimated = project.budget.breakdown.reduce((sum, item) => sum + item.amount, 0);
    project.budget.spent = project.budget.breakdown.reduce((sum, item) => sum + (item.spent || 0), 0);

    // Recalculate analytics
    project = await updateAnalytics(project);
    await project.save();

    res.json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update project progress
router.patch('/:id/progress', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.userId },
        { 'team.user': req.user.userId }
      ]
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.progress = req.body.progress;
    project = await updateAnalytics(project);
    await project.save();
    res.json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Helper function to calculate analytics
function calculateAnalytics(project) {
  const analytics = {
    performanceIndex: 0,
    delayProbability: 0,
    costVariance: 0,
    scheduleVariance: 0
  };

  // Calculate Performance Index
  analytics.performanceIndex = project.progress.completed / project.progress.planned;

  // Calculate Cost Variance
  analytics.costVariance = project.budget.estimated - project.budget.spent;

  // Calculate Schedule Variance
  const today = new Date();
  const totalDuration = project.expectedEndDate - project.startDate;
  const elapsed = today - project.startDate;
  const plannedProgress = (elapsed / totalDuration) * 100;
  analytics.scheduleVariance = project.progress.completed - plannedProgress;

  // Calculate Delay Probability
  analytics.delayProbability = calculateDelayProbability(project);

  return analytics;
}

// Helper function to calculate delay probability
function calculateDelayProbability(project) {
  let delayFactors = 0;

  // Check progress delay
  if (project.progress.completed < project.progress.planned) {
    delayFactors += 0.3;
  }

  // Check budget overrun
  if (project.budget.spent > project.budget.estimated) {
    delayFactors += 0.3;
  }

  // Check milestone delays
  const delayedMilestones = project.timeline.milestones.filter(m => m.status === 'delayed');
  if (delayedMilestones.length > 0) {
    delayFactors += 0.4;
  }

  return Math.min(delayFactors, 1);
}

module.exports = router;
