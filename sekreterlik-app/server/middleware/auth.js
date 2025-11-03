// Simple authentication middleware for demo purposes
// In a real application, you would implement proper JWT authentication

const authenticateToken = (req, res, next) => {
  // For demo purposes, we'll allow all requests to pass through
  // In a real application, you would verify the JWT token here
  
  // Set a default user for demo purposes
  // In a real app, this would come from JWT token verification
  req.user = {
    id: 4, // Use a real user ID from member_users table
    username: 'admin',
    role: 'admin'
  };
  
  next();
};

module.exports = { authenticateToken };