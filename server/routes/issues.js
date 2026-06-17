import express from 'express';
import jwt from 'jsonwebtoken';
import Issue from '../models/Issue.js';
import User from '../models/User.js';
// import config from '../config.js';
import multer from "multer";
import { fileURLToPath } from 'url';
import path from 'path';
import fs from "fs-extra";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};


// file storage with multer 


const storage = multer.diskStorage(({
  destination: (req, file, cb) => {
    cb(null, `./uploaded-photo`);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.trim());
  }
}))
const upload = multer({ storage });

// Create a new issue

router.post('/', upload.array('images', 5), authenticateToken, async (req, res) => {
  try {
    const { title, description, category, location } = req.body;
    let images;
    if (req.files) {
      images = req.files.map(f => {
        return { "path": f.path, "filename": f.filename };
      });
    } else {
      images = [];
    }
    console.log(req.body);
    console.log(images);
    console.log(req.files);
    const issue = new Issue({
      title,
      description,
      category,
      location: {
        latitude: location.split(',')[0].trim(),
        longitude: location.split(',')[1].trim(),
        address: req.body.address || ''
      },
      images: images,
      reportedBy: req.user.userId
    });
    // console.log(issue);
    await issue.save();
    await issue.populate('reportedBy', 'name email');
    res.status(201).json({
      message: 'Issue reported successfully',
      issue
    });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ message: 'Server error while creating issue' });
  }
});

// Get all issues (with pagination)

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const issues = await Issue.find()
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Issue.countDocuments();

    res.json({
      issues,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ message: 'Server error while fetching issues' });
  }
});

// Get issues by user
router.get('/my-issues', authenticateToken, async (req, res) => {
  try {
    const issues = await Issue.find({ reportedBy: req.user.userId })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ issues });
  } catch (error) {
    console.error('Get user issues error:', error);
    res.status(500).json({ message: 'Server error while fetching user issues' });
  }
});

// Get single issue
router.get('/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json({ issue });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({ message: 'Server error while fetching issue' });
  }
});

// Update issue status (for officials)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'official') {
      return res.status(403).json({ message: 'Only officials can update issue status' });
    }

    const { status, assignedTo } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    issue.status = status;
    if (assignedTo) {
      issue.assignedTo = assignedTo;
    }

    if (status === 'resolved') {
      issue.actualResolution = new Date();
    }

    await issue.save();
    await issue.populate('assignedTo', 'name email');

    res.json({
      message: 'Issue status updated successfully',
      issue
    });
  } catch (error) {
    console.error('Update issue status error:', error);
    res.status(500).json({ message: 'Server error while updating issue status' });
  }
});

// Add comment to issue
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    issue.comments.push({
      user: req.user.userId,
      text
    });

    await issue.save();
    await issue.populate('comments.user', 'name email');

    res.json({
      message: 'Comment added successfully',
      issue
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error while adding comment' });
  }
});

// Upvote issue
router.post('/:id/upvote', authenticateToken, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const userId = req.user.userId;
    const hasUpvoted = issue.upvotes.includes(userId);

    if (hasUpvoted) {
      issue.upvotes = issue.upvotes.filter(id => id.toString() !== userId);
    } else {
      issue.upvotes.push(userId);
    }

    await issue.save();

    res.json({
      message: hasUpvoted ? 'Upvote removed' : 'Issue upvoted',
      upvotes: issue.upvotes.length
    });
  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({ message: 'Server error while upvoting' });
  }
});

// for image fetching from frontend 

router.get("/image/:address", async (req, res) => {
  const fileName = req.params.address;
  const filePath = path.join(
    __dirname,
    '.././uploaded-photo',
    fileName
  );
  console.log(filePath)
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('Image not found:', err);
      return res.status(404).send('Image not found');
    }

    const stat = fs.statSync(filePath);

    const type = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': `image/${type}`, // Adjust based on your image type
      'Content-Length': stat.size
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);

    readStream.on('error', (err) => {
      console.error('Error streaming image:', err);
      res.status(500).send('Error serving image');
    });
  });

  // try {
  //   if (fs.existsSync(filePath)) {
  //     res.sendFile(filePath);
  //   }
  //   else {
  //     res.status(404).json({ message: "file not found" })
  //   }
  // } catch (error) {
  //   console.log(error);
  // }
})

export default router;